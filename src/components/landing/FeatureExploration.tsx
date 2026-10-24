import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  Flame, 
  Timer, 
  Sparkles, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useMotionValueEvent, 
  useReducedMotion 
} from 'motion/react';

interface FeatureExplorationProps {
  onExploreDemo: () => void;
}

export const FeatureExploration: React.FC<FeatureExplorationProps> = ({ onExploreDemo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [selectedFeature, setSelectedFeature] = useState(0);

  // Dedicated scroll runway for Desktop showcase
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Synchronize scroll position with active feature without unnecessary re-renders
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Only drive feature selection via scroll on desktop where runway is active
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // 5 distinct segments across the runway: [0..0.2), [0.2..0.4), [0.4..0.6), [0.6..0.8), [0.8..1.0]
      const step = Math.min(4, Math.max(0, Math.floor(latest * 5)));
      if (step !== selectedFeature) {
        setSelectedFeature(step);
      }
    }
  });

  const handleSelectFeature = (idx: number) => {
    setSelectedFeature(idx);
    if (containerRef.current && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const containerTop = rect.top + scrollTop;
      const totalScroll = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScroll > 0) {
        const targetScroll = containerTop + ((idx + 0.5) / 5) * totalScroll;
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }
    }
  };

  const featureGroups = [
    {
      id: 'academics',
      title: 'Organize Academic Life',
      badge: 'Academics & CGPA',
      icon: GraduationCap,
      color: '#7197FF',
      headline: 'Semester forecasting that keeps your degree on track',
      desc: 'Log enrolled subjects, track continuous assessment test (CAT) marks, compute weighted GPAs, and visualize target grade feasibility before exam week.',
      highlights: [
        'Automatic SGPA & CGPA predictive calculation',
        'Subject syllabus breakdown and weight distributions',
        'Direct linkage between courses, lectures, and exams',
      ],
      previewStats: [
        { label: 'Current CGPA', value: '8.42' },
        { label: 'Target Feasibility', value: 'Achievable' },
        { label: 'Active Courses', value: '5 Modules' },
      ],
      metricsList: [
        { name: 'CAT-1 Continuous Assessment', score: '92%', status: 'Secured' },
        { name: 'CAT-2 Midterm Evaluation', score: '88%', status: 'Secured' },
        { name: 'Lab Practical & Viva', score: '95%', status: 'High Distinction' },
      ],
    },
    {
      id: 'schedules',
      title: 'Manage Schedules & Deadlines',
      badge: 'Calendar & Matrix',
      icon: Calendar,
      color: '#85DFFF',
      headline: 'A weekly timetable grid engineered for university lectures',
      desc: 'Set recurring class schedules, lab rooms, assignment due dates, and exam dates. UniFlow warns you immediately if a lecture conflicts with coursework deadlines.',
      highlights: [
        'Multi-day visual schedule grid with lecture recurrence',
        'Urgent priority countdowns and subtask checklists',
        'One-click calendar event generation from assignments',
      ],
      previewStats: [
        { label: 'Classes / Week', value: '18 Hours' },
        { label: 'Pending Deadlines', value: '3 Active' },
        { label: 'Conflict Status', value: 'Zero Clashes' },
      ],
      metricsList: [
        { name: '09:30 AM • OS Lab (Room 304)', score: 'Mon, Wed', status: 'Attendance 96%' },
        { name: '11:15 AM • Advanced Algorithms', score: 'Tue, Thu', status: 'Attendance 92%' },
        { name: '02:00 PM • Database Architecture', score: 'Friday', status: 'Attendance 100%' },
      ],
    },
    {
      id: 'spending',
      title: 'Understand Personal Spending',
      badge: 'Finance & INR ₹',
      icon: DollarSign,
      color: '#34D399',
      headline: 'Student allowance management with threshold warning alerts',
      desc: 'Keep track of cafeteria food expenses, xerox notes, metro transit, and hostel costs in Indian Rupees (₹). Receive gentle visual warnings at 80% and 100% of your monthly limit.',
      highlights: [
        'Categorical breakdown (Food, Books, Transit, Entertainment)',
        'Monthly budget pacing with safe daily spending estimates',
        'Savings goals tracker with visual target progress',
      ],
      previewStats: [
        { label: 'Monthly Budget', value: '₹8,500' },
        { label: 'Spent to Date', value: '₹5,240' },
        { label: 'Budget Status', value: 'Safe Pace' },
      ],
      metricsList: [
        { name: 'Cafeteria & Lunch Meals', score: '-₹180', status: 'Daily Meal' },
        { name: 'Course Books & Xerox Notes', score: '-₹320', status: 'Academic' },
        { name: 'Campus Metro & Transit', score: '-₹500', status: 'Pass Reload' },
      ],
    },
    {
      id: 'habits',
      title: 'Build Productive Habits',
      badge: 'Routines & Discipline',
      icon: Flame,
      color: '#EC4899',
      headline: 'Measurable daily routines with GitHub-style heatmaps',
      desc: 'Form lasting academic routines. Track measurable goals like coding 45 minutes, reading 20 textbook pages, or drinking 2 liters of water, backed by routine streaks.',
      highlights: [
        'Custom frequency targets (Daily, Weekdays, Weekly)',
        'GitHub-style visual heatmap of annual consistency',
        'Archive and restore habits without losing past streak data',
      ],
      previewStats: [
        { label: 'Current Streak', value: '14 Days' },
        { label: 'Completion Rate', value: '94%' },
        { label: 'Active Habits', value: '8 Routines' },
      ],
      metricsList: [
        { name: 'Deep Coding Sprint (45 mins)', score: 'Done', status: 'Streak Day 14' },
        { name: 'Read 20 Textbook Pages', score: 'Done', status: 'Streak Day 8' },
        { name: 'Evening Lecture Recap', score: 'Pending', status: 'Due 09:00 PM' },
      ],
    },
    {
      id: 'focus',
      title: 'Protect Focused Study Time',
      badge: 'Deep Work & Pomodoro',
      icon: Timer,
      color: '#9471FF',
      headline: 'Distraction-free timer synchronized with course tasks',
      desc: 'Enter deep flow with customizable Pomodoro cycles (25/5, 50/10) or flexible Open Focus sprints. Link every timer session to a specific subject to see where your hours go.',
      highlights: [
        'Customizable focus intervals and short/long break timers',
        'Subject-tagged study logs for deep semester reflection',
        'Distraction-free ambient fullscreen study environment',
      ],
      previewStats: [
        { label: 'Focus Today', value: '3.5 Hours' },
        { label: 'Cycles Done', value: '6 Sprints' },
        { label: 'Primary Focus', value: 'Core Modules' },
      ],
      metricsList: [
        { name: 'Sprint 1: Operating Systems', score: '50 mins', status: 'Completed' },
        { name: 'Sprint 2: Algorithm Problem Set', score: '50 mins', status: 'Completed' },
        { name: 'Sprint 3: Database Revision', score: '25 mins', status: 'Active Sprint' },
      ],
    },
  ];

  const current = featureGroups[selectedFeature];
  const CurrentIcon = current.icon;

  return (
    <section 
      id="features" 
      ref={containerRef}
      className="scroll-mt-24 sm:scroll-mt-28 relative w-full h-auto lg:h-[260vh] bg-atmos-navy text-atmos-white selection:bg-atmos-purple/30"
    >
      {/* Subtle Ambient Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(148,113,255,0.08),transparent_70%)] pointer-events-none -z-10" />

      {/* STICKY CINEMATIC SHOWCASE REGION (Pinned during scroll on Desktop, normal flow on Mobile) */}
      <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-6.5rem)] w-full flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-periwinkle/15 border border-atmos-periwinkle/25 text-atmos-periwinkle text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-atmos-cyan" />
            <span>Interactive Deep Dive</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
            Purpose-built for student reality.
          </h2>
          <p className="text-xs sm:text-sm text-atmos-muted max-w-xl mx-auto leading-relaxed">
            Explore how each interconnected module eliminates scattered apps and brings cognitive clarity to university life.
          </p>
        </div>

        {/* Cinematic Step Progress Indicator */}
        <div className="w-full max-w-4xl mx-auto mb-4 flex items-center justify-between text-xs text-atmos-muted px-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold" style={{ color: current.color }}>
              0{selectedFeature + 1}
            </span>
            <span className="text-white/40">•</span>
            <span className="font-medium text-white/90 truncate max-w-[200px] sm:max-w-none">
              {current.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {featureGroups.map((_, idx) => (
              <div
                key={idx}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: selectedFeature === idx ? '24px' : '8px',
                  backgroundColor: selectedFeature === idx ? current.color : 'rgba(255, 255, 255, 0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Feature Selector Buttons (Hover & Click Supported with Coordinated Scroll) */}
        <div 
          role="tablist"
          aria-label="Student OS Feature Highlights"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6 w-full"
        >
          {featureGroups.map((feat, idx) => {
            const Icon = feat.icon;
            const isSelected = selectedFeature === idx;

            return (
              <button
                key={feat.id}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`feature-panel-${feat.id}`}
                id={`feature-tab-${feat.id}`}
                onClick={() => handleSelectFeature(idx)}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-atmos-purple cursor-pointer select-none hover:-translate-y-1 ${
                  isSelected
                    ? 'bg-gradient-to-b from-atmos-indigo/95 to-atmos-navy border-atmos-purple shadow-atmos-glow -translate-y-1'
                    : 'bg-atmos-navy/85 hover:bg-atmos-indigo/80 border-white/10 hover:border-atmos-purple/60 hover:shadow-atmos-card-hover'
                }`}
                style={{
                  borderColor: isSelected ? feat.color : undefined,
                }}
              >
                {/* Luminous Top Accent Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(90deg, ${feat.color}, transparent)`,
                    opacity: isSelected ? 1 : 0,
                  }}
                />

                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{
                      backgroundColor: `${feat.color}20`,
                      color: feat.color,
                      border: isSelected ? `1px solid ${feat.color}40` : '1px solid transparent',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: isSelected ? feat.color : 'rgba(255,255,255,0.3)' }}
                  >
                    0{idx + 1}
                  </span>
                </div>

                <h4 className={`font-heading font-bold text-xs truncate mb-0.5 transition-colors ${
                  isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  {feat.title}
                </h4>

                <p className="text-[10px] text-atmos-muted truncate">
                  {feat.badge}
                </p>
              </button>
            );
          })}
        </div>

        {/* Feature Panel Display (Stable Dimensions, Coordinated Staggered Entrance) */}
        <div className="relative min-h-[440px] sm:min-h-[460px] lg:flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              role="tabpanel"
              id={`feature-panel-${current.id}`}
              aria-labelledby={`feature-tab-${current.id}`}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-atmos-navy/90 border border-white/15 backdrop-blur-2xl shadow-atmos-card grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full"
            >
              {/* Left Details & Value Proposition */}
              <div className="lg:col-span-7 space-y-5">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: `${current.color}15`,
                    color: current.color,
                    borderColor: `${current.color}35`,
                  }}
                >
                  <CurrentIcon className="w-3.5 h-3.5" />
                  <span>{current.badge}</span>
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-heading text-white tracking-tight leading-snug">
                  {current.headline}
                </h3>

                <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                  {current.desc}
                </p>

                {/* Staggered Highlights List */}
                <div className="space-y-2.5 pt-1">
                  {current.highlights.map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.25 }}
                      className="flex items-center gap-2.5 text-xs text-atmos-white"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${current.color}20`, color: current.color }}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{h}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-atmos-purple to-atmos-periwinkle hover:from-atmos-purple hover:to-atmos-cyan text-white font-bold text-xs shadow-atmos-glow flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Launch in Demo Student</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Metrics & Real-Time Telemetry Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 shadow-atmos-card">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-atmos-muted">
                      Real-Time Telemetry
                    </span>
                    <span 
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${current.color}15`,
                        color: current.color,
                        borderColor: `${current.color}30`,
                      }}
                    >
                      Live Sync
                    </span>
                  </div>

                  {/* 3 Metric Summary Boxes */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {current.previewStats.map((st, i) => (
                      <div key={i} className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                        <p className="text-[10px] text-atmos-muted truncate mb-0.5">{st.label}</p>
                        <p 
                          className="font-heading font-bold text-xs sm:text-sm text-white truncate"
                          style={{ color: i === 0 ? current.color : undefined }}
                        >
                          {st.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Animated Feature Breakdown List */}
                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-atmos-muted/70 block">
                      Active Telemetry Records
                    </span>
                    {current.metricsList.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: current.color }}
                          />
                          <span className="text-white/90 truncate text-[11px] sm:text-xs">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span 
                            className="font-mono font-bold text-[11px]" 
                            style={{ color: current.color }}
                          >
                            {item.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Privacy Sentinel Footer */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-custom shrink-0" />
                    <p className="text-[11px] text-atmos-muted leading-tight">
                      Encrypted local client isolation ensures student records stay private to this device.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
