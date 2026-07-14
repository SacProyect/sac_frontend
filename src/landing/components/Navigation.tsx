import { motion } from 'framer-motion';
import { useHeaderScroll } from '../hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: 'Módulos', href: '#modulos' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Seguridad', href: '#seguridad' },
  { label: 'Contacto', href: '#contacto' },
];

export function Navigation() {
  const isScrolled = useHeaderScroll(50);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-500',
        isScrolled
          ? 'border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 group">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
            <Shield className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            SAC
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <span className="relative z-10">{link.label}</span>
              <span className="absolute inset-0 rounded-lg bg-slate-100 opacity-0 transition-opacity duration-300 hover:opacity-100 dark:bg-slate-800/50" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#contacto"
            className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 md:inline-flex"
          >
            Solicitar Demo
          </a>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          >
            {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-slate-200 bg-white px-6 pb-6 dark:border-slate-800 dark:bg-slate-950 md:hidden"
        >
          <div className="flex flex-col gap-2 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Solicitar Demo
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
