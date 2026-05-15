import { useState } from "react";
import { PersonalFiscalPanel } from "@/components/gestion-personal/personal-fiscal-panel";
import { CasosPorFiscalSection } from "@/components/gestion-personal/casos-por-fiscal-section";
import { PersonalPermisosVacacionesPanel } from "@/components/gestion-personal/personal-permisos-vacaciones-panel";
import { ReparosActasSection } from "@/components/gestion-personal/reparos-actas-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import { BarChart3, CalendarRange, ScrollText, Table2 } from "lucide-react";

/**
 * Módulo «Gestión de personal»: métricas, casos por fiscal, permisos/vacaciones (tabla + tarjetas)
 * y actas de reparo — todo en un solo lugar para admin y coordinador.
 */
export default function GestionPersonalPageV2() {
    const [casosYear, setCasosYear] = useState(() => new Date().getFullYear());

    return (
        <div className="space-y-5 max-w-[1680px] mx-auto pb-8">
            <header className="space-y-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    SAC Fiscal · Recursos humanos de campo
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestión de personal</h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    Métricas y visitas, casos por fiscal, permisos y actas de reparo. Use las pestañas para cambiar de
                    vista.
                </p>
            </header>

            <Tabs defaultValue="permisos" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/80 border border-border rounded-lg w-full justify-start">
                    <TabsTrigger
                        value="metricas"
                        className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Métricas y visitas
                    </TabsTrigger>
                    <TabsTrigger
                        value="casos"
                        className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <Table2 className="h-4 w-4" />
                        Casos por fiscal
                    </TabsTrigger>
                    <TabsTrigger
                        value="permisos"
                        className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <CalendarRange className="h-4 w-4" />
                        Permisos y vacaciones
                    </TabsTrigger>
                    <TabsTrigger
                        value="actas"
                        className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <ScrollText className="h-4 w-4" />
                        Actas de reparo
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="metricas" className="mt-4 focus-visible:outline-none">
                    <PersonalFiscalPanel hideCasosReportCard />
                </TabsContent>

                <TabsContent value="casos" className="mt-4 focus-visible:outline-none">
                    <CasosPorFiscalSection year={casosYear} onYearChange={setCasosYear} />
                </TabsContent>

                <TabsContent value="permisos" className="mt-4 focus-visible:outline-none">
                    <PersonalPermisosVacacionesPanel />
                </TabsContent>

                <TabsContent value="actas" className="mt-4 focus-visible:outline-none">
                    <ReparosActasSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}
