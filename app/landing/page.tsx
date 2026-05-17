"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, X, Play } from "lucide-react";

const Problem = dynamic(() => import("./sections/ProblemSection"), { ssr: false });
const Stats = dynamic(() => import("./sections/StatsSection"), { ssr: false });
const Features = dynamic(() => import("./sections/FeaturesSection"), { ssr: false });
const HowItWorks = dynamic(() => import("./sections/HowItWorksSection"), { ssr: false });
const RoleGuides = dynamic(() => import("./sections/RoleGuides"), { ssr: false });
const GuidedDemo = dynamic(() => import("./sections/GuidedDemo"), { ssr: false });
const Testimonials = dynamic(() => import("./sections/TestimonialsSection"), { ssr: false });
const CTA = dynamic(() => import("./sections/CTASection"), { ssr: false });
const Footer = dynamic(() => import("./sections/FooterSection"), { ssr: false });

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[oklch(0.10_0.015_260/0.92)] backdrop-blur-xl border-b border-[oklch(0.28_0.01_260)]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow overflow-hidden">
            <img src="/logo.svg" alt="FieldSync" className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">FieldSync</span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (<a key={l.label} href={l.href} className="text-sm text-[oklch(0.65_0_0)] hover:text-white transition-colors">{l.label}</a>))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[oklch(0.65_0_0)] hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-colors shadow-lg shadow-[oklch(0.7_0.18_160)/25]">Get started <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        <button className="md:hidden text-white p-1" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[oklch(0.10_0.015_260)] border-b border-[oklch(0.28_0.01_260)] px-5 pb-5 pt-2 space-y-3">
          {navLinks.map((l) => (<a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block text-sm text-[oklch(0.65_0_0)] hover:text-white py-1 transition-colors">{l.label}</a>))}
          <div className="flex gap-3 pt-2 border-t border-[oklch(0.28_0.01_260)] mt-2">
            <Link href="/login" className="flex-1 text-center text-sm py-2 rounded-lg border border-[oklch(0.28_0.01_260)] text-white">Sign in</Link>
            <Link href="/register" className="flex-1 text-center text-sm py-2 rounded-lg bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] font-semibold">Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

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
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseleave", handleMouseLeave); };
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
          <div className="w-3 h-3 rounded-full bg-[oklch(0.5_0.2_25)]" /><div className="w-3 h-3 rounded-full bg-[oklch(0.75_0.18_65)]" /><div className="w-3 h-3 rounded-full bg-[oklch(0.7_0.18_160)]" />
          <div className="ml-3 flex-1 bg-[oklch(0.18_0.01_260)] rounded-md px-3 py-1 text-xs text-[oklch(0.45_0_0)] font-mono">app.fieldsync.io/dashboard</div>
          <div className="flex items-center gap-1.5 ml-2"><span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" /><span className="text-[10px] text-[oklch(0.7_0.18_160)] font-medium">LIVE</span></div>
        </div>
        <div className="relative">
          <Image src="/hero-dashboard.png" alt="FieldSync Dashboard" width={1024} height={768} className="w-full h-auto block" priority quality={90} />
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
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pill.color, boxShadow: `0 0 6px ${pill.color}` }} />{pill.label}
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
            <span className="w-2 h-2 rounded-full bg-[oklch(0.7_0.18_160)] animate-pulse" /><span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Real-Time Field Operations — Live</span>
          </div>
          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold text-white leading-[1.06] tracking-tight" style={{ animation: "fadeSlideDown 0.7s ease-out 0.1s backwards" }}>
            Field ops,{" "}<br /><span style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>finally in sync.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[oklch(0.58_0_0)] max-w-xl leading-relaxed" style={{ animation: "fadeSlideDown 0.7s ease-out 0.2s backwards" }}>
            Managing field teams without the right tools means lost coverage, missed tasks, and zero visibility. FieldSync brings your supervisors, team leaders, and field workers into one real-time platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4" style={{ animation: "fadeSlideDown 0.7s ease-out 0.3s backwards" }}>
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[0.9375rem] font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-xl shadow-[oklch(0.7_0.18_160)/30] hover:shadow-[oklch(0.7_0.18_160)/55] hover:-translate-y-0.5">Get started free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
            <a href="#demo" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[0.9375rem] font-medium text-white border border-[oklch(0.3_0.01_260)] hover:border-[oklch(0.45_0.01_260)] hover:bg-[oklch(0.14_0.01_260)] transition-all"><Play className="w-4 h-4 text-[oklch(0.7_0.18_160)]" /> See how it works</a>
          </div>
          <div className="mt-8 flex items-center gap-4" style={{ animation: "fadeSlideDown 0.7s ease-out 0.4s backwards" }}>
            <div className="flex -space-x-2">
              {["oklch(0.7 0.18 160)", "oklch(0.65 0.2 250)", "oklch(0.75 0.18 65)", "oklch(0.65 0.22 330)"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[oklch(0.10_0.01_260)] flex items-center justify-center text-[9px] font-bold text-[oklch(0.10_0_0)]" style={{ background: c }}>{["S", "L", "W", "T"][i]}</div>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.48_0_0)]">Supervisors, leaders & field workers — all on one platform</p>
          </div>
        </div>
        <div className="relative" style={{ animation: "fadeSlideUp 0.9s ease-out 0.4s backwards" }}><HeroImage /></div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <a href="#problem" className="flex flex-col items-center gap-1 text-[oklch(0.38_0_0)] hover:text-[oklch(0.7_0.18_160)] transition-colors group"><span className="text-[10px] tracking-widest uppercase">Scroll</span><ChevronDown className="w-4 h-4 animate-bounce" /></a>
      </div>
    </section>
  );
}

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
