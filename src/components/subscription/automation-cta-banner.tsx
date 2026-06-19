import { Link } from 'react-router-dom';

import { ArrowRight, Zap, Sparkles } from 'lucide-react';



interface AutomationCtaBannerProps {

    title: string;

    subtitle: string;

}



/**
 * Banner CTA full-width para fiscales, supervisores y coordinadores.
 * Diseño mejorado: más atractivo, mejor jerarquía visual, micro-animaciones.
 */
export function AutomationCtaBanner({ title, subtitle }: AutomationCtaBannerProps) {

    return (

        <Link

            to="/automatizacion/planes"

            className="group relative block w-full rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/60 via-card/95 to-indigo-950/40 p-4 sm:p-5 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-900/20 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 overflow-hidden"

            aria-label={`${title} - ${subtitle}`}

        >

            {/* Subtle animated background glow */}

            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />



            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">

                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-900/20 transition-transform group-hover:scale-110 duration-300">

                        <Zap className="h-5 w-5 text-emerald-400" />

                    </div>

                    <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                            <p className="text-sm sm:text-base font-bold text-foreground leading-snug">

                                {title}

                            </p>

                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wide">

                                <Sparkles className="h-2.5 w-2.5" />

                                Desde $12/mes

                            </span>

                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">

                            {subtitle}

                        </p>

                    </div>

                </div>



                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 sm:pl-2">

                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all duration-300 group-hover:gap-3 group-hover:from-emerald-500 group-hover:to-emerald-400 group-hover:shadow-xl group-hover:shadow-emerald-900/40">

                        Ver planes

                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />

                    </span>

                </div>

            </div>

        </Link>

    );

}