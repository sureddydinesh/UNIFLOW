import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Timer, 
  GraduationCap, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  AlertCircle,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductShowcaseProps {
  onExploreDemo: () => void;
  onGoToRegister: () => void;
  initialTab?: string;
}

export type MainProductModuleId = 
  | 'habit_tracker'
  | 'focus_pomodoro'
  | 'academic_progress'
  | 'timetable_calendar'
  | 'assignments'
  | 'money_manager';

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  onExploreDemo,
  onGoToRegister,
  initialTab = 'habit_tracker',
}) => {
  // Map any incoming tab ID or default to habit_tracker
  const normalizeTab = (tab: string): MainProductModuleId => {
    if (tab === 'habits' || tab === 'habits_focus' || tab === 'habit_tracker') return 'habit_tracker';
    if (tab === 'focus' || tab === 'focus_pomodoro') return 'focus_pomodoro';
    if (tab === 'academics' || tab === 'academic_progress' || tab === 'notes') return 'academic_progress';
    if (tab === 'timetable' || tab === 'calendar' || tab === 'timetable_calendar') return 'timetable_calendar';
    if (tab === 'assignments') return 'assignments';
    if (tab === 'money' || tab === 'finance' || tab === 'money_manager') return 'money_manager';
    return 'habit_tracker';
  };

  const [activeTab, setActiveTab] = useState<MainProductModuleId>(normalizeTab(initialTab));
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab && initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(normalizeTab(initialTab));
  }

  // Public interactive focus timer (Isolated strictly to client state, zero database impact)
  const [demoTimerSeconds, setDemoTimerSeconds] = useState(25 * 60);
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);

  useEffect(() => {
    if (!demoTimerRunning) return;
    const interval = setInterval(() => {
      setDemoTimerSeconds((prev) => {
        if (prev <= 1) {
          setDemoTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [demoTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Exact 6 Modules in the exact order requested:
  // 1. Habit Tracker
  // 2. Focus Pomodoro
  // 3. Academic Progress
  // 4. Timetable & Calendar
  // 5. Assignments
  // 6. Money Manager
  const modules: {
    id: MainProductModuleId;
    label: string;
    icon: React.ElementType;
    badge: string;
    accentColor: string;
  }[] = [
    {
      id: 'habit_tracker',
      label: 'HABIT TRACKER',
      icon: Flame,
      badge: 'Routines',
      accentColor: '#EC4899',
    },
    {
      id: 'focus_pomodoro',
      label: 'FOCUS POMODORO',
      icon: Timer,
      badge: 'Flow State',
      accentColor: '#85DFFF',
    },
    {
      id: 'academic_progress',
      label: 'ACADEMIC PROGRESS',
      icon: GraduationCap,
      badge: 'Milestones',
      accentColor: '#7197FF',
    },
    {
      id: 'timetable_calendar',
      label: 'TIMETABLE & CALENDAR',
      icon: Calendar,
      badge: 'Schedule',
      accentColor: '#C9B9FF',
    },
    {
      id: 'assignments',
      label: 'ASSIGNMENTS',
      icon: CheckSquare,
      badge: 'Deadlines',
      accentColor: '#9471FF',
    },
    {
      id: 'money_manager',
      label: 'MONEY MANAGER',
      icon: DollarSign,
      badge: 'Finance ₹',
      accentColor: '#34D399',
    },
  ];

  return (
    <section id="showcase" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-atmos-purple/10 blur-[150px] pointer-events-none -z-10" />

      {/* Section Header */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-purple/15 border border-atmos-purple/25 text-atmos-lavender text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-atmos-cyan" />
          <span>Product Experience</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
          Everything connected.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-atmos-purple via-atmos-periwinkle to-atmos-cyan">
            Nothing overlooked.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-atmos-muted max-w-2xl mx-auto leading-relaxed">
          Switch between six integrated student modules engineered to unify your daily habits, study focus, coursework deadlines, and finances into one flow.
        </p>
      </motion.div>

      {/* Responsive 6-Module Tab Selector with Hover Highlighting */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        role="tablist"
        aria-label="UniFlow Product Modules"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-8 w-full"
      >
        {modules.map((m) => {
          const Icon = m.icon;
          const isSelected = activeTab === m.id;

          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${m.id}`}
              id={`tab-${m.id}`}
              onClick={() => setActiveTab(m.id)}
              className={`group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer outline-none relative overflow-hidden select-none focus-visible:ring-2 focus-visible:ring-atmos-purple focus-visible:ring-offset-2 focus-visible:ring-offset-atmos-navy ${
                isSelected
                  ? 'bg-gradient-to-b from-atmos-indigo/95 to-atmos-navy border-atmos-purple shadow-atmos-glow -translate-y-1'
                  : 'bg-atmos-navy/85 hover:bg-atmos-indigo/80 border-white/10 hover:border-atmos-purple/60 hover:shadow-atmos-card-hover hover:-translate-y-1'
              }`}
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-200"
                style={{
                  background: `linear-gradient(90deg, ${m.accentColor}, transparent)`,
                  opacity: isSelected ? 1 : 0,
                }}
              />

              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `${m.accentColor}18`,
                  color: m.accentColor,
                  border: isSelected ? `1px solid ${m.accentColor}40` : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>

              <span
                className={`font-heading font-bold text-[11px] sm:text-xs tracking-tight transition-colors duration-200 line-clamp-1 ${
                  isSelected ? 'text-white' : 'text-atmos-muted group-hover:text-white'
                }`}
              >
                {m.label}
              </span>

              <span
                className="text-[9px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full border transition-colors duration-200"
                style={{
                  backgroundColor: isSelected ? `${m.accentColor}20` : 'rgba(255,255,255,0.04)',
                  color: isSelected ? m.accentColor : '#8E8AA8',
                  borderColor: isSelected ? `${m.accentColor}40` : 'transparent',
                }}
              >
                {m.badge}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Interactive Workspace Preview Window (Stable Height Container) */}
      <motion.div 
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl bg-atmos-navy/95 border border-white/15 shadow-2xl backdrop-blur-2xl overflow-hidden relative min-h-[460px] flex flex-col justify-between"
      >
        {/* Window Chrome Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-atmos-muted ml-3 hidden sm:inline">
              uniflow.app/{activeTab} • Student Life OS Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-custom/15 border border-emerald-custom/25 text-[11px] font-semibold text-emerald-custom">
              <span className="w-2 h-2 rounded-full bg-emerald-custom animate-pulse" />
              Interactive Preview
            </span>
            <button
              type="button"
              onClick={onExploreDemo}
              className="text-xs font-semibold text-atmos-cyan hover:text-white flex items-center gap-1 transition-colors outline-none focus-visible:underline"
            >
              <span>Open in Full Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Module Content Panel */}
        <div 
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col justify-center"
        >
          <AnimatePresence mode="wait">
            {/* MODULE 1: HABIT TRACKER */}
            {activeTab === 'habit_tracker' && (
              <motion.div
                key="habit_tracker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Daily Discipline</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Build Lasting Daily Routines
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    Track daily study habits, measurable routines, and consistency scores with GitHub-style annual heatmaps that keep your momentum relentless.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Daily habits completed: 8 of 8 today</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Weekly consistency: 94% on target</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Current streak: 14 consecutive days 🔥</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Test Habit Tracker in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Daily Habits Checklist Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                        Today&apos;s Checklist
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-custom/15 text-emerald-custom font-semibold">
                        All Completed
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {[
                        { title: 'Leetcode / Algorithm Practice', time: '45 mins' },
                        { title: 'Textbook Reading (20 pages)', time: '30 mins' },
                        { title: 'Daily Workout & Hydration', time: 'Goal Met' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-white font-medium">{item.title}</span>
                          <span className="text-[10px] font-semibold text-emerald-custom flex items-center gap-1">
                            <Check className="w-3 h-3" /> {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Routine Consistency & Heatmap Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">
                          Weekly Consistency
                        </span>
                        <span className="text-sm font-mono font-bold text-pink-400">
                          14-Day Streak 🔥
                        </span>
                      </div>
                      <p className="text-[11px] text-atmos-muted">
                        Visual activity heatmap across the past 2 weeks:
                      </p>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="grid grid-cols-7 gap-1.5 py-1">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="text-center">
                          <div
                            className="w-full aspect-square rounded-md bg-pink-500 transition-colors"
                            style={{ opacity: 0.45 + (idx % 4) * 0.18 }}
                            title={`Day ${idx + 1}: Habits completed`}
                          />
                          <span className="text-[9px] text-atmos-muted block mt-1">{day}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-atmos-muted">
                      <span>Completion Score</span>
                      <span className="font-bold text-emerald-custom">94% Monthly Rate</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 2: FOCUS POMODORO */}
            {activeTab === 'focus_pomodoro' && (
              <motion.div
                key="focus_pomodoro"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-cyan/15 border border-atmos-cyan/30 text-atmos-cyan text-xs font-bold uppercase tracking-wider">
                    <Timer className="w-3.5 h-3.5" />
                    <span>Deep Study Sprint</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Distraction-Free Focus Timer
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    Customizable Pomodoro cycles and flexible Open Focus sessions. Run timed study intervals with ambient sound and clean session tracking.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>25m / 5m customizable study cycles</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Full screen ambient flow mode</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Session progress and cycle indicators</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-atmos-cyan/20 hover:bg-atmos-cyan/30 text-atmos-cyan border border-atmos-cyan/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Open Focus Suite in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Interactive Demo Focus Timer Card */}
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-4 flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* Subtle Circular Progress Indicator */}
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="#85DFFF"
                          strokeWidth="6"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * (25 * 60 - demoTimerSeconds)) / (25 * 60)}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black font-mono tracking-tight text-white">
                          {formatTimer(demoTimerSeconds)}
                        </span>
                        <span className="text-[10px] text-atmos-cyan font-bold uppercase tracking-wider">
                          {demoTimerRunning ? 'In Flow' : 'Ready'}
                        </span>
                      </div>
                    </div>

                    {/* Safe Demo Timer Controls */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDemoTimerRunning((prev) => !prev)}
                        className="px-4 py-1.5 rounded-xl bg-atmos-cyan text-atmos-navy font-bold text-xs shadow-atmos-glow flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                      >
                        {demoTimerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Start Timer
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDemoTimerRunning(false);
                          setDemoTimerSeconds(25 * 60);
                        }}
                        className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors"
                        title="Reset demo timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Focus Session Progress Stats Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">
                          Focus-Session Progress
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-atmos-cyan/15 text-atmos-cyan font-semibold">
                          Sprint 3 of 4
                        </span>
                      </div>
                      <p className="text-xs text-atmos-muted leading-relaxed">
                        Today&apos;s logged focus time: <span className="font-bold text-white">3.5 Hours</span> across completed study cycles.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] text-atmos-muted">
                        <span>Cycle 1 (25m)</span>
                        <span className="text-emerald-custom font-semibold">Completed ✓</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-atmos-muted">
                        <span>Cycle 2 (25m)</span>
                        <span className="text-emerald-custom font-semibold">Completed ✓</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-atmos-muted">
                        <span>Cycle 3 (25m)</span>
                        <span className="text-atmos-cyan font-semibold">Current Active</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-atmos-muted">
                        <span>Cycle 4 (Long break 15m)</span>
                        <span className="text-atmos-muted">Upcoming</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-atmos-muted">
                      <span>Ambient Mode</span>
                      <span className="text-atmos-cyan font-semibold">Lo-Fi Rain Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 3: ACADEMIC PROGRESS */}
            {activeTab === 'academic_progress' && (
              <motion.div
                key="academic_progress"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-periwinkle/15 border border-atmos-periwinkle/30 text-atmos-periwinkle text-xs font-bold uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Academic Trajectory</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Overall Academic Progress
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    Track overall semester curriculum completion, assessment performance indicators, and target feasibility before final examination periods.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Curriculum completion progress: 82%</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Assessments tracked: 4 of 6 completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Target benchmark: On track</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-atmos-periwinkle/20 hover:bg-atmos-periwinkle/30 text-atmos-periwinkle border border-atmos-periwinkle/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>View Academic Analyzer in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Overall Curriculum Progress Bar Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-atmos-periwinkle uppercase tracking-wider">
                        Curriculum Progress
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        82% Completed
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-atmos-purple to-atmos-periwinkle rounded-full w-[82%]" />
                    </div>
                    <p className="text-[11px] text-atmos-muted leading-relaxed">
                      Illustrative semester benchmark based on continuous module checkpoints and lab assignments.
                    </p>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs">
                      <span className="text-atmos-muted">Assessment Feasibility</span>
                      <span className="font-bold text-emerald-custom">Benchmark Met</span>
                    </div>
                  </div>

                  {/* Assessment Indicators Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Study Progress Indicators
                    </span>
                    <div className="space-y-2 text-xs">
                      {[
                        { title: 'Core Lecture Modules', progress: '88%', status: 'Complete' },
                        { title: 'Practical Lab Reports', progress: '85%', status: 'On Track' },
                        { title: 'Mid-Term Checkpoints', progress: '92%', status: 'Achieved' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                          <span className="text-white font-medium">{item.title}</span>
                          <span className="font-mono font-bold text-atmos-cyan">{item.progress}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-atmos-muted pt-1">
                      * Illustrative sample values for preview demonstration.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 4: TIMETABLE & CALENDAR */}
            {activeTab === 'timetable_calendar' && (
              <motion.div
                key="timetable_calendar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-lavender/15 border border-atmos-lavender/30 text-atmos-lavender text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Weekly Grid</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Timetable & Schedule Matrix
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    View upcoming lectures, recurring campus slots, and classroom tags. Intelligent conflict detection prevents overlapping exam and study commitments.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Weekly visual recurrence grid</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Lecture room tags & timing alerts</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Zero timetable clash verification</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-atmos-lavender/20 hover:bg-atmos-lavender/30 text-atmos-lavender border border-atmos-lavender/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Open Timetable in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Today's Upcoming Schedule Events */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-atmos-lavender uppercase tracking-wider">
                        Upcoming Schedule
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-atmos-cyan/15 text-atmos-cyan font-semibold">
                        Today
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>Lecture Slot A</span>
                          <span className="text-atmos-cyan font-mono">10:00 – 11:30 AM</span>
                        </div>
                        <p className="text-[11px] text-atmos-muted">Academic Hall 4B • Campus East</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>Laboratory Session</span>
                          <span className="text-atmos-lavender font-mono">14:00 – 16:00 PM</span>
                        </div>
                        <p className="text-[11px] text-atmos-muted">Computing Lab 2 • Workstations</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Calendar Preview & Conflict Monitor */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">
                          Conflict Monitor
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-custom/15 text-emerald-custom font-semibold">
                          Zero Clashes
                        </span>
                      </div>
                      <p className="text-xs text-atmos-muted leading-relaxed">
                        Automatic schedule conflict detection continuously checks lecture recurrences against submission dates.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5 text-xs text-emerald-custom">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>All enrolled timeslots conflict-free.</span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-atmos-muted">
                      <span>Weekly Load</span>
                      <span className="font-bold text-white">18 Hours Scheduled</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 5: ASSIGNMENTS (Strictly Generic, No Subject Names) */}
            {activeTab === 'assignments' && (
              <motion.div
                key="assignments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-purple/15 border border-atmos-purple/30 text-atmos-purple text-xs font-bold uppercase tracking-wider">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Task Manager</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Assignment Completion
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    Track pending tasks, break down complex milestones into step-by-step checklists, and manage upcoming deadlines with zero confusion.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Assignment progress: 3 of 4 tasks completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Pending task count: 3 active in priority queue</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Upcoming deadlines: 1 due soon (48 hours left)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-atmos-purple/20 hover:bg-atmos-purple/30 text-atmos-purple border border-atmos-purple/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Manage Tasks in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Generic Assignment Progress Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-atmos-purple uppercase tracking-wider">
                        Assignment Progress
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-semibold">
                        Due Soon
                      </span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">
                        Project Report & Submission
                      </h4>
                      <p className="text-xs text-atmos-muted mt-0.5">
                        Priority Queue • 3 of 4 tasks completed
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-atmos-muted">
                        <span>Checklist Progress</span>
                        <span className="font-bold text-atmos-purple">75%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-atmos-purple rounded-full w-3/4" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-atmos-muted">
                      <span>Remaining Tasks</span>
                      <span className="font-semibold text-white">1 Final Task</span>
                    </div>
                  </div>

                  {/* Pending Tasks & Upcoming Deadlines Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Pending Task Count
                      </span>
                      <span className="text-xs font-mono font-bold text-atmos-cyan">
                        3 In Queue
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {[
                        { title: 'Milestone 1: Research & Outline', status: 'Completed', done: true },
                        { title: 'Milestone 2: Implementation & Tests', status: 'Completed', done: true },
                        { title: 'Milestone 3: Technical Documentation', status: 'Completed', done: true },
                        { title: 'Milestone 4: Final Submission Review', status: 'Due Soon', done: false },
                      ].map((task, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                          <span className={task.done ? 'text-atmos-muted line-through' : 'text-white font-medium'}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] font-bold ${task.done ? 'text-emerald-custom' : 'text-rose-400'}`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODULE 6: MONEY MANAGER */}
            {activeTab === 'money_manager' && (
              <motion.div
                key="money_manager"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-custom/15 border border-emerald-custom/30 text-emerald-custom text-xs font-bold uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Personal Finance</span>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Monthly Budget & Spending
                  </h3>
                  <p className="text-xs sm:text-sm text-atmos-muted leading-relaxed">
                    Designed for student allowances in Indian Rupees (₹). Categorize everyday food, books, and transit expenses with threshold alert safeguards.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Monthly allowance: ₹8,500 limit</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Current spending: ₹5,240 (61% used)</span>
                    </div>
                    <div className="flex items-center gap-2 text-atmos-white">
                      <Check className="w-4 h-4 text-emerald-custom shrink-0" />
                      <span>Remaining budget: ₹3,260 (Safe pace)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreDemo}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-custom/20 hover:bg-emerald-custom/30 text-emerald-custom border border-emerald-custom/35 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>View Budget Ledger in Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Budget Progress Gauge Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-custom uppercase tracking-wider">
                        Budget Progress
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-custom/15 text-emerald-custom font-semibold">
                        Safe Pace
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-white">
                        ₹5,240
                      </span>
                      <span className="text-xs text-atmos-muted">
                        of ₹8,500 monthly limit
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-custom rounded-full w-[61%]" />
                    </div>
                    <div className="flex justify-between text-xs text-atmos-muted">
                      <span>Remaining to spend</span>
                      <span className="font-mono font-bold text-white">₹3,260</span>
                    </div>
                  </div>

                  {/* Spending Summary & Savings Progress Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Spending Summary (INR ₹)
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-white">Cafeteria Meals</span>
                        <span className="font-mono text-rose-400 font-bold">-₹180</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-white">Course Books & Xerox</span>
                        <span className="font-mono text-rose-400 font-bold">-₹320</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/[0.02]">
                        <span className="text-white">Metro & Transit</span>
                        <span className="font-mono text-rose-400 font-bold">-₹500</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs">
                      <span className="text-atmos-muted">Savings Goal: Tech Fund</span>
                      <span className="font-mono font-bold text-emerald-custom">₹18,500 / ₹32,000</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
};
