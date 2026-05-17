"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Play, X, Crosshair, FolderOpen, Map, Users, BarChart3, Bell,
  ListChecks, FileText, Activity, Smartphone, Target, SlidersHorizontal,
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
    label: "Supervisor", color: "oklch(0.65 0.2 250)", badge: "Project Owner", icon: SlidersHorizontal,
    steps: [
      { title: "Your Project Workspace", description: "This is your home. Every project you own or manage lives here. Switch between them instantly.", highlight: "Project list on the left sidebar", icon: FolderOpen },
      { title: "Live Map Overview", description: "See all active zones and your team's live positions plotted in real time across the operation area.", highlight: "Map panel with zone overlays", icon: Map },
      { title: "Team Management", description: "Review your team leaders, their assigned zones, and how their teams are performing right now.", highlight: "Teams tab in the top nav", icon: Users },
      { title: "Analytics Dashboard", description: "Submission counts, coverage percentages, and task completion — all updating live as your teams work.", highlight: "Analytics panel on the right", icon: BarChart3 },
    ],
  },
  teamleader: {
    label: "Team Leader", color: "oklch(0.75 0.18 65)", badge: "Squad Coordinator", icon: Target,
    steps: [
      { title: "Your Team Overview", description: "See every member of your squad — who's active, where they are, and how many tasks each has remaining.", highlight: "Team members list", icon: Users },
      { title: "Task Assignment Panel", description: "Drag and drop tasks to assign them, or use group mode to designate one member to submit on behalf of the team.", highlight: "Task board in the centre", icon: ListChecks },
      { title: "Live Map View", description: "Watch your team's movement in real time. Spot if anyone is outside their zone or too far from a task location.", highlight: "Map with member pins", icon: Map },
      { title: "Notifications & Alerts", description: "Receive instant alerts when members complete tasks, flag issues, or request assistance from the field.", highlight: "Alert bell in the top bar", icon: Bell },
    ],
  },
  fieldworker: {
    label: "Field Worker", color: "oklch(0.7 0.18 160)", badge: "On the Ground", icon: Smartphone,
    steps: [
      { title: "Start Your Session", description: "Tap Start Session to check in for your shift. Your GPS begins sharing with your team leader and teammates.", highlight: "Start Session button", icon: Activity },
      { title: "Your Task List", description: "All tasks assigned to you appear here, sorted by priority. Tap any task to see full details and instructions.", highlight: "Tasks panel", icon: ListChecks },
      { title: "Your Map", description: "See your current location, your assigned zone, and nearby teammates — all updating in real time.", highlight: "Map tab", icon: Map },
      { title: "Fill & Submit a Form", description: "Complete each form step by step. Save drafts if you lose connection — it syncs automatically when you're back online.", highlight: "Forms tab", icon: FileText },
    ],
  },
};

