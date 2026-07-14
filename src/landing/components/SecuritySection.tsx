import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { Shield, Lock, Eye, FileCheck, Server, UserCheck } from 'lucide-react';

const securityFeatures = [
  {
    icon: <Shield className="size-8" />,
    title: 'Encriptación AES-256',
    description: 'Todos los datos en tránsito y en reposo utilizan encriptación de grado militar.',
  },
  {
    icon: <Lock className="size-8" />,
    title: 'Autenticación Multifactor',
    description: 'Múltiples capas de verificación para acceso seguro a la plataforma.',
  },
  {
    icon: <Eye className="size-8" />,
    title: 'Monitoreo 24/7',
    description: 'Sistema de vigilancia continua con detección de amenazas en tiempo real.',
  },
  {
    icon: <FileCheck className="size-8" />,
    title: 'Auditoría Completa',
    description: 'Registro detallado de cada acción con timestamps verificables.',
  },
  {
    icon: <Server className="size-8" />,
    title: 'Infraestructura Redundante',
    description: 'Centros de datos distribuidos con failover automático.',
  },
  {
    icon: <UserCheck className="size-8" />,
    title: 'Control de Acceso RBAC',
    description: 'Permisos granulares basados en roles organizacionales.',
  },
];

export function SecuritySection() {
  const [ref, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    <section
      id="seguridad"
      ref={ref}
      className="relative overflow-hidden bg-slate-900 py-32 dark:bg-slate-950"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-900/0 to-slate-900/0" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-400">
            Seguridad Primero
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Protección de{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              nivel empresarial
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Tu información fiscal es crítica. SAC implementa las mejores prácticas 
            de seguridad con certificaciones internacionales que respaldan cada capa 
            de protección.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-800/50"
            >
              <div className="mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 transition-colors group-hover:from-indigo-500/30 group-hover:to-purple-500/30">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-12 text-center"
        >
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <Shield className="size-8" />
          </div>
          <h3 className="text-2xl font-bold text-white">Certificaciones Internacionales</h3>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400">
            SAC cumple con los estándares de seguridad más rigurosos: ISO 27001, 
            SOC 2 Type II, y está preparado para GDPR. Auditado regularmente por 
            firmas de seguridad independientes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {['ISO 27001', 'SOC 2 Type II', 'GDPR Ready', 'LEA Certified'].map((cert) => (
              <div
                key={cert}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-2 text-sm font-medium text-emerald-400"
              >
                {cert}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
