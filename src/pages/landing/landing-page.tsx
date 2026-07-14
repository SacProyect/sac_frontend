import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { href: "#about", label: "Nosotros" },
  { href: "#modulos", label: "Módulos" },
  { href: "#servicios", label: "Capacidades" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacto", label: "Contacto" },
];

const MODULES = [
  {
    tag: "Operación",
    title: "Administración tributaría",
    description: "Contribuyentes, providencias, avisos y multas en un solo panel operativo.",
    year: "Core",
  },
  {
    tag: "Campo",
    title: "Fiscalización & censo",
    description: "Captura en terreno, mapas y revisión fiscal con trazabilidad completa.",
    year: "Campo",
  },
  {
    tag: "Control",
    title: "Actas y expedientes",
    description: "Centro de mando para actas de reparo y control de expedientes administrativos.",
    year: "Admin",
  },
  {
    tag: "Inteligencia",
    title: "Reportes e indicadores",
    description: "IVA, ISLR, desempeño de grupos y tableros de cumplimiento en tiempo real.",
    year: "BI",
  },
];

const SERVICES = [
  {
    title: "Gestión de contribuyentes",
    body: "Altas, historial, eventos y documentación de cada sujeto pasivo con búsqueda ágil.",
  },
  {
    title: "Fiscalización territorial",
    body: "Censos, presencia fiscal, divulgación y seguimiento de cuadrillas en campo.",
  },
  {
    title: "Cobranza y cumplimiento",
    body: "Multas, pagos, compromisos e indicadores de recupero organizados por periodo.",
  },
  {
    title: "Gobierno y auditoría",
    body: "Roles, bitácora, auditoría interna y control de acceso para equipos municipales.",
  },
];

