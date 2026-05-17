"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock, SlidersHorizontal, Target, Smartphone, FolderOpen, MapPin, UserPlus, FileText, BarChart3,
  Users, ListChecks, Map, Bell, ClipboardList, Activity, SendHorizonal, ChevronRight,
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

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
    role: "Supervisor", badge: "Project Owner", color: "oklch(0.65 0.2 250)", bgColor: "oklch(0.65 0.2 250 / 0.08)", icon: SlidersHorizontal,
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
    role: "Team Leader", badge: "Squad Coordinator", color: "oklch(0.75 0.18 65)", bgColor: "oklch(0.75 0.18 65 / 0.08)", icon: Target,
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
    role: "Field Worker", badge: "On the Ground", color: "oklch(0.7 0.18 160)", bgColor: "oklch(0.7 0.18 160 / 0.08)", icon: Smartphone,
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

export default function RoleGuides() {
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">See how FieldSync works<br className="hidden sm:block" /> for your specific role.</h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">Everyone on your team has a different job. FieldSync is built so each person gets exactly what they need.</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex gap-2 p-1.5 rounded-2xl bg-[oklch(0.12_0.01_260)] border border-[oklch(0.22_0.01_260)]">
            {roleGuides.map((r, i) => {
              const RIcon = r.icon;
              return (
                <button key={r.role} onClick={() => setActiveRole(i)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200" style={{ background: activeRole === i ? r.color : "transparent", color: activeRole === i ? "oklch(0.10 0 0)" : "oklch(0.55 0 0)", boxShadow: activeRole === i ? `0 4px 16px ${r.color}35` : "none" }}>
                  <RIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{r.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "opacity 0.6s, transform 0.6s" }}>
          <div className="lg:col-span-2 rounded-2xl border p-7 flex flex-col justify-between" style={{ borderColor: `${guide.color}25`, background: guide.bgColor }}>
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${guide.color}15`, border: `1px solid ${guide.color}25` }}>
                <Icon className="w-6 h-6" style={{ color: guide.color }} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3" style={{ color: guide.color, background: `${guide.color}12`, border: `1px solid ${guide.color}20` }}>{guide.badge}</div>
              <h3 className="text-xl font-bold text-white mb-3">{guide.role}</h3>
              <p className="text-sm text-[oklch(0.58_0_0)] leading-relaxed">{guide.summary}</p>
            </div>
            <div className="mt-8 pt-5 border-t" style={{ borderColor: `${guide.color}15` }}><p className="text-xs text-[oklch(0.45_0_0)]">{guide.steps.length} key actions in your workflow</p></div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            {guide.steps.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={s.action} className="flex gap-4 p-4 rounded-xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] hover:border-[oklch(0.32_0.01_260)] transition-all group">
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
