import React, { useEffect, useMemo, useState } from 'react';
import { IVAReports } from '@/types/iva-reports';
import toast from 'react-hot-toast';
import { deleteIva, updateIva } from '../utils/api/taxpayer-functions';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { decimalToNumber } from '../utils/number.utils';
import { MoreVertical, Pencil, Trash2, Calendar, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/UI/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/UI/dialog';
import { Label } from '@/components/UI/label';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';

interface Props {
    rows: IVAReports[];
    pdfMode?: boolean;
    setRows?: React.Dispatch<React.SetStateAction<IVAReports[]>>;
    canEdit?: boolean;
}

/** Solo dígitos → DD/MM/AAAA mientras el usuario escribe (hasta 8 dígitos). */
function formatDateDigitsAsTyping(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    if (digits.length <= 2) return dd;
    if (digits.length <= 4) return `${dd}/${mm}`;
    return `${dd}/${mm}/${yyyy}`;
}

/** Normaliza DD/M/AAAA o D/M/AA a DD/MM/YYYY al salir del campo. */
function normalizeDateDisplayOnBlur(display: string): string {
    const trimmed = display.trim();
    if (!trimmed) return "";
    const parts = trimmed.split("/").map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length !== 3) {
        return formatDateDigitsAsTyping(trimmed);
    }
    const d = Number(parts[0]);
    const mo = Number(parts[1]);
    let yStr = parts[2];
    if (!Number.isFinite(d) || !Number.isFinite(mo)) {
        return formatDateDigitsAsTyping(trimmed.replace(/\D/g, ""));
    }
    if (yStr.length === 2 && /^\d{2}$/.test(yStr)) {
        yStr = `20${yStr}`;
    }
    const y = Number(yStr);
    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
        return formatDateDigitsAsTyping(trimmed.replace(/\D/g, ""));
    }
    const dd = String(d).padStart(2, "0");
    const mm = String(mo).padStart(2, "0");
    const yyyy = String(y);
    return `${dd}/${mm}/${yyyy}`;
}

/** Fecha guardada (ISO) → DD/MM/AAAA para el input. */
function isoUtcToDdMmYyyy(isoOrDate: string): string {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getUTCFullYear());
    return `${dd}/${mm}/${yyyy}`;
}

/** DD/MM/YYYY válido → ISO UTC 12:00 (mismo criterio que el alta de IVA). */
function ddMmYyyyToIsoUtcNoon(display: string): string | null {
    const normalized = normalizeDateDisplayOnBlur(display);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
        return null;
    }
    return dt.toISOString();
}

function sanitizeAmountInput(value: string): string {
    const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const [intPart, ...rest] = normalized.split(".");
    const decimals = rest.join("");
    return decimals.length > 0 ? `${intPart}.${decimals.slice(0, 6)}` : intPart;
}

function formatAmountInput(value: string): string {
    const cleaned = sanitizeAmountInput(value);
    if (!cleaned) return "0.00";
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return "0.00";
    return parsed.toFixed(2);
}

type IvaAmountField = 'iva' | 'excess' | 'purchases' | 'sells' | 'paid';

interface IvaEditFormValues {
    date: string;
    iva: string;
    excess: string;
    purchases: string;
    sells: string;
    paid: string;
}

const EMPTY_IVA_EDIT: IvaEditFormValues = {
    date: '',
    iva: '0',
    excess: '0',
    purchases: '0',
    sells: '0',
    paid: '0',
};

const AMOUNT_FIELDS: { key: IvaAmountField; label: string }[] = [
    { key: 'iva', label: 'IVA (Bs.)' },
    { key: 'excess', label: 'Exc. crédito (Bs.)' },
    { key: 'purchases', label: 'Compras (Bs.)' },
    { key: 'sells', label: 'Ventas (Bs.)' },
    { key: 'paid', label: 'Pagado (Bs.)' },
];

