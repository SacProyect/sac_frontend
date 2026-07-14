import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ─── Revana structure · SAC content · black + SAC blues ─── */

const NAV = [
  { href: "#about", label: "About" },
  { href: "#works", label: "Works" },
  { href: "#services", label: "Services" },
  { href: "#planes", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacto", label: "Contact" },
];

const WORKS = [
  {
    cat: "Operación",
    title: "Administración Central",
    desc: "Contribuyentes, providencias y cobranza en un panel unificado.",
    year: "2026",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    cat: "Campo",
    title: "Fiscalización Territorial",
    desc: "Censo, mapas y presencia fiscal con trazabilidad completa.",
    year: "2025",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  },
  {
    cat: "Control",
    title: "Actas & Expedientes",
    desc: "Centro de mando para reparos y control administrativo.",
    year: "2026",
    img: "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1400&q=80",
  },
  {
    cat: "Inteligencia",
    title: "Reportes & KPI",
    desc: "IVA, ISLR y desempeño de grupos al instante.",
    year: "2025",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  },
];

const SERVICES = [
  {
    title: "Gestión tributaria",
    body: "Layouts claros, flujos diarios y control total de cada contribuyente — de alta a cobranza.",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Fiscalización en campo",
    body: "Captura móvil, mapas y supervisión de cuadrillas pensados para el terreno.",
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cumplimiento & cobranza",
    body: "Multas, pagos, compromisos e indicadores de recupero por periodo.",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Gobierno & auditoría",
    body: "Roles, bitácora y auditoría interna para equipos municipales exigentes.",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  },
];

const FAQS = [
  {
    q: "¿Quién puede usar SAC?",
    a: "Personal autorizado: administradores, coordinadores, supervisores y fiscales, según el rol asignado.",
  },
  {
    q: "¿Hay un tamaño mínimo de equipo?",
    a: "Trabajamos desde equipos compactos hasta direcciones completas. El plan se ajusta al alcance operativo.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Entra por Acceder con tu cédula institucional, o escríbenos desde Contacto para alta y capacitación.",
  },
  {
    q: "¿Incluye campo y oficina?",
    a: "Sí: censo, fiscalización territorial, cobranza, reportes y control documental en la misma plataforma.",
  },
  {
    q: "¿Qué tan involucrado estaré?",
    a: "Colaboramos en implementación y roles. Tú defines procesos; SAC ejecuta el día a día.",
  },
  {
    q: "¿Cuánto tarda el despliegue?",
    a: "Depende del plan: de 2 semanas en Esencial hasta un onboarding institucional completo.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "SAC transformó nuestra operación tributaria en algo que finalmente se siente ordenado, claro y bajo control.",
    name: "Laura M.",
    role: "Coordinación operativa",
  },
  {
    quote:
      "Del concepto a los detalles finales, el sistema quedó alineado con cómo trabajamos en campo y en oficina.",
    name: "Nadia S.",
    role: "Supervisión fiscal",
  },
  {
    quote:
      "Trabajar con SAC fue un cambio real. Cada módulo tiene propósito — y el equipo lo nota todos los días.",
    name: "Elise D.",
    role: "Administración central",
  },
];

type Billing = "monthly" | "annual";

const PLANS = [
  {
    id: "esencial",
    name: "Esencial",
    blurb: "Un flujo de alto impacto para equipos compactos.",
    monthly: 499,
    annual: 399,
    cta: "Empezar",
    popular: false,
    features: [
      "Contribuyentes y eventos",
      "Hasta 3 roles operativos",
      "Implementación en 2 semanas",
      "Soporte por correo (48 h)",
      "Actualizaciones incluidas",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    blurb: "Varios procesos en paralelo, con analytics.",
    monthly: 2500,
    annual: 2000,
    cta: "Empezar",
    popular: true,
    features: [
      "Hasta 3 frentes operativos",
      "Integraciones del stack SAC",
      "Analytics avanzados",
      "Revisiones trimestrales",
      "Capacitación + soporte prioritario",
    ],
  },
  {
    id: "institucional",
    name: "Institucional",
    blurb: "Estrategia completa multi-equipo.",
    monthly: 6750,
    annual: 5400,
    cta: "Hablar con ventas",
    popular: false,
    features: [
      "Flujos ilimitados",
      "Integraciones enterprise",
      "Onboarding white-glove",
      "SLA + estratega dedicado",
      "ROI ejecutivo anual",
    ],
  },
] as const;

const fontStyle = {
  "--lp-serif": '"Cormorant Garamond", "Times New Roman", Georgia, serif',
  "--lp-sans": '"Sora", system-ui, sans-serif',
} as CSSProperties;

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-6 text-left"
      >
        <span className="font-[family-name:var(--lp-serif)] text-xl text-white sm:text-2xl">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#60a5fa] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-10 font-[family-name:var(--lp-sans)] text-sm leading-relaxed text-white/55 sm:text-base">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PricingSection({ onCta }: { onCta: () => void }) {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section id="planes" className="relative border-t border-white/10 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12),_transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="font-[family-name:var(--lp-sans)] text-[11px] font-medium uppercase tracking-[0.32em] text-[#60a5fa]">
            Pricing
          </p>
          <h2 className="mt-4 max-w-3xl font-[family-name:var(--lp-serif)] text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl md:text-6xl">
            Flexible plans for any scale.
          </h2>
        </Reveal>

        <div className="mt-10 flex justify-start">
          <div className="relative inline-flex rounded-full border border-white/15 bg-white/[0.03] p-1">
            {(["monthly", "annual"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBilling(key)}
                className="relative min-w-[7.25rem] rounded-full px-4 py-2.5 font-[family-name:var(--lp-sans)] text-sm font-medium"
              >
                {billing === key && (
                  <motion.span
                    layoutId="pricing-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] shadow-[0_0_30px_rgba(59,130,246,0.45)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 text-white">
                  {key === "monthly" ? "Monthly" : "Annual"}
                  {key === "annual" && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                      −20%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan, i) => {
            const price = billing === "monthly" ? plan.monthly : plan.annual;
            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -10 }}
                className={`relative flex flex-col overflow-hidden rounded-[1.75rem] border p-7 ${
                  plan.popular
                    ? "border-[#3b82f6]/50 bg-[#0c1220] shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_40px_100px_rgba(37,99,235,0.2)] lg:-translate-y-3"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {plan.popular && (
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#3b82f6]/25 blur-3xl" />
                )}
                <div className="relative flex items-start justify-between">
                  <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.28em] text-white/40">
                    {plan.name}
                  </p>
                  {plan.popular && (
                    <span className="rounded-full bg-[#3b82f6] px-3 py-1 font-[family-name:var(--lp-sans)] text-[10px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
                </div>
                <p className="relative mt-4 font-[family-name:var(--lp-sans)] text-sm text-white/50">
                  {plan.blurb}
                </p>
                <div className="relative mt-8 flex items-end gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${plan.id}-${billing}`}
                      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                      transition={{ duration: 0.28 }}
                      className="font-[family-name:var(--lp-serif)] text-5xl text-white sm:text-6xl"
                    >
                      {formatUsd(price)}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mb-2 text-sm text-white/40">/mo</span>
                </div>
                <ul className="relative mt-8 flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 font-[family-name:var(--lp-sans)] text-sm text-white/70"
                    >
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3b82f6]/15">
                        <Check className="h-3 w-3 text-[#60a5fa]" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onCta}
                  className={`relative mt-8 rounded-full px-5 py-3.5 font-[family-name:var(--lp-sans)] text-sm font-semibold transition ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white shadow-[0_0_40px_rgba(59,130,246,0.35)] hover:brightness-110"
                      : "border border-white/20 text-white hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceIdx, setServiceIdx] = useState(0);
  const [testiIdx, setTestiIdx] = useState(0);
  const [sent, setSent] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const titleY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), {
    stiffness: 80,
    damping: 28,
  });

  useEffect(() => {
    document.documentElement.classList.add("landing-scroll");
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.classList.remove("landing-scroll");
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setTestiIdx((i) => (i + 1) % TESTIMONIALS.length),
      6000
    );
    return () => window.clearInterval(id);
  }, []);

  if (user) return <Navigate to="/admin" replace />;

  const onContact = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div
      className="sac-landing min-h-app overflow-x-hidden bg-[#05070c] text-white antialiased"
      style={fontStyle}
    >
      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse,_rgba(59,130,246,0.18),_transparent_60%)]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[50vw] bg-[radial-gradient(ellipse,_rgba(99,102,241,0.12),_transparent_55%)]" />
      </div>

      {/* NAV — Revana minimal */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#05070c]/70 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="font-[family-name:var(--lp-serif)] text-2xl font-semibold tracking-tight"
          >
            SAC<span className="text-[#60a5fa]">®</span>
          </a>
          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-[family-name:var(--lp-sans)] text-[12px] uppercase tracking-[0.18em] text-white/55 transition hover:text-white"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 font-[family-name:var(--lp-sans)] text-xs uppercase tracking-[0.16em] text-white transition hover:border-[#60a5fa]/50 hover:bg-[#3b82f6]/15 sm:inline-flex"
            >
              Acceder
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 md:hidden"
              aria-label="Menu"
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
              className="overflow-hidden border-t border-white/10 md:hidden"
            >
              <div className="flex flex-col gap-1 px-5 py-4">
                {NAV.map((n) => (
                  <a
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 font-[family-name:var(--lp-sans)] text-sm text-white/80"
                  >
                    {n.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-2 rounded-full bg-[#3b82f6] px-4 py-3 text-sm font-semibold"
                >
                  Acceder al sistema
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        {/* HERO — brand first, full-bleed image like Revana */}
        <section ref={heroRef} className="relative min-h-[100dvh] overflow-hidden">
          <motion.div style={{ y: heroY, scale: heroScale, opacity: heroOpacity }} className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05070c]/55 via-[#05070c]/75 to-[#05070c]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#05070c_75%)]" />
          </motion.div>

          <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
            <motion.div style={{ y: titleY }}>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mb-4 font-[family-name:var(--lp-sans)] text-[11px] font-medium uppercase tracking-[0.35em] text-[#60a5fa]"
              >
                Administration
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="font-[family-name:var(--lp-serif)] text-[clamp(4.5rem,18vw,10rem)] font-medium leading-[0.85] tracking-[-0.04em] text-white"
              >
                SAC<span className="text-[#60a5fa]">®</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.28 }}
                className="mt-5 max-w-xl font-[family-name:var(--lp-serif)] text-xl italic leading-snug text-white/70 sm:text-2xl md:text-3xl"
              >
                We craft rigorous, functional tax operations — from field to reports —
                tailored to your institution.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <a
                  href="#works"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-[family-name:var(--lp-sans)] text-sm font-semibold text-[#05070c] transition hover:bg-[#dbeafe]"
                >
                  View Works
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-[family-name:var(--lp-sans)] text-sm font-medium text-white transition hover:border-[#60a5fa] hover:bg-[#3b82f6]/15"
                >
                  SAC Studio®
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ABOUT — Revana “designing everyday spaces” */}
        <section id="about" className="relative py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <div className="overflow-hidden rounded-[1.75rem]">
                <motion.img
                  whileInView={{ scale: 1 }}
                  initial={{ scale: 1.08 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80"
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal className="flex flex-col justify-center lg:col-span-6" delay={0.1}>
              <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.32em] text-[#60a5fa]">
                About
              </p>
              <h2 className="mt-5 font-[family-name:var(--lp-serif)] text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl md:text-[3.25rem]">
                Designing everyday operations with care.
              </h2>
              <p className="mt-6 font-[family-name:var(--lp-sans)] text-base leading-relaxed text-white/55 sm:text-lg">
                Built for municipal and institutional teams, SAC helps transform field work,
                collection, and reporting through thoughtful, lasting software design.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
                {[
                  ["2018+", "En producción"],
                  ["7k+", "Contribuyentes"],
                  ["PWA", "Mobile-ready"],
                ].map(([k, v]) => (
                  <div key={v}>
                    <p className="font-[family-name:var(--lp-serif)] text-3xl text-white">{k}</p>
                    <p className="mt-1 font-[family-name:var(--lp-sans)] text-xs uppercase tracking-wider text-white/40">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* SELECTED WORKS — Revana grid with image zoom */}
        <section id="works" className="border-t border-white/10 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.32em] text-[#60a5fa]">
                Selected Works
              </p>
              <h2 className="mt-4 font-[family-name:var(--lp-serif)] text-4xl font-medium tracking-[-0.02em] text-white sm:text-5xl">
                Modules that define the platform.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {WORKS.map((w, i) => (
                <motion.article
                  key={w.title}
                  initial={{ opacity: 0, y: 48 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (i % 2) * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={`group ${i % 3 === 0 ? "sm:mt-12" : ""}`}
                >
                  <div className="relative overflow-hidden rounded-[1.5rem]">
                    <motion.img
                      src={w.img}
                      alt=""
                      className="aspect-[5/4] w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070c]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="font-[family-name:var(--lp-sans)] text-[10px] uppercase tracking-[0.25em] text-[#93c5fd]">
                        {w.cat}
                      </p>
                      <h3 className="mt-2 font-[family-name:var(--lp-serif)] text-3xl text-white">
                        {w.title}
                      </h3>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <p className="max-w-xs font-[family-name:var(--lp-sans)] text-sm text-white/60">
                          {w.desc}
                        </p>
                        <span className="font-[family-name:var(--lp-sans)] text-xs text-white/40">
                          {w.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES — giant titles + image swap (Revana) */}
        <section id="services" className="border-t border-white/10 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.32em] text-[#60a5fa]">
                Service
              </p>
            </Reveal>
            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-1 lg:col-span-5">
                {SERVICES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onMouseEnter={() => setServiceIdx(i)}
                    onClick={() => setServiceIdx(i)}
                    className="block w-full py-3 text-left"
                  >
                    <span
                      className={`font-[family-name:var(--lp-serif)] text-3xl leading-none tracking-[-0.02em] transition duration-300 sm:text-4xl md:text-5xl ${
                        serviceIdx === i ? "text-white" : "text-white/25 hover:text-white/50"
                      }`}
                    >
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-[1.75rem]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={SERVICES[serviceIdx].img}
                      src={SERVICES[serviceIdx].img}
                      alt=""
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55 }}
                      className="aspect-[5/4] w-full object-cover"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={SERVICES[serviceIdx].body}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="max-w-md font-[family-name:var(--lp-sans)] text-base leading-relaxed text-white/75"
                      >
                        {SERVICES[serviceIdx].body}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PricingSection onCta={() => navigate("/login")} />

        {/* FAQ */}
        <section id="faq" className="border-t border-white/10 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.32em] text-[#60a5fa]">
                faq
              </p>
              <h2 className="mt-4 font-[family-name:var(--lp-serif)] text-4xl font-medium tracking-[-0.02em] text-white sm:text-5xl">
                Your Questions, Answered.
              </h2>
              <p className="mt-4 font-[family-name:var(--lp-sans)] text-sm text-white/50">
                Find quick answers about access, roles, and how SAC fits your teams.
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS carousel */}
        <section className="border-t border-white/10 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <AnimatePresence mode="wait">
              <motion.figure
                key={testiIdx}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45 }}
              >
                <blockquote className="font-[family-name:var(--lp-serif)] text-3xl font-medium leading-snug tracking-[-0.02em] text-white sm:text-4xl md:text-5xl">
                  “{TESTIMONIALS[testiIdx].quote}”
                </blockquote>
                <figcaption className="mt-10 font-[family-name:var(--lp-sans)]">
                  <p className="text-sm font-semibold text-white">{TESTIMONIALS[testiIdx].name}</p>
                  <p className="mt-1 text-sm text-white/45">{TESTIMONIALS[testiIdx].role}</p>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Anterior"
                onClick={() =>
                  setTestiIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-[#60a5fa] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => setTestiIdx((i) => (i + 1) % TESTIMONIALS.length)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-[#60a5fa] hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CONTACT — Revana contact block */}
        <section id="contacto" className="relative border-t border-white/10">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=80"
              alt=""
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-[#05070c]/85" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-[family-name:var(--lp-sans)] text-[11px] uppercase tracking-[0.32em] text-[#60a5fa]">
                Contact us
              </p>
              <h2 className="mt-4 font-[family-name:var(--lp-serif)] text-4xl font-medium text-white sm:text-5xl">
                Let’s Chat
              </h2>
              <a
                href="mailto:noreply@sac-app.com"
                className="mt-8 inline-block font-[family-name:var(--lp-serif)] text-2xl text-white underline-offset-4 hover:text-[#93c5fd] hover:underline sm:text-3xl"
              >
                noreply@sac-app.com
              </a>
              <p className="mt-6 font-[family-name:var(--lp-sans)] text-sm uppercase tracking-[0.2em] text-white/40">
                Administration
              </p>
            </div>
            <div className="lg:col-span-7">
              {sent ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <p className="font-[family-name:var(--lp-serif)] text-3xl text-white">Message received</p>
                  <p className="mt-2 text-white/55">Meanwhile you can enter the system with your credentials.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-6 rounded-full bg-[#3b82f6] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Ir al login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={onContact}
                  className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-white/60">
                      Name
                      <input
                        required
                        name="name"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#60a5fa]"
                        placeholder="Your name"
                      />
                    </label>
                    <label className="block text-sm text-white/60">
                      Email
                      <input
                        required
                        type="email"
                        name="email"
                        className="mt-2 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#60a5fa]"
                        placeholder="you@email.com"
                      />
                    </label>
                  </div>
                  <label className="block text-sm text-white/60">
                    Message
                    <textarea
                      required
                      name="message"
                      rows={4}
                      className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#60a5fa]"
                      placeholder="Tell us what you need"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.35)]"
                  >
                    Submit <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 pb-safe">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-[family-name:var(--lp-serif)] text-2xl text-white">
              SAC<span className="text-[#60a5fa]">®</span>
            </p>
            <p className="mt-1 font-[family-name:var(--lp-sans)] text-sm text-white/40">
              Sistema de Administración Central
            </p>
          </div>
          <div className="flex flex-wrap gap-6 font-[family-name:var(--lp-sans)] text-xs uppercase tracking-[0.16em] text-white/45">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-white">
                {n.label}
              </a>
            ))}
            <Link to="/login" className="text-[#60a5fa] hover:text-white">
              Acceder
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
