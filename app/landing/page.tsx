"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Radio,
  MapPin,
  Users,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Globe,
  Lock,
  Activity,
  Layers,
  Terminal,
  Wifi,
  Star,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
  Eye,
  ClipboardList,
  UserCheck,
  Navigation,
  FileText,
  Bell,
  Play,
  ChevronRight,
  Map,
  Crosshair,
  ListChecks,
  SendHorizonal,
  UserPlus,
  FolderOpen,
  LayoutDashboard,
  SlidersHorizontal,
  Target,
  Smartphone,
} from "lucide-react";

// ─── Intersection-observer hook ──────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated counter ────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(to / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Navbar ──────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Problem", href: "#problem" },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Roles", href: "#roles" },
    { label: "Demo", href: "#demo" },
    { label: "About", href: "/about" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(0.10_0.015_260/0.92)] backdrop-blur-xl border-b border-[oklch(0.28_0.01_260)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)] flex items-center justify-center shadow-lg shadow-[oklch(0.7_0.18_160)/30] group-hover:shadow-[oklch(0.7_0.18_160)/50] transition-shadow">
            <ShieldCheck className="w-4 h-4 text-[oklch(0.10_0_0)]" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-[oklch(0.65_0_0)] hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[oklch(0.65_0_0)] hover:text-white transition-colors">Sign in</Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-colors shadow-lg shadow-[oklch(0.7_0.18_160)/25]"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button className="md:hidden text-white p-1" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[oklch(0.10_0.015_260)] border-b border-[oklch(0.28_0.01_260)] px-5 pb-5 pt-2 space-y-3">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm text-[oklch(0.65_0_0)] hover:text-white py-1 transition-colors">{l.label}</a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[oklch(0.28_0.01_260)] mt-2">
            <Link href="/login" className="flex-1 text-center text-sm py-2 rounded-lg border border-[oklch(0.28_0.01_260)] text-white">Sign in</Link>
            <Link href="/register" className="flex-1 text-center text-sm py-2 rounded-lg bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] font-semibold">Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────
