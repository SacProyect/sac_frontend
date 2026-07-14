import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'María González',
    role: 'CFO - TechCorp Venezuela',
    company: 'TechCorp',
    quote: 'SAC transformó completamente nuestra gestión de declaraciones fiscales. Lo que antes nos tomaba semanas ahora lo hacemos en horas con total confianza.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Director Financiero - Grupo Estratégico',
    company: 'Grupo Estratégico',
    quote: 'La seguridad y el cumplimiento normativo que ofrece SAC nos dio la tranquilidad que necesitábamos. Específicamente su módulo de auditoría es excepcional.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Ana Rodríguez',
    role: 'Gerente de Impuestos - RetailMax',
    company: 'RetailMax',
    quote: 'El soporte técnico es outstanding. Cada vez que tenemos una duda, el equipo de SAC nos responde con precisión y rapidez. Altamente recomendados.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'Roberto Hernández',
    role: 'CEO - Consultores Asociados',
    company: 'Consultores Asociados',
    quote: 'Implementamos SAC en toda nuestra firma de consultoría. La integración con nuestros sistemas existentes fue perfecta y el ROI fue inmediato.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
];

const companies = [
  'TechCorp Venezuela',
  'Grupo Estratégico',
  'RetailMax C.A.',
  'Consultores Asociados',
  'Industrias Bolívar',
  'Servicios Metropolitan',
];

export function SocialProof() {
  const [ref, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white py-32 dark:bg-slate-950"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 top-1/2 size-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Testimonios
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Lo que dicen nuestros{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              clientes
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Más de 50,000 profesionales fiscales confían en SAC para sus operaciones 
            diarias. Esto es lo que tienen que decir.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 grid gap-8 md:grid-cols-2"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-3xl border border-slate-200/50 bg-slate-50/50 p-8 transition-all duration-300 hover:border-slate-300 hover:bg-white dark:border-slate-800/50 dark:bg-slate-900/50 dark:hover:bg-slate-900"
            >
              <Quote className="absolute right-6 top-6 size-8 text-indigo-500/20" />
              
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="size-14 rounded-full object-cover ring-2 ring-white shadow-lg dark:ring-slate-800"
                />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="relative text-slate-600 dark:text-slate-400">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <p className="mb-8 text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Empresas que confían en SAC
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {companies.map((company) => (
              <div
                key={company}
                className="text-lg font-semibold tracking-tight text-slate-300 dark:text-slate-600"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
