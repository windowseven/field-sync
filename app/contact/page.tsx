"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Mail,
  MapPin,
  Clock,
  SendHorizonal,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { submitContactForm } from "@/lib/api/contactService";

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
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-[oklch(0.06_0.01_260)] pt-20 pb-16">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.04] blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.2_250)] opacity-[0.05] blur-[120px]" style={{ animation: "pulse 4s ease-in-out infinite" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(oklch(0.7 0.18 160) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.18 160) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] mb-10" style={{ animation: "fadeSlideDown 0.6s ease-out forwards" }}>
          <MessageSquare className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">We&apos;d Love to Hear From You</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          Get in{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Touch
          </span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          Have questions, feedback, or want to explore a partnership? Drop us a message and we&apos;ll get back to you within 24 hours.
        </p>
      </div>
    </section>
  );
}

// ─── Contact Form & Info ─────────────────────────────────────────
function ContactSection() {
  const { ref, inView } = useInView();
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    try {
      await submitContactForm(formData);
      setFormState("success");
    } catch (error) {
      setFormState("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <section className="py-24 bg-[oklch(0.04_0.01_260)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-5 gap-12" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)", transition: "opacity 0.6s, transform 0.6s" }}>
          {/* Left: Form */}
          <div className="lg:col-span-3">
            {formState === "success" ? (
              <div className="rounded-2xl border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[oklch(0.7_0.18_160)/10] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.7_0.18_160)]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Message Sent!</h3>
                <p className="text-[oklch(0.55_0_0)] leading-relaxed mb-8">
                  Thank you for reaching out. Our team will review your message and respond within 24 hours.
                </p>
                <button
                  onClick={() => setFormState("idle")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[oklch(0.7_0.18_160)] border border-[oklch(0.7_0.18_160)/20] hover:bg-[oklch(0.7_0.18_160)/10] transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-white">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-white">Subject</label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors appearance-none"
                  >
                    <option value="" disabled className="bg-[oklch(0.12_0.01_260)]">Select a topic</option>
                    <option value="general" className="bg-[oklch(0.12_0.01_260)]">General Inquiry</option>
                    <option value="partnership" className="bg-[oklch(0.12_0.01_260)]">Partnership</option>
                    <option value="support" className="bg-[oklch(0.12_0.01_260)]">Technical Support</option>
                    <option value="feedback" className="bg-[oklch(0.12_0.01_260)]">Feedback</option>
                    <option value="other" className="bg-[oklch(0.12_0.01_260)]">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-white">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.65_0.18_160)] transition-all shadow-lg shadow-[oklch(0.7_0.18_160)/25] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <SendHorizonal className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.06_0.01_260)] p-6">
              <h3 className="text-lg font-bold text-white mb-6">Contact Information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.18_160)/10] border border-[oklch(0.7_0.18_160)/15] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[oklch(0.7_0.18_160)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <a href="mailto:fieldsyncsupport@gmail.com" className="text-sm text-[oklch(0.55_0_0)] hover:text-[oklch(0.7_0.18_160)] transition-colors">
                      fieldsyncsupport@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.2_250)/10] border border-[oklch(0.65_0.2_250)/15] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[oklch(0.65_0.2_250)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Location</p>
                    <p className="text-sm text-[oklch(0.55_0_0)]">Dar es Salaam, Tanzania</p>
                    <p className="text-xs text-[oklch(0.45_0_0)] mt-1">Available Worldwide</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[oklch(0.75_0.18_65)/10] border border-[oklch(0.75_0.18_65)/15] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[oklch(0.75_0.18_65)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Response Time</p>
                    <p className="text-sm text-[oklch(0.55_0_0)]">Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[oklch(0.18_0.01_260)] bg-[oklch(0.06_0.01_260)] p-6">
              <h3 className="text-lg font-bold text-white mb-3">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/about" className="flex items-center justify-between text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors group">
                  <span>About FieldSync</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/careers" className="flex items-center justify-between text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors group">
                  <span>Join Our Network</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="flex items-center justify-between text-sm text-[oklch(0.55_0_0)] hover:text-white transition-colors group">
                  <span>Request a Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function ContactPage() {
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
      <ContactSection />
      <Footer />
    </div>
  );
}