function HeroImage() {
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `perspective(1200px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    el.style.transform = `perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)`;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const floatingPills = [
    { label: "124 Agents Online", color: "oklch(0.7 0.18 160)", top: "8%", right: "-6%", delay: "0s" },
    { label: "18 Zones Active", color: "oklch(0.65 0.2 250)", bottom: "22%", left: "-8%", delay: "0.4s" },
    { label: "99.9% Uptime", color: "oklch(0.75 0.18 65)", bottom: "6%", right: "4%", delay: "0.8s" },
  ];

  return (
    <div ref={imgRef} className="relative w-full" style={{ transition: "transform 0.15s ease-out" }}>
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse, oklch(0.7 0.18 160), transparent 70%)", animation: "pulseGlow 3s ease-in-out infinite" }} />
      <div className="absolute -inset-2 rounded-3xl pointer-events-none" style={{ border: "1px solid oklch(0.7 0.18 160 / 0.15)", animation: "ringPulse 4s ease-in-out infinite" }} />

      <div className="relative rounded-2xl overflow-hidden border border-[oklch(0.35_0.01_260)] shadow-2xl shadow-black/70">
        <div className="bg-[oklch(0.12_0.01_260)] px-4 py-2.5 flex items-center gap-2 border-b border-[oklch(0.22_0.01_260)]">
          <div className="w-3 h-3 rounded-full bg-[oklch(0.5_0.2_25)]" />
          <div className="w-3 h-3 rounded-full bg-[oklch(0.75_0.18_65)]" />
          <div className="w-3 h-3 rounded-full bg-[oklch(0.7_0.18_160)]" />
          <div className="ml-3 flex-1 bg-[oklch(0.18_0.01_260)] rounded-md px-3 py-1 text-xs text-[oklch(0.45_0_0)] font-mono">app.fieldsync.io/dashboard</div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
            <span className="text-[10px] text-[oklch(0.7_0.18_160)] font-medium">LIVE</span>
          </div>
        </div>

        <div className="relative">
          <Image
            src="/hero-dashboard.png"
            alt="FieldSync Dashboard — real-time field operations map with team tracking and zone management"
            width={1024}
            height={768}
            className="w-full h-auto block"
            priority
            quality={90}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, oklch(0.08 0.015 260 / 0.15) 0%, transparent 50%, oklch(0.08 0.015 260 / 0.2) 100%)" }} />
          {[{ top: "35%", left: "28%", delay: "0s" }, { top: "50%", left: "58%", delay: "0.6s" }, { top: "30%", left: "72%", delay: "1.2s" }].map((p, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ top: p.top, left: p.left }}>
              <div className="absolute rounded-full bg-[oklch(0.7_0.18_160)]" style={{ width: 10, height: 10, boxShadow: "0 0 12px oklch(0.7 0.18 160)", animation: `ping ${1.6 + i * 0.4}s ease-in-out infinite`, animationDelay: p.delay }} />
              <div className="absolute rounded-full border border-[oklch(0.7_0.18_160)/50]" style={{ width: 24, height: 24, top: -7, left: -7, animation: `ripple ${2 + i * 0.5}s ease-out infinite`, animationDelay: p.delay }} />
            </div>
          ))}
        </div>
      </div>

      {floatingPills.map((pill) => (
        <div key={pill.label} className="absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md text-xs font-semibold" style={{ top: pill.top, bottom: pill.bottom, left: pill.left, right: pill.right, color: pill.color, background: `oklch(0.12 0.01 260 / 0.85)`, borderColor: `${pill.color}30`, boxShadow: `0 4px 20px ${pill.color}15`, animation: `floatPill 3s ease-in-out infinite`, animationDelay: pill.delay }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color, boxShadow: `0 0 6px ${pill.color}` }} />
          {pill.label}
        </div>
      ))}

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-[oklch(0.7_0.18_160)] opacity-25 blur-2xl rounded-full pointer-events-none" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[oklch(0.08_0.015_260)] pt-20 pb-16">
      <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(oklch(0.7 0.18 160) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.18 160) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.05] blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.2_250)] opacity-[0.06] blur-[110px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/25] mb-8" style={{ animation: "fadeSlideDown 0.6s ease-out forwards" }}>
            <span className="w-2 h-2 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
            <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Real-Time Field Operations — Live</span>
          </div>

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-white leading-[1.06] tracking-tight" style={{ animation: "fadeSlideDown 0.7s ease-out 0.1s backwards" }}>
            Field ops,{" "}<br />
            <span style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              finally in sync.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[oklch(0.58_0_0)] max-w-xl leading-relaxed" style={{ animation: "fadeSlideDown 0.7s ease-out 0.2s backwards" }}>
            Managing field teams without the right tools means lost coverage, missed tasks, and zero visibility. FieldSync brings your supervisors, team leaders, and field workers into one real-time platform — so everyone knows where to go, what to do, and what's happening.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4" style={{ animation: "fadeSlideDown 0.7s ease-out 0.3s backwards" }}>
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[0.9375rem] font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-xl shadow-[oklch(0.7_0.18_160)/30] hover:shadow-[oklch(0.7_0.18_160)/55] hover:-translate-y-0.5">
              Get started free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#demo" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[0.9375rem] font-medium text-white border border-[oklch(0.3_0.01_260)] hover:border-[oklch(0.45_0.01_260)] hover:bg-[oklch(0.14_0.01_260)] transition-all">
              <Play className="w-4 h-4 text-[oklch(0.7_0.18_160)]" /> See how it works
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4" style={{ animation: "fadeSlideDown 0.7s ease-out 0.4s backwards" }}>
            <div className="flex -space-x-2">
              {["oklch(0.7 0.18 160)", "oklch(0.65 0.2 250)", "oklch(0.75 0.18 65)", "oklch(0.65 0.22 330)"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[oklch(0.10_0.01_260)] flex items-center justify-center text-[9px] font-bold text-[oklch(0.10_0_0)]" style={{ background: c }}>
                  {["S", "L", "W", "T"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.48_0_0)]">Supervisors, leaders & field workers — all on one platform</p>
          </div>
        </div>

        <div className="relative" style={{ animation: "fadeSlideUp 0.9s ease-out 0.4s backwards" }}>
          <HeroImage />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <a href="#problem" className="flex flex-col items-center gap-1 text-[oklch(0.38_0_0)] hover:text-[oklch(0.7_0.18_160)] transition-colors group">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}

// ─── Problem Section ─────────────────────────────────────────────
const problems = [
  { icon: Eye, label: "No real-time visibility", desc: "You can't see where your teams are or what they're doing until it's too late." },
  { icon: ClipboardList, label: "Inconsistent data collection", desc: "Paper forms, WhatsApp messages, and phone calls mean data is always incomplete." },
  { icon: Users, label: "Poor team coordination", desc: "Teams overlap zones, miss areas, and can't communicate efficiently in the field." },
  { icon: AlertTriangle, label: "Weak accountability", desc: "No way to track individual contributions or audit what actually happened and when." },
  { icon: Clock, label: "Delayed decisions", desc: "Reports take hours to reach supervisors, by which time the window for action has passed." },
  { icon: Wifi, label: "Network dependency", desc: "Operations grind to a halt the moment connectivity drops in remote areas." },
];

function Problem() {
  const { ref, inView } = useInView();
  return (
    <section id="problem" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.65_0.22_25)/10] border border-[oklch(0.65_0.22_25)/20] mb-5">
            <AlertTriangle className="w-3 h-3 text-[oklch(0.72_0.2_40)]" />
            <span className="text-xs text-[oklch(0.72_0.2_40)] font-medium tracking-wide">The Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Field operations are broken<br className="hidden sm:block" /> in ways most teams accept as normal.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] leading-relaxed">
            Whether you&apos;re running a community survey, an outreach programme, a field inspection, or a census — the same challenges keep showing up. Teams work blind, data gets lost, and supervisors only find out what went wrong after the fact.
          </p>
        </div>

        {/* Problem cards */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className="flex gap-4 p-5 rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] hover:border-[oklch(0.3_0.01_260)] transition-all"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "none" : "translateY(20px)",
                  transition: `opacity 0.5s ${i * 0.07}s, transform 0.5s ${i * 0.07}s`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-[oklch(0.65_0.22_25)/10] border border-[oklch(0.65_0.22_25)/15]">
                  <Icon className="w-4 h-4 text-[oklch(0.72_0.2_40)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{p.label}</p>
                  <p className="text-xs text-[oklch(0.5_0_0)] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition to solution */}
        <div className="mt-16 relative rounded-2xl border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] p-8 sm:p-10 overflow-hidden text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.7 0.18 160 / 0.08), transparent 70%)" }} />
          <p className="relative text-[oklch(0.7_0.18_160)] font-semibold text-lg mb-2">There&apos;s a better way.</p>
          <p className="relative text-[oklch(0.6_0_0)] max-w-xl mx-auto text-sm leading-relaxed">
            FieldSync was built specifically for these situations — giving every person on your team the tools they need, in real time, whether they&apos;re in the office or deep in the field.
          </p>
          <ChevronDown className="w-5 h-5 text-[oklch(0.7_0.18_160)] mx-auto mt-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────
function Stats() {
  const { ref, inView } = useInView();
  const items = [
    { value: 50000, suffix: "+", label: "Field workers managed" },
    { value: 99.9, suffix: "%", label: "Platform uptime SLA" },
    { value: 200, suffix: "ms", label: "Average sync latency" },
    { value: 1200, suffix: "+", label: "Operations completed" },
  ];

  return (
    <section id="stats" className="py-20 bg-[oklch(0.08_0.015_260)] border-y border-[oklch(0.18_0.01_260)]">
      <div ref={ref} className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {items.map((item, i) => (
          <div key={item.label} className="space-y-1" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}>
            <p className="text-3xl sm:text-4xl font-bold text-[oklch(0.7_0.18_160)]">
              {inView ? <Counter to={item.value} suffix={item.suffix} /> : "0"}
            </p>
            <p className="text-sm text-[oklch(0.5_0_0)]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────
const features = [
  { icon: Radio, title: "Real-Time Sync", desc: "Every update from every team member propagates across the platform in under 200ms — no refreshing, no guessing.", color: "oklch(0.7 0.18 160)", bg: "oklch(0.7 0.18 160 / 0.08)" },
  { icon: MapPin, title: "Dynamic Zone Management", desc: "Draw zones, assign teams to them, and get alerts when boundaries are crossed. Full coverage visibility at a glance.", color: "oklch(0.65 0.2 250)", bg: "oklch(0.65 0.2 250 / 0.08)" },
  { icon: Users, title: "Role-Based Workspaces", desc: "Supervisors, team leaders, and field workers each see exactly what they need — purpose-built, not one-size-fits-all.", color: "oklch(0.75 0.18 65)", bg: "oklch(0.75 0.18 65 / 0.08)" },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time dashboards with task completion, field coverage, and team performance data ready to export.", color: "oklch(0.65 0.22 330)", bg: "oklch(0.65 0.22 330 / 0.08)" },
  { icon: Shield, title: "Secure by Default", desc: "OTP verification, role-enforced access, session monitoring, and a full audit trail on every important action.", color: "oklch(0.6 0.18 200)", bg: "oklch(0.6 0.18 200 / 0.08)" },
  { icon: Terminal, title: "Works Offline", desc: "Field workers can keep working without connectivity. Data queues locally and syncs the moment signal returns.", color: "oklch(0.7 0.15 140)", bg: "oklch(0.7 0.15 140 / 0.08)" },
];

function Features() {
  const { ref, inView } = useInView();
  return (
    <section id="features" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-4">
            <Zap className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">What FieldSync Gives You</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Everything your team needs,<br className="hidden sm:block" /> nothing that slows them down.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-xl mx-auto">
            Built from the ground up for real field environments — not adapted from office software.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-6 hover:border-[oklch(0.35_0.01_260)] transition-all duration-300 hover:-translate-y-1"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s, border-color 0.3s, translate 0.3s` }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(ellipse at 50% 0%, ${f.color}08, transparent 70%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg, border: `1px solid ${f.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[oklch(0.52_0_0)] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────
const steps = [
  { step: "01", title: "Supervisor creates the project", desc: "Set up your project, define zones on the map, invite team leaders, and configure forms — all from the Supervisor workspace.", icon: FolderOpen },
  { step: "02", title: "Teams get assigned and briefed", desc: "Team leaders receive their assignments, review their zone, and know exactly which tasks their members need to complete.", icon: UserCheck },
  { step: "03", title: "Field workers execute on the ground", desc: "Workers start their session, share their location, complete assigned tasks, fill forms, and submit data in real time.", icon: Navigation },
  { step: "04", title: "Everyone stays in the picture", desc: "Live dashboards, instant notifications, and drill-down analytics give supervisors and leaders a complete operational picture.", icon: LayoutDashboard },
];

function HowItWorks() {
  const { ref, inView } = useInView();
  return (
    <section id="how-it-works" className="py-24 bg-[oklch(0.08_0.015_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.65_0.2_250)/10] border border-[oklch(0.65_0.2_250)/20] mb-4">
            <TrendingUp className="w-3 h-3 text-[oklch(0.65_0.2_250)]" />
            <span className="text-xs text-[oklch(0.65_0.2_250)] font-medium tracking-wide">How FieldSync Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From project setup<br className="hidden sm:block" /> to field execution in four steps.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">No training weeks, no complex onboarding. Your team can be operational in minutes.</p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.6s ${i * 0.12}s, transform 0.6s ${i * 0.12}s` }}
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[oklch(0.28_0.01_260)] to-transparent z-0" />
                )}
                <div className="relative z-10 bg-[oklch(0.13_0.01_260)] border border-[oklch(0.22_0.01_260)] rounded-2xl p-6 h-full hover:border-[oklch(0.35_0.01_260)] transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-[oklch(0.7_0.18_160)] font-mono">{s.step}</span>
                    <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/15] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-[oklch(0.52_0_0)] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Role Guides ─────────────────────────────────────────────────
