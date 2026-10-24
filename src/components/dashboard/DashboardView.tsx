import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  MapPin,
  BellRing,
  Timer,
  Flame,
  GraduationCap
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getRemainingTimeString } from '../../utils/formatters';
import { AssignmentModal } from '../common/AssignmentModal';
import { EventModal } from '../common/EventModal';
import { TransactionModal } from '../common/TransactionModal';
import { NavTab } from '../layout/AppLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calculateCategoryExpenses, detectCalendarConflicts } from '../../utils/calculations';
import { calculateDailyHabitSummary } from '../../utils/habitCalculations';
import { calculateFocusStats, formatDurationHuman } from '../../utils/focusCalculations';
import { calculateSemesterAcademicSummary } from '../../utils/academicCalculations';
import { TransactionType } from '../../types';
import { motion } from 'motion/react';
import { 
  fadeUpVariants, 
  staggerContainerVariants, 
  CountUp,
  EASE_PREMIUM 
} from '../../utils/motion';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { 
    profile, 
    events, 
    assignments, 
    transactions, 
    financialSummary, 
    academicSummary,
    toggleAssignmentComplete,
    activeTheme,
    habits,
    habitLogs,
    focusSessions,
    assessments,
    subjects
  } = useApp();

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  // Greeting based on time of day
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');

  const todayStr = new Date().toISOString().split('T')[0];

  // Feature expansion live calculations
  const dailyHabitSummary = calculateDailyHabitSummary(habits, habitLogs, todayStr);
  const focusStats = calculateFocusStats(focusSessions, subjects);
  const semesterAcademic = calculateSemesterAcademicSummary(subjects, assessments);
  const todayEvents = events.filter(e => {
    const evDate = new Date(e.startAt).toISOString().split('T')[0];
    if (evDate === todayStr) return true;
    if (e.isRecurring && e.recurringDays) {
      const todayDayOfWeek = new Date().getDay();
      return e.recurringDays.includes(todayDayOfWeek);
    }
    return false;
  }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Detect any conflicts
  const conflicts = detectCalendarConflicts(todayEvents);

  // Filter upcoming pending assignments (DASH-03)
  const upcomingAssignments = assignments
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 4);

  // Category spending for mini chart
  const categoryExpenses = calculateCategoryExpenses(transactions);
  const COLORS = ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24', '#EC4899', '#A855F7', '#F43F5E'];

  return (
    <motion.div 
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Modals for Quick Actions */}
      <AssignmentModal 
        isOpen={assignmentModalOpen} 
        onClose={() => setAssignmentModalOpen(false)} 
      />
      <EventModal 
        isOpen={eventModalOpen} 
        onClose={() => setEventModalOpen(false)} 
      />
      <TransactionModal 
        isOpen={transactionModalOpen} 
        onClose={() => setTransactionModalOpen(false)} 
        defaultType={transactionType}
      />

      {/* DASH-01: Welcome Banner with subtle ambient gradient & light sweep */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-card to-card border border-border-subtle shadow-card relative overflow-hidden ambient-banner-gradient light-sweep-effect"
      >
        {/* Decorative background blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 right-20 w-32 h-32 rounded-full bg-emerald-custom/5 blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary flex items-center gap-1.5 border border-primary/20">
              <Sparkles className="w-3 h-3" /> {profile?.semester || 'Semester 5'} Active
            </span>
            <span className="text-xs text-text-muted font-medium">
              {formatDate(new Date())}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-main tracking-tight">
            {timeOfDay}, {profile?.fullName?.split(' ')[0] || 'Student'}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md">
            {profile?.university ? `${profile.university} · ${profile.department}` : 'Welcome to your unified academic & financial workspace.'}
          </p>
        </div>

        {/* Quick Actions Shortcuts (DASH-06) */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setAssignmentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary transition-all btn-action"
          >
            <Plus className="w-3.5 h-3.5" /> Assignment
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setEventModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-main text-xs font-semibold flex items-center gap-1.5 transition-all btn-action"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-primary" /> Event
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setTransactionType('expense');
              setTransactionModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-elevated border border-border-subtle hover:border-status-error text-text-main text-xs font-semibold flex items-center gap-1.5 transition-all btn-action"
          >
            <span className="text-status-error font-bold">−</span> Expense
          </motion.button>
        </div>
      </motion.div>

      {/* DASH-08: Priority Alert Banner if urgent items exist */}
      {(academicSummary.dueSoon > 0 || academicSummary.overdue > 0 || financialSummary.isOverBudget || financialSummary.budgetUtilization >= 80) && (
        <motion.div 
          variants={fadeUpVariants}
          className="p-4 rounded-2xl bg-status-warning/10 border border-status-warning/40 text-text-main flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-status-warning/20 text-status-warning flex-shrink-0">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-status-warning flex items-center gap-2">
                Attention Required (Priority Indicators)
              </p>
              <p className="text-text-muted mt-0.5">
                {academicSummary.overdue > 0 && `⚠️ ${academicSummary.overdue} overdue assignment! `}
                {academicSummary.dueSoon > 0 && `⏳ ${academicSummary.dueSoon} assignments due within 48 hours. `}
                {financialSummary.budgetUtilization >= 100 && `🚨 Monthly budget exceeded (${financialSummary.budgetUtilization}%). `}
                {financialSummary.budgetUtilization >= 80 && financialSummary.budgetUtilization < 100 && `⚠️ Spending reached ${financialSummary.budgetUtilization}% of budget. `}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('assignments')}
            className="px-3 py-1.5 rounded-lg bg-status-warning text-black font-semibold hover:bg-amber-400 text-[11px] whitespace-nowrap self-end sm:self-auto transition-colors btn-action"
          >
            Resolve Now
          </motion.button>
        </motion.div>
      )}

      {/* DASH-04 & DASH-05: Consolidated Academic & Financial Summary Cards Grid */}
      <motion.div 
        variants={fadeUpVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Pending Assignments */}
        <div 
          onClick={() => onNavigate('assignments')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden metric-card-accent-violet card-hover"
        >
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending Tasks</span>
            <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-200">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold font-heading text-text-main">
              <CountUp value={academicSummary.totalPending} duration={850} delay={0} />
            </span>
            <span className="text-xs text-text-muted">assignments</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-status-warning/15 text-status-warning font-semibold border border-status-warning/20">
              <CountUp value={academicSummary.dueSoon} duration={800} delay={60} /> Due Soon
            </span>
            {academicSummary.overdue > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-status-error/15 text-status-error font-semibold border border-status-error/20">
                <CountUp value={academicSummary.overdue} duration={800} delay={80} /> Overdue
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Assignment Completion Rate */}
        <div 
          onClick={() => onNavigate('assignments')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden metric-card-accent-emerald card-hover"
        >
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Completion Rate</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-custom/15 text-emerald-custom flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-custom/25 transition-all duration-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold font-heading text-emerald-custom">
              <CountUp value={academicSummary.completionRate} suffix="%" duration={950} delay={80} />
            </span>
            <span className="text-xs text-text-muted">this cohort</span>
          </div>
          <div>
            <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-emerald-custom h-full rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${academicSummary.completionRate}%` }}
                transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.1 }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              <CountUp value={academicSummary.completedThisMonth} duration={850} delay={140} /> completed this month
            </p>
          </div>
        </div>

        {/* Card 3: Monthly Net Cash Flow */}
        <div 
          onClick={() => onNavigate('money')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden metric-card-accent-sky card-hover"
        >
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Net Cash Flow</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500/25 transition-all duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-2xl sm:text-3xl font-extrabold font-heading ${
              financialSummary.netCashFlow >= 0 ? 'text-emerald-custom' : 'text-status-error'
            }`}>
              <CountUp 
                value={financialSummary.netCashFlow} 
                duration={1050}
                delay={160}
                formatter={(v) => formatCurrency(v, profile?.currency)} 
              />
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="text-emerald-custom flex items-center gap-0.5 font-medium">
              +{formatCurrency(financialSummary.income, profile?.currency)}
            </span>
            <span className="text-text-muted">vs</span>
            <span className="text-status-error flex items-center gap-0.5 font-medium">
              -{formatCurrency(financialSummary.expenses, profile?.currency)}
            </span>
          </div>
        </div>

        {/* Card 4: Budget Remaining */}
        <div 
          onClick={() => onNavigate('money')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden metric-card-accent-violet card-hover"
        >
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Remaining Budget</span>
            <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-2xl sm:text-3xl font-extrabold font-heading ${
              financialSummary.remainingBudget >= 0 ? 'text-text-main' : 'text-status-error'
            }`}>
              <CountUp 
                value={financialSummary.remainingBudget} 
                duration={1100}
                delay={240}
                formatter={(v) => formatCurrency(v, profile?.currency)} 
              />
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
              <span>Used: <strong className="text-text-main"><CountUp value={financialSummary.budgetUtilization} suffix="%" duration={950} delay={300} /></strong></span>
              <span>of {formatCurrency(financialSummary.monthlyBudget, profile?.currency)}</span>
            </div>
            <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  financialSummary.budgetUtilization >= 100 
                    ? 'bg-status-error progress-striped' 
                    : financialSummary.budgetUtilization >= 80 
                    ? 'bg-status-warning' 
                    : 'bg-primary'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, financialSummary.budgetUtilization)}%` }}
                transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.15 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Expansion Widgets Row: Habits, Focus & Academic Progress */}
      <motion.div 
        variants={fadeUpVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Widget 1: Habits Today */}
        <div 
          onClick={() => onNavigate('habits')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                Daily Habits
              </span>
              <span className="text-xs font-bold text-violet-400">
                <CountUp value={dailyHabitSummary.completionRate} suffix="% Done" duration={950} delay={120} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black font-heading text-text-main">
                <CountUp value={dailyHabitSummary.completedCount} duration={850} delay={180} /> / {dailyHabitSummary.totalScheduled}
              </span>
              <span className="text-xs text-text-muted">completed today</span>
            </div>
            <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${dailyHabitSummary.completionRate}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <span className="text-text-muted text-[11px]">
              {dailyHabitSummary.remainingCount === 0 ? (
                '🎉 All routines done!'
              ) : (
                <>
                  <CountUp value={dailyHabitSummary.remainingCount} duration={800} delay={220} /> pending
                </>
              )}
            </span>
            <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Habit Tracker <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Widget 2: Focus Mode */}
        <div 
          onClick={() => onNavigate('focus')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-sky-400" />
                Focus Workspace
              </span>
              <span className="text-xs font-bold text-sky-400">
                <CountUp value={focusStats.todaySessionsCount} suffix=" Sprints" duration={900} delay={160} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black font-heading text-text-main">
                <CountUp 
                  value={focusStats.totalFocusTimeTodaySeconds} 
                  duration={1000} 
                  delay={220} 
                  formatter={(s) => formatDurationHuman(s)} 
                />
              </span>
              <span className="text-xs text-text-muted">deep focus today</span>
            </div>
            <p className="text-[11px] text-text-muted line-clamp-1 mb-2">
              {focusStats.todaySessionsCount > 0 
                ? `Logged across ${focusStats.subjectBreakdown.length} enrolled subjects`
                : 'Ready for your next distraction-free sprint'}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <span className="text-text-muted text-[11px]">
              {focusStats.totalFocusTimeWeekSeconds > 0 
                ? `${formatDurationHuman(focusStats.totalFocusTimeWeekSeconds)} this week`
                : 'Pomodoro timer active'}
            </span>
            <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Open Focus <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Widget 3: Academic SGPA */}
        <div 
          onClick={() => onNavigate('academics')}
          className="p-5 rounded-3xl bg-card border border-border-subtle cursor-pointer group shadow-card relative overflow-hidden card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Academic SGPA
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CountUp value={semesterAcademic.totalCredits} suffix=" Credits" duration={950} delay={200} />
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black font-heading text-emerald-600 dark:text-emerald-300 font-mono">
                {semesterAcademic.overallSGPA !== null ? (
                  <CountUp value={semesterAcademic.overallSGPA} decimals={2} duration={1050} delay={280} />
                ) : (
                  'N/A'
                )}
              </span>
              <span className="text-xs text-text-muted">/ 10.0 scale</span>
            </div>
            <p className="text-[11px] text-text-muted line-clamp-1 mb-2">
              {semesterAcademic.strongestSubject 
                ? `Strongest: ${semesterAcademic.strongestSubject.subject.name} (${semesterAcademic.strongestSubject.currentPercentage}%)`
                : 'Evaluate coursework & target feasibility'}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <span className="text-text-muted text-[11px]">
              <CountUp value={semesterAcademic.upcomingAssessments.length} duration={800} delay={320} /> upcoming tests
            </span>
            <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Grade Tracker <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Two-Column Layout */}
      <motion.div 
        variants={fadeUpVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Left 2 Cols: Schedule and Assignments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DASH-02: Today's Schedule */}
          <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-card card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-text-main">
                  Today's Schedule
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-elevated text-text-muted">
                  <CountUp value={todayEvents.length} suffix=" events" delay={120} duration={800} />
                </span>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-elevated/40 border border-dashed border-border-subtle">
                <p className="text-sm font-medium text-text-muted">No classes or events scheduled for today.</p>
                <button
                  onClick={() => setEventModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  + Add a class or study session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((ev) => {
                  const isConflict = conflicts.has(ev.id);
                  const isExam = ev.eventType === 'exam';
                  const isLab = ev.eventType === 'lab';

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl bg-elevated/70 border flex items-start justify-between gap-3 group row-hover cursor-pointer ${
                        isConflict 
                          ? 'border-status-warning/60 bg-status-warning/5 row-conflict' 
                          : 'border-border-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center min-w-[58px] transition-transform duration-200 row-time-badge ${
                          isExam 
                            ? 'bg-status-error/20 text-status-error'
                            : isLab
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          <Clock className="w-3.5 h-3.5 mb-0.5" />
                          <span className="text-[11px] tabular-nums font-semibold">
                            {formatTime(ev.startAt).replace(' ', '')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-text-main">
                              {ev.title}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              isExam 
                                ? 'bg-status-error/20 text-status-error' 
                                : isLab 
                                ? 'bg-sky-500/20 text-sky-400' 
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {ev.eventType}
                            </span>
                            {isConflict && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Overlap
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                            <span>
                              {formatTime(ev.startAt)} – {formatTime(ev.endAt)}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1 text-text-main">
                                <MapPin className="w-3 h-3 text-text-muted" /> {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DASH-03: Urgent & Upcoming Assignments */}
          <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-card card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-text-main">
                  Upcoming Deadlines
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-elevated text-text-muted">
                  <CountUp value={upcomingAssignments.length} suffix=" pending" delay={160} duration={800} />
                </span>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                All Assignments <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAssignments.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-elevated/40 border border-dashed border-border-subtle">
                <p className="text-sm font-medium text-text-muted">All caught up! Zero pending assignments.</p>
                <button
                  onClick={() => setAssignmentModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  + Add new assignment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((asg) => {
                  const remaining = getRemainingTimeString(asg.dueAt, false);
                  const isOverdue = remaining.isOverdue;
                  const isDueSoon = remaining.isDueSoon;

                  return (
                    <div
                      key={asg.id}
                      className={`p-3.5 rounded-2xl bg-elevated/70 border flex items-center justify-between gap-3 group row-hover cursor-pointer ${
                        isOverdue ? 'border-status-error/50 bg-status-error/5 row-overdue' : 'border-border-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Quick complete checkbox with spring feedback */}
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleAssignmentComplete(asg.id)}
                          title="Mark completed"
                          className="w-5 h-5 rounded-lg border border-border-subtle hover:border-primary flex items-center justify-center text-transparent hover:text-primary transition-colors flex-shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-text-main truncate">
                              {asg.title}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              asg.priority === 'high' 
                                ? 'bg-status-error/20 text-status-error'
                                : asg.priority === 'medium'
                                ? 'bg-status-warning/20 text-status-warning'
                                : 'bg-emerald-custom/20 text-emerald-custom'
                            }`}>
                              {asg.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                            <span className={`font-semibold flex items-center gap-1 ${
                              isOverdue 
                                ? 'text-status-error' 
                                : isDueSoon 
                                ? 'text-status-warning' 
                                : 'text-text-muted'
                            }`}>
                              <Clock className="w-3 h-3" /> {remaining.text}
                            </span>
                            <span>Due: {formatDate(asg.dueAt)}</span>
                            {asg.subtasks.length > 0 && (
                              <span>
                                {asg.subtasks.filter(s => s.isCompleted).length}/{asg.subtasks.length} steps
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => toggleAssignmentComplete(asg.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border-subtle hover:bg-emerald-custom hover:text-white hover:border-emerald-custom transition-all whitespace-nowrap btn-action"
                      >
                        Done
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Financial Snapshot & Quick Breakdown */}
        <div className="space-y-6">
          
          {/* DASH-05 / FIN-05: Spending Breakdown Donut Chart with smooth animation */}
          <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-card card-hover">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-lg text-text-main flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-custom" />
                Spending Share
              </h3>
              <button
                onClick={() => onNavigate('money')}
                className="text-xs font-semibold text-primary hover:underline transition-colors"
              >
                Details
              </button>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Monthly expenses categorized by proportion
            </p>

            {categoryExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted bg-elevated/40 rounded-2xl border border-dashed border-border-subtle">
                No expense transactions logged this month.
              </div>
            ) : (
              <div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="amount"
                        isAnimationActive={true}
                        animationDuration={750}
                        animationEasing="ease-out"
                      >
                        {categoryExpenses.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value), profile?.currency)}
                        contentStyle={{ 
                          backgroundColor: activeTheme === 'dark' ? '#182235' : '#FFFFFF',
                          borderColor: activeTheme === 'dark' ? '#30394D' : '#E5E7EF',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: activeTheme === 'dark' ? '#F8FAFC' : '#172033',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {categoryExpenses.slice(0, 4).map((item, idx) => (
                    <div key={item.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                        />
                        <span className="text-text-main capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="font-semibold text-text-muted tabular-nums">
                        {item.percentage}% ({formatCurrency(item.amount, profile?.currency)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Academic Workload Mini-Card */}
          <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-card card-hover">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-base text-text-main flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Academic Workload
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-elevated text-text-muted">
                <CountUp value={academicSummary.totalEstimatedHours} suffix="h est." delay={200} duration={850} />
              </span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Estimated effort across active assignments
            </p>
            <div className="p-4 rounded-2xl bg-elevated border border-border-subtle space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Pending Hours:</span>
                <span className="font-bold text-text-main">
                  <CountUp value={academicSummary.totalEstimatedHours} suffix=" hours" delay={240} duration={850} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Completed this month:</span>
                <span className="font-bold text-emerald-custom">
                  <CountUp value={academicSummary.completedThisMonth} suffix=" tasks" delay={280} duration={850} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Overall Completion:</span>
                <span className="font-bold text-primary">
                  <CountUp value={academicSummary.completionRate} suffix="%" delay={320} duration={900} />
                </span>
              </div>
            </div>
          </div>

        </div>

      </motion.div>
    </motion.div>
  );
};
