import "./landing.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowRight, Check, Menu, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ═══════════════════════════════════════════════════════
   S.O.T Landing — Revana-style premium · light/dark rhythm
   ═══════════════════════════════════════════════════════ */

const fontStyle = {
  "--f-display": '"Syne", system-ui, sans-serif',
  "--f-body": '"Outfit", system-ui, sans-serif',
} as CSSProperties;

const NAV = [
  { href: "#about", label: "Nosotros" },
  { href: "#works", label: "Modulos" },
  { href: "#services", label: "Servicios" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contacto" },
];

const STRIP = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
];

const WORKS = [
  {
    title: "Administracion",
    desc: "Contribuyentes, providencias y cobranza en un solo panel.",
    year: "2026",
    img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    offset: "lg:mt-24",
  },
  {
    title: "Fiscalizacion",
    desc: "Campo, censo y mapas con trazabilidad completa.",
    year: "2025",
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80",
    offset: "lg:mt-0",
  },
  {
    title: "Actas & Expedientes",
    desc: "Centro de mando para reparos y control administrativo.",
    year: "2026",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    offset: "lg:mt-32",
  },
  {
    title: "Reportes & KPI",
    desc: "IVA, ISLR y desempeno institucional en tiempo real.",
    year: "2025",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    offset: "lg:mt-8",
  },
];

const SERVICES = [
  {
    title: "Gestion tributaria",
    body: "Layouts claros y control total de cada contribuyente — de alta a cobranza.",
    img: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Fiscalizacion en campo",
    body: "Captura movil, mapas y cuadrillas pensados para el terreno.",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Cumplimiento & cobranza",
    body: "Multas, pagos, compromisos e indicadores de recupero por periodo.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Gobierno & auditoria",
    body: "Roles, bitacora y auditoria interna para equipos exigentes.",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
  },
];

const FAQS = [
  { q: "Quien puede usar S.O.T?", a: "Personal autorizado de la administracion tributaria segun rol: administradores, coordinadores, supervisores y fiscales." },
  { q: "Hay un tamano minimo de equipo?", a: "No. Escala desde equipos compactos hasta direcciones completas con planes flexibles." },
  { q: "Como empiezo con un proyecto?", a: "Accede con tu cedula institucional o escribenos desde Contacto para alta y capacitacion." },
  { q: "Incluye campo y oficina?", a: "Si. Censo, fiscalizacion, cobranza, reportes y control documental en una sola plataforma." },
  { q: "Que tan involucrado estare?", a: "Colaboramos en roles e implementacion. Tu defines procesos; S.O.T ejecuta el dia a dia." },
  { q: "Cual es el timeline tipico?", a: "De 2 semanas en el plan Esencial hasta un onboarding institucional completo." },
];

const PLANS = [
  {
    name: "Esencial", blurb: "Un flujo de alto impacto para equipos compactos.",
    monthly: 499, annual: 399, popular: false, cta: "Empezar",
    features: ["Contribuyentes y eventos", "Hasta 3 roles", "Implementacion 2 semanas", "Soporte por correo 48h"],
  },
  {
    name: "Profesional", blurb: "Varios procesos en paralelo, con analytics.",
    monthly: 2500, annual: 2000, popular: true, cta: "Empezar",
    features: ["Hasta 3 frentes operativos", "Analytics avanzados", "Revisiones trimestrales", "Soporte prioritario"],
  },
  {
    name: "Institucional", blurb: "Estrategia completa multi-equipo.",
    monthly: 6750, annual: 5400, popular: false, cta: "Hablar con ventas",
    features: ["Flujos ilimitados", "Onboarding acompanado", "SLA + estratega dedicado", "ROI ejecutivo anual"],
  },
] as const;

