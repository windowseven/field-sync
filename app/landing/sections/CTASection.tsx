"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

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

export default function CTASection() {
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
