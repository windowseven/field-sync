"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Users,
  Code,
  TrendingUp,
  Rocket,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Target,
  Layers,
  Heart,
  Zap,
  BarChart3,
  MapPin,
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
    { label: "Partnerships", href: "#partnerships" },
    { label: "Community", href: "#community" },
    { label: "Roadmap", href: "#roadmap" },
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
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)] flex items-center justify-center shadow-lg shadow-[oklch(0.7_0.18_160)/30] group-hover:shadow-[oklch(0.7_0.18_160)/50] transition-shadow">
            <ShieldCheck className="w-4 h-4 text-[oklch(0.10_0_0)]" />
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
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.18_160)] flex items-center justify-center shadow-lg shadow-[oklch(0.7_0.18_160)/30]">
                <ShieldCheck className="w-4 h-4 text-[oklch(0.10_0_0)]" />
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
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Be Part of the Journey</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          Join Our{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Network
          </span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          FieldSync is still in its early chapters. Whether you&apos;re an organization, a developer, or a mentor — there&apos;s a place for you in this story.
        </p>

        <div className="mt-16 flex flex-col items-center gap-3" style={{ animation: "fadeSlideDown 0.8s ease-out 0.4s backwards" }}>
          <span className="text-[10px] tracking-widest uppercase text-[oklch(0.35_0_0)]">Explore how</span>
          <div className="w-px h-12 bg-gradient-to-b from-[oklch(0.7_0.18_160)/50] to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ─── How to Get Involved ─────────────────────────────────────────
function Opportunities() {
  const { ref, inView } = useInView();

  const opportunities = [
    {
      icon: Target,
      category: "For Organizations",
      title: "Become a Pilot Partner",
      description: "We're looking for organizations running field operations who want early access to FieldSync at no cost. Help us shape the platform for real-world use and get a solution built around your actual challenges.",
      perks: [
        "Early access to all features",
        "Direct input on product roadmap",
        "Priority support from the team",
        "No cost during the pilot phase",
      ],
      color: "oklch(0.7_0.18_160)",
      bg: "oklch(0.7_0.18_160)/8",
      border: "oklch(0.7_0.18_160)/15",
      cta: "Partner With Us",
      ctaLink: "/contact",
    },
    {
      icon: Code,
      category: "For Developers & Students",
      title: "Join the Community",
      description: "FieldSync is built by someone who started from scratch. We're open to collaboration, feedback, and anyone who wants to contribute ideas, test features, or learn how real-time systems are built.",
      perks: [
        "Open feedback channels",
        "Learn from a live production system",
        "Contribute ideas and feature requests",
        "Networking with other builders",
      ],
      color: "oklch(0.75_0.18_65)",
      bg: "oklch(0.75_0.18_65)/8",
      border: "oklch(0.75_0.18_65)/15",
      cta: "Connect With Us",
      ctaLink: "/contact",
    },
    {
      icon: TrendingUp,
      category: "For Investors & Mentors",
      title: "Support the Mission",
      description: "We're a self-funded project with a clear vision. If you believe in solving real field coordination problems and want to support a young builder from the ground up, we'd love to connect.",
      perks: [
        "Early-stage access to a proven concept",
        "Real traction from real field operations",
        "Clear roadmap and product vision",
        "Direct engagement with the founder",
      ],
      color: "oklch(0.65_0.2_250)",
      bg: "oklch(0.65_0.2_250)/8",
      border: "oklch(0.65_0.2_250)/15",
      cta: "Get in Touch",
      ctaLink: "/contact",
    },
  ];

  return (
    <section id="partnerships" className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16" ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.75_0.18_65)/8] border border-[oklch(0.75_0.18_65)/15] mb-5">
            <Users className="w-3 h-3 text-[oklch(0.75_0.18_65)]" />
            <span className="text-xs text-[oklch(0.75_0.18_65)] font-medium tracking-wide">Ways to Get Involved</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Not hiring yet, but the door is open
          </h2>
          <p className="mt-4 text-[oklch(0.5_0_0)] max-w-lg mx-auto">
            We're focused on building a great product first. But there are many ways to be part of the journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {opportunities.map((opp, i) => (
            <OpportunityCard key={i} opp={opp} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OpportunityCard({ opp, index, inView }: { opp: { icon: React.ElementType; category: string; title: string; description: string; perks: string[]; color: string; bg: string; border: string; cta: string; ctaLink: string }; index: number; inView: boolean }) {
  const Icon = opp.icon;
  return (
    <div
      className="rounded-2xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.06_0.01_260)] p-8 hover:border-[oklch(0.3_0.01_260)] transition-all duration-500 relative overflow-hidden flex flex-col"
      style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: `opacity 0.6s ${index * 0.1}s, transform 0.6s ${index * 0.1}s` }}
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(ellipse at 30% 20%, ${opp.color}06, transparent 60%)` }} />

      <div className="relative flex-1">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: opp.bg, border: `1px solid ${opp.border}` }}>
          <Icon className="w-6 h-6" style={{ color: opp.color }} />
        </div>

        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: opp.color }}>{opp.category}</p>
        <h3 className="text-xl font-bold text-white mb-3">{opp.title}</h3>
        <p className="text-sm text-[oklch(0.55_0_0)] leading-relaxed mb-6">{opp.description}</p>

        <ul className="space-y-2 mb-8">
          {opp.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-[oklch(0.5_0_0)]">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.7_0.18_160)] mt-0.5 flex-shrink-0" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={opp.ctaLink}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
        style={{ background: `${opp.color}15`, border: `1px solid ${opp.border}`, color: opp.color }}
      >
        {opp.cta} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Why Partner Early ───────────────────────────────────────────
function WhyPartner() {
  const { ref, inView } = useInView();

  const reasons = [
    { icon: Heart, title: "Built for Real Problems", desc: "Every feature comes from real field experience, not guesswork." },
    { icon: Rocket, title: "Ground Floor Opportunity", desc: "Shape the platform from day one. Your input matters." },
    { icon: Layers, title: "Flexible & Adaptable", desc: "We build around your workflow, not the other way around." },
    { icon: Globe, title: "Social Impact", desc: "Support a tool designed to make field work more effective worldwide." },
  ];

  return (
    <section id="community" className="py-24 bg-[oklch(0.06_0.01_260)] border-y border-[oklch(0.15_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16" ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.7_0.18_160)/8] border border-[oklch(0.7_0.18_160)/15] mb-5">
            <MessageSquare className="w-3 h-3 text-[oklch(0.7_0.18_160)]" />
            <span className="text-xs text-[oklch(0.7_0.18_160)] font-medium tracking-wide">Why Get Involved Now</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Early partners shape the future
          </h2>
          <p className="mt-4 text-[oklch(0.5_0_0)] max-w-lg mx-auto">
            The organizations and individuals who get involved now will directly influence how FieldSync evolves.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.18_0.01_260)] hover:border-[oklch(0.3_0.01_260)] transition-all duration-300"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "oklch(0.7_0.18_160)/10", border: "1px solid oklch(0.7_0.18_160)/15" }}>
                <item.icon className="w-5 h-5 text-[oklch(0.7_0.18_160)]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-[oklch(0.5_0_0)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Roadmap ─────────────────────────────────────────────────────
function Roadmap() {
  const { ref, inView } = useInView();

  const phases = [
    {
      status: "complete",
      label: "Phase 1",
      title: "Core Platform",
      description: "Role-based dashboards, real-time tracking, zone management, digital forms, and team coordination.",
      items: ["Supervisor workspace", "Team leader dashboard", "Field worker app", "Real-time sync engine"],
      color: "oklch(0.7_0.18_160)",
    },
    {
      status: "active",
      label: "Phase 2",
      title: "Multi-Organization Support",
      description: "Support for multiple organizations on one platform with isolated workspaces and shared infrastructure.",
      items: ["Organization management", "Multi-tenant architecture", "Advanced analytics", "Export & reporting"],
      color: "oklch(0.75_0.18_65)",
    },
    {
      status: "planned",
      label: "Phase 3",
      title: "Offline-First Mobile App",
      description: "Full offline functionality for field workers in remote areas with automatic sync when connected.",
      items: ["React Native mobile app", "Offline data queue", "Background sync", "Low-bandwidth mode"],
      color: "oklch(0.65_0.2_250)",
    },
    {
      status: "planned",
      label: "Phase 4",
      title: "Global Scaling",
      description: "Multi-language support, regional data centers, and partnerships with organizations worldwide.",
      items: ["Multi-language UI", "Regional servers", "API integrations", "Partner network"],
      color: "oklch(0.6_0.18_200)",
    },
  ];

  return (
    <section id="roadmap" className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-16" ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.65_0.2_250)/8] border border-[oklch(0.65_0.2_250)/15] mb-5">
            <MapPin className="w-3 h-3 text-[oklch(0.65_0.2_250)]" />
            <span className="text-xs text-[oklch(0.65_0.2_250)] font-medium tracking-wide">The Road Ahead</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Our Roadmap
          </h2>
          <p className="mt-4 text-[oklch(0.5_0_0)] max-w-lg mx-auto">
            From a local mission to a global platform — here&apos;s where we&apos;re headed.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[oklch(0.7_0.18_160)] via-[oklch(0.65_0.2_250)] to-[oklch(0.18_0.01_260)]" />

          <div className="space-y-8">
            {phases.map((phase, i) => (
              <PhaseCard key={i} phase={phase} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({ phase, index, inView }: { phase: { status: string; label: string; title: string; description: string; items: string[]; color: string }; index: number; inView: boolean }) {
  return (
    <div
      className="relative pl-16 sm:pl-24"
      style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.6s ${index * 0.12}s, transform 0.6s ${index * 0.12}s` }}
    >
      {/* Dot */}
      <div
        className="absolute left-4 sm:left-6 top-8 w-5 h-5 rounded-full border-2 flex items-center justify-center"
        style={{
          borderColor: phase.color,
          background: phase.status === "complete" ? phase.color : phase.status === "active" ? `${phase.color}40` : "oklch(0.08_0.01_260)",
        }}
      >
        {phase.status === "complete" && <CheckCircle2 className="w-3 h-3 text-[oklch(0.10_0_0)]" />}
        {phase.status === "active" && <Zap className="w-3 h-3" style={{ color: phase.color }} />}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.06_0.01_260)] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold font-mono" style={{ color: phase.color }}>{phase.label}</span>
          {phase.status === "complete" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.7_0.18_160)/10] text-[oklch(0.7_0.18_160)] border border-[oklch(0.7_0.18_160)/15]">Completed</span>
          )}
          {phase.status === "active" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.75_0.18_65)/10] text-[oklch(0.75_0.18_65)] border border-[oklch(0.75_0.18_65)/15]">In Progress</span>
          )}
          {phase.status === "planned" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.65_0.2_250)/10] text-[oklch(0.65_0.2_250)] border border-[oklch(0.65_0.2_250)/15]">Planned</span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
        <p className="text-sm text-[oklch(0.55_0_0)] leading-relaxed mb-4">{phase.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {phase.items.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[oklch(0.5_0_0)]">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: phase.color }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Contact CTA ─────────────────────────────────────────────────
function ContactCTA() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 bg-[oklch(0.06_0.01_260)]">
      <div ref={ref} className="max-w-4xl mx-auto px-5 sm:px-8 text-center" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
        <div className="relative rounded-3xl border border-[oklch(0.2_0.01_260)] bg-[oklch(0.08_0.01_260)] p-12 sm:p-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.7 0.18 160 / 0.08), transparent 60%)" }} />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "oklch(0.7_0.18_160)/10", border: "1px solid oklch(0.7_0.18_160)/15" }}>
              <Mail className="w-7 h-7 text-[oklch(0.7_0.18_160)]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Let&apos;s build something together
            </h2>
            <p className="mt-4 text-[oklch(0.5_0_0)] max-w-lg mx-auto leading-relaxed">
              Whether you want to partner, contribute, or simply stay updated on FieldSync&apos;s progress — we&apos;d love to hear from you.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-xl shadow-[oklch(0.7_0.18_160)/30] hover:shadow-[oklch(0.7_0.18_160)/50] hover:-translate-y-0.5">
                Contact Us <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[0.9375rem] font-medium text-white border border-[oklch(0.25_0.01_260)] hover:border-[oklch(0.4_0.01_260)] hover:bg-[oklch(0.12_0.01_260)] transition-all">
                Learn Our Story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function CareersPage() {
  return (
    <div className="dark">
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <Navbar />
      <Hero />
      <Opportunities />
      <WhyPartner />
      <Roadmap />
      <ContactCTA />
      <Footer />
    </div>
  );
}