type RoleGuide = {
  role: string;
  badge: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  summary: string;
  steps: { icon: React.ElementType; action: string; detail: string }[];
};

const roleGuides: RoleGuide[] = [
  {
    role: "Supervisor",
    badge: "Project Owner",
    color: "oklch(0.65 0.2 250)",
    bgColor: "oklch(0.65 0.2 250 / 0.08)",
    icon: SlidersHorizontal,
    summary: "You own the project. Create it, configure it, assign your leaders, and monitor everything from your workspace.",
    steps: [
      { icon: FolderOpen, action: "Create your project", detail: "Set a name, description, and kick off your project workspace in seconds." },
      { icon: MapPin, action: "Define zones on the map", detail: "Draw operational zones, set boundaries, and assign areas to specific teams." },
      { icon: UserPlus, action: "Invite team leaders", detail: "Add team leaders to your project and assign them to specific zones or tasks." },
      { icon: FileText, action: "Build your forms", detail: "Create dynamic multi-step forms for the data your field workers will collect." },
      { icon: BarChart3, action: "Monitor in real time", detail: "Watch live progress, review submissions, and pull analytics whenever you need them." },
    ],
  },
  {
    role: "Team Leader",
    badge: "Squad Coordinator",
    color: "oklch(0.75 0.18 65)",
    bgColor: "oklch(0.75 0.18 65 / 0.08)",
    icon: Target,
    summary: "You coordinate the team. Assign tasks, track progress, and keep everyone moving in the right direction.",
    steps: [
      { icon: Users, action: "View your team members", detail: "See everyone assigned to your team and their current availability." },
      { icon: ListChecks, action: "Assign tasks", detail: "Distribute tasks to individual members or set up group assignments with a designated submitter." },
      { icon: Map, action: "Monitor on the map", detail: "Watch your team's location in real time and spot any coverage gaps." },
      { icon: Bell, action: "Respond to alerts", detail: "Get notified when members need help, complete tasks, or flag issues." },
      { icon: ClipboardList, action: "Review progress", detail: "Track submissions and completion rates across your entire team." },
    ],
  },
  {
    role: "Field Worker",
    badge: "On the Ground",
    color: "oklch(0.7 0.18 160)",
    bgColor: "oklch(0.7 0.18 160 / 0.08)",
    icon: Smartphone,
    summary: "You do the work. Start your session, complete your tasks, fill your forms, and stay connected to your team.",
    steps: [
      { icon: Activity, action: "Start your session", detail: "Check in to start your shift. Your location begins syncing with your team." },
      { icon: ListChecks, action: "See your tasks", detail: "View all tasks assigned to you — clearly prioritised and ready to action." },
      { icon: Map, action: "Navigate the map", detail: "See your zone, your position, and nearby teammates in real time." },
      { icon: FileText, action: "Fill and submit forms", detail: "Complete dynamic forms step by step and submit your collected field data." },
      { icon: SendHorizonal, action: "Request help if needed", detail: "Send a meet or help request to your team leader or a nearby teammate instantly." },
    ],
  },
];

