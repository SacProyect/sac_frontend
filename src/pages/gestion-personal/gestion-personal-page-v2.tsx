import { useState } from "react";
import { PersonalFiscalPanel } from "@/components/gestion-personal/personal-fiscal-panel";
import { CasosPorFiscalSection } from "@/components/gestion-personal/casos-por-fiscal-section";
import { PersonalPermisosVacacionesPanel } from "@/components/gestion-personal/personal-permisos-vacaciones-panel";
import { ReparosActasSection } from "@/components/gestion-personal/reparos-actas-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import { BackButton } from "@/components/UI/v2";
import { BarChart3, CalendarRange, ScrollText, Table2 } from "lucide-react";

/**
 * Módulo «Gestión de personal»: métricas, casos por fiscal, permisos/vacaciones (tabla + tarjetas)
 * y actas de reparo — rediseñado como un Centro de Mando (Command Center).
 */
export default function GestionPersonalPageV2() {
    const [casosYear, setCasosYear] = useState(() => new Date().getFullYear());

    return (
        <div className="space-y-5 max-w-[1680px] mx-auto pb-8">
            <BackButton to="/admin" hideLabelOnMobile className="mb-2" />
            <header className="space-y-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    SAC Fiscal · Operaciones de Campo
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Centro de Mando: Personal</h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    Vista global del cuadrante, carga de expedientes y estado del equipo. Las métricas principales 
                    se mantienen visibles mientras explora el detalle de casos y novedades.
                </p>
            </header>

            {/* Panel de métricas (Ledger) persistente en la parte superior - Oculto temporalmente */}
            {/* 
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <PersonalFiscalPanel hideCasosReportCard />
            </section>
            */}

            {/* Detalle profundo en pestañas secundarias */}
            <section className="pt-2">
                <Tabs defaultValue="casos" className="w-full">
                    <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/30 border border-border/60 rounded-lg w-full justify-start">
                        <TabsTrigger
                            value="casos"
                            className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/60 border border-transparent"
                        >
                            <Table2 className="h-4 w-4" />
                            Control de Expedientes
                        </TabsTrigger>
                        <TabsTrigger
                            value="permisos"
                            className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/60 border border-transparent"
                        >
                            <CalendarRange className="h-4 w-4" />
                            Cuadrante y Novedades
                        </TabsTrigger>
                        <TabsTrigger
                            value="actas"
                            className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/60 border border-transparent"
                        >
                            <ScrollText className="h-4 w-4" />
                            Actas de Reparo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="casos" className="mt-6 focus-visible:outline-none">
                        <CasosPorFiscalSection year={casosYear} onYearChange={setCasosYear} />
                    </TabsContent>

                    <TabsContent value="permisos" className="mt-6 focus-visible:outline-none">
                        <PersonalPermisosVacacionesPanel />
                    </TabsContent>

                    <TabsContent value="actas" className="mt-6 focus-visible:outline-none">
                        <ReparosActasSection />
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}
