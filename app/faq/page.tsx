"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Menu, X, HelpCircle, ChevronDown, ChevronUp, Rocket, User, Users, Smartphone, Mail, Search } from "lucide-react";

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
    { label: "Contact", href: "/contact" },
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
    Company: ["About", "Careers", "Blog", "Contact"],
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
          <HelpCircle className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Common Questions</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          Frequently Asked{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Questions
          </span>
        </h1>

        <p className="mt-6 text-base text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          Everything you need to know about using FieldSync.
        </p>
      </div>
    </section>
  );
}

// ─── Accordion Item ──────────────────────────────────────────────
function AccordionItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[oklch(0.15_0.01_260)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 sm:py-5 text-left group"
      >
        <span className="text-sm sm:text-base font-medium text-white pr-4 group-hover:text-[oklch(0.7_0.18_160)] transition-colors">
          {question}
        </span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-[oklch(0.12_0.01_260)] flex items-center justify-center transition-colors ${isOpen ? "bg-[oklch(0.7_0.18_160)/10]" : "group-hover:bg-[oklch(0.7_0.18_160)/10]"}`}>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[oklch(0.5_0_0)] group-hover:text-[oklch(0.7_0.18_160)] transition-colors" />
          )}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-4 sm:pb-5" : "max-h-0"}`}
      >
        <p className="text-sm text-[oklch(0.5_0_0)] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ─── FAQ Content ─────────────────────────────────────────────────
