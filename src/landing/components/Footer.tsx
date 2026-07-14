import { Shield, Mail, Phone, MapPin, Linkedin, Twitter } from 'lucide-react';

const footerLinks = {
  producto: [
    { label: 'Módulos', href: '#modulos' },
    { label: 'Características', href: '#caracteristicas' },
    { label: 'Seguridad', href: '#seguridad' },
    { label: 'Precios', href: '#' },
  ],
  empresa: [
    { label: 'Sobre Nosotros', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Partners', href: '#' },
  ],
  legal: [
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Términos de Servicio', href: '#' },
    { label: 'Política de Cookies', href: '#' },
    { label: 'Compliance', href: '#' },
  ],
  soporte: [
    { label: 'Centro de Ayuda', href: '#' },
    { label: 'Documentación API', href: '#' },
    { label: 'Estado del Sistema', href: '#' },
    { label: 'Contacto', href: '#contacto' },
  ],
};

const socialLinks = [
  { icon: <Linkedin className="size-5" />, href: '#', label: 'LinkedIn' },
  { icon: <Twitter className="size-5" />, href: '#', label: 'Twitter' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <Shield className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                SAC
              </span>
            </a>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Sistema de Gestión Fiscal y Administrativa certificado. 
              Más de 50,000 empresas confían en SAC para su cumplimiento tributario.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="mailto:contacto@sac.com"
                className="flex items-center gap-3 text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                <Mail className="size-4" />
                contacto@sac.com
              </a>
              <a
                href="tel:+5802121234567"
                className="flex items-center gap-3 text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                <Phone className="size-4" />
                +58 0212 123 4567
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="size-4" />
                Caracas, Venezuela
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Producto
            </h4>
            <ul className="mt-6 space-y-4">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Empresa
            </h4>
            <ul className="mt-6 space-y-4">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal
            </h4>
            <ul className="mt-6 space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2026 SAC - Sistema de Gestión Fiscal. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
