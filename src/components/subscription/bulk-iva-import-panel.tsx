import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { Card } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { bulkImportIvaReports, BulkIvaRow } from '@/components/utils/api/subscription-functions';
import { SubscriptionFeatureGate } from '@/components/subscription/subscription-feature-gate';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';

const HEADERS = ['taxpayerId', 'purchases', 'sells', 'paid', 'date', 'iva', 'excess'] as const;

export function BulkIvaImportPanel() {
    const { features, loading, active } = useSubscriptionFeatures();
    const fileRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<BulkIvaRow[]>([]);
    const [importing, setImporting] = useState(false);

    const downloadTemplate = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('IVA');
        ws.addRow([...HEADERS]);
        ws.addRow(['uuid-contribuyente', '1000', '5000', '600', '2026-02-01', '720', '']);
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-iva-sac.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    };

    const parseFile = async (file: File) => {
        const wb = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        if (file.name.endsWith('.csv')) {
            await wb.csv.read(buffer as unknown as ExcelJS.Buffer);
        } else {
            await wb.xlsx.load(buffer);
        }
        const ws = wb.worksheets[0];
        if (!ws) return;

        const headerRow = ws.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, col) => {
            headers[col - 1] = String(cell.value ?? '').trim().toLowerCase();
        });

        const parsed: BulkIvaRow[] = [];
        ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const get = (key: string) => {
                const idx = headers.indexOf(key);
                return idx >= 0 ? String(row.getCell(idx + 1).value ?? '').trim() : '';
            };
            const taxpayerId = get('taxpayerid');
            if (!taxpayerId) return;
            parsed.push({
                taxpayerId,
                purchases: get('purchases'),
                sells: get('sells'),
                paid: get('paid'),
                date: get('date'),
                iva: get('iva') || undefined,
                excess: get('excess') || undefined,
            });
        });
        setRows(parsed);
        toast.success(`${parsed.length} reportes IVA detectados`);
    };

    const runImport = async () => {
        if (!rows.length) return;
        setImporting(true);
        try {
            const result = await bulkImportIvaReports(rows);
            if (result.failed === 0) {
                toast.success(`${result.created} reportes IVA creados`);
                setRows([]);
            } else {
                toast.error(`${result.created} OK, ${result.failed} fallidos`);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error en importación');
        } finally {
            setImporting(false);
        }
    };

    return (
        <SubscriptionFeatureGate feature="ivaAutomation" enabled={features.ivaAutomation} loading={loading}>
            <Card className="border-indigo-500/20 bg-indigo-950/10 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-200 flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Carga masiva de IVA
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Plan {active ? 'activo' : ''} — Importa cientos de reportes desde Excel
                        </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-1.5" />
                        Plantilla
                    </Button>
                </div>

                <div
                    className="border border-dashed border-indigo-500/30 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-500/5"
                    onClick={() => fileRef.current?.click()}
                >
                    <Upload className="h-6 w-6 mx-auto text-indigo-400 mb-1" />
                    <p className="text-xs text-muted-foreground">
                        {rows.length ? `${rows.length} filas listas` : 'Seleccionar archivo .xlsx / .csv'}
                    </p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) parseFile(f);
                        }}
                    />
                </div>

                <Button
                    onClick={runImport}
                    disabled={importing || rows.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500"
                    size="sm"
                >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Importar ${rows.length || ''} reportes`}
                </Button>
            </Card>
        </SubscriptionFeatureGate>
    );
}