const TaxSummaryTable: React.FC<Props> = ({ rows, pdfMode, setRows, canEdit }) => {
    const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<IvaEditFormValues>(EMPTY_IVA_EDIT);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    if (!user) return null;

    const columns: { name: string; id: keyof IVAReports | 'options' }[] = [
        { name: 'Fecha', id: 'date' },
        { name: 'IVA', id: 'iva' },
        { name: 'Exc. Crédito', id: 'excess' },
        { name: 'Compras', id: 'purchases' },
        { name: 'Ventas', id: 'sells' },
        { name: 'Pagado', id: 'paid' },
    ];

    if (canEdit) {
        columns.push({ name: '', id: 'options' });
    }

    const sortedItems = useMemo(() => {
        return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rows]);

    const processedItems = useMemo(() => {
        return sortedItems.map((item, index) => ({ ...item, _key: item.id || index.toString() }));
    }, [sortedItems]);

    const handleEdit = (item: IVAReports) => {
        setEditingRowId(item.id);
        setEditValues({
            date: isoUtcToDdMmYyyy(String(item.date)),
            iva: String(decimalToNumber(item.iva)),
            excess: String(decimalToNumber(item.excess)),
            purchases: String(decimalToNumber(item.purchases)),
            sells: String(decimalToNumber(item.sells)),
            paid: String(decimalToNumber(item.paid)),
        });
    };

    const handleEditFieldChange = (field: keyof IvaEditFormValues, value: string) => {
        if (field === "date") {
            setEditValues(prev => ({ ...prev, date: formatDateDigitsAsTyping(value) }));
            return;
        }
        setEditValues(prev => ({ ...prev, [field]: sanitizeAmountInput(value) }));
    };

    /** ISO listo para backend; null si la fecha aún no es válida. */
    const parsedEditDateIso = ddMmYyyyToIsoUtcNoon(editValues.date);

    const handleSave = async () => {
        try {
            if (!editingRowId) return;
            const dateIso = ddMmYyyyToIsoUtcNoon(editValues.date);
            if (!dateIso) {
                toast.error("Fecha inválida. Complete DD/MM/AAAA (solo números, el formato se aplica solo).");
                return;
            }
            setSaving(true);
            const payload: Partial<IVAReports> = {
                id: editingRowId,
                date: dateIso,
                iva: Number(formatAmountInput(editValues.iva)),
                excess: Number(formatAmountInput(editValues.excess)),
                purchases: Number(formatAmountInput(editValues.purchases)),
                sells: Number(formatAmountInput(editValues.sells)),
                paid: Number(formatAmountInput(editValues.paid)),
            };
            await updateIva(payload);
            setRows?.(prev =>
                prev.map(row =>
                    row.id === editingRowId
                        ? {
                              ...row,
                              ...payload,
                              date: payload.date || row.date,
                          }
                        : row
                )
            );
            toast.success('Cambios guardados');
            setEditingRowId(null);
            setEditValues(EMPTY_IVA_EDIT);
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditValues(EMPTY_IVA_EDIT);
    };

    const confirmDeleteReport = async () => {
        if (!reportIdToDelete) return;
        try {
            await deleteIva(reportIdToDelete);
            toast.success('Reporte eliminado');
            setRows?.(prev => prev.filter(row => row.id !== reportIdToDelete));
            setReportIdToDelete(null);
        } catch (err: any) {
            toast.error(`Error: ${err.message || err}`);
        }
    };

    const numCols: (keyof IVAReports | 'options')[] = ['iva', 'excess', 'purchases', 'sells', 'paid'];

    const previewBs = (field: IvaAmountField) =>
        Number(formatAmountInput(editValues[field])).toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <>
            <style>{`
                .et-wrap { --et-base:#0b1220;--et-surface:#111f32;--et-border:rgba(148,163,184,0.09);--et-border-row:rgba(148,163,184,0.07);--et-text-1:#e2e8f0;--et-text-2:#94a3b8;--et-text-3:#475569;--et-hover:rgba(148,163,184,0.05);--et-amber:#f59e0b;font-family:'Inter',system-ui,sans-serif;width:100%;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--et-border) transparent; }
                .et-wrap::-webkit-scrollbar{height:4px;} .et-wrap::-webkit-scrollbar-thumb{background:var(--et-border);border-radius:2px;}
                .et-table{width:100%;min-width:640px;border-collapse:collapse;font-size:13px;table-layout:fixed;}
                .et-thead tr{background:rgba(8,15,28,0.9);border-bottom:1px solid var(--et-border);}
                .et-th{padding:12px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--et-text-3);text-align:left;white-space:nowrap;}
                .et-th.num{text-align:right;} .et-th.center{text-align:center;}
                .et-tr{border-bottom:1px solid var(--et-border-row);transition:background 0.12s;}
                .et-tr:hover{background:var(--et-hover);} .et-tr:last-child{border-bottom:none;}
                .et-td{padding:14px 14px;color:var(--et-text-1);vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
                .et-td.num{text-align:right;font-family:ui-monospace,monospace;font-size:13px;font-variant-numeric:tabular-nums;color:var(--et-text-2);}
                .et-td.center{text-align:center;display:table-cell;}
                .et-td.center > *{margin:0 auto;}
                .et-paid-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(16,185,129,0.12);color:#6ee7b7;}
                .et-zero-val{color:var(--et-text-3);}
                .et-menu-btn{width:40px;height:40px;border-radius:8px;background:transparent;border:1px solid var(--et-border);color:var(--et-text-3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.12s,color 0.12s;}
                .et-menu-btn:hover{background:rgba(148,163,184,0.10);color:var(--et-text-1);}
                .et-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:opacity 0.15s;}
                .et-btn:hover{opacity:0.85;}
                .et-btn.cancel{background:transparent;border-color:rgba(148,163,184,0.2);color:#94a3b8;}
            `}</style>

            <div className="et-wrap">
                {pdfMode && <p className="py-8 text-lg text-slate-100">Historial de IVA</p>}

                <table className="et-table">
                    <thead className="et-thead">
                        <tr>
                            <th style={{ width: 3, padding: 0 }} />
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    style={col.id === 'date' ? { width: '120px' } : (col.id === 'options' ? { width: '72px' } : {})}
                                    className={`et-th${numCols.includes(col.id) ? ' num' : col.id === 'options' ? ' center' : ''}`}
                                >
                                    {col.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedItems.map(item => (
                            <tr key={item._key} className="et-tr">
                                <td style={{ width: 3, padding: 0 }} />
                                {columns.map(col => {
                                    const isNum = numCols.includes(col.id);

                                    return (
                                        <td key={col.id} className={`et-td${isNum ? ' num' : col.id === 'options' ? ' center' : ''}`}>
                                            {col.id === 'options' && !pdfMode && canEdit ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button type="button" className="et-menu-btn" title="Opciones">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e293b] border-slate-700 min-w-[160px] text-slate-200 p-1">
                                                        <DropdownMenuItem
                                                          className="flex items-center gap-2 cursor-pointer text-blue-300 focus:bg-slate-800 focus:text-blue-200 rounded-md px-3 py-2.5 text-sm min-h-[44px]"
                                                          onClick={() => handleEdit(item)}
                                                        >
                                                            <Pencil size={16} /> Editar reporte
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                          className="flex items-center gap-2 cursor-pointer text-rose-300 focus:bg-slate-800 focus:text-rose-200 rounded-md px-3 py-2.5 text-sm min-h-[44px]"
                                                          onClick={() => setReportIdToDelete(item.id)}
                                                        >
                                                            <Trash2 size={16} /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : col.id === 'date' ? (
                                                (() => {
                                                    const [y, m] = item.date.slice(0, 10).split('-');
                                                    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                                    const mi = Number(m) - 1;
                                                    const label = mi >= 0 && mi < 12 ? `${monthNames[mi]} ${y}` : `${m}/${y}`;
                                                    return <span title={item.date}>{label}</span>;
                                                })()
                                            ) : col.id === 'paid' ? (
                                                (() => {
                                                    const val = decimalToNumber(item.paid);
                                                    return val > 0 ? (
                                                        <span className="et-paid-badge">
                                                            {val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="et-zero-val">—</span>
                                                    );
                                                })()
                                            ) : isNum ? (
                                                decimalToNumber(item[col.id as keyof IVAReports]).toLocaleString('es-VE', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })
                                            ) : (
                                                String(item[col.id as keyof IVAReports])
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog
                open={!!editingRowId}
                onOpenChange={(open) => {
                    if (!open) handleCancel();
                }}
            >
                <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-xl bg-slate-900 border-slate-700/80 text-slate-100 p-0 overflow-hidden gap-0">
                    <div className="h-0.5 bg-gradient-to-r from-amber-500 via-amber-400/60 to-transparent" />

                    <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <DialogHeader className="flex-1 space-y-1.5 text-left p-0 pr-6">
                            <DialogTitle className="text-base sm:text-lg font-bold text-white leading-tight">
                                Editar declaración de IVA
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                                Escriba la fecha solo con números (DD/MM/AAAA); los montos con dos decimales. Todo se envía en UTC al servidor.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-200px)] px-5 py-5">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="iva-edit-date" className="text-slate-300 text-sm font-medium">
                                    Fecha del reporte
                                </Label>
                                <Input
                                    id="iva-edit-date"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="DD/MM/AAAA"
                                    className="h-12 text-base font-mono tabular-nums bg-slate-950 border-slate-600 text-white tracking-wide"
                                    value={editValues.date}
                                    onChange={(e) => handleEditFieldChange("date", e.target.value)}
                                    onBlur={() =>
                                        setEditValues((prev) => ({
                                            ...prev,
                                            date: normalizeDateDisplayOnBlur(prev.date),
                                        }))
                                    }
                                />
                                <p className="text-xs text-slate-500">
                                    Escriba 8 números seguidos (día, mes, año); se mostrará como DD/MM/AAAA. Ej.: <span className="font-mono text-slate-400">17032026</span> → 17/03/2026.
                                </p>
                                {parsedEditDateIso ? (
                                    <p className="text-[11px] text-slate-500 font-mono break-all">
                                        ISO (backend): <span className="text-emerald-400/90">{parsedEditDateIso}</span>
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-amber-500/90">
                                        Complete una fecha válida (calendario) para poder guardar.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {AMOUNT_FIELDS.map(({ key, label }) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={`iva-edit-${key}`} className="text-slate-300 text-sm font-medium">
                                            {label}
                                        </Label>
                                        <Input
                                            id={`iva-edit-${key}`}
                                            inputMode="decimal"
                                            autoComplete="off"
                                            className="h-12 text-base font-mono tabular-nums bg-slate-950 border-slate-600 text-white"
                                            value={String(editValues[key] ?? '')}
                                            onChange={(e) => handleEditFieldChange(key, e.target.value)}
                                            onBlur={(e) => handleEditFieldChange(key, formatAmountInput(e.target.value))}
                                        />
                                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                                            Vista previa: {previewBs(key)} Bs.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-4 px-5 pt-5 pb-6 sm:pb-8 border-t border-slate-800 bg-slate-900/95 mt-1">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto min-h-[48px] border-slate-600 text-slate-200 bg-slate-800/50 hover:bg-slate-800 sm:mb-0.5"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="w-full sm:w-auto min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold sm:mb-0.5"
                            onClick={() => void handleSave()}
                            disabled={saving || !parsedEditDateIso}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Guardando…
                                </>
                            ) : (
                                'Guardar cambios'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {reportIdToDelete && canEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm p-6 rounded-xl" style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
                        <p className="mb-4 text-sm text-slate-200">¿Eliminar este reporte de IVA?</p>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button type="button" className="et-btn cancel min-h-[44px] px-4" onClick={() => setReportIdToDelete(null)}>Cancelar</button>
                            <button type="button" className="et-btn min-h-[44px] px-4" style={{ background: '#e11d48', color: 'white' }} onClick={confirmDeleteReport}><Trash2 size={14} /> Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaxSummaryTable;