export default function GuidedDemo() {
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoActive, setDemoActive] = useState(false);
  const { ref, inView } = useInView(0.15);

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
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Pick your role.<br className="hidden sm:block" /> See your experience.</h2>
          <p className="mt-4 text-[oklch(0.55_0_0)] max-w-lg mx-auto">Select how you&apos;ll use FieldSync and get a guided walkthrough of exactly what you&apos;ll see and do.</p>
        </div>

        {!demoActive && (
          <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto" style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "opacity 0.6s, transform 0.6s" }}>
            {(Object.entries(demoConfigs) as [DemoRole, DemoConfig][]).map(([key, cfg], i) => {
              const CIcon = cfg.icon;
              return (
                <button key={key} onClick={() => startDemo(key)} className="group relative rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] p-7 flex flex-col items-center text-center hover:border-[oklch(0.38_0.01_260)] transition-all duration-300 hover:-translate-y-1 cursor-pointer">
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
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: cfg.color }}><Play className="w-3.5 h-3.5" /> Start guided tour</div>
                </button>
              );
            })}
          </div>
        )}

        {demoActive && config && step && StepIcon && (
          <div className="max-w-4xl mx-auto">
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
              <button onClick={exitDemo} className="flex items-center gap-1.5 text-xs text-[oklch(0.48_0_0)] hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-[oklch(0.22_0.01_260)] hover:border-[oklch(0.35_0.01_260)]"><X className="w-3.5 h-3.5" /> Exit tour</button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {config.steps.map((_, i) => (
                <button key={i} onClick={() => setCurrentStep(i)} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === currentStep ? "2.5rem" : "1rem", background: i <= currentStep ? config.color : "oklch(0.22 0.01 260)" }} />
              ))}
              <span className="ml-2 text-xs text-[oklch(0.45_0_0)] font-mono">{currentStep + 1}/{totalSteps}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-2 rounded-2xl border p-7 flex flex-col" style={{ borderColor: `${config.color}20`, background: `${config.color}06` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${config.color}12`, border: `1px solid ${config.color}20` }}>
                  <StepIcon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div className="text-xs font-bold font-mono mb-2" style={{ color: config.color }}>STEP {currentStep + 1} OF {totalSteps}</div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[oklch(0.58_0_0)] leading-relaxed flex-1">{step.description}</p>
                <div className="mt-5 pt-5 border-t flex items-center gap-2" style={{ borderColor: `${config.color}15` }}>
                  <Crosshair className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                  <p className="text-xs text-[oklch(0.55_0_0)]"><span className="font-semibold text-white">Look for:</span> {step.highlight}</p>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[oklch(0.28_0.01_260)] text-white disabled:opacity-30 hover:bg-[oklch(0.16_0.01_260)] transition-all">Back</button>
                  {currentStep < totalSteps - 1 ? (
                    <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5" style={{ background: config.color, color: "oklch(0.10 0 0)", boxShadow: `0 4px 16px ${config.color}30` }}>Next step</button>
                  ) : (
                    <Link href="/register" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all hover:-translate-y-0.5" style={{ background: config.color, color: "oklch(0.10 0 0)", boxShadow: `0 4px 16px ${config.color}30` }}>Get started &rarr;</Link>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 rounded-2xl border border-[oklch(0.22_0.01_260)] bg-[oklch(0.12_0.01_260)] overflow-hidden">
                <div className="bg-[oklch(0.10_0.01_260)] px-4 py-2 flex items-center gap-2 border-b border-[oklch(0.18_0.01_260)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.5_0.2_25)]" /><div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.75_0.18_65)]" /><div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.18_160)]" />
                  <div className="ml-2 flex-1 bg-[oklch(0.15_0.01_260)] rounded px-2 py-0.5 text-[10px] text-[oklch(0.38_0_0)] font-mono">app.fieldsync.io/{selectedRole}</div>
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.color }} /><span className="text-[9px] font-medium" style={{ color: config.color }}>LIVE</span></div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex gap-3 h-52">
                    <div className="w-10 bg-[oklch(0.10_0.01_260)] rounded-xl p-2 flex flex-col items-center gap-2.5">
                      {[FolderOpen, Map, Users, BarChart3, Bell].map((SIcon, si) => (
                        <div key={si} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: si === currentStep % 5 ? `${config.color}20` : "transparent", border: si === currentStep % 5 ? `1px solid ${config.color}30` : "1px solid transparent" }}>
                          <SIcon className="w-3 h-3" style={{ color: si === currentStep % 5 ? config.color : "oklch(0.35 0 0)" }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 rounded-xl bg-[oklch(0.10_0.01_260)] p-4 space-y-3 overflow-hidden">
                      <div className="flex items-center justify-between"><div className="h-3 w-28 rounded-full bg-[oklch(0.22_0.01_260)]" /><div className="h-3 w-16 rounded-full" style={{ background: `${config.color}25` }} /></div>
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="h-10 rounded-lg border flex items-center gap-3 px-3 transition-all duration-500" style={{ borderColor: row === currentStep % 3 + 1 ? `${config.color}30` : "oklch(0.18 0.01 260)", background: row === currentStep % 3 + 1 ? `${config.color}06` : "oklch(0.13 0.01 260)" }}>
                          <div className="w-5 h-5 rounded-md" style={{ background: row === currentStep % 3 + 1 ? `${config.color}20` : "oklch(0.22 0.01 260)" }} />
                          <div className="flex-1 space-y-1"><div className="h-2 rounded-full" style={{ width: `${60 + row * 12}%`, background: row === currentStep % 3 + 1 ? `${config.color}30` : "oklch(0.22 0.01 260)" }} /><div className="h-1.5 rounded-full w-2/5 bg-[oklch(0.18_0.01_260)]" /></div>
                          {row === currentStep % 3 + 1 && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: config.color }} />}
                        </div>
                      ))}
                      <div className="h-14 rounded-lg border border-[oklch(0.18_0.01_260)] bg-[oklch(0.11_0.01_260)] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${config.color} 1px, transparent 1px), linear-gradient(90deg, ${config.color} 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
                        {[{ x: "25%", y: "40%" }, { x: "55%", y: "60%" }, { x: "70%", y: "30%" }].map((pos, pi) => (
                          <div key={pi} className="absolute w-2 h-2 rounded-full" style={{ left: pos.x, top: pos.y, background: config.color, boxShadow: `0 0 6px ${config.color}`, animation: `ping ${1.5 + pi * 0.3}s ease-in-out infinite`, animationDelay: `${pi * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border" style={{ borderColor: `${config.color}20`, background: `${config.color}06` }}>
                    <Crosshair className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                    <p className="text-xs text-[oklch(0.6_0_0)]"><span className="font-semibold" style={{ color: config.color }}>Highlighted:</span> {step.highlight}</p>
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
