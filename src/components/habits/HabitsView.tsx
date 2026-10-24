import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Habit, HabitLog } from '../../types';
import { 
  calculateHabitStreak, 
  calculateDailyHabitSummary, 
  generateHabitHeatmapData,
  generateWeeklyHabitTrend 
} from '../../utils/habitCalculations';
import { HabitModal } from './HabitModal';
import { HabitCompletionModal } from './HabitCompletionModal';
import { HabitHeatmap } from './HabitHeatmap';
import { renderHabitIcon } from './HabitIconHelper';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Archive, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Sparkles,
  BarChart2,
  CalendarDays
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell 
} from 'recharts';
import confetti from 'canvas-confetti';

export const HabitsView: React.FC = () => {
  const { 
    habits, 
    habitLogs, 
    saveHabit, 
    archiveHabit, 
    deleteHabit, 
    recordHabitCompletion 
  } = useApp();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [completionModalHabit, setCompletionModalHabit] = useState<Habit | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isSelectedDateToday = selectedDate === todayStr;

  // Habits divided into active and archived
  const activeHabits = useMemo(() => habits.filter(h => !h.isArchived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.isArchived), [habits]);

  // Daily Summary for selected date
  const dailySummary = useMemo(() => {
    return calculateDailyHabitSummary(habits, habitLogs, selectedDate);
  }, [habits, habitLogs, selectedDate]);

  // Streaks for all active habits
  const habitStreaks = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateHabitStreak>>();
    activeHabits.forEach(h => {
      map.set(h.id, calculateHabitStreak(h, habitLogs, selectedDate));
    });
    return map;
  }, [activeHabits, habitLogs, selectedDate]);

  // Max streak among habits
  const highestStreak = useMemo(() => {
    let max = 0;
    habitStreaks.forEach((val) => {
      if (val.currentStreak > max) max = val.currentStreak;
    });
    return max;
  }, [habitStreaks]);

  // Weekly Trend data for chart
  const weeklyTrendData = useMemo(() => {
    return generateWeeklyHabitTrend(habits, habitLogs, selectedDate);
  }, [habits, habitLogs, selectedDate]);

  // 60-day heatmap data
  const heatmapData = useMemo(() => {
    return generateHabitHeatmapData(habits, habitLogs, 60);
  }, [habits, habitLogs]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayStr);
  };

  // Quick toggle boolean habit
  const handleToggleHabit = (habit: Habit, isAlreadyCompleted: boolean) => {
    const nextCompleted = !isAlreadyCompleted;
    recordHabitCompletion(
      habit.id,
      selectedDate,
      nextCompleted,
      nextCompleted ? (habit.targetValue || 1) : 0
    );

    // Trigger celebration if checking off completes all remaining habits for today
    if (nextCompleted && dailySummary.completedCount + 1 >= dailySummary.totalScheduled) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24']
        });
      } catch {
        // Safe fallback
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-text-main tracking-tight">
              Habit Tracker & Routines
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {activeHabits.length} Active
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Build unshakeable daily habits, track measurable targets, and guard your streaks.
          </p>
        </div>

        {/* Date Selector & New Habit Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Bar */}
          <div className="flex items-center bg-card border border-border-subtle rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-text-main focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-1.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isSelectedDateToday && (
              <button
                onClick={handleJumpToToday}
                className="ml-1 px-2.5 py-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
              >
                Today
              </button>
            )}
          </div>

          {/* Create Habit CTA */}
          <button
            onClick={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition-all active:scale-[0.98] btn-action"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Completion */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Daily Completion</span>
            <span className="font-bold text-primary">{dailySummary.completionRate}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">
              {dailySummary.completedCount} / {dailySummary.totalScheduled}
            </span>
            <span className="text-xs text-text-muted">habits done</span>
          </div>
          <div className="w-full h-2 bg-border-subtle dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${dailySummary.completionRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Remaining Habits */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Remaining Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">
              {dailySummary.remainingCount}
            </span>
            <span className="text-xs text-text-muted">pending</span>
          </div>
          <p className="text-[11px] text-text-muted mt-3">
            {dailySummary.remainingCount === 0 
              ? '🎉 All routines completed for this date!' 
              : `${dailySummary.remainingCount} routines left to achieve 100%`}
          </p>
        </div>

        {/* Card 3: Top Current Streak */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Top Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500/20" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-300">
              {highestStreak}
            </span>
            <span className="text-xs text-text-muted">days running</span>
          </div>
          <p className="text-[11px] text-text-muted mt-3">
            Streak protects schedule off-days without penalty
          </p>
        </div>

        {/* Card 4: Active Habit Roster */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Routine System</span>
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">
              {activeHabits.length}
            </span>
            <span className="text-xs text-text-muted">active ({archivedHabits.length} archived)</span>
          </div>
          <p className="text-[11px] text-text-muted mt-3">
            {habits.filter(h => h.targetType === 'measurable').length} measurable, {habits.filter(h => h.targetType === 'boolean').length} boolean
          </p>
        </div>
      </div>

      {/* Analytics Row: 7-day Weekly Trend & 60-day Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                7-Day Completion Trend
              </h3>
              <span className="text-xs text-text-muted">Past Week</span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Completion percentage across scheduled habits
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  stroke="#8490A5" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#E1E6F0' }} 
                />
                <YAxis 
                  stroke="#8490A5" 
                  fontSize={10} 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(101, 88, 232, 0.06)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-card border border-border-subtle rounded-xl shadow-xl text-xs">
                          <div className="font-bold text-text-main">{data.date}</div>
                          <div className="text-primary font-semibold mt-1">
                            {data.completed} of {data.scheduled} completed ({data.rate}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {weeklyTrendData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.date === selectedDate ? '#6558E8' : (entry.rate === 100 ? '#10B981' : 'var(--color-primary)')} 
                      opacity={entry.date === selectedDate ? 1 : 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 60-Day Heatmap Card */}
        <div className="lg:col-span-2">
          <HabitHeatmap
            data={heatmapData}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
          />
        </div>
      </div>

      {/* Tabs: Active vs Archived Habits */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'active'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <span>Active Routines</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-elevated text-text-main border border-border-subtle">
              {activeHabits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'archived'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-elevated text-text-main border border-border-subtle">
              {archivedHabits.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-text-muted">
          Showing habits for: <span className="font-semibold text-text-main">{selectedDate}</span>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {activeTab === 'active' ? (
        activeHabits.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-elevated border border-border-subtle shadow-sm">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-text-main">No active habits yet</h3>
            <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
              Start building your student routine by adding your first daily or weekly habit.
            </p>
            <button
              onClick={() => {
                setEditingHabit(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/30"
            >
              Add First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map((habit) => {
              const streak = habitStreaks.get(habit.id) || {
                currentStreak: 0,
                bestStreak: 0,
                totalCompletions: 0,
                completionRateMonth: 0,
                isScheduledToday: true,
                isCompletedToday: false,
                historyLast7Days: [],
              };

              const existingLog = habitLogs.find(
                l => l.habitId === habit.id && l.date === selectedDate
              );
              const isCompletedOnDate = existingLog?.isCompleted || false;
              const currentValue = existingLog?.currentValue || (isCompletedOnDate ? (habit.targetValue || 1) : 0);
              const target = habit.targetValue || 1;
              const progressPct = habit.targetType === 'measurable' 
                ? Math.min(100, Math.round((currentValue / target) * 100))
                : (isCompletedOnDate ? 100 : 0);

              return (
                <div
                  key={habit.id}
                  className={`card-hover p-4 rounded-3xl bg-card border transition-all duration-300 relative flex flex-col justify-between shadow-sm ${
                    isCompletedOnDate
                      ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'border-border-subtle'
                  }`}
                >
                  <div>
                    {/* Header: Icon, Title, Actions */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform"
                          style={{
                            backgroundColor: `${habit.color}18`,
                            borderColor: `${habit.color}40`,
                            color: habit.color,
                          }}
                        >
                          {renderHabitIcon(habit.icon, { className: 'w-5 h-5' })}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-main truncate flex items-center gap-1.5">
                            {habit.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-elevated text-text-muted border border-border-subtle capitalize">
                              {habit.category.replace('_', ' ')}
                            </span>
                            {habit.reminderTime && (
                              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <Clock className="w-3 h-3 text-text-muted" />
                                {habit.reminderTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Button: Boolean vs Measurable */}
                      {habit.targetType === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleHabit(habit, isCompletedOnDate)}
                          title={isCompletedOnDate ? 'Mark incomplete' : 'Mark completed'}
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isCompletedOnDate
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/40'
                              : 'bg-elevated hover:bg-card text-text-muted border border-border-subtle hover:border-primary/50 shadow-sm'
                          }`}
                        >
                          <Check className={`w-5 h-5 stroke-[2.5] ${isCompletedOnDate ? 'text-white' : 'opacity-40'}`} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCompletionModalHabit(habit)}
                          title="Record Measurable Progress"
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isCompletedOnDate
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                          }`}
                        >
                          {isCompletedOnDate ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Done
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Log
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Description if present */}
                    {habit.description && (
                      <p className="text-xs text-text-muted line-clamp-1 mb-3">
                        {habit.description}
                      </p>
                    )}

                    {/* Progress Bar for Measurable Habits */}
                    {habit.targetType === 'measurable' && (
                      <div className="mb-3 p-2.5 bg-elevated rounded-xl border border-border-subtle shadow-sm">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-text-muted">Target: {target} {habit.unit}</span>
                          <span className="font-bold text-text-main">
                            {currentValue} / {target} {habit.unit} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-border-subtle dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${progressPct}%`,
                              backgroundColor: isCompletedOnDate ? '#10B981' : habit.color 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Streak Info, 7-day mini-dots & Menu */}
                  <div className="pt-3 border-t border-border-subtle mt-2">
                    <div className="flex items-center justify-between">
                      {/* Streak badge */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                          <span>{streak.currentStreak}d streak</span>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          (Best: {streak.bestStreak}d)
                        </span>
                      </div>

                      {/* 7-day history dots */}
                      <div className="flex items-center gap-1" title="Last 7 days history">
                        {streak.historyLast7Days.map((h, i) => (
                          <div
                            key={i}
                            title={`${h.date}: ${h.isCompleted ? 'Completed' : h.isScheduled ? 'Missed' : 'Off-day'}`}
                            className={`w-2 h-2 rounded-full transition-all ${
                              h.isCompleted
                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                : h.isScheduled
                                ? 'bg-slate-300 dark:bg-slate-700'
                                : 'bg-border-subtle border border-border-subtle'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Manage buttons footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-text-muted border-t border-border-subtle">
                      <span className="text-text-muted capitalize">
                        {habit.scheduleType === 'daily'
                          ? 'Daily'
                          : habit.scheduleType === 'weekly'
                          ? `${habit.weeklyTargetDays}x / wk`
                          : 'Selected Days'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingHabit(habit);
                            setIsModalOpen(true);
                          }}
                          title="Edit Habit"
                          className="p-1 hover:text-text-main hover:bg-elevated rounded-md transition-colors text-text-muted"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => archiveHabit(habit.id, true)}
                          title="Archive Habit"
                          className="p-1 hover:text-amber-500 hover:bg-elevated rounded-md transition-colors text-text-muted"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(habit.id)}
                          title="Delete Habit"
                          className="p-1 hover:text-rose-500 hover:bg-elevated rounded-md transition-colors text-text-muted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Archived Habits Tab */
        archivedHabits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-elevated border border-border-subtle text-text-muted text-sm shadow-sm">
            No archived habits found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedHabits.map((habit) => (
              <div 
                key={habit.id}
                className="p-4 rounded-2xl bg-card border border-border-subtle opacity-75 hover:opacity-100 transition-opacity flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      borderColor: `${habit.color}30`,
                      color: habit.color,
                    }}
                  >
                    {renderHabitIcon(habit.icon, { className: 'w-5 h-5' })}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-text-main truncate">{habit.title}</h4>
                    <span className="text-[10px] text-text-muted">Archived routine</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => archiveHabit(habit.id, false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-semibold border border-primary/20 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(habit.id)}
                    className="p-1.5 hover:text-rose-500 hover:bg-elevated rounded-lg text-text-muted transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={(data) => saveHabit(data)}
        habitToEdit={editingHabit}
      />

      {/* Habit Progress Recording Modal */}
      <HabitCompletionModal
        isOpen={!!completionModalHabit}
        onClose={() => setCompletionModalHabit(null)}
        habit={completionModalHabit}
        selectedDate={selectedDate}
        existingLog={
          completionModalHabit
            ? habitLogs.find(l => l.habitId === completionModalHabit.id && l.date === selectedDate)
            : undefined
        }
        onSave={(habitId, date, isCompleted, currentValue, notes) => {
          recordHabitCompletion(habitId, date, isCompleted, currentValue, notes);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="p-6 bg-card border border-border-subtle rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Delete Habit?</h3>
              <p className="text-xs text-text-muted mt-1">
                This will permanently delete this habit and all its historical completion records. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-elevated hover:bg-card text-text-main border border-border-subtle rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteHabit(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