const FAQS = [
  {
    q: "¿Quién puede usar SAC?",
    a: "Personal autorizado de la administración tributaria: administradores, coordinadores, supervisores y fiscales, según el rol asignado.",
  },
  {
    q: "¿Funciona en celular?",
    a: "Sí. SAC está pensado para escritorio y dispositivos móviles, incluyendo instalación como app desde el navegador (PWA).",
  },
  {
    q: "¿Cómo inicio sesión?",
    a: "Con tu cédula y contraseña institucional. Si aún no tienes acceso, solicita credenciales a tu administrador del sistema.",
  },
  {
    q: "¿Qué pasa si olvido mi contraseña?",
    a: "Puedes usar el flujo de recuperación en el login o pedir un restablecimiento al administrador del sistema.",
  },
  {
    q: "¿Mis datos están protegidos?",
    a: "El acceso es por roles, con sesión autenticada y registros de auditoría. Solo usuarios habilitados operan cada módulo.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "SAC unificó la operación tributaria: menos planillas sueltas y más control sobre cada providencia.",
    name: "Equipo de Coordinación",
    role: "Operaciones",
  },
  {
    quote:
      "En campo el censo y la fiscalización quedaron trazables. Sabemos quién hizo qué y cuándo.",
    name: "Supervisión territorial",
    role: "Fiscalización",
  },
  {
    quote:
      "Los reportes dejaron de ser un cuello de botella. Cerramos el mes con indicadores claros.",
    name: "Administración central",
    role: "Dirección",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#2a261f]/12">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-[family-name:var(--lp-sans)] text-base font-medium text-[#1c1915] sm:text-lg">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#1c1915]/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 font-[family-name:var(--lp-sans)] text-sm leading-relaxed text-[#1c1915]/70 sm:text-base">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("landing-scroll");
    return () => document.documentElement.classList.remove("landing-scroll");
  }, []);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const onContact = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div
      className="sac-landing min-h-app bg-[#f3efe6] text-[#1c1915]"
      style={
        {
          "--lp-serif": '"Cormorant Garamond", "Times New Roman", serif',
          "--lp-sans": '"Sora", system-ui, sans-serif',
        } as CSSProperties
      }
    >
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#1c1915]/10 bg-[#f3efe6]/90 pt-safe backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <a href="#top" className="font-[family-name:var(--lp-serif)] text-2xl font-semibold tracking-tight">
            SAC<span className="align-super text-xs">®</span>
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-[family-name:var(--lp-sans)] text-sm text-[#1c1915]/70 transition hover:text-[#1c1915]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden rounded-full bg-[#1c1915] px-4 py-2 font-[family-name:var(--lp-sans)] text-sm font-medium text-[#f3efe6] transition hover:bg-[#1c1915]/90 sm:inline-flex"
            >
              Acceder
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1c1915]/15 md:hidden"
              aria-label="Menú"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#1c1915]/10 md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 font-[family-name:var(--lp-sans)] text-sm"
                  >
                    {item.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-2 rounded-full bg-[#1c1915] px-4 py-3 font-[family-name:var(--lp-sans)] text-sm font-medium text-[#f3efe6]"
                >
                  Acceder al sistema
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        {/* Hero — brand first, one composition */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(28,25,21,0.06),_transparent_55%)]" />
          <div className="mx-auto grid min-h-[min(92dvh,920px)] max-w-6xl grid-cols-1 items-end gap-10 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="lg:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1c1915]/55"
              >
                Plataforma institucional
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="font-[family-name:var(--lp-serif)] text-[clamp(3.4rem,12vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.03em] text-[#1c1915]"
              >
                SAC<span className="align-super text-[0.35em]">®</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="mt-3 font-[family-name:var(--lp-serif)] text-2xl italic text-[#1c1915]/75 sm:text-3xl md:text-4xl"
              >
                Administración Central
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-6 max-w-xl font-[family-name:var(--lp-sans)] text-base leading-relaxed text-[#1c1915]/65 sm:text-lg"
              >
                Sistema de gestión tributaria y fiscalización: diseño claro, operación diaria y control
                institucional en una sola plataforma.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.24 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1c1915] px-6 py-3 font-[family-name:var(--lp-sans)] text-sm font-semibold text-[#f3efe6] transition hover:bg-[#1c1915]/90"
                >
                  Entrar a SAC
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modulos"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1c1915]/20 bg-transparent px-6 py-3 font-[family-name:var(--lp-sans)] text-sm font-medium text-[#1c1915] transition hover:bg-[#1c1915]/5"
                >
                  Ver módulos
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative lg:col-span-5"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-[#1c1915] shadow-[0_30px_80px_rgba(28,25,21,0.22)]">
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#2a3348_0%,#0b1224_45%,#152238_100%)]" />
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.45),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.35),transparent_35%)]" />
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                  <div>
                    <p className="font-[family-name:var(--lp-sans)] text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                      SAC Studio
                    </p>
                    <p className="mt-4 font-[family-name:var(--lp-serif)] text-3xl font-medium leading-tight text-white sm:text-4xl">
                      Operación tributaria con presencia y claridad.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["+7k", "Contribuyentes"],
                      ["24/7", "Disponibilidad"],
                      ["Roles", "Seguridad"],
                      ["PWA", "Móvil"],
                    ].map(([k, v]) => (
                      <div key={v} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                        <p className="font-[family-name:var(--lp-serif)] text-2xl text-white">{k}</p>
                        <p className="mt-1 font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-wider text-white/55">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-t border-[#1c1915]/10 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1c1915]/45">
                Nosotros
              </p>
              <h2 className="mt-4 font-[family-name:var(--lp-serif)] text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                Diseñado para el trabajo diario de la administración.
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="font-[family-name:var(--lp-sans)] text-lg leading-relaxed text-[#1c1915]/70 sm:text-xl">
                SAC concentra fiscalización, cobranza, reportes y control documental. Menos fricción entre
                equipos, más trazabilidad en cada decisión.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {[
                  ["Operativo", "Desde el primer login"],
                  ["Roles", "ADMIN a fiscal"],
                  ["Móvil", "Listo para instalar"],
                ].map(([t, d]) => (
                  <div key={t}>
                    <p className="font-[family-name:var(--lp-serif)] text-2xl font-semibold">{t}</p>
                    <p className="mt-1 font-[family-name:var(--lp-sans)] text-sm text-[#1c1915]/55">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modules / Selected works */}
        <section id="modulos" className="border-t border-[#1c1915]/10 bg-[#ebe6db] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1c1915]/45">
                  Selected modules
                </p>
                <h2 className="mt-3 font-[family-name:var(--lp-serif)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                  Módulos clave
                </h2>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-[family-name:var(--lp-sans)] text-sm font-medium text-[#1c1915]/70 underline-offset-4 hover:underline"
              >
                Ir al panel <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 divide-y divide-[#1c1915]/12 border-y border-[#1c1915]/12">
              {MODULES.map((m, i) => (
                <motion.article
                  key={m.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05 }}
                  className="group grid grid-cols-1 items-center gap-4 py-8 sm:grid-cols-12 sm:gap-6"
                >
                  <p className="font-[family-name:var(--lp-sans)] text-xs uppercase tracking-[0.2em] text-[#1c1915]/45 sm:col-span-2">
                    {m.tag}
                  </p>
                  <div className="sm:col-span-6">
                    <h3 className="font-[family-name:var(--lp-serif)] text-2xl font-semibold sm:text-3xl">
                      {m.title}
                    </h3>
                    <p className="mt-2 max-w-xl font-[family-name:var(--lp-sans)] text-sm leading-relaxed text-[#1c1915]/65 sm:text-base">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:col-span-4 sm:justify-end sm:gap-8">
                    <span className="font-[family-name:var(--lp-sans)] text-sm text-[#1c1915]/45">{m.year}</span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1c1915]/15 transition group-hover:bg-[#1c1915] group-hover:text-[#f3efe6]">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Services accordion-like */}
        <section id="servicios" className="border-t border-[#1c1915]/10 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1c1915]/45">
              Capacidades
            </p>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--lp-serif)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Todo lo que tu equipo necesita para ejecutar.
            </h2>

            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <div className="space-y-2 lg:col-span-5">
                {SERVICES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setActiveService(i)}
                    className={`block w-full rounded-2xl px-4 py-4 text-left transition ${
                      activeService === i
                        ? "bg-[#1c1915] text-[#f3efe6]"
                        : "bg-transparent text-[#1c1915]/70 hover:bg-[#1c1915]/5"
                    }`}
                  >
                    <span className="font-[family-name:var(--lp-serif)] text-2xl font-semibold sm:text-3xl">
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-7">
                <div className="flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[1.6rem] bg-[#1c1915] p-8 text-[#f3efe6] sm:min-h-[360px] sm:p-10">
                  <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.25em] text-white/45">
                    Servicio
                  </p>
                  <div>
                    <h3 className="font-[family-name:var(--lp-serif)] text-3xl font-semibold sm:text-4xl">
                      {SERVICES[activeService].title}
                    </h3>
                    <p className="mt-4 max-w-lg font-[family-name:var(--lp-sans)] text-base leading-relaxed text-white/70">
                      {SERVICES[activeService].body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#f3efe6] px-5 py-3 font-[family-name:var(--lp-sans)] text-sm font-semibold text-[#1c1915]"
                  >
                    Empezar ahora <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-[#1c1915]/10 bg-[#ebe6db] py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#1c1915]/45">
                FAQ
              </p>
              <h2 className="mt-3 font-[family-name:var(--lp-serif)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Preguntas frecuentes
              </h2>
              <p className="mt-4 font-[family-name:var(--lp-sans)] text-base text-[#1c1915]/65">
                Respuestas rápidas sobre acceso, roles y uso diario de la plataforma.
              </p>
            </div>
            <div className="lg:col-span-7">
              {FAQS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-[#1c1915]/10 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-[family-name:var(--lp-serif)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Lo que permite en la práctica
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col justify-between rounded-[1.4rem] border border-[#1c1915]/10 bg-[#f7f3ea] p-6 sm:p-7"
                >
                  <blockquote className="font-[family-name:var(--lp-serif)] text-xl leading-snug text-[#1c1915] sm:text-2xl">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-8 font-[family-name:var(--lp-sans)]">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-sm text-[#1c1915]/55">{t.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contacto" className="border-t border-[#1c1915]/10 bg-[#1c1915] py-20 text-[#f3efe6] sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-[family-name:var(--lp-sans)] text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Contacto
              </p>
              <h2 className="mt-3 font-[family-name:var(--lp-serif)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Hablemos de tu operación
              </h2>
              <p className="mt-4 font-[family-name:var(--lp-sans)] text-base text-white/60">
                ¿Necesitas acceso, capacitación o despliegue? Déjanos un mensaje.
              </p>
              <a
                href="mailto:noreply@sac-app.com"
                className="mt-8 inline-block font-[family-name:var(--lp-serif)] text-2xl underline-offset-4 hover:underline sm:text-3xl"
              >
                noreply@sac-app.com
              </a>
            </div>
            <div className="lg:col-span-7">
              {sent ? (
                <div className="rounded-[1.4rem] border border-white/15 bg-white/5 p-8">
                  <p className="font-[family-name:var(--lp-serif)] text-3xl">Mensaje registrado</p>
                  <p className="mt-2 font-[family-name:var(--lp-sans)] text-white/60">
                    Gracias. Mientras tanto puedes ingresar al sistema con tus credenciales.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-6 rounded-full bg-[#f3efe6] px-5 py-3 font-[family-name:var(--lp-sans)] text-sm font-semibold text-[#1c1915]"
                  >
                    Ir al login
                  </button>
                </div>
              ) : (
                <form onSubmit={onContact} className="space-y-4 rounded-[1.4rem] border border-white/15 bg-white/5 p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block font-[family-name:var(--lp-sans)] text-sm">
                      Nombre
                      <input
                        required
                        name="name"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none ring-0 placeholder:text-white/30 focus:border-white/40"
                        placeholder="Tu nombre"
                      />
                    </label>
                    <label className="block font-[family-name:var(--lp-sans)] text-sm">
                      Correo
                      <input
                        required
                        type="email"
                        name="email"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/40"
                        placeholder="tu@correo.com"
                      />
                    </label>
                  </div>
                  <label className="block font-[family-name:var(--lp-sans)] text-sm">
                    Mensaje
                    <textarea
                      required
                      name="message"
                      rows={4}
                      className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-transparent px-4 py-3 outline-none placeholder:text-white/30 focus:border-white/40"
                      placeholder="Cuéntanos qué necesitas"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#f3efe6] px-6 py-3 font-[family-name:var(--lp-sans)] text-sm font-semibold text-[#1c1915]"
                  >
                    Enviar <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1c1915]/10 bg-[#f3efe6] pb-safe">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-[family-name:var(--lp-serif)] text-2xl font-semibold">
              SAC<span className="align-super text-xs">®</span>
            </p>
            <p className="mt-1 font-[family-name:var(--lp-sans)] text-sm text-[#1c1915]/55">
              Sistema de Administración Central
            </p>
          </div>
          <div className="flex flex-wrap gap-5 font-[family-name:var(--lp-sans)] text-sm text-[#1c1915]/60">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-[#1c1915]">
                {n.label}
              </a>
            ))}
            <Link to="/login" className="font-medium text-[#1c1915]">
              Acceder
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
