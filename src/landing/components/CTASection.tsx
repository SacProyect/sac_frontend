import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';

export function CTASection() {
  const [ref, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    <section
      id="contacto"
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-32 dark:from-slate-950 dark:to-slate-900"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 size-1/2 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute -left-1/4 -bottom-1/4 size-1/2 rounded-full bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2rem] border border-slate-200/50 bg-white p-12 shadow-2xl shadow-slate-200/50 dark:border-slate-800/50 dark:bg-slate-900/80 dark:shadow-none md:p-16"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
          
          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-8 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30"
            >
              <Calendar className="size-10" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl"
            >
              ¿Listo para transformar tu{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                gestión fiscal?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-400"
            >
              Agenda una demostración personalizada y descubre cómo SAC puede 
              optimizar tus procesos tributarios. Sin compromiso, con soporte técnico dedicado.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row"
            >
              <a
                href="mailto:contacto@sac.com?subject=Demo%20SAC"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30"
              >
                Solicitar Demo Gratuita
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Demo personalizada</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Sin compromiso</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Soporte dedicado</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
