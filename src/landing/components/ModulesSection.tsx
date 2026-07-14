import { motion } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { BentoCard, BentoGrid } from './BentoGrid';
import { 
  FileCheck, 
  Calculator, 
  Shield, 
  BarChart3, 
  Cloud, 
  Lock,
  RefreshCw,
  Globe,
  Database,
  AlertTriangle,
  FileText,
  Users
} from 'lucide-react';

const modules = [
  {
    title: 'Módulo de Auditoría Fiscal',
    description: 'Herramientas completas para auditorías internas y externas con trazabilidad total de cada operación.',
    icon: <FileCheck className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Cálculo Automático ISLR',
    description: 'Motor de cálculo inteligente que procesa declaraciones de ISLR con precisión y cumplimiento normativo.',
    icon: <Calculator className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Reporting en Tiempo Real',
    description: 'Dashboards interactivos con métricas fiscales actualizadas al instante para toma de decisiones.',
    icon: <BarChart3 className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Seguridad de Nivel Empresarial',
    description: 'Encriptación AES-256, autenticación multifactor y cumplimiento con estándares internacionales.',
    icon: <Shield className="size-7" />,
    span: 'col-span-2' as const,
  },
  {
    title: 'Integración API REST',
    description: 'Conecta SAC con tu ERP, CRM o sistemas internos mediante nuestra API REST documentada.',
    icon: <Globe className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Copia de Seguridad Automática',
    description: 'Respaldo continuo en la nube con recuperación ante desastres en menos de 15 minutos.',
    icon: <Cloud className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Gestión de Máquinas Fiscales',
    description: 'Control total de impresoras fiscales, técnicos y mantenimiento preventivo-programado.',
    icon: <Database className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Alertas de Cumplimiento',
    description: 'Notificaciones proactivas sobre deadlines tributarios y cambios normativos relevantes.',
    icon: <AlertTriangle className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Generación de Documentos',
    description: 'Creación automatizada de planillas, certificados y reportes en múltiples formatos.',
    icon: <FileText className="size-7" />,
    span: 'col-span-1' as const,
  },
  {
    title: 'Gestión de Usuarios',
    description: 'Control de acceso basado en roles con permisos granulares y auditoría de sesiones.',
    icon: <Users className="size-7" />,
    span: 'col-span-1' as const,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function ModulesSection() {
  const [ref, isVisible] = useScrollAnimation<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  return (
    <section
      id="modulos"
      ref={ref}
      className="relative overflow-hidden bg-white py-32 dark:bg-slate-950"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 size-1/2 rounded-full bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent" />
        <div className="absolute -left-1/4 -bottom-1/4 size-1/2 rounded-full bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Módulos Integrados
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Todo lo que necesitas para una{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              gestión fiscal impecable
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Cada módulo de SAC está diseñado para integrarse perfectamente, 
            creando un ecosistema unificado que simplifica los procesos tributarios 
            más complejos de tu organización.
          </p>
        </motion.div>

        <motion.div
          ref={ref as React.RefObject<HTMLDivElement>}
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="mt-16"
        >
          <BentoGrid>
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                variants={itemVariants}
              >
                <BentoCard
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  delay={index * 50}
                  span={module.span}
                />
              </motion.div>
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
