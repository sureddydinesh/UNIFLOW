import { Habit, HabitLog, HabitStreakInfo } from '../types';

/**
 * Format date to YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Determine if a habit is scheduled on a specific date
 */
export function isHabitScheduledOnDate(habit: Habit, date: Date): boolean {
  if (habit.isArchived) return false;

  if (habit.scheduleType === 'daily') {
    return true;
  }

  if (habit.scheduleType === 'selected_days') {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return habit.selectedDays ? habit.selectedDays.includes(dayOfWeek) : true;
  }

  if (habit.scheduleType === 'weekly') {
    // For weekly habits, it's open every day until weekly target is hit
    return true;
  }

  return true;
}

/**
 * Calculate accurate habit streaks according to its schedule.
 * Does not penalize days when the habit was not scheduled!
 */
export function calculateHabitStreak(
  habit: Habit, 
  logs: HabitLog[], 
  referenceDateStr?: string
): HabitStreakInfo {
  const refDate = referenceDateStr ? parseLocalDate(referenceDateStr) : new Date();
  const refDateStr = formatLocalDate(refDate);

  // Filter logs for this habit and authenticated user
  const habitLogs = logs.filter(l => l.habitId === habit.id);
  const logMap = new Map<string, HabitLog>();
  habitLogs.forEach(l => logMap.set(l.date, l));

  const isScheduledToday = isHabitScheduledOnDate(habit, refDate);
  const todayLog = logMap.get(refDateStr);
  const isCompletedToday = !!(todayLog && todayLog.isCompleted);

  // Total completions ever
  const totalCompletions = habitLogs.filter(l => l.isCompleted).length;

  // Completion rate in last 30 days
  let scheduledIn30Days = 0;
  let completedIn30Days = 0;

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(refDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = formatLocalDate(checkDate);

    if (isHabitScheduledOnDate(habit, checkDate)) {
      scheduledIn30Days++;
      const log = logMap.get(dateStr);
      if (log && log.isCompleted) {
        completedIn30Days++;
      }
    }
  }

  const completionRateMonth = scheduledIn30Days > 0 
    ? Math.round((completedIn30Days / scheduledIn30Days) * 100) 
    : 0;

  // 7-day history array for mini indicators
  const historyLast7Days: { date: string; isCompleted: boolean; isScheduled: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalDate(d);
    const isSched = isHabitScheduledOnDate(habit, d);
    const l = logMap.get(dStr);
    historyLast7Days.push({
      date: dStr,
      isScheduled: isSched,
      isCompleted: !!(l && l.isCompleted)
    });
  }

  // --- Calculate Current Streak ---
  let currentStreak = 0;
  
  // Start checking from today (if completed) or yesterday (if today not completed yet)
  let checkOffset = isCompletedToday ? 0 : 1;
  let streakBroken = false;

  // Look back up to 365 days
  for (let i = checkOffset; i < 365; i++) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalDate(d);

    // If not scheduled on this day, skip without breaking the streak
    if (!isHabitScheduledOnDate(habit, d)) {
      continue;
    }

    const log = logMap.get(dStr);
    if (log && log.isCompleted) {
      currentStreak++;
    } else {
      // First missed scheduled day breaks the current streak
      streakBroken = true;
      break;
    }
  }

  // --- Calculate Best (Longest) Streak Ever ---
  let bestStreak = currentStreak;
  let tempStreak = 0;

  // Scan from 180 days ago forward to today
  for (let i = 180; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalDate(d);

    if (!isHabitScheduledOnDate(habit, d)) {
      continue;
    }

    const log = logMap.get(dStr);
    if (log && log.isCompleted) {
      tempStreak++;
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRateMonth,
    isScheduledToday,
    isCompletedToday,
    historyLast7Days
  };
}

/**
 * Calculate summary of all habits for a specific date
 */
export function calculateDailyHabitSummary(
  habits: Habit[], 
  logs: HabitLog[], 
  targetDateStr: string
) {
  const date = parseLocalDate(targetDateStr);
  const activeHabits = habits.filter(h => !h.isArchived);
  const scheduledHabits = activeHabits.filter(h => isHabitScheduledOnDate(h, date));

  const logMap = new Map<string, HabitLog>();
  logs.filter(l => l.date === targetDateStr).forEach(l => logMap.set(l.habitId, l));

  let completedCount = 0;
  scheduledHabits.forEach(h => {
    const log = logMap.get(h.id);
    if (log && log.isCompleted) {
      completedCount++;
    }
  });

  const totalScheduled = scheduledHabits.length;
  const remainingCount = totalScheduled - completedCount;
  const completionPercentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

  return {
    date: targetDateStr,
    totalScheduled,
    completedCount,
    remainingCount,
    completionPercentage,
    completionRate: completionPercentage,
    scheduledHabits
  };
}

export interface HabitHeatmapCell {
  date: string;
  dayOfWeek: number;
  completedCount: number;
  scheduledCount: number;
  completionPercentage: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

/**
 * Generate 60-day Activity Heatmap Data
 */
export function generateHabitHeatmapData(
  habits: Habit[], 
  logs: HabitLog[], 
  days = 60,
  referenceDateInput: Date | string = new Date()
): HabitHeatmapCell[] {
  const referenceDate = typeof referenceDateInput === 'string' ? parseLocalDate(referenceDateInput) : referenceDateInput;
  const activeHabits = habits.filter(h => !h.isArchived);
  const logMap = new Map<string, HabitLog[]>();

  logs.forEach(l => {
    if (!logMap.has(l.date)) {
      logMap.set(l.date, []);
    }
    logMap.get(l.date)!.push(l);
  });

  const heatmap: HabitHeatmapCell[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = formatLocalDate(d);

    const scheduledCount = activeHabits.filter(h => isHabitScheduledOnDate(h, d)).length;
    const dayLogs = logMap.get(dateStr) || [];
    const completedCount = dayLogs.filter(l => l.isCompleted).length;

    const percentage = scheduledCount > 0 ? (completedCount / scheduledCount) * 100 : 0;

    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (completedCount > 0) {
      if (percentage >= 100) intensity = 4;
      else if (percentage >= 75) intensity = 3;
      else if (percentage >= 50) intensity = 2;
      else intensity = 1;
    }

    heatmap.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      completedCount,
      scheduledCount,
      completionPercentage: Math.round(percentage),
      intensity
    });
  }

  return heatmap;
}

/**
 * Generate weekly chart data for the past 7 days
 */
export function generateWeeklyHabitTrend(
  habits: Habit[], 
  logs: HabitLog[], 
  referenceDateInput: Date | string = new Date()
) {
  const referenceDate = typeof referenceDateInput === 'string' ? parseLocalDate(referenceDateInput) : referenceDateInput;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: {
    dayName: string;
    day: string;
    date: string;
    completed: number;
    total: number;
    rate: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = formatLocalDate(d);
    const summary = calculateDailyHabitSummary(habits, logs, dateStr);

    result.push({
      dayName: dayNames[d.getDay()],
      day: dayNames[d.getDay()],
      date: dateStr,
      completed: summary.completedCount,
      total: summary.totalScheduled,
      rate: summary.completionPercentage
    });
  }

  return result;
}