/* ── helpers ─────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function BrandMark({ dark }: { dark?: boolean }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="inline-block h-2 w-2 shrink-0 bg-[#3b82f6]" />
      <span
        className="font-[family-name:var(--f-body)] text-[11px] font-medium uppercase tracking-[0.28em]"
        style={dark ? { color: "rgba(0,0,0,0.4)" } : { color: "rgba(255,255,255,0.4)" }}
      >
        S.O.T
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [serviceIdx, setServiceIdx] = useState(0);

  const heroRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const worksBgRef = useRef<HTMLDivElement>(null);

  /* ── hero parallax ─────────────────────────────────── */
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(heroProgress, [0, 1], ["0%", "32%"]);
  const heroImgScale = useTransform(heroProgress, [0, 1], [1, 1.10]);
  const brandY = useSpring(useTransform(heroProgress, [0, 1], [0, -130]), { stiffness: 90, damping: 26 });

  /* ── services scrub ────────────────────────────────── */
  const { scrollYProgress: servicesProgress } = useScroll({
    target: servicesRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(servicesProgress, "change", (v) => {
    const next = Math.min(SERVICES.length - 1, Math.floor(v * SERVICES.length));
    setServiceIdx((prev) => (prev === next ? prev : next));
  });

  /* ── works bg text drift ───────────────────────────── */
  const { scrollYProgress: worksProgress } = useScroll({
    target: worksBgRef,
    offset: ["start end", "end start"],
  });
  const worksTextX = useTransform(worksProgress, [0, 1], ["0%", "-15%"]);

  /* ── image strip drift ─────────────────────────────── */
  const stripX = useTransform(heroProgress, [0.2, 1], ["0%", "-24%"]);

  useEffect(() => {
    document.documentElement.classList.add("landing-active");
    return () => document.documentElement.classList.remove("landing-active");
  }, []);

  const activeService = useMemo(() => SERVICES[serviceIdx], [serviceIdx]);

  if (user) return <Navigate to="/admin" replace />;

  const onContact = (e: FormEvent) => { e.preventDefault(); setSent(true); };

  return (
    <div className="sot-landing" style={fontStyle}>
      {/* ═══════ NAV ════════════════════════════════════ */}
      <header className="fixed inset-x-0 top-0 z-50 pt-safe mix-blend-difference">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="font-[family-name:var(--f-display)] text-sm font-bold uppercase tracking-[0.35em] text-white"
          >
            S.O.T
          </a>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#050505]/95 backdrop-blur-xl"
          >
            <div className="flex h-full flex-col px-6 pb-safe pt-6">
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--f-display)] text-sm font-bold uppercase tracking-[0.35em] text-white">
                  S.O.T
                </span>
                <button type="button" aria-label="Cerrar" onClick={() => setMenuOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <nav className="mt-16 flex flex-1 flex-col gap-5">
                {NAV.map((n, i) => (
                  <motion.a
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="font-[family-name:var(--f-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl"
                  >
                    {n.label}
                  </motion.a>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); navigate("/login"); }}
                className="mb-8 rounded-full bg-[#3b82f6] px-6 py-4 font-[family-name:var(--f-body)] text-sm font-semibold uppercase tracking-wider text-white"
              >
                Acceder al sistema
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="top">
        {/* ═══════ HERO ═════════════════════════════════ */}
        <section ref={heroRef} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#050505]">
          <motion.div style={{ y: heroImgY, scale: heroImgScale }} className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85"
              alt=""
              className="h-full w-full object-cover"
            />
            {/* ── overlay ligero para que la imagen respire, no la mate ── */}
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          </motion.div>

          <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 pb-8 pt-28 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="font-[family-name:var(--f-body)] text-sm leading-relaxed text-white/85 sm:text-base md:text-lg">
                Operaciones tributarias rigurosas y funcionales — del campo a los
                reportes — pensadas para tu institucion y su vision.
              </p>
              <a
                href="#works"
                className="mt-8 inline-flex items-center gap-2 font-[family-name:var(--f-body)] text-sm text-white/85 transition hover:text-[#93c5fd]"
              >
                Ver modulos <ArrowDown className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.h1
              style={{ y: brandY }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center font-[family-name:var(--f-display)] text-[clamp(3.2rem,14vw,9.5rem)] font-bold leading-[0.9] tracking-[-0.04em] text-white"
            >
              S.O.T<span className="text-[#60a5fa]">®</span>
            </motion.h1>
          </div>
        </section>

        {/* ═══════ IMAGE STRIP ══════════════════════════ */}
        <section className="relative z-20 -mt-6 bg-[#050505] pb-8 pt-2">
          <motion.div style={{ x: stripX }} className="flex w-[140%] gap-3 px-3 sm:gap-4 sm:px-4">
            {STRIP.map((src) => (
              <div key={src} className="relative h-48 w-[42vw] shrink-0 overflow-hidden sm:h-64 sm:w-[28vw] md:h-80">
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </motion.div>
        </section>

        {/* ═══════ ABOUT · seccion CLARA ════════════════ */}
        <section id="about" className="bg-[#f7f5f0] py-28 text-[#111] sm:py-36">
          <div className="mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <BrandMark dark />
              <h2 className="font-[family-name:var(--f-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Operaciones cotidianas, disenadas con precision.
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={0.1}>
              <p className="max-w-2xl font-[family-name:var(--f-body)] text-lg leading-relaxed text-black/55 sm:text-xl">
                Pensado para equipos institucionales: ayuda a oficinas tributarias a transformar
                el trabajo de campo, la cobranza y los reportes con software claro y durable.
              </p>
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
                  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=800&q=80",
                  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
                ].map((src, i) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.7 }}
                    className={`overflow-hidden ${i === 1 ? "mt-8" : ""}`}
                  >
                    <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════ WORKS · seccion OSCURA ═══════════════ */}
        <section id="works" ref={worksBgRef} className="relative overflow-hidden bg-[#0a0a0a] py-28 sm:py-36">
          <motion.div
            style={{ x: worksTextX }}
            className="pointer-events-none absolute left-0 top-24 whitespace-nowrap font-[family-name:var(--f-display)] text-[clamp(5rem,18vw,14rem)] font-bold leading-none tracking-[-0.05em] text-white/[0.04]"
          >
            Modulos · S.O.T · Modulos · S.O.T
          </motion.div>

          <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <BrandMark />
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mb-2 font-[family-name:var(--f-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
                Modulos seleccionados
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-20">
              {WORKS.map((w, i) => (
                <motion.article
                  key={w.title}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.8, delay: (i % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={`group ${w.offset}`}
                >
                  <div className="relative overflow-hidden">
                    {/* ── crop marks ── */}
                    <div className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 border-l border-t border-white/50" />
                    <div className="pointer-events-none absolute bottom-3 right-3 z-10 h-5 w-5 border-b border-r border-white/50" />
                    <img
                      src={w.img}
                      alt=""
                      className="aspect-[16/11] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--f-display)] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {w.title}
                      </h3>
                      <p className="mt-2 max-w-sm font-[family-name:var(--f-body)] text-sm text-white/50">
                        {w.desc}
                      </p>
                    </div>
                    <span className="pt-1 font-[family-name:var(--f-body)] text-xs text-white/35">{w.year}</span>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ SERVICES · sticky scrub ══════════════ */}
        <section ref={servicesRef} className="relative h-[300vh] bg-black">
          <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
            <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <BrandMark />
                <ul className="mt-4 space-y-1">
                  {SERVICES.map((s, i) => {
                    const active = i === serviceIdx;
                    return (
                      <li key={s.title}>
                        <button
                          type="button"
                          onClick={() => setServiceIdx(i)}
                          className="group flex w-full items-center gap-4 py-2 text-left"
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                              active ? "border-white bg-white text-black" : "border-transparent text-transparent"
                            }`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </span>
                          <span
                            className={`font-[family-name:var(--f-display)] text-3xl font-semibold tracking-tight transition sm:text-4xl md:text-5xl ${
                              active ? "text-white" : "text-white/20"
                            }`}
                          >
                            {s.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="lg:col-span-7">
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeService.img}
                      src={activeService.img}
                      alt=""
                      initial={{ opacity: 0, y: 24, scale: 1.04 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.45 }}
                      className="aspect-[5/3.4] w-full object-cover"
                    />
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeService.body}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 max-w-lg font-[family-name:var(--f-body)] text-base text-white/60"
                  >
                    {activeService.body}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ PRICING · seccion CLARA ═══════════════ */}
        <section id="planes" className="bg-[#f7f5f0] py-28 text-[#111] sm:py-36">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <Reveal>
              <BrandMark dark />
              <h2 className="max-w-3xl font-[family-name:var(--f-display)] text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Precios flexibles para cualquier escala.
              </h2>
            </Reveal>

            <div className="mt-10 inline-flex rounded-full border border-black/15 bg-white p-1">
              {(["monthly", "annual"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setBilling(k)}
                  className="relative min-w-[7rem] rounded-full px-4 py-2.5 font-[family-name:var(--f-body)] text-sm"
                >
                  {billing === k && (
                    <motion.span
                      layoutId="bill"
                      className="absolute inset-0 rounded-full bg-[#3b82f6]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className={`relative z-10 font-medium ${billing === k ? "text-white" : "text-black/60"}`}>
                    {k === "monthly" ? "Mensual" : "Anual"}
                    {k === "annual" && (
                      <span className="ml-1 text-[10px] font-bold uppercase text-emerald-300">-20%</span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PLANS.map((p, i) => {
                const price = billing === "monthly" ? p.monthly : p.annual;
                return (
                  <motion.article
                    key={p.name}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -8 }}
                    className={`relative flex flex-col rounded-3xl border p-7 ${
                      p.popular
                        ? "border-[#3b82f6]/50 bg-white shadow-[0_0_80px_rgba(59,130,246,0.15)] lg:-translate-y-3"
                        : "border-black/[0.08] bg-white/60"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute right-5 top-5 rounded-full bg-[#3b82f6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Destacado
                      </span>
                    )}
                    <p className="font-[family-name:var(--f-body)] text-xs uppercase tracking-[0.25em] text-black/40">
                      {p.name}
                    </p>
                    <p className="mt-3 text-sm text-black/50">{p.blurb}</p>
                    <div className="mt-8 flex items-end gap-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${p.name}-${billing}`}
                          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -8 }}
                          className="font-[family-name:var(--f-display)] text-5xl font-semibold text-[#111]"
                        >
                          {fmt(price)}
                        </motion.span>
                      </AnimatePresence>
                      <span className="mb-2 text-sm text-black/40">/mo</span>
                    </div>
                    <ul className="mt-8 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3 text-sm text-black/70">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3b82f6]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className={`mt-8 rounded-full py-3.5 text-sm font-semibold ${
                        p.popular
                          ? "bg-[#3b82f6] text-white"
                          : "border border-black/15 bg-white text-[#111] hover:bg-black/5"
                      }`}
                    >
                      {p.cta}
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════ FAQ · seccion CLARA ═══════════════════ */}
        <section id="faq" className="bg-[#f7f5f0] py-28 text-[#111] sm:py-36">
          <div className="mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <BrandMark dark />
              <h2 className="font-[family-name:var(--f-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Tus preguntas,
                <br />
                respondidas.
              </h2>
              <p className="mt-5 max-w-sm font-[family-name:var(--f-body)] text-sm text-black/50">
                Respuestas rapidas a lo que mas preguntan sobre el sistema y el proceso.
              </p>
            </Reveal>
            <div className="lg:col-span-7">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className="border-b border-black/10">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center gap-4 py-5 text-left"
                    >
                      <Plus className={`h-4 w-4 shrink-0 text-black/35 transition ${open ? "rotate-45" : ""}`} />
                      <span className="font-[family-name:var(--f-body)] text-base font-medium sm:text-lg">
                        {f.q}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pl-8 font-[family-name:var(--f-body)] text-sm leading-relaxed text-black/55">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════ CONTACT · OSCURO + CLARO ═════════════= */}
        <section id="contact" className="grid lg:grid-cols-2">
          <div className="relative flex items-center overflow-hidden bg-[#050505] px-5 py-28 sm:px-10 sm:py-36 lg:px-14">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=80"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative">
              <BrandMark />
              <h2 className="font-[family-name:var(--f-display)] text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Hablemos
              </h2>
              <p className="mt-5 max-w-sm font-[family-name:var(--f-body)] text-base text-white/55">
                Escribenos para una demo personalizada o para resolver cualquier duda sobre S.O.T.
              </p>
              <a
                href="mailto:noreply@sac-app.com"
                className="mt-8 inline-block font-[family-name:var(--f-display)] text-2xl text-white underline-offset-4 hover:text-[#93c5fd] hover:underline sm:text-3xl"
              >
                noreply@sac-app.com
              </a>
            </div>
          </div>

          <div className="flex items-center bg-[#f7f5f0] px-5 py-28 sm:px-10 sm:py-36 lg:px-14">
            <div className="w-full">
              {sent ? (
                <div className="rounded-3xl border border-black/10 bg-white p-8 text-[#111]">
                  <p className="font-[family-name:var(--f-display)] text-3xl font-semibold">Mensaje recibido</p>
                  <p className="mt-2 text-black/50">Te contactaremos pronto.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-6 rounded-full bg-[#3b82f6] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Ir al login
                  </button>
                </div>
              ) : (
                <form onSubmit={onContact} className="space-y-4 rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      name="name"
                      placeholder="Nombre"
                      className="rounded-xl border border-black/15 bg-transparent px-4 py-3 text-[#111] outline-none placeholder:text-black/30 focus:border-[#3b82f6]"
                    />
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="Correo"
                      className="rounded-xl border border-black/15 bg-transparent px-4 py-3 text-[#111] outline-none placeholder:text-black/30 focus:border-[#3b82f6]"
                    />
                  </div>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    placeholder="Mensaje"
                    className="w-full resize-none rounded-xl border border-black/15 bg-transparent px-4 py-3 text-[#111] outline-none placeholder:text-black/30 focus:border-[#3b82f6]"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#3b82f6] px-6 py-3.5 text-sm font-semibold text-white"
                  >
                    Enviar
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ═══════ FOOTER ═════════════════════════════════ */}
      <footer className="border-t border-white/10 bg-[#050505] pb-safe text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-[family-name:var(--f-display)] text-lg font-bold uppercase tracking-[0.25em]">
              S.O.T
            </p>
            <p className="mt-1 font-[family-name:var(--f-body)] text-sm text-white/40">
              Sistema de Organizacion Tributaria
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs uppercase tracking-[0.16em] text-white/40">
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
