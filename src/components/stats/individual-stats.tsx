import React from "react";
import { RepairReports } from "@/types/repair-reports";
import { InvestigationPdf } from "@/types/investigation-pdf";
import { User } from "@/types/user";
import { IVAReports } from "@/types/iva-reports";
import { Parish, TaxpayerCategory } from "@/types/taxpayer";

/** Resumen compacto para barra informativa en móvil (página detalle). */
export interface TaxpayerSummaryStrip {
    rif: string;
    fase: string;
    notified: boolean;
    notificationLabel: string;
}

export interface TaxpayerData {
    providenceNum: number;
    address: string;
    process: string;
    contract_type: string;
    rif: string;
    name: string;
    description: string;
    fase: string;
    notified: Boolean;
    culminated: Boolean;
    RepairReports: RepairReports[];
    officerId: string;
    investigation_pdfs: InvestigationPdf[];
    user: User;
    IVAReports: IVAReports[];
    supervisorId?: string;
    taxpayer_category: TaxpayerCategory | null;
    parish: Parish | null;
    emition_date?: string | Date;
    updated_at?: string | Date;
    /** Índice efectivo (Soberano): propio o general, ya resuelto por el backend. */
    currentEffectiveIndex?: number | null;
}

export function IndividualStatsLeftSkeleton() {
    return (
        <div
            className="w-full min-w-0 min-h-[380px] lg:min-h-[420px] p-4 sm:p-5 lg:p-6 lg:w-1/2 flex flex-col gap-4 animate-pulse border-b lg:border-b-0 lg:border-r border-slate-700/80 bg-slate-800/90"
            aria-hidden
        >
            <div className="flex justify-between gap-2">
                <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-2.5 w-24 rounded bg-slate-600" />
                    <div className="h-5 w-48 max-w-full rounded bg-slate-600" />
                </div>
                <div className="h-8 w-20 rounded-full bg-slate-600 shrink-0" />
            </div>
            <div className="h-px bg-slate-700" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-2 w-16 rounded bg-slate-600" />
                        <div className="h-4 w-full rounded bg-slate-600/70" />
                    </div>
                ))}
            </div>
            <div className="h-px bg-slate-700" />
            <div className="flex flex-wrap gap-2">
                <div className="h-9 w-44 rounded-md bg-slate-600" />
                <div className="h-9 w-40 rounded-md bg-slate-600" />
            </div>
        </div>
    );
}
