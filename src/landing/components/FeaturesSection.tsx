import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { CheckCircle2, Star } from 'lucide-react';

const features = [
  {
    title: 'Escalabilidad Ilimitada',
    description: 'De PyMEs a corporaciones, SAC crece contigo sin comprometer el rendimiento.',
  },
  {
    title: 'Tiempo de Actividad 99.9%',
    description: 'Infraestructura redundante que garantiza disponibilidad continua.',
  },
  {
    title: 'Cumplimiento Normativo Total',
    description: 'Actualizaciones automáticas ante cambios legislativos.',
  },
  {
    title: 'Soporte Técnico 24/7',
    description: 'Equipo especializado disponible en todo momento por múltiples canales.',
  },
  {
    title: 'Migración Sin Fricción',
    description: 'Proceso de migración asistido con mínimo impacto operativo.',
  },
  {
    title: 'API Abierta y Documentada',
    description: 'Integración perfecta con cualquier sistema existente.',
  },
];

const certifications = [
  'ISO 27001',
  'SOC 2 Type II',
  'GDPR Compliant',
  'LEA Certified',
];

export function FeaturesSection() {
  const [ref, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    <section
      id="caracteristicas"
      ref={ref}
      className="relative overflow-hidden bg-slate-50 py-32 dark:bg-slate-900"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-transparent to-slate-50/50 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Características
            </span>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              Infraestructura de{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                clase mundial
              </span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              SAC está construido sobre una arquitectura queprioriza la seguridad, 
              confiabilidad y rendimiento. Cada característica está diseñada para 
              cumplir con los estándares más exigentes del sector.
            </p>

            <div className="mt-10 grid gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 flex size-6 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  {cert}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl" />
            
            <div className="relative rounded-3xl border border-slate-200/50 bg-white p-8 shadow-2xl dark:border-slate-800/50 dark:bg-slate-900">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Star className="size-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Rated 4.9/5
                </h3>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'María González', role: 'CFO TechCorp', text: 'SAC transformó completamente nuestra gestión fiscal.' },
                  { name: 'Carlos Ruiz', role: 'Director Financiero', text: 'La mejor inversión que hemos hecho para compliance.' },
                  { name: 'Ana Martínez', role: 'Gerente de Impuestos', text: 'Automatizó procesos que nos tomaban semanas.' },
                ].map((testimonial) => (
                  <div
                    key={testimonial.name}
                    className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"
                  >
                    <p className="text-sm italic text-slate-600 dark:text-slate-400">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
