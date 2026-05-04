"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Menu, X, Calendar, Clock, ArrowUpRight } from "lucide-react";

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
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-[oklch(0.06_0.01_260)] pt-20 pb-16">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.04] blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.2_250)] opacity-[0.05] blur-[120px]" style={{ animation: "pulse 4s ease-in-out infinite" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(oklch(0.7 0.18 160) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.18 160) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.7_0.18_160)/20] bg-[oklch(0.7_0.18_160)/5] mb-10" style={{ animation: "fadeSlideDown 0.6s ease-out forwards" }}>
          <Calendar className="w-4 h-4 text-[oklch(0.7_0.18_160)]" />
          <span className="text-xs font-medium text-[oklch(0.7_0.18_160)] tracking-wide uppercase">Insights & Updates</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight" style={{ animation: "fadeSlideDown 0.8s ease-out 0.1s backwards" }}>
          The{" "}
          <span className="block mt-2" style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 160), oklch(0.55 0.22 190), oklch(0.65 0.2 250))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            FieldSync Blog
          </span>
        </h1>

        <p className="mt-8 text-base sm:text-lg text-[oklch(0.55_0_0)] max-w-2xl mx-auto leading-relaxed" style={{ animation: "fadeSlideDown 0.8s ease-out 0.25s backwards" }}>
          Best practices, product updates, and stories from the field.
        </p>
      </div>
    </section>
  );
}

// ─── Blog Posts ──────────────────────────────────────────────────
const posts = [
  {
    title: "Why Real-Time GPS Tracking is a Game-Changer for Field Teams",
    excerpt: "Learn how live location sharing improves safety, accountability, and response times for surveyors and data collectors.",
    date: "Apr 28, 2026",
    readTime: "5 min read",
    category: "Product",
  },
  {
    title: "5 Common Data Collection Mistakes (And How to Avoid Them)",
    excerpt: "From offline data loss to duplicate entries, we break down the most frequent pitfalls in field research.",
    date: "Apr 15, 2026",
    readTime: "4 min read",
    category: "Best Practices",
  },
  {
    title: "Introducing Zone-Based Task Assignment",
    excerpt: "Our new geofencing feature lets managers assign work by area, not just by person. Here's how it works.",
    date: "Mar 30, 2026",
    readTime: "6 min read",
    category: "Feature Update",
  },
  {
    title: "How FieldSync Helps NGOs Reach Last-Mile Communities",
    excerpt: "Case studies from partners in Tanzania who use FieldSync to coordinate health and education surveys.",
    date: "Mar 12, 2026",
    readTime: "8 min read",
    category: "Case Study",
  },
  {
    title: "The Future of Offline-First Mobile Data Collection",
    excerpt: "Why offline capability isn't optional in emerging markets and how we built our sync engine for reliability.",
    date: "Feb 25, 2026",
    readTime: "7 min read",
    category: "Engineering",
  },
  {
    title: "Building a Culture of Accountability in Remote Teams",
    excerpt: "Practical strategies for team leaders to maintain visibility and support without micromanaging.",
    date: "Feb 10, 2026",
    readTime: "5 min read",
    category: "Leadership",
  },
];

function BlogGrid() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-[oklch(0.06_0.01_260)] py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8" ref={ref}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <article
              key={i}
              className="group relative bg-[oklch(0.08_0.01_260)] border border-[oklch(0.15_0.01_260)] rounded-2xl p-6 hover:border-[oklch(0.7_0.18_160)/30] transition-all duration-300 hover:-translate-y-1"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease-out ${i * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[oklch(0.7_0.18_160)/10] text-[oklch(0.7_0.18_160)]">
                  {post.category}
                </span>
                <span className="text-xs text-[oklch(0.4_0_0)] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[oklch(0.7_0.18_160)] transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-[oklch(0.45_0_0)] leading-relaxed mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[oklch(0.35_0_0)]">{post.date}</span>
                <span className="text-sm font-medium text-[oklch(0.7_0.18_160)] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read more <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter CTA ──────────────────────────────────────────────
function NewsletterCTA() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-[oklch(0.06_0.01_260)] pb-20">
      <div
        ref={ref}
        className="max-w-3xl mx-auto px-5 sm:px-8"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}
      >
        <div className="relative bg-gradient-to-br from-[oklch(0.12_0.02_260)] to-[oklch(0.08_0.01_260)] border border-[oklch(0.2_0.01_260)] rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[oklch(0.7_0.18_160)] opacity-[0.06] blur-[80px]" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Stay Updated</h3>
            <p className="text-sm text-[oklch(0.5_0_0)] mb-6 max-w-md mx-auto">
              Get product updates, field tips, and industry insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 rounded-xl bg-[oklch(0.06_0.01_260)] border border-[oklch(0.2_0.01_260)] text-white placeholder:text-[oklch(0.4_0_0)] focus:outline-none focus:border-[oklch(0.7_0.18_160)] transition-colors"
              />
              <button className="px-6 py-3 rounded-xl bg-[oklch(0.7_0.18_160)] text-[oklch(0.10_0_0)] font-semibold hover:bg-[oklch(0.65_0.18_160)] transition-colors shadow-lg shadow-[oklch(0.7_0.18_160)/25]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_260)]">
      <Navbar />
      <Hero />
      <BlogGrid />
      <NewsletterCTA />
      <Footer />
    </main>
  );
}
