import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollText, Table2 } from 'lucide-react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/UI/tabs';
import { BackButton } from '@/components/UI/v2';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { CommandCenterMetrics } from '../CommandCenterMetrics/CommandCenterMetrics';
import { ActasTab } from '../ActasTab/ActasTab';
import { ExpedientesTab } from '../ExpedientesTab/ExpedientesTab';

type TabKey = 'actas' | 'expedientes';

const TAB_HASH: Record<TabKey, string> = {
    actas: '#actas',
    expedientes: '#expedientes',
};

const VALID_HASHES = new Set<string>(Object.values(TAB_HASH));

/**
 * Shell del Centro de Mando: Actas y Expedientes (TASK-003).
 *
 * Responsabilidades:
 *  - Header (eyebrow + título + descripción) — guide §3.2
 *  - Fila de 6 Ledger Blocks — guide §3.3 (delegado a `CommandCenterMetrics`)
 *  - Sub-navegación de 2 tabs (Actas → Expedientes, orden invertido
 *    respecto a `/gestion-personal` por coherencia con el nombre de la
 *    ruta; ver guía §3.4 / MINOR #11) — guide §3.4
 *  - Hash routing bidireccional `#actas` / `#expedientes` (EARS)
 *  - Stagger de entrada y respeto a `prefers-reduced-motion` — guide §6
 *
 * Fuera de scope de este shell:
 *  - Carga real de métricas (TASK-004a / TASK-005a)
 *  - Dropzone, tabla de actas, dialogs, sheet de filtros (TASK-004a/b/c)
 *  - Filtros sticky, cards/tabla de expedientes, export Excel (TASK-005a/b/c)
 *  - Banner de deprecación (TASK-006)
 */
export function Shell() {
    const location = useLocation();
    const navigate = useNavigate();
    const reducedMotion = usePrefersReducedMotion();

    const [activeTab, setActiveTab] = useState<TabKey>(() => {
        const hash = location.hash.replace('#', '');
        return hash === 'expedientes' ? 'expedientes' : 'actas';
    });

    // Sincroniza `activeTab → window.location.hash` (sin loops).
    useEffect(() => {
        const newHash = TAB_HASH[activeTab];
        if (location.hash !== newHash) {
            navigate({ hash: newHash }, { replace: true });
        }
    }, [activeTab, location.hash, navigate]);

    // Sincroniza cambios externos de hash (back/forward, deep-link) → state.
    // `useState` initializer solo corre una vez, así que este listener
    // mantiene la pestaña activa coherente con la URL en todo momento.
    useEffect(() => {
        const current = location.hash.replace('#', '');
        if (!VALID_HASHES.has(location.hash)) return;
        if (current !== activeTab) {
            setActiveTab(current as TabKey);
        }
    }, [location.hash, activeTab]);

    return (
        <div
            data-testid="gestion-actas-page"
            className="space-y-5 max-w-[1680px] mx-auto pb-8"
        >
            <div data-testid="gestion-actas-back">
                <BackButton to="/admin" hideLabelOnMobile className="mb-2" />
            </div>

            <header className="space-y-2 min-w-0 pt-2">
                <h1
                    data-testid="gestion-actas-title"
                    className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground border-b-2 border-indigo-500/30 pb-3"
                >
                    Centro de Mando: Actas y Expedientes
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed mt-2">
                    Vista global de actas de reparo y control de expedientes
                    fiscales. Las métricas principales se mantienen visibles
                    mientras exploras el detalle.
                </p>
            </header>

            <motion.section
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                    reducedMotion ? { duration: 0 } : { duration: 0.25 }
                }
            >
                <CommandCenterMetrics />
            </motion.section>

            <section className="pt-2">
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as TabKey)}
                    className="w-full"
                >
                    <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/30 border border-border/60 rounded-lg w-full justify-start">
                        <TabsTrigger
                            value="actas"
                            data-testid="gestion-actas-tab-actas"
                            className="gap-1.5 px-4 py-2.5 data-[state=active]:bg-indigo-500/5 data-[state=active]:border-l-2 data-[state=active]:border-l-indigo-500 data-[state=active]:text-foreground data-[state=active]:font-medium border border-transparent transition-colors"
                        >
                            <ScrollText className="h-4 w-4" />
                            Actas de Reparo
                        </TabsTrigger>
                        <TabsTrigger
                            value="expedientes"
                            data-testid="gestion-actas-tab-expedientes"
                            className="gap-1.5 px-4 py-2.5 data-[state=active]:bg-indigo-500/5 data-[state=active]:border-l-2 data-[state=active]:border-l-indigo-500 data-[state=active]:text-foreground data-[state=active]:font-medium border border-transparent transition-colors"
                        >
                            <Table2 className="h-4 w-4" />
                            Control de Expedientes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="actas"
                        className="mt-6 focus-visible:outline-none"
                    >
                        <ActasTab />
                    </TabsContent>
                    <TabsContent
                        value="expedientes"
                        className="mt-6 focus-visible:outline-none"
                    >
                        <ExpedientesTab />
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}