function FAQContent() {
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: <Rocket className="w-5 h-5" />,
      title: "Getting Started",
      questions: [
        { q: "What is FieldSync?", a: "FieldSync is a real-time field operations management platform designed for teams that conduct surveys, data collection, and field research. It provides GPS tracking, zone-based task assignment, offline data collection, and team coordination tools." },
        { q: "Who should use FieldSync?", a: "FieldSync is built for NGOs, government agencies, research institutions, and private organizations that manage field teams. It&apos;s especially useful for census workers, health surveyors, agricultural researchers, and any team that collects data outside the office." },
        { q: "How do I create an account?", a: "Click &quot;Get started&quot; on the homepage, fill in your name, email, and organization details, then verify your email address. You&apos;ll be able to set up your first project immediately after registration." },
        { q: "Is there a free trial?", a: "Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can invite up to 5 team members to test the platform together." },
      ],
    },
    {
      icon: <User className="w-5 h-5" />,
      title: "Account & Login",
      questions: [
        { q: "I forgot my password. How do I reset it?", a: "Click &quot;Forgot password?&quot; on the login page. Enter your registered email address and we&apos;ll send you a secure reset link. The link expires after 1 hour for security." },
        { q: "Can I use two-factor authentication?", a: "Yes. Go to Settings > Security and enable Two-Factor Authentication. We recommend using an authenticator app like Google Authenticator or Authy for the best experience." },
        { q: "How do I update my profile information?", a: "Navigate to Settings > Profile where you can update your name, email, phone number, and profile photo. Email changes require verification of the new address." },
        { q: "Can I delete my account?", a: "Yes. Go to Settings > Account > Delete Account. Your data will be retained for 30 days before permanent deletion, allowing you to recover your account if you change your mind." },
      ],
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Teams & Collaboration",
      questions: [
        { q: "How do I create a team?", a: "From the dashboard, click &quot;Create Team&quot; and enter a team name, description, and select a team leader. You can then invite members via email or generate an invitation link." },
        { q: "What roles are available in a team?", a: "FieldSync has three main roles: Admin (full access), Team Leader (manages team members and tasks), and Member (field worker who completes tasks and submits data). Role permissions can be customized." },
        { q: "How do I assign tasks to my team?", a: "Create a task from the dashboard or project view, select the team or individual members, set a deadline and priority, and optionally define a zone or location for the task." },
        { q: "Can I track my team&apos;s location in real-time?", a: "Yes. When team members have location sharing enabled, you can see their live positions on the map. Location data is only visible to authorized team leaders and administrators." },
      ],
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Mobile App & Offline",
      questions: [
        { q: "Does FieldSync work offline?", a: "Yes. The mobile app is designed for offline-first operation. Data collected offline is automatically synced when connectivity is restored. You can also manually trigger a sync from the app." },
        { q: "What devices are supported?", a: "FieldSync works on Android 8.0+ and iOS 14+. The web dashboard is compatible with all modern browsers on desktop and mobile devices." },
        { q: "How does offline sync work?", a: "When you&apos;re offline, all data is stored securely on your device. Once you reconnect, the app automatically uploads pending submissions and downloads any updates from the server. Conflict resolution is handled automatically." },
        { q: "Is my offline data secure?", a: "Yes. All data stored on the device is encrypted using AES-256. If your device is lost or stolen, you can remotely wipe the app data from the dashboard." },
      ],
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: "Features & Usage",
      questions: [
        { q: "What is zone-based assignment?", a: "Zones let you divide your operational area into geographic regions. You can assign teams or individuals to specific zones, and track coverage in real-time. This is ideal for census work, health surveys, and environmental monitoring." },
        { q: "Can I create custom forms for data collection?", a: "Yes. Use the Form Builder to create custom survey forms with various field types: text, number, multiple choice, GPS coordinates, photos, signatures, and more. Forms can be published to specific teams or projects." },
        { q: "How do I export my data?", a: "From any project or submission view, click &quot;Export&quot; and choose your preferred format: CSV, Excel, or JSON. You can also set up automated daily or weekly exports via email." },
        { q: "Does FieldSync support geofencing?", a: "Yes. You can set up geofences around zones to receive alerts when team members enter or leave an area. Geofencing helps ensure teams are working in the correct locations." },
      ],
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Support & Contact",
      questions: [
        { q: "How do I get help if I&apos;m stuck?", a: "You can reach our support team via email at fieldsyncsupport@gmail.com, through the in-app help widget, or by visiting our Contact page. We typically respond within 24 hours." },
        { q: "Do you offer training for new users?", a: "Yes. We provide free onboarding webinars and video tutorials. Contact us to schedule a session for your team. We also have a comprehensive knowledge base with step-by-step guides." },
        { q: "Can I request a new feature?", a: "Absolutely! We welcome feature requests. Use the Contact page and select &quot;Feedback&quot; as the subject, or reach out to our support team. We review all requests and prioritize based on user demand." },
        { q: "What is your uptime guarantee?", a: "We maintain a 99.9% uptime SLA for paid plans. Scheduled maintenance is announced at least 48 hours in advance. Real-time system status is available at status.fieldsync.com." },
      ],
    },
  ];

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <section className="bg-[oklch(0.06_0.01_260)] py-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8" ref={ref}>
        {/* Search */}
        <div
          className="relative mb-12"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-out",
          }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[oklch(0.4_0_0)]" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[oklch(0.08_0.01_260)] border border-[oklch(0.15_0.01_260)] text-white placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {filteredCategories.map((cat, i) => (
            <div
              key={i}
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease-out ${i * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[oklch(0.7_0.18_160)/10] flex items-center justify-center text-[oklch(0.7_0.18_160)]">
                  {cat.icon}
                </div>
                <h2 className="text-lg font-semibold text-white">{cat.title}</h2>
              </div>
              <div className="bg-[oklch(0.08_0.01_260)] border border-[oklch(0.15_0.01_260)] rounded-2xl px-6 sm:px-8 divide-y divide-[oklch(0.15_0.01_260)]">
                {cat.questions.map((item, j) => (
                  <AccordionItem key={j} question={item.q} answer={item.a} index={j} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help CTA */}
        <div
          className="mt-16 bg-gradient-to-br from-[oklch(0.12_0.02_260)] to-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out 0.4s",
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.06] blur-[80px]" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Still have questions?</h3>
            <p className="text-sm text-[oklch(0.5_0_0)] mb-6 max-w-md mx-auto">
              Can&apos;t find what you&apos;re looking for? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] font-semibold hover:bg-[oklch(0.65_0.18_160)] transition-colors shadow-lg shadow-[oklch(0.7_0.18_160)/25]"
              >
                Contact us <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:fieldsyncsupport@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[oklch(0.12_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white font-semibold hover:border-[oklch(0.7_0.18_160)/30] transition-colors"
              >
                <Mail className="w-4 h-4" /> Email support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_260)]">
      <Navbar />
      <Hero />
      <FAQContent />
      <Footer />
    </main>
  );
}