function RoleGuides() {
  const [activeRole, setActiveRole] = useState(0);
  const { ref, inView } = useInView();
  const guide = roleGuides[activeRole];
  const Icon = guide.icon;

  return (
    <section id="roles" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.75_0.18_65)/10] border border-[oklch(0.75_0.18_65)/20] mb-4">
            <Lock className="w-3 h-3 text-[oklch(0.75_0.18_65)]" />
            <span className="text-xs text-[oklch(0.75_0.18_65)] font-medium tracking-wide">Role Guides</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            See how FieldSync works<br className="hidden sm:block" /> for your specific role.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">
            Everyone on your team has a different job. FieldSync is built so each person gets exactly what they need.
          </p>
        </div>

        {/* Role selector tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex gap-2 p-1.5 rounded-2xl bg-[oklch(0.12_0.01_260)] border border-[oklch(0.22_0.01_260)]">
            {roleGuides.map((r, i) => {
              const RIcon = r.icon;
              return (
                <button
                  key={r.role}
                  onClick={() => setActiveRole(i)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: activeRole === i ? r.color : "transparent",
                    color: activeRole === i ? "oklch(0.10 0 0)" : "oklch(0.55 0 0)",
                    boxShadow: activeRole === i ? `0 4px 16px ${r.color}35` : "none",
                  }}
                >
                  <RIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{r.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Guide content */}
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "opacity 0.6s, transform 0.6s" }}>
          {/* Left: Summary */}
          <div className="lg:col-span-2 rounded-2xl border p-7 flex flex-col justify-between" style={{ borderColor: `${guide.color}25`, background: guide.bgColor }}>
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${guide.color}15`, border: `1px solid ${guide.color}25` }}>
                <Icon className="w-6 h-6" style={{ color: guide.color }} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3" style={{ color: guide.color, background: `${guide.color}12`, border: `1px solid ${guide.color}20` }}>
                {guide.badge}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{guide.role}</h3>
              <p className="text-sm text-[oklch(0.58_0_0)] leading-relaxed">{guide.summary}</p>
            </div>
            <div className="mt-8 pt-5 border-t" style={{ borderColor: `${guide.color}15` }}>
              <p className="text-xs text-[oklch(0.45_0_0)]">{guide.steps.length} key actions in your workflow</p>
            </div>
          </div>

          {/* Right: Steps */}
          <div className="lg:col-span-3 space-y-3">
            {guide.steps.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div
                  key={s.action}
                  className="flex gap-4 p-4 rounded-xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] hover:border-[oklch(0.32_0.01_260)] transition-all group"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${guide.color}10`, border: `1px solid ${guide.color}20` }}>
                    <SIcon className="w-4 h-4" style={{ color: guide.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold font-mono" style={{ color: guide.color }}>0{i + 1}</span>
                      <p className="text-sm font-semibold text-white">{s.action}</p>
                    </div>
                    <p className="text-xs text-[oklch(0.5_0_0)] leading-relaxed">{s.detail}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1 text-[oklch(0.3_0_0)] group-hover:text-white transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Guided Demo ─────────────────────────────────────────────────
type DemoRole = "supervisor" | "teamleader" | "fieldworker";

type DemoStep = {
  title: string;
  description: string;
  highlight: string;
  icon: React.ElementType;
};

type DemoConfig = {
  label: string;
  color: string;
  badge: string;
  icon: React.ElementType;
  steps: DemoStep[];
};

const demoConfigs: Record<DemoRole, DemoConfig> = {
  supervisor: {
    label: "Supervisor",
    color: "oklch(0.65 0.2 250)",
    badge: "Project Owner",
    icon: SlidersHorizontal,
    steps: [
      { title: "Your Project Workspace", description: "This is your home. Every project you own or manage lives here. Switch between them instantly.", highlight: "Project list on the left sidebar", icon: FolderOpen },
      { title: "Live Map Overview", description: "See all active zones and your team's live positions plotted in real time across the operation area.", highlight: "Map panel with zone overlays", icon: Map },
      { title: "Team Management", description: "Review your team leaders, their assigned zones, and how their teams are performing right now.", highlight: "Teams tab in the top nav", icon: Users },
      { title: "Analytics Dashboard", description: "Submission counts, coverage percentages, and task completion — all updating live as your teams work.", highlight: "Analytics panel on the right", icon: BarChart3 },
    ],
  },
  teamleader: {
    label: "Team Leader",
    color: "oklch(0.75 0.18 65)",
    badge: "Squad Coordinator",
    icon: Target,
    steps: [
      { title: "Your Team Overview", description: "See every member of your squad — who's active, where they are, and how many tasks each has remaining.", highlight: "Team members list", icon: Users },
      { title: "Task Assignment Panel", description: "Drag and drop tasks to assign them, or use group mode to designate one member to submit on behalf of the team.", highlight: "Task board in the centre", icon: ListChecks },
      { title: "Live Map View", description: "Watch your team's movement in real time. Spot if anyone is outside their zone or too far from a task location.", highlight: "Map with member pins", icon: Map },
      { title: "Notifications & Alerts", description: "Receive instant alerts when members complete tasks, flag issues, or request assistance from the field.", highlight: "Alert bell in the top bar", icon: Bell },
    ],
  },
  fieldworker: {
    label: "Field Worker",
    color: "oklch(0.7 0.18 160)",
    badge: "On the Ground",
    icon: Smartphone,
    steps: [
      { title: "Start Your Session", description: "Tap Start Session to check in for your shift. Your GPS begins sharing with your team leader and teammates.", highlight: "Start Session button", icon: Activity },
      { title: "Your Task List", description: "All tasks assigned to you appear here, sorted by priority. Tap any task to see full details and instructions.", highlight: "Tasks panel", icon: ListChecks },
      { title: "Your Map", description: "See your current location, your assigned zone, and nearby teammates — all updating in real time.", highlight: "Map tab", icon: Map },
      { title: "Fill & Submit a Form", description: "Complete each form step by step. Save drafts if you lose connection — it syncs automatically when you&apos;re back online.", highlight: "Forms tab", icon: FileText },
    ],
  },
};

function GuidedDemo() {
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoActive, setDemoActive] = useState(false);
  const { ref, inView } = useInView();

  const startDemo = (role: DemoRole) => {
    setSelectedRole(role);
    setCurrentStep(0);
    setDemoActive(true);
  };

  const exitDemo = () => {
    setDemoActive(false);
    setSelectedRole(null);
    setCurrentStep(0);
  };

  const config = selectedRole ? demoConfigs[selectedRole] : null;
  const totalSteps = config?.steps.length ?? 0;
  const step = config?.steps[currentStep];
  const StepIcon = step?.icon;

  return (
    <section id="demo" className="py-24 bg-[oklch(0.08_0.015_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-4">
            <Play className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">Interactive Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Pick your role.<br className="hidden sm:block" /> See your experience.
          </h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">
            Select how you&apos;ll use FieldSync and get a guided walkthrough of exactly what you&apos;ll see and do.
          </p>
        </div>

        {/* Role selector cards */}
        {!demoActive && (
          <div
            ref={ref}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "opacity 0.6s, transform 0.6s" }}
          >
            {(Object.entries(demoConfigs) as [DemoRole, DemoConfig][]).map(([key, cfg], i) => {
              const CIcon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => startDemo(key)}
                  className="group relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-7 flex flex-col items-center text-center hover:border-[oklch(0.38_0.01_260)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}08, transparent 70%)` }} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                    <CIcon className="w-7 h-7" style={{ color: cfg.color }} />
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2" style={{ color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>{cfg.badge}</span>
                  <h3 className="text-base font-bold text-white mb-2">{cfg.label}</h3>
                  <p className="text-xs text-[oklch(0.5_0_0)] leading-relaxed mb-5">
                    {key === "supervisor" && "You set up projects, define zones, assign leaders, and monitor everything."}
                    {key === "teamleader" && "You coordinate your squad, assign tasks, and keep the team on track."}
                    {key === "fieldworker" && "You start sessions, complete tasks, fill forms, and share your location."}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cfg.color }}>
                    <Play className="w-3.5 h-3.5" /> Start guided tour
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Active demo tour */}
        {demoActive && config && step && StepIcon && (
          <div className="max-w-4xl mx-auto">
            {/* Demo header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${config.color}15`, border: `1px solid ${config.color}25` }}>
                  {(() => { const CI = config.icon; return <CI className="w-4 h-4" style={{ color: config.color }} />; })()}
                </div>
                <div>
                  <p className="text-xs text-[oklch(0.48_0_0)]">Guided Tour</p>
                  <p className="text-sm font-semibold text-white">{config.label} Walkthrough</p>
                </div>
              </div>
              <button onClick={exitDemo} className="flex items-center gap-1.5 text-xs text-[oklch(0.48_0_0)] hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-[oklch(0.22_0.01_260)] hover:border-[oklch(0.35_0.01_260)]">
                <X className="w-3.5 h-3.5" /> Exit tour
              </button>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2 mb-6">
              {config.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStep ? "2.5rem" : "1rem",
                    background: i <= currentStep ? config.color : "oklch(0.22 0.01 260)",
                  }}
                />
              ))}
              <span className="ml-2 text-xs text-[oklch(0.45_0_0)] font-mono">{currentStep + 1}/{totalSteps}</span>
            </div>

            {/* Demo content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Step info */}
              <div className="lg:col-span-2 rounded-2xl border p-7 flex flex-col" style={{ borderColor: `${config.color}20`, background: `${config.color}06` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${config.color}12`, border: `1px solid ${config.color}20` }}>
                  <StepIcon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div className="text-xs font-bold font-mono mb-2" style={{ color: config.color }}>STEP {currentStep + 1} OF {totalSteps}</div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[oklch(0.58_0_0)] leading-relaxed flex-1">{step.description}</p>

                {/* Highlighted element */}
                <div className="mt-5 pt-5 border-t flex items-center gap-2" style={{ borderColor: `${config.color}15` }}>
                  <Crosshair className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                  <p className="text-xs text-[oklch(0.55_0_0)]"><span className="font-semibold text-white">Look for:</span> {step.highlight}</p>
                </div>

                {/* Navigation */}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[oklch(0.28_0.01_260)] text-white disabled:opacity-30 hover:bg-[oklch(0.16_0.01_260)] transition-all"
                  >
                    Back
                  </button>
                  {currentStep < totalSteps - 1 ? (
                    <button
                      onClick={() => setCurrentStep(s => s + 1)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                      style={{ background: config.color, color: "oklch(0.10 0 0)", boxShadow: `0 4px 16px ${config.color}30` }}
                    >
                      Next step
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all hover:-translate-y-0.5"
                      style={{ background: config.color, color: "oklch(0.10 0 0)", boxShadow: `0 4px 16px ${config.color}30` }}
                    >
                      Get started →
                    </Link>
                  )}
                </div>
              </div>

              {/* Mock dashboard preview */}
              <div className="lg:col-span-3 rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] overflow-hidden">
                {/* Mock browser bar */}
                <div className="bg-[oklch(0.10_0.01_260)] px-4 py-2 flex items-center gap-2 border-b border-[oklch(0.18_0.01_260)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.5_0.2_25)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.75_0.18_65)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.18_160)]" />
                  <div className="ml-2 flex-1 bg-[oklch(0.15_0.01_260)] rounded px-2 py-0.5 text-[10px] text-[oklch(0.38_0_0)] font-mono">
                    app.fieldsync.io/{selectedRole}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
                    <span className="text-[9px] font-medium" style={{ color: config.color }}>LIVE</span>
                  </div>
                </div>

                {/* Mock UI */}
                <div className="p-5 space-y-3">
                  {/* Mock sidebar + content */}
                  <div className="flex gap-3 h-52">
                    {/* Sidebar */}
                    <div className="w-10 bg-[oklch(0.10_0.01_260)] rounded-xl p-2 flex flex-col items-center gap-2.5">
                      {[FolderOpen, Map, Users, BarChart3, Bell].map((SIcon, si) => (
                        <div
                          key={si}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{
                            background: si === currentStep % 5 ? `${config.color}20` : "transparent",
                            border: si === currentStep % 5 ? `1px solid ${config.color}30` : "1px solid transparent",
                          }}
                        >
                          <SIcon className="w-3 h-3" style={{ color: si === currentStep % 5 ? config.color : "oklch(0.35 0 0)" }} />
                        </div>
                      ))}
                    </div>

                    {/* Main panel */}
                    <div className="flex-1 rounded-xl bg-[oklch(0.10_0.01_260)] p-4 space-y-3 overflow-hidden">
                      {/* Header bar */}
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-28 rounded-full bg-[oklch(0.22_0.01_260)]" />
                        <div className="h-3 w-16 rounded-full" style={{ background: `${config.color}25` }} />
                      </div>
                      {/* Content mock rows */}
                      {[1, 2, 3].map((row) => (
                        <div
                          key={row}
                          className="h-10 rounded-lg border flex items-center gap-3 px-3 transition-all duration-500"
                          style={{
                            borderColor: row === currentStep % 3 + 1 ? `${config.color}30` : "oklch(0.18 0.01 260)",
                            background: row === currentStep % 3 + 1 ? `${config.color}06` : "oklch(0.13 0.01 260)",
                          }}
                        >
                          <div className="w-5 h-5 rounded-md" style={{ background: row === currentStep % 3 + 1 ? `${config.color}20` : "oklch(0.22 0.01 260)" }} />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 rounded-full" style={{ width: `${60 + row * 12}%`, background: row === currentStep % 3 + 1 ? `${config.color}30` : "oklch(0.22 0.01 260)" }} />
                            <div className="h-1.5 rounded-full w-2/5 bg-[oklch(0.18_0.01_260)]" />
                          </div>
                          {row === currentStep % 3 + 1 && (
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: config.color }} />
                          )}
                        </div>
                      ))}
                      {/* Map preview strip */}
                      <div className="h-14 rounded-lg border border-[oklch(0.18_0.01_260)] bg-[oklch(0.11_0.01_260)] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${config.color} 1px, transparent 1px), linear-gradient(90deg, ${config.color} 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
                        {[{ x: "25%", y: "40%" }, { x: "55%", y: "60%" }, { x: "70%", y: "30%" }].map((pos, pi) => (
                          <div key={pi} className="absolute w-2 h-2 rounded-full" style={{ left: pos.x, top: pos.y, background: config.color, boxShadow: `0 0 6px ${config.color}`, animation: `ping ${1.5 + pi * 0.3}s ease-in-out infinite`, animationDelay: `${pi * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tour highlight tooltip */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border" style={{ borderColor: `${config.color}20`, background: `${config.color}06` }}>
                    <Crosshair className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                    <p className="text-xs text-[oklch(0.6_0_0)]">
                      <span className="font-semibold" style={{ color: config.color }}>Highlighted:</span> {step.highlight}
                    </p>
                    <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: config.color }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────
const testimonials = [
  { quote: "FieldSync cut our coordination time significantly. The real-time zone map alone saved us from multiple coverage failures this quarter.", author: "Amara Diallo", title: "Field Operations Lead", stars: 5 },
  { quote: "Our supervisors can now spin up a project, invite a team, and assign zones in under five minutes. Previously that took hours of back-and-forth messages.", author: "Kofi Mensah", title: "Senior Supervisor, Community Outreach", stars: 5 },
  { quote: "The role-based dashboards are brilliant. Every team member sees exactly what they need and nothing they don't — no confusion, just clarity.", author: "Fatima Al-Rashid", title: "Operations Manager", stars: 5 },
];

function Testimonials() {
  const { ref, inView } = useInView();
  return (
    <section id="testimonials" className="py-24 bg-[oklch(0.10_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-4">
            <Star className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">What Teams Say</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Trusted in the field.</h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className="relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-6 hover:border-[oklch(0.35_0.01_260)] transition-all duration-300"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.12}s, transform 0.5s ${i * 0.12}s` }}
            >
              <div className="flex gap-1 mb-4">
                {Array(t.stars).fill(0).map((_, si) => (
                  <Star key={si} className="w-3.5 h-3.5 text-[oklch(0.75_0.18_65)] fill-[oklch(0.75_0.18_65)]" />
                ))}
              </div>
              <p className="text-sm text-[oklch(0.65_0_0)] leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold text-white">{t.author}</p>
                <p className="text-xs text-[oklch(0.48_0_0)] mt-0.5">{t.title}</p>
              </div>
              <div className="absolute top-4 right-4 text-5xl text-[oklch(0.7_0.18_160)/8] font-serif leading-none select-none">❝</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────
function CTA() {
  const { ref, inView } = useInView();
  return (
    <section className="py-24 bg-[oklch(0.08_0.015_260)]">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div
          ref={ref}
          className="relative rounded-3xl border border-[oklch(0.28_0.01_260)] bg-[oklch(0.12_0.01_260)] p-12 sm:p-16 overflow-hidden"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.7s, transform 0.7s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[oklch(0.7_0.18_160)] opacity-[0.07] blur-[60px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[oklch(0.65_0.2_250)] opacity-[0.05] blur-[80px] rounded-full" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/20] mb-6">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
              <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium">Ready when you are</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Your field team deserves<br className="hidden sm:block" /> better tools.
            </h2>
            <p className="text-[oklch(0.55_0_0)] max-w-md mx-auto mb-8">
              Join teams who&apos;ve replaced guesswork, missed updates, and manual tracking with real-time field coordination. Set up in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-xl shadow-[oklch(0.7_0.18_160)/30] hover:shadow-[oklch(0.7_0.18_160)/50] hover:-translate-y-0.5">
                Create free account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-medium text-white border border-[oklch(0.28_0.01_260)] hover:border-[oklch(0.4_0.01_260)] hover:bg-[oklch(0.14_0.01_260)] transition-all">
                <Clock className="w-4 h-4" /> Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  const links = {
    Platform: ["Features", "How it works", "Roles", "Demo"],
    Company: ["About", "Careers", "Blog", "FAQ", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  };
  return (
    <footer className="bg-[oklch(0.08_0.015_260)] border-t border-[oklch(0.18_0.01_260)] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)] flex items-center justify-center shadow-lg shadow-[oklch(0.7_0.18_160)/30]">
                <ShieldCheck className="w-4 h-4 text-[oklch(0.10_0_0)]" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
            </Link>
            <p className="text-sm text-[oklch(0.48_0_0)] max-w-xs leading-relaxed">
              Real-time field operations management for teams that can&apos;t afford to work blind.
            </p>
            <div className="flex items-center gap-2 text-xs text-[oklch(0.4_0_0)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
              All systems operational
            </div>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-[oklch(0.55_0_0)] uppercase tracking-wider mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => {
                  const hrefMap: Record<string, string> = {
                    About: "/about",
                    Careers: "/careers",
                    Blog: "/blog",
                    FAQ: "/faq",
                    Contact: "/contact",
                    "Privacy Policy": "/privacy",
                    "Terms of Service": "/terms",
                    "Cookie Policy": "/cookies",
                    Features: "#features",
                    "How it works": "#how-it-works",
                    Roles: "#roles",
                    Demo: "#demo",
                  };
                  const href = hrefMap[item] || "#";
                  return (
                    <li key={item}>
                      <a href={href} className="text-sm text-[oklch(0.45_0_0)] hover:text-white transition-colors">{item}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-[oklch(0.18_0.01_260)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.38_0_0)]">© {new Date().getFullYear()} FieldSync. All rights reserved.</p>
          <p className="text-xs text-[oklch(0.38_0_0)] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            Secured with end-to-end encryption
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="dark">
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.8); opacity: 0.3; }
        }
        @keyframes ripple {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.38; }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.28; transform: scale(1.005); }
        }
        @keyframes floatPill {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <Navbar />
      <Hero />
      <Problem />
      <Stats />
      <Features />
      <HowItWorks />
      <RoleGuides />
      <GuidedDemo />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

