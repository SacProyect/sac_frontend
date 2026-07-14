import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle2, FileText, Lock, TrendingUp } from 'lucide-react';

const floatingAnimation = {
  y: [0, -20, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const stats = [
  { value: '99.9%', label: 'Uptime Garantizado' },
  { value: '50K+', label: 'Empresas Confían' },
  { value: '<50ms', label: 'Tiempo de Respuesta' },
];

const features = [
  'Cumplimiento fiscal automático',
  'Reportes en tiempo real',
  'Integración API segura',
  'Soporte 24/7 especializado',
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 size-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 size-1/2 rounded-full bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent blur-3xl" />
        
        <motion.div
          style={{ y }}
          className="absolute inset-0"
        >
          <div className="absolute left-1/2 top-20 grid size-96 grid-cols-3 gap-4 opacity-[0.03]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-900 dark:bg-white" />
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 mx-auto max-w-7xl px-6 pt-32 lg:px-8"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
            >
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              Sistema de Gestión Fiscal Certificado
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-900 bg-clip-text">
                El sistema fiscal
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                que impulsa empresas
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400"
            >
              SAC es la plataforma integral de gestión fiscal y administrativa 
              diseñada para empresas que requieren máxima confiabilidad, 
              seguridad y escalabilidad en sus procesos tributarios.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="#contacto"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30"
              >
                Solicitar Demo
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#modulos"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Explorar Módulos
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative lg:pl-8"
          >
            <motion.div
              animate={floatingAnimation}
              className="relative"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
              
              <div className="relative rounded-3xl border border-slate-200/50 bg-white/80 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Panel de Control
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      <FileText className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Declaraciones Procesadas
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">12,847</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      <TrendingUp className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Crecimiento Mensual
                      </p>
                      <p className="text-2xl font-bold text-emerald-600">+23.5%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                      <Lock className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Seguridad Activa
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">Nivel 5</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: 1,
                }}
                className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-200/50 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/90"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Validación OK</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">ISLR 2026</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 grid grid-cols-2 gap-8 md:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-100 to-transparent dark:from-slate-900 dark:to-transparent" />
    </section>
  );
}
