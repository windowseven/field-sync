"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Menu, X, Cookie, Settings, Shield, BarChart3, Clock, Mail } from "lucide-react";

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
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "FAQ", href: "/faq" },
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
          <div className="pt-2 border-t border-[oklch(0.2_0.01_260)] space-y-3">
            <Link href="/login" className="block text-sm text-[oklch(0.6_0_0)] hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="block text-center px-4 py-2 rounded-lg text-sm font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)]">Get started</Link>
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
    <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-[oklch(0.06_0.01_260)] pt-20 pb-16">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.04] blur-[140px] animate-pulse" />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(oklch(0.7 0.18 160) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.18 160) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] mb-10" style={{ animation: "fadeSlideDown 0.6s ease-out forwards" }}>
          <Cookie className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Effective May 1, 2026</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          Cookie{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Policy
          </span>
        </h1>

        <p className="mt-6 text-base text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          How FieldSync uses cookies and similar tracking technologies.
        </p>
      </div>
    </section>
  );
}

// ─── Cookie Content ──────────────────────────────────────────────
function CookieContent() {
  const { ref, inView } = useInView();

  const categories = [
    {
      icon: <Settings className="w-5 h-5" />,
      category: "Essential",
      color: "text-[oklch(0.7_0.18_160)]",
      bgColor: "bg-[oklch(0.7_0.18_160)/10]",
      borderColor: "border-[oklch(0.7_0.18_160)/20]",
      description: "Required for the platform to function. Cannot be disabled.",
      cookies: [
        { name: "fs_session", purpose: "Maintains your logged-in session", duration: "Until logout" },
        { name: "fs_csrf_token", purpose: "Protects against cross-site request forgery", duration: "Session" },
        { name: "fs_theme", purpose: "Remembers your UI theme preference", duration: "1 year" },
      ],
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      category: "Analytics",
      color: "text-[oklch(0.65_0.2_250)]",
      bgColor: "bg-[oklch(0.65_0.2_250)/10]",
      borderColor: "border-[oklch(0.65_0.2_250)/20]",
      description: "Helps us understand how users interact with the platform.",
      cookies: [
        { name: "_ga", purpose: "Distinguishes unique users (Google Analytics)", duration: "2 years" },
        { name: "fs_page_views", purpose: "Tracks pages visited for UX improvements", duration: "30 days" },
        { name: "fs_session_duration", purpose: "Measures time spent per session", duration: "Session" },
      ],
    },
    {
      icon: <Shield className="w-5 h-5" />,
      category: "Security",
      color: "text-[oklch(0.75_0.2_150)]",
      bgColor: "bg-[oklch(0.75_0.2_150)/10]",
      borderColor: "border-[oklch(0.75_0.2_150)/20]",
      description: "Used to detect and prevent fraudulent activity.",
      cookies: [
        { name: "fs_device_id", purpose: "Identifies trusted devices", duration: "6 months" },
        { name: "fs_login_attempts", purpose: "Limits brute-force login attempts", duration: "1 hour" },
      ],
    },
  ];

  return (
    <section className="bg-[oklch(0.06_0.01_260)] py-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8" ref={ref}>
        <div className="space-y-12">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-[oklch(0.08_0.01_260)] border border-[oklch(0.15_0.01_260)] rounded-2xl overflow-hidden"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease-out ${i * 0.1}s`,
              }}
            >
              <div className="p-6 sm:p-8 border-b border-[oklch(0.15_0.01_260)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${cat.bgColor} flex items-center justify-center ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{cat.category} Cookies</h2>
                    <p className="text-xs text-[oklch(0.5_0_0)]">{cat.description}</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[oklch(0.15_0.01_260)]">
                {cat.cookies.map((cookie, j) => (
                  <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-6 sm:px-8 py-4">
                    <code className="text-sm font-mono text-[oklch(0.7_0.18_160)] bg-[oklch(0.12_0.01_260)] px-2 py-1 rounded w-fit">
                      {cookie.name}
                    </code>
                    <p className="text-sm text-[oklch(0.5_0_0)] flex-1">{cookie.purpose}</p>
                    <span className="text-xs text-[oklch(0.4_0_0)] flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3" /> {cookie.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-[oklch(0.08_0.01_260)] border border-[oklch(0.15_0.01_260)] rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Managing Cookies</h3>
          <div className="space-y-3 text-sm text-[oklch(0.5_0_0)] leading-relaxed">
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View and delete existing cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
            </ul>
            <p className="mt-4">
              Note: Disabling essential cookies will prevent you from using the FieldSync platform.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[oklch(0.4_0_0)]">
            Questions about our cookie usage? Contact us at{" "}
            <a href="mailto:fieldsyncsupport@gmail.com" className="text-[oklch(0.7_0.18_160)] hover:underline">
              fieldsyncsupport@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_260)]">
      <Navbar />
      <Hero />
      <CookieContent />
      <Footer />
    </main>
  );
}
