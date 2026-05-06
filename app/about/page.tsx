"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  MapPin,
  Users,
  Activity,
  CheckCircle2,
  Quote,
  Menu,
  X,
  Globe,
  Zap,
  Target,
  BarChart3,
  Eye,
  Sparkles,
  ChevronDown,
} from "lucide-react";

// ─── Intersection-observer hook ──────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold, rootMargin: "-50px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
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
    { label: "Story", href: "#origin" },
    { label: "Impact", href: "#impact" },
    { label: "Founder", href: "#founder" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(0.06_0.01_260/0.92)] backdrop-blur-xl border-b border-[oklch(0.2_0.01_260)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow overflow-hidden">
            <img src="/logo.svg" alt="FieldSync" className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-[oklch(0.6_0_0)] hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[oklch(0.6_0_0)] hover:text-white transition-colors">Sign in</Link>
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
        <div className="md:hidden bg-[oklch(0.06_0.01_260)] border-b border-[oklch(0.2_0.01_260)] px-5 pb-5 pt-2 space-y-3">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm text-[oklch(0.6_0_0)] hover:text-white py-1 transition-colors">{l.label}</a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[oklch(0.2_0.01_260)] mt-2">
            <Link href="/login" className="flex-1 text-center text-sm py-2 rounded-lg border border-[oklch(0.2_0.01_260)] text-white">Sign in</Link>
            <Link href="/register" className="flex-1 text-center text-sm py-2 rounded-lg bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] font-semibold">Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  const links = {
    Company: ["About", "Careers", "Blog", "FAQ", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  };
  return (
    <footer className="bg-[oklch(0.06_0.01_260)] border-t border-[oklch(0.15_0.01_260)] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 overflow-hidden">
                <img src="/logo.svg" alt="FieldSync" className="w-7 h-7" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
            </Link>
            <p className="text-sm text-[oklch(0.45_0_0)] max-w-xs leading-relaxed">
              Real-time field operations management for teams that can&apos;t afford to work blind.
            </p>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-[oklch(0.5_0_0)] uppercase tracking-wider mb-4">{group}</p>
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
                  };
                  const href = hrefMap[item] || "#";
                  return (
                    <li key={item}>
                      <a href={href} className="text-sm text-[oklch(0.42_0_0)] hover:text-white transition-colors">{item}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-[oklch(0.15_0.01_260)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.35_0_0)]">&copy; {new Date().getFullYear()} FieldSync. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Hero ────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[oklch(0.06_0.01_260)] pt-20">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.04] blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.2_250)] opacity-[0.05] blur-[120px]" style={{ animation: "pulse 4s ease-in-out infinite" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(oklch(0.7 0.18 160) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.18 160) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] mb-10" style={{ animation: "fadeSlideDown 0.6s ease-out forwards" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" />
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Our Story</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          The Origin of{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FieldSync
          </span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          From a mission field in Tanzania to a platform transforming field operations worldwide
        </p>

        <div className="mt-16 flex flex-col items-center gap-3" style={{ animation: "fadeSlideDown 0.8s ease-out 0.4s backwards" }}>
          <span className="text-[10px] tracking-widest uppercase text-[oklch(0.35_0_0)]">Read our story</span>
          <div className="w-px h-12 bg-gradient-to-b from-[oklch(0.7_0.18_160)/50] to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ─── Origin Story ────────────────────────────────────────────────
function Origin() {
  const { ref, inView } = useInView();

  return (
    <section id="origin" className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.75_0.18_65)/8] border border-[oklch(0.75_0.18_65)/15] mb-2">
              <MapPin className="w-3 h-3 text-[oklch(0.75_0.18_65)]" />
              <span className="text-xs text-[oklch(0.75_0.18_65)] font-medium tracking-wide">March 2026 • Kaloleni, Manyara, Tanzania</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Where It All Began
            </h2>
            <div className="space-y-4 text-[oklch(0.55_0_0)] leading-relaxed">
              <p>
                In March 2026, I participated in an evangelistic mission in Kaloleni, Manyara, Tanzania. The mission involved going house-to-house, sharing messages, and engaging with the local community.
              </p>
              <p>
                The process was simple—but the challenges were not. A team leader would first scout the area and assign groups to visit specific locations. Each team was given paper forms to record their interactions.
              </p>
              <p className="font-medium text-white">
                At first, it seemed organized. But as the mission progressed, several problems became clear.
              </p>
            </div>
          </div>

          <div className="relative" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s 0.15s, transform 0.6s 0.15s" }}>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-[oklch(0.7_0.18_160)/20] via-[oklch(0.7_0.18_160)/10] to-transparent p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-[oklch(0.7_0.18_160)/20]" style={{ animation: "pingPulse 4s ease-in-out infinite" }} />
              <div className="absolute inset-4 rounded-full bg-[oklch(0.7_0.18_160)/15]" style={{ animation: "pingPulse 4s ease-in-out 0.5s infinite" }} />
              <div className="absolute inset-8 rounded-full bg-[oklch(0.7_0.18_160)/10] flex items-center justify-center relative">
                <MapPin className="w-16 h-16 text-[oklch(0.7_0.18_160)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Challenges ──────────────────────────────────────────────────
function Challenges() {
  const { ref, inView } = useInView();

  const challenges = [
    { icon: Users, title: "Duplicate Visits", desc: "Teams unknowingly visited the same areas multiple times" },
    { icon: MapPin, title: "Missed Areas", desc: "Some locations were completely overlooked and left unvisited" },
    { icon: Eye, title: "No Visibility", desc: "Leaders had no real visibility of coverage status" },
    { icon: BarChart3, title: "Manual Data", desc: "Data collection was slow and difficult to verify" }
  ];

  return (
    <section className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-16" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            The Challenges We Discovered
          </h2>
          <p className="text-[oklch(0.55_0_0)] text-lg max-w-2xl mx-auto">
            Despite the effort and dedication, coordination gaps reduced overall effectiveness
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {challenges.map((item, i) => (
            <ChallengeCard key={i} item={item} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChallengeCard({ item, index, inView }: { item: { icon: React.ElementType; title: string; desc: string }; index: number; inView: boolean }) {
  const Icon = item.icon;
  return (
    <div
      className="group p-6 rounded-2xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.18_0.01_260)] hover:border-[oklch(0.7_0.18_160)/30] hover:shadow-lg hover:shadow-[oklch(0.7_0.18_160)/5] transition-all duration-300"
      style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${index * 0.1}s, transform 0.5s ${index * 0.1}s, border-color 0.3s, box-shadow 0.3s` }}
    >
      <div className="w-12 h-12 rounded-xl bg-[oklch(0.5_0.2_25)/10] text-[oklch(0.72_0.2_40)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-white mb-2">{item.title}</h3>
      <p className="text-sm text-[oklch(0.5_0_0)]">{item.desc}</p>
    </div>
  );
}

// ─── The Spark Question ──────────────────────────────────────────
function SparkQuestion() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", animation: "bgShift 20s ease-in-out infinite" }} />

      <div ref={ref} className="max-w-4xl mx-auto text-center relative z-10" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
        <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          That experience sparked a question
        </h2>
        <p className="text-xl sm:text-2xl opacity-90 font-medium leading-relaxed max-w-2xl mx-auto">
          &ldquo;What if field operations could be managed in real-time, with full visibility, structured data, and smarter coordination?&rdquo;
        </p>
        <div className="h-1 bg-white/30 rounded-full mt-8 max-w-md mx-auto" style={{ animation: "expandWidth 1s ease-out 0.3s backwards" }} />
        <p className="mt-8 text-lg opacity-80">
          From that moment, the idea of FieldSync was born.
        </p>
      </div>
    </section>
  );
}

// ─── Universal Solution ──────────────────────────────────────────
function UniversalSolution() {
  const { ref, inView } = useInView();

  const useCases = [
    { title: "Evangelism Missions", desc: "House-to-house outreach and community engagement" },
    { title: "Census & Population Data", desc: "Large-scale data collection and demographic surveys" },
    { title: "Surveys & Research", desc: "Academic and market research fieldwork" },
    { title: "Community Outreach", desc: "Social programs and community development initiatives" },
    { title: "Inspections & Monitoring", desc: "Quality assurance and compliance verification" },
    { title: "Follow-up Operations", desc: "Engagement tracking and relationship management" }
  ];

  return (
    <section className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-16" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/8] border border-[oklch(0.7_0.18_160)/15] mb-6">
            <Target className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">From Mission to Universal Solution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            A Problem Much Bigger Than One Mission
          </h2>
          <p className="text-[oklch(0.5_0_0)] text-lg max-w-2xl mx-auto">
            Although the challenge was observed during an evangelistic mission, it became clear that the problem was universal
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.18_0.01_260)] hover:border-[oklch(0.7_0.18_160)/30] transition-all duration-300"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)/10] text-[oklch(0.7_0.18_160)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-[oklch(0.5_0_0)]">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Common Struggles ────────────────────────────────────────────
function CommonStruggles() {
  const { ref, inView } = useInView();

  const struggles = [
    "Poor coordination",
    "Lack of real-time visibility",
    "Inefficient data collection",
    "Weak analytics and reporting",
    "Limited control over field execution"
  ];

  return (
    <section className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center">
            These Activities Often Struggle With
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {struggles.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.18_0.01_260)] text-center hover:border-[oklch(0.5_0.2_25)/30] transition-all duration-300"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(16px)", transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s` }}
              >
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Vision Grid ─────────────────────────────────────────────────
function Vision() {
  const { ref, inView } = useInView();

  const features = [
    { icon: MapPin, label: "Real-time Tracking", color: "bg-[oklch(0.488_0.243_264.376)/10] text-[oklch(0.6_0.2_250)]" },
    { icon: Globe, label: "Map-based Coordination", color: "bg-[oklch(0.696_0.17_162.48)/10] text-[oklch(0.7_0.18_145)]" },
    { icon: CheckCircle2, label: "Digital Forms", color: "bg-[oklch(0.769_0.188_70.08)/10] text-[oklch(0.75_0.18_65)]" },
    { icon: Users, label: "Role-based Management", color: "bg-[oklch(0.627_0.265_303.9)/10] text-[oklch(0.65_0.22_330)]" },
    { icon: BarChart3, label: "Live Analytics", color: "bg-[oklch(0.645_0.246_16.439)/10] text-[oklch(0.7_0.18_160)]" },
    { icon: Zap, label: "Instant Insights", color: "bg-[oklch(0.7_0.18_160)/10] text-[oklch(0.7_0.18_160)]" }
  ];

  return (
    <section id="impact" className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="grid lg:grid-cols-2 gap-12 items-center" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          {/* Grid */}
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {features.map((item, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${item.color} flex flex-col items-center justify-center gap-2 aspect-square hover:scale-105 transition-transform duration-300`}
                  style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "scale(0.95)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}
                >
                  <item.icon className="w-8 h-8" />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/10] text-[oklch(0.7_0.18_160)] border border-[oklch(0.7_0.18_160)/15]">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium tracking-wide">The Vision</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Solving Both Execution & Management Problems
            </h2>
            <div className="space-y-4 text-[oklch(0.55_0_0)] leading-relaxed">
              <p>
                FieldSync was designed to solve both execution problems in the field and management/visibility problems at the platform level.
              </p>
              <p>
                By combining real-time tracking, map-based coordination, structured digital forms, role-based management, and live analytics—FieldSync transforms how field operations are planned, executed, and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why It Matters ──────────────────────────────────────────────
function WhyItMatters() {
  const { ref, inView } = useInView();

  const items = [
    { title: "No area is left uncovered", icon: MapPin },
    { title: "No effort is duplicated", icon: Users },
    { title: "Every activity is tracked", icon: CheckCircle2 },
    { title: "Every result is measurable", icon: BarChart3 }
  ];

  return (
    <section className="py-24 bg-[oklch(0.95_0_0)] text-[oklch(0.15_0_0)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why It Matters
            </h2>
            <p className="text-lg text-[oklch(0.5_0_0)] max-w-2xl mx-auto">
              Field work is powerful—but without the right tools, it becomes inefficient.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[oklch(0.15_0_0)]/10 border border-[oklch(0.15_0_0)]/20 text-center hover:-translate-y-2 transition-all duration-300"
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-[oklch(0.15_0_0)]/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="font-medium">{item.title}</p>
              </div>
            ))}
          </div>

          <p className="text-center mt-12 text-xl font-medium text-[oklch(0.3_0_0)]">
            FieldSync turns field operations into a coordinated, data-driven, and scalable system.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Bigger Future ───────────────────────────────────────────────
function BiggerFuture() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/8] border border-[oklch(0.7_0.18_160)/15] mb-6">
            <Globe className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">A Simple Beginning, A Bigger Future</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
            From Manyara to the World
          </h2>
          <p className="text-lg text-[oklch(0.55_0_0)] mb-8 leading-relaxed">
            What started as a challenge in one mission in Manyara has grown into a platform with the potential to support organizations across different sectors.
          </p>
          <div className="p-8 rounded-2xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)]">
            <p className="text-xl font-semibold text-white mb-2">
              FieldSync is not just a tool.
            </p>
            <p className="text-[oklch(0.55_0_0)]">
              It is a step toward smarter, more effective field operations—anywhere in the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Founder ─────────────────────────────────────────────────────
function Founder() {
  const { ref, inView } = useInView();

  return (
    <section id="founder" className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="relative rounded-3xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.06_0.01_260)] overflow-hidden" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(30px)", transition: "opacity 0.7s, transform 0.7s" }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.18_160)/30] to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative flex items-center justify-center p-10 lg:p-14 bg-[oklch(0.04_0.01_260)]">
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 40% 50%, oklch(0.7 0.18 160 / 0.08), transparent 60%)" }} />
              <div className="absolute top-8 left-8 w-16 h-16 rounded-full border border-[oklch(0.7_0.18_160)/10]" />
              <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full border border-[oklch(0.65_0.2_250)/10]" />

              <div className="relative">
                <div className="absolute -inset-6 rounded-full opacity-20 blur-xl bg-[oklch(0.7_0.18_160)]" />
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden border-2 border-[oklch(0.2_0.01_260)] shadow-2xl shadow-black/50">
                  <Image
                    src="/PROFILE PICTURE.jpeg"
                    alt="Junior Lespikius, Founder & CEO of FieldSync"
                    width={240}
                    height={240}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-14 flex flex-col justify-center space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-4 bg-[oklch(0.7_0.18_160)/8] text-[oklch(0.7_0.18_160)] border border-[oklch(0.7_0.18_160)/15]">
                  Founder & CEO
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Junior Lespikius</h3>
                <p className="text-sm text-[oklch(0.45_0_0)] mt-1">Computer Science Undergraduate (2nd Year)</p>
              </div>

              <div className="p-5 rounded-xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.08_0.01_260)] relative">
                <Quote className="w-5 h-5 text-[oklch(0.7_0.18_160)/30] absolute top-4 left-4" />
                <p className="text-sm text-[oklch(0.55_0_0)] leading-relaxed pl-8 italic">
                  &ldquo;What started as a challenge in one mission in Manyara has grown into a platform with the potential to support organizations across different sectors. FieldSync is not just a tool — it is a step toward smarter, more effective field operations, anywhere in the world.&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[oklch(0.15_0.01_260)]">
                {[
                  { label: "Role", value: "Full-Stack Dev" },
                  { label: "Focus", value: "Real-Time Systems" },
                  { label: "Mission", value: "Field Operations" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[10px] text-[oklch(0.4_0_0)] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────
function CTA() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div ref={ref} className="max-w-4xl mx-auto px-5 sm:px-8 text-center" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Ready to Transform Your Field Operations?
        </h2>
        <p className="mt-4 text-[oklch(0.5_0_0)] max-w-lg mx-auto leading-relaxed">
          Join organizations worldwide using FieldSync to coordinate smarter.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-xl shadow-[oklch(0.7_0.18_160)/30] hover:shadow-[oklch(0.7_0.18_160)/50] hover:-translate-y-0.5">
            Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-medium text-white border border-[oklch(0.25_0.01_260)] hover:border-[oklch(0.4_0.01_260)] hover:bg-[oklch(0.12_0.01_260)] transition-all">
            Request Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="dark">
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pingPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50%       { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes expandWidth {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes bgShift {
          0%, 100% { background-position: 0% 0%; }
          50%       { background-position: 100% 100%; }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <Navbar />
      <Hero />
      <Origin />
      <Challenges />
      <SparkQuestion />
      <UniversalSolution />
      <CommonStruggles />
      <Vision />
      <WhyItMatters />
      <BiggerFuture />
      <Founder />
      <CTA />
      <Footer />
    </div>
  );
}
