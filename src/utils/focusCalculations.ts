import { FocusSession, Subject } from '../types';
import { formatLocalDate } from './habitCalculations';

/**
 * Format remaining milliseconds (or seconds) into mm:ss or hh:mm:ss
 * - 25:00 for durations under one hour
 * - 01:30:00 for durations of one hour or longer
 */
export function formatTimerDisplay(millisecondsOrSeconds: number): string {
  if (isNaN(millisecondsOrSeconds) || millisecondsOrSeconds <= 0) {
    return '00:00';
  }

  // Handle both milliseconds (e.g. 1,500,000 for 25m) and raw seconds
  const isMs = millisecondsOrSeconds > 86400 || millisecondsOrSeconds % 1000 === 0 || millisecondsOrSeconds >= 60000;
  const totalSeconds = isMs 
    ? Math.max(0, Math.ceil(millisecondsOrSeconds / 1000))
    : Math.max(0, Math.ceil(millisecondsOrSeconds));

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format total study duration into human-readable e.g. "2h 35m" or "45m"
 */
export function formatDurationHuman(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Aggregate focus statistics for today, this week, subjects, and daily trends
 */
export function calculateFocusStats(
  sessions: FocusSession[],
  subjects: Subject[],
  assignmentsOrDate?: any,
  referenceDateInput: Date = new Date()
) {
  const referenceDate = assignmentsOrDate instanceof Date ? assignmentsOrDate : referenceDateInput;
  const todayStr = formatLocalDate(referenceDate);

  // Compute start of week (Monday)
  const currentDay = referenceDate.getDay();
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
  const startOfWeek = new Date(referenceDate);
  startOfWeek.setDate(referenceDate.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Only consider 'focus' session types (breaks do not count as focused study time!)
  const focusOnlySessions = sessions.filter(s => s.sessionType === 'focus');

  // Today's sessions
  const todaySessions = focusOnlySessions.filter(s => {
    const sessionDate = s.completedAt.split('T')[0];
    return sessionDate === todayStr;
  });

  const todayTotalSeconds = todaySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const todayCompletedCount = todaySessions.length;

  // This week's sessions
  const thisWeekSessions = focusOnlySessions.filter(s => {
    const sessionTime = new Date(s.completedAt).getTime();
    return sessionTime >= startOfWeek.getTime();
  });

  const weekTotalSeconds = thisWeekSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const totalCompletedSessions = focusOnlySessions.length;

  const totalFocusSecondsAllTime = focusOnlySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
  const averageDurationMinutes = totalCompletedSessions > 0 
    ? Math.round(totalFocusSecondsAllTime / totalCompletedSessions / 60) 
    : 25;

  // Subject-wise study time breakdown
  const subjectMap = new Map<string, number>();
  focusOnlySessions.forEach(s => {
    const subId = s.subjectId || 'unassigned';
    subjectMap.set(subId, (subjectMap.get(subId) || 0) + s.actualDurationSeconds);
  });

  const rawSubjectBreakdown: {
    subjectId: string;
    name: string;
    color: string;
    totalSeconds: number;
    hours: number;
    percentage: number;
  }[] = [];

  subjects.forEach(sub => {
    const sec = subjectMap.get(sub.id) || 0;
    if (sec > 0) {
      rawSubjectBreakdown.push({
        subjectId: sub.id,
        name: sub.name,
        color: sub.color,
        totalSeconds: sec,
        hours: Math.round((sec / 3600) * 10) / 10,
        percentage: totalFocusSecondsAllTime > 0 ? Math.round((sec / totalFocusSecondsAllTime) * 100) : 0
      });
    }
  });

  // Include general / unassigned study
  const unassignedSec = subjectMap.get('unassigned') || 0;
  if (unassignedSec > 0) {
    rawSubjectBreakdown.push({
      subjectId: 'unassigned',
      name: 'General Study',
      color: '#A855F7',
      totalSeconds: unassignedSec,
      hours: Math.round((unassignedSec / 3600) * 10) / 10,
      percentage: totalFocusSecondsAllTime > 0 ? Math.round((unassignedSec / totalFocusSecondsAllTime) * 100) : 0
    });
  }

  // 7-day daily focus trend
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTrend: {
    dayName: string;
    day: string;
    date: string;
    minutes: number;
    hours: number;
    sessionsCount: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dStr = formatLocalDate(d);

    const daySessions = focusOnlySessions.filter(s => s.completedAt.split('T')[0] === dStr);
    const daySec = daySessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);

    dailyTrend.push({
      dayName: dayNames[d.getDay()],
      day: dayNames[d.getDay()],
      date: dStr,
      minutes: Math.round(daySec / 60),
      hours: Math.round((daySec / 3600) * 10) / 10,
      sessionsCount: daySessions.length
    });
  }

  // Recent 8 sessions
  const recentSessions = [...focusOnlySessions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 8);

  const subjectBreakdown = rawSubjectBreakdown.map(sb => ({
    ...sb,
    durationMinutes: Math.round(sb.totalSeconds / 60),
    durationHours: sb.hours,
    sessionsCount: focusOnlySessions.filter(s => s.subjectId === sb.subjectId).length,
  }));

  return {
    todayTotalSeconds,
    totalFocusTimeTodaySeconds: todayTotalSeconds,
    todayCompletedCount,
    todaySessionsCount: todayCompletedCount,
    weekTotalSeconds,
    totalFocusTimeWeekSeconds: weekTotalSeconds,
    totalCompletedSessions,
    completedFocusCount: totalCompletedSessions,
    averageDurationMinutes,
    averageSessionMinutes: averageDurationMinutes,
    subjectBreakdown,
    dailyTrend,
    recentSessions
  };
}

/**
 * Synthesize a soft, pleasant completion chime using Web Audio API
 * No external sound files or asset downloads required!
 */
export function playChimeSound(
  soundEnabledOrType: boolean | 'focus_complete' | 'break_complete' = true,
  typeInput: 'focus_complete' | 'break_complete' = 'focus_complete'
) {
  if (soundEnabledOrType === false) return;
  const type = typeof soundEnabledOrType === 'string' ? soundEnabledOrType : typeInput;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (type === 'focus_complete') {
      // Gentle ascending major chord: C5 -> E5 -> G5
      osc1.frequency.setValueAtTime(523.25, now);       // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5
      osc2.frequency.setValueAtTime(261.63, now);       // C4 harmonic
    } else {
      // Soft calming descending chime: G5 -> C5
      osc1.frequency.setValueAtTime(783.99, now);       // G5
      osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.25); // C5
      osc2.frequency.setValueAtTime(392.00, now);       // G4 harmonic
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.95);
    osc2.stop(now + 0.95);
  } catch (err) {
    console.warn('AudioContext playback error (user interaction required):', err);
  }
}
