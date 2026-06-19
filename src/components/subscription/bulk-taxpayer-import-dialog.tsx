import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { useAuth } from '@/hooks/use-auth';
import { useCachedFormData } from '@/hooks/useCachedData';
import { createTaxpayerBulkRow } from '@/components/utils/api/subscription-functions';

const TEMPLATE_HEADERS = [
    'providenceNum',
    'process',
    'name',
    'rif',
    'contract_type',
    'address',
    'emition_date',
    'category',
    'parish',
    'officerId',
] as const;

type BulkRow = Record<(typeof TEMPLATE_HEADERS)[number], string>;

interface BulkTaxpayerImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete?: () => void;
}

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase().replace(/\s+/g, '_');
}

export function BulkTaxpayerImportDialog({ open, onOpenChange, onComplete }: BulkTaxpayerImportDialogProps) {
    const { user } = useAuth();
    const { parishes, categories } = useCachedFormData();
    const fileRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<BulkRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

    const downloadTemplate = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Contribuyentes');
        ws.addRow([...TEMPLATE_HEADERS]);
        ws.addRow([
            '12345',
            'VDF',
            'Ejemplo C.A.',
            'J123456789',
            'SPECIAL',
            'Av. Principal',
            '2026-01-15',
            'Comercio',
            'CHACAO',
            user?.id ?? '',
        ]);
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-contribuyentes-sac.xlsx';
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
        if (!ws) {
            toast.error('Archivo vacío');
            return;
        }

        const headerRow = ws.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell, col) => {
            headers[col - 1] = normalizeHeader(String(cell.value ?? ''));
        });

        const parsed: BulkRow[] = [];
        ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const obj: Partial<BulkRow> = {};
            let hasData = false;
            headers.forEach((h, i) => {
                const val = String(row.getCell(i + 1).value ?? '').trim();
                if (val) hasData = true;
                if (TEMPLATE_HEADERS.includes(h as (typeof TEMPLATE_HEADERS)[number])) {
                    obj[h as keyof BulkRow] = val;
                }
            });
            if (hasData) parsed.push(obj as BulkRow);
        });

        setRows(parsed);
        toast.success(`${parsed.length} filas detectadas`);
    };

    const resolveCategoryId = (name: string) =>
        categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id;

    const resolveParishId = (name: string) =>
        parishes.find((p) => p.name.toLowerCase() === name.toLowerCase())?.id;

    const runImport = async () => {
        if (!rows.length) {
            toast.error('Carga un archivo primero');
            return;
        }

        setImporting(true);
        setProgress({ done: 0, total: rows.length, errors: 0 });
        let errors = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const categoryId = resolveCategoryId(row.category);
                const parishId = resolveParishId(row.parish);
                const officerId = row.officerId || user?.id;

                if (!categoryId) throw new Error(`Categoría no encontrada: ${row.category}`);
                if (!parishId) throw new Error(`Parroquia no encontrada: ${row.parish}`);
                if (!officerId) throw new Error('officerId requerido');

                await createTaxpayerBulkRow({
                    providenceNum: row.providenceNum,
                    process: row.process,
                    name: row.name,
                    rif: row.rif,
                    contract_type: row.contract_type,
                    officerName: user?.name ?? '',
                    officerId,
                    address: row.address,
                    emition_date: row.emition_date,
                    categoryId,
                    parishId,
                });
            } catch (err: unknown) {
                errors++;
                const msg = err instanceof Error ? err.message : 'Error';
                console.error(`Fila ${i + 2}:`, msg);
            }
            setProgress({ done: i + 1, total: rows.length, errors });
        }

        setImporting(false);
        if (errors === 0) {
            toast.success(`¡${rows.length} contribuyentes importados!`);
            onOpenChange(false);
            onComplete?.();
        } else {
            toast.error(`Importación parcial: ${rows.length - errors} OK, ${errors} errores`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                        Importación masiva
                    </DialogTitle>
                    <DialogDescription>
                        Sube un Excel o CSV con la plantilla institucional. Requiere plan Fiscal Pro activo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar plantilla
                    </Button>

                    <div
                        className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {rows.length > 0
                                ? `${rows.length} filas listas para importar`
                                : 'Haz clic para seleccionar .xlsx o .csv'}
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

                    {importing && (
                        <p className="text-xs text-center text-muted-foreground">
                            Procesando {progress.done}/{progress.total}
                            {progress.errors > 0 && ` · ${progress.errors} errores`}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancelar
                    </Button>
                    <Button onClick={runImport} disabled={importing || rows.length === 0} className="bg-emerald-600 hover:bg-emerald-500">
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
