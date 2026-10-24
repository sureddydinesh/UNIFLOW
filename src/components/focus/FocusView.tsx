import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { FocusModeType, FocusWorkflowMode, FocusSession, ActiveFocusState } from '../../types';
import { NavTab } from '../layout/AppLayout';
import { 
  formatDurationHuman, 
  calculateFocusStats, 
  playChimeSound, 
  formatTimerDisplay 
} from '../../utils/focusCalculations';
import { FocusTimerRing } from './FocusTimerRing';
import { FocusSettingsModal } from './FocusSettingsModal';
import { FocusCompleteModal } from './FocusCompleteModal';
import { BreakChoiceModal } from './BreakChoiceModal';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings2, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  Flame, 
  BarChart3, 
  History, 
  Trash2,
  Coffee,
  Sliders,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FastForward
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

interface FocusViewProps {
  onNavigate?: (tab: NavTab) => void;
}

const OPEN_FOCUS_PRESETS = [15, 25, 30, 45, 60, 90, 120];

export const FocusView: React.FC<FocusViewProps> = ({ onNavigate }) => {
  const { 
    subjects, 
    assignments, 
    focusSessions, 
    focusSettings, 
    activeFocusState, 
    saveFocusSession, 
    deleteFocusSession, 
    saveFocusSettings, 
    saveActiveFocusState 
  } = useApp();

  // Workflow Mode: Open Focus (flexible custom study) vs Pomodoro (structured interval cycles)
  const [workflowMode, setWorkflowMode] = useState<FocusWorkflowMode>('open_focus');

  // Selected Task & Subject
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('Deep Study Sprint');

  // Open Focus Duration Picker State
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(25);
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(45);

  // Timer State
  const [sessionType, setSessionType] = useState<FocusModeType>('focus');
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [totalDurationMs, setTotalDurationMs] = useState<number>(25 * 60 * 1000);
  const [remainingMs, setRemainingMs] = useState<number>(25 * 60 * 1000);
  const [completedPomodorosInCycle, setCompletedPomodorosInCycle] = useState<number>(0);

  // Full-screen & Modals
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [breakModalType, setBreakModalType] = useState<'short_break' | 'long_break' | 'custom'>('short_break');
  const [lastFinishedDuration, setLastFinishedDuration] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const targetEndTimestampRef = useRef<number | null>(null);
  const startedAtTimestampRef = useRef<number | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    return calculateFocusStats(focusSessions, subjects);
  }, [focusSessions, subjects]);

  // Request browser notification permission non-intrusively
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Send sound & notification if allowed
  const triggerNotification = useCallback((title: string, body: string) => {
    playChimeSound(
      focusSettings.soundEnabled ? (sessionType === 'focus' ? 'focus_complete' : 'break_complete') : false
    );

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback silently
      }
    }
  }, [focusSettings.soundEnabled, sessionType]);

  // Timer Completion Handler
  const handleTimerComplete = useCallback(() => {
    const isFocus = sessionType === 'focus';
    const durationSec = Math.round(totalDurationMs / 1000);
    setLastFinishedDuration(durationSec);

    // Increment completed pomodoros in cycle if focus and in pomodoro mode
    if (isFocus && workflowMode === 'pomodoro') {
      setCompletedPomodorosInCycle(prev => prev + 1);
    }

    // Audio & desktop notification
    triggerNotification(
      isFocus ? 'Focus Session Completed!' : 'Break Time Concluded!',
      isFocus
        ? `Great focus! You dedicated ${Math.round(totalDurationMs / 60000)} minutes of study.`
        : 'Your break has finished. Ready to resume studying?'
    );

    if (isFocus) {
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24']
        });
      } catch {
        // Safe fallback
      }
    }

    // Persist completed session strictly for focus sessions (breaks are excluded from study stats)
    if (isFocus) {
      saveFocusSession({
        title: taskTitle,
        sessionType: 'focus',
        workflowMode,
        plannedMinutes: Math.round(totalDurationMs / 60000),
        actualDurationSeconds: durationSec,
        completedAt: new Date().toISOString(),
        subjectId: selectedSubjectId || undefined,
        assignmentId: selectedAssignmentId || undefined,
        isCompleted: true,
      });
    }

    // Clear active state from storage
    saveActiveFocusState(null);

    // Open completion modal
    setIsCompleteModalOpen(true);
  }, [
    sessionType, 
    workflowMode,
    totalDurationMs, 
    triggerNotification, 
    taskTitle, 
    selectedSubjectId, 
    selectedAssignmentId, 
    saveFocusSession, 
    saveActiveFocusState
  ]);

  // Restore active focus state if returning to page or refreshing
  useEffect(() => {
    if (activeFocusState && status === 'idle') {
      setWorkflowMode(activeFocusState.workflowMode || 'open_focus');
      setSessionType(activeFocusState.sessionType || 'focus');
      setSelectedSubjectId(activeFocusState.subjectId || '');
      setSelectedAssignmentId(activeFocusState.assignmentId || '');
      setTaskTitle(activeFocusState.taskTitle || 'Deep Study Sprint');
      setTotalDurationMs(activeFocusState.totalDurationMs);
      setCompletedPomodorosInCycle(activeFocusState.completedPomodorosInCycle || 0);

      if (activeFocusState.status === 'running' && activeFocusState.targetEndTimestamp) {
        const now = Date.now();
        const diff = activeFocusState.targetEndTimestamp - now;
        if (diff > 0) {
          const safeDiff = Math.min(activeFocusState.totalDurationMs, diff);
          setRemainingMs(safeDiff);
          setStatus('running');
          targetEndTimestampRef.current = activeFocusState.targetEndTimestamp;
          startedAtTimestampRef.current = activeFocusState.startedAtTimestamp;
        } else {
          // Finished while away
          setRemainingMs(0);
          setStatus('completed');
          targetEndTimestampRef.current = null;
          handleTimerComplete();
        }
      } else if (activeFocusState.status === 'paused') {
        const safeRemaining = Math.max(0, Math.min(activeFocusState.totalDurationMs, activeFocusState.remainingMs));
        setRemainingMs(safeRemaining);
        setStatus('paused');
        targetEndTimestampRef.current = null;
      }
    }
  }, [activeFocusState, handleTimerComplete, status]);

  // Keep remaining time accurate on tab focus / visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running' && targetEndTimestampRef.current) {
        const now = Date.now();
        const diff = targetEndTimestampRef.current - now;
        if (diff <= 0) {
          setRemainingMs(0);
          setStatus('completed');
          targetEndTimestampRef.current = null;
          handleTimerComplete();
        } else {
          const safeDiff = Math.min(totalDurationMs, Math.max(0, diff));
          setRemainingMs(safeDiff);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, totalDurationMs, handleTimerComplete]);

  // Timer Tick Interval (Survives smoothly without drift)
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (!targetEndTimestampRef.current) return;
        const now = Date.now();
        const diff = targetEndTimestampRef.current - now;

        if (diff <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setRemainingMs(0);
          setStatus('completed');
          targetEndTimestampRef.current = null;
          handleTimerComplete();
        } else {
          const safeDiff = Math.min(totalDurationMs, Math.max(0, diff));
          setRemainingMs(safeDiff);
        }
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, totalDurationMs, handleTimerComplete]);

  // Start Timer
  const handleStart = () => {
    requestNotificationPermission();

    const now = Date.now();
    // If paused, resume with current remainingMs; otherwise start with full totalDurationMs
    const duration = remainingMs > 0 && status === 'paused' ? remainingMs : totalDurationMs;
    const targetEnd = now + duration;

    targetEndTimestampRef.current = targetEnd;
    startedAtTimestampRef.current = startedAtTimestampRef.current || now;

    setStatus('running');

    // Persist active state to storage for tab/refresh recovery
    const state: ActiveFocusState = {
      status: 'running',
      sessionType,
      workflowMode,
      subjectId: selectedSubjectId || undefined,
      assignmentId: selectedAssignmentId || undefined,
      taskTitle,
      totalDurationMs,
      remainingMs: duration,
      startedAtTimestamp: startedAtTimestampRef.current,
      targetEndTimestamp: targetEnd,
      completedPomodorosInCycle,
    };
    saveActiveFocusState(state);
  };

  // Pause Timer
  const handlePause = () => {
    setStatus('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const now = Date.now();
    let currentRemaining = remainingMs;
    if (targetEndTimestampRef.current) {
      currentRemaining = Math.max(0, Math.min(totalDurationMs, targetEndTimestampRef.current - now));
      setRemainingMs(currentRemaining);
    }
    targetEndTimestampRef.current = null;

    // Persist paused state (targetEnd is null because time is paused)
    const state: ActiveFocusState = {
      status: 'paused',
      sessionType,
      workflowMode,
      subjectId: selectedSubjectId || undefined,
      assignmentId: selectedAssignmentId || undefined,
      taskTitle,
      totalDurationMs,
      remainingMs: currentRemaining,
      startedAtTimestamp: startedAtTimestampRef.current,
      targetEndTimestamp: null,
      completedPomodorosInCycle,
    };
    saveActiveFocusState(state);
  };

  // Stop / End Timer Early (Interrupted session)
  const handleStop = () => {
    if (status === 'running' || status === 'paused') {
      const elapsedMs = Math.max(0, totalDurationMs - remainingMs);
      const elapsedSeconds = Math.round(elapsedMs / 1000);

      // If user spent >= 60 seconds in focused study, record actual duration
      if (sessionType === 'focus' && elapsedSeconds >= 60) {
        saveFocusSession({
          title: taskTitle,
          sessionType: 'focus',
          workflowMode,
          plannedMinutes: Math.round(totalDurationMs / 60000),
          actualDurationSeconds: elapsedSeconds,
          completedAt: new Date().toISOString(),
          subjectId: selectedSubjectId || undefined,
          assignmentId: selectedAssignmentId || undefined,
          isCompleted: false,
          notes: 'Session ended early',
        });
      }
    }

    setStatus('idle');
    setRemainingMs(totalDurationMs);
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);
  };

  // Reset Timer to intended full duration (does NOT record as completed study)
  const handleReset = () => {
    setStatus('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemainingMs(totalDurationMs);
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);
  };

  // Skip an active break immediately
  const handleSkipBreak = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);

    // Switch back to focus mode
    setSessionType('focus');
    setStatus('idle');
    const defaultFocusDur = workflowMode === 'pomodoro' 
      ? focusSettings.focusDurationMinutes * 60 * 1000
      : (typeof selectedPreset === 'number' ? selectedPreset : (customHours * 60 + customMinutes)) * 60 * 1000;
    setTotalDurationMs(defaultFocusDur);
    setRemainingMs(defaultFocusDur);
  };

  // Open Break Choice Modal
  const handleOpenBreakModal = (type: 'short_break' | 'long_break' | 'custom') => {
    setBreakModalType(type);
    setIsBreakModalOpen(true);
  };

  // Confirm and start a chosen break duration
  const handleConfirmBreak = (durationMinutes: number, type: 'short_break' | 'long_break') => {
    // If a focus timer was running, record elapsed study time before switching
    if (status === 'running' || status === 'paused') {
      const elapsedMs = Math.max(0, totalDurationMs - remainingMs);
      const elapsedSeconds = Math.round(elapsedMs / 1000);
      if (sessionType === 'focus' && elapsedSeconds >= 60) {
        saveFocusSession({
          title: taskTitle,
          sessionType: 'focus',
          workflowMode,
          plannedMinutes: Math.round(totalDurationMs / 60000),
          actualDurationSeconds: elapsedSeconds,
          completedAt: new Date().toISOString(),
          subjectId: selectedSubjectId || undefined,
          assignmentId: selectedAssignmentId || undefined,
          isCompleted: false,
          notes: 'Saved before starting break',
        });
      }
    }

    const breakDurMs = durationMinutes * 60 * 1000;
    setSessionType(type);
    setTotalDurationMs(breakDurMs);
    setRemainingMs(breakDurMs);

    // If auto-start breaks is enabled or user confirmed, start immediately
    const now = Date.now();
    const targetEnd = now + breakDurMs;
    targetEndTimestampRef.current = targetEnd;
    startedAtTimestampRef.current = now;
    setStatus('running');

    // Persist break active state
    saveActiveFocusState({
      status: 'running',
      sessionType: type,
      workflowMode,
      taskTitle: `Break (${durationMinutes}m)`,
      totalDurationMs: breakDurMs,
      remainingMs: breakDurMs,
      startedAtTimestamp: now,
      targetEndTimestamp: targetEnd,
      completedPomodorosInCycle,
    });
  };

  // Switch between Open Focus and Pomodoro
  const handleSwitchWorkflow = (mode: FocusWorkflowMode) => {
    if (status === 'running') {
      const confirmed = window.confirm('A focus session is currently running. Switch modes and reset the timer?');
      if (!confirmed) return;
    }

    setWorkflowMode(mode);
    setSessionType('focus');
    setStatus('idle');
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);

    let newDurMs = 25 * 60 * 1000;
    if (mode === 'pomodoro') {
      newDurMs = focusSettings.focusDurationMinutes * 60 * 1000;
    } else {
      newDurMs = (typeof selectedPreset === 'number' ? selectedPreset : (customHours * 60 + customMinutes)) * 60 * 1000;
    }
    setTotalDurationMs(newDurMs);
    setRemainingMs(newDurMs);
  };

  // Preset Selection for Open Focus
  const handleSelectPreset = (mins: number) => {
    if (status === 'running') {
      const confirmed = window.confirm('Timer is running. Update session duration?');
      if (!confirmed) return;
    }

    setSelectedPreset(mins);
    setSessionType('focus');
    setStatus('idle');
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);

    const durMs = mins * 60 * 1000;
    setTotalDurationMs(durMs);
    setRemainingMs(durMs);
  };

  // Custom Duration Change
  const handleApplyCustomDuration = (hrs: number, mins: number) => {
    const totalMins = hrs * 60 + mins;
    if (totalMins <= 0) return;

    if (status === 'running') {
      const confirmed = window.confirm('Timer is running. Update session duration?');
      if (!confirmed) return;
    }

    setSelectedPreset('custom');
    setCustomHours(hrs);
    setCustomMinutes(mins);
    setSessionType('focus');
    setStatus('idle');
    targetEndTimestampRef.current = null;
    startedAtTimestampRef.current = null;
    saveActiveFocusState(null);

    const durMs = totalMins * 60 * 1000;
    setTotalDurationMs(durMs);
    setRemainingMs(durMs);
  };

  // Full Screen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Next session recommendation in Pomodoro mode
  const nextSessionType: FocusModeType = useMemo(() => {
    if (sessionType === 'focus') {
      return (completedPomodorosInCycle + 1) % focusSettings.longBreakInterval === 0
        ? 'long_break'
        : 'short_break';
    }
    return 'focus';
  }, [sessionType, completedPomodorosInCycle, focusSettings.longBreakInterval]);

  // Transition after completion modal
  const handleCompletionTransition = (
    notes: string, 
    nextAction: 'break' | 'focus' | 'dashboard' | 'finish'
  ) => {
    setIsCompleteModalOpen(false);

    if (nextAction === 'dashboard') {
      handleReset();
      if (onNavigate) {
        onNavigate('dashboard');
      }
    } else if (nextAction === 'break') {
      // Open break choice modal so the student can pick break duration
      handleOpenBreakModal(nextSessionType === 'focus' ? 'short_break' : nextSessionType);
    } else if (nextAction === 'focus') {
      // Start a new focus session
      setSessionType('focus');
      setStatus('idle');
      const focusDur = workflowMode === 'pomodoro'
        ? focusSettings.focusDurationMinutes * 60 * 1000
        : (typeof selectedPreset === 'number' ? selectedPreset : (customHours * 60 + customMinutes)) * 60 * 1000;
      setTotalDurationMs(focusDur);
      setRemainingMs(focusDur);
      setTimeout(() => handleStart(), 200);
    } else {
      handleReset();
    }
  };

  // Active linked subject & assignment objects
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

  return (
    <div 
      ref={containerRef} 
      className={`space-y-4 sm:space-y-5 animate-fade-in ${isFullScreen ? 'p-6 sm:p-8 bg-background min-h-screen overflow-y-auto' : ''}`}
    >
      {/* Top Header & Workspace Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
              Focus Mode & Pomodoro
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Deep Work
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Choose your own flexible study duration or follow structured Pomodoro intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Full Screen Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen Focus'}
            className="p-2 sm:p-2.5 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl border border-border-subtle transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Configure Focus & Pomodoro Settings"
            className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-card border border-border-subtle hover:bg-elevated text-text-main rounded-xl text-xs font-semibold transition-colors card-hover shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-primary" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Study Workspace Card */}
      <div id="focus-main-workspace-card" className="card-hover p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border-subtle flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
        
        {/* ============================================================== */}
        {/* 1. ABOVE THE TIMER: MODE SELECTION & DURATION SELECTION        */}
        {/* ============================================================== */}
        
        {/* Mode Selector Toggle: Open Focus vs Pomodoro */}
        <div className="w-full max-w-md sm:max-w-lg mb-2.5 sm:mb-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 sm:p-1.5 bg-elevated rounded-xl sm:rounded-2xl border border-border-subtle">
            <button
              type="button"
              onClick={() => handleSwitchWorkflow('open_focus')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                workflowMode === 'open_focus'
                  ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary/40'
                  : 'text-text-muted hover:text-text-main hover:bg-card/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Open Focus</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Custom Time)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchWorkflow('pomodoro')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                workflowMode === 'pomodoro'
                  ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary/40'
                  : 'text-text-muted hover:text-text-main hover:bg-card/80'
              }`}
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
              <span>Pomodoro</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">({focusSettings.focusDurationMinutes}m intervals)</span>
            </button>
          </div>
        </div>

        {/* DURATION CONFIGURATION SECTION */}
        {workflowMode === 'open_focus' ? (
          /* Mode A: Open Focus Presets & Custom Duration */
          <div className="w-full max-w-md sm:max-w-lg p-2 sm:p-3 rounded-2xl bg-elevated/70 border border-border-subtle mb-2.5 sm:mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Select Focus Duration
              </span>
              <span className="text-xs font-extrabold text-primary font-mono">
                {Math.round(totalDurationMs / 60000)} mins
              </span>
            </div>

            {/* Presets Bar */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-2 sm:mb-2.5">
              {OPEN_FOCUS_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={status === 'running'}
                  onClick={() => handleSelectPreset(mins)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 ${
                    selectedPreset === mins
                      ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary/40'
                      : 'bg-card hover:bg-elevated text-text-main border border-border-subtle shadow-sm'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}

              <button
                type="button"
                disabled={status === 'running'}
                onClick={() => setSelectedPreset('custom')}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 ${
                  selectedPreset === 'custom'
                    ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary/40'
                    : 'bg-card hover:bg-elevated text-text-main border border-border-subtle shadow-sm'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Hours & Minutes Stepper Input */}
            {selectedPreset === 'custom' && (
              <div className="p-2 sm:p-2.5 bg-card rounded-xl border border-primary/30 flex flex-wrap items-center justify-between gap-2 animate-fade-in shadow-sm">
                <span className="text-xs text-text-main font-medium">Custom Hours & Minutes:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      disabled={status === 'running'}
                      value={customHours}
                      onChange={(e) => {
                        const h = Math.max(0, Math.min(12, Number(e.target.value) || 0));
                        handleApplyCustomDuration(h, customMinutes);
                      }}
                      className="w-11 text-center py-0.5 sm:py-1 bg-elevated border border-border-subtle rounded-lg text-text-main font-bold text-xs focus:outline-none focus:border-primary"
                    />
                    <span className="text-[11px] text-text-muted ml-1 font-semibold">hr</span>
                  </div>
                  <span className="text-text-muted font-bold">:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={customHours === 0 ? 1 : 0}
                      max={59}
                      disabled={status === 'running'}
                      value={customMinutes}
                      onChange={(e) => {
                        const m = Math.max(customHours === 0 ? 1 : 0, Math.min(59, Number(e.target.value) || 0));
                        handleApplyCustomDuration(customHours, m);
                      }}
                      className="w-11 text-center py-0.5 sm:py-1 bg-elevated border border-border-subtle rounded-lg text-text-main font-bold text-xs focus:outline-none focus:border-primary"
                    />
                    <span className="text-[11px] text-text-muted ml-1 font-semibold">min</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Mode B: Pomodoro Configuration Banner */
          <div className="w-full max-w-md sm:max-w-lg p-2 sm:p-2.5 rounded-2xl bg-surface-secondary border border-border-subtle mb-2.5 sm:mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-text-main">
                  Focus: {focusSettings.focusDurationMinutes}m · Short Break: {focusSettings.shortBreakMinutes}m · Long Break: {focusSettings.longBreakMinutes}m
                </span>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Long break offered after every {focusSettings.longBreakInterval} completed sprints
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-card hover:bg-elevated text-text-main text-xs font-semibold border border-border-subtle shrink-0 transition-colors shadow-sm"
            >
              Customize
            </button>
          </div>
        )}

        {/* ACADEMIC ASSOCIATION SELECTOR (Subject & Assignment) */}
        <div className="w-full max-w-md sm:max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-2 sm:mb-2.5">
          {/* Subject Selector */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
              Link to Course Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={status === 'running'}
                className="w-full px-3 py-1.5 sm:py-2 bg-card border border-border-subtle rounded-xl text-text-main text-xs font-medium focus:outline-none focus:border-primary disabled:opacity-60 transition-colors shadow-sm"
              >
                <option value="" className="bg-card text-text-main">(No Subject Attached)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card text-text-main">
                    {s.code ? `[${s.code}] ` : ''}{s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment Selector */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
              Link to Assignment
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => {
                setSelectedAssignmentId(e.target.value);
                const asg = assignments.find(a => a.id === e.target.value);
                if (asg) {
                  setTaskTitle(`Assignment: ${asg.title}`);
                  if (asg.subjectId) setSelectedSubjectId(asg.subjectId);
                }
              }}
              disabled={status === 'running'}
              className="w-full px-3 py-1.5 sm:py-2 bg-card border border-border-subtle rounded-xl text-text-main text-xs font-medium focus:outline-none focus:border-primary disabled:opacity-60 transition-colors shadow-sm"
            >
              <option value="" className="bg-card text-text-main">(No Assignment Attached)</option>
              {assignments
                .filter(a => a.status !== 'completed')
                .map((a) => (
                  <option key={a.id} value={a.id} className="bg-card text-text-main">
                    {a.title} ({a.priority})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Task Name Editable Input */}
        <div className="w-full max-w-md sm:max-w-lg mb-1.5 sm:mb-2">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={status === 'running'}
            placeholder="What are you working on right now? (e.g. Algorithms chapter 4)"
            className="w-full px-3.5 py-1.5 sm:py-2 bg-card border border-border-subtle rounded-xl text-center text-xs sm:text-sm font-semibold text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-80 transition-colors shadow-sm"
          />
        </div>

        {/* ============================================================== */}
        {/* 2. CENTERPIECE: CIRCULAR COUNTDOWN TIMER & STATUS               */}
        {/* ============================================================== */}
        <FocusTimerRing
          remainingMs={remainingMs}
          totalDurationMs={totalDurationMs}
          sessionType={sessionType}
          workflowMode={workflowMode}
          isRunning={status === 'running'}
          isPaused={status === 'paused'}
          status={status}
        />

        {/* ============================================================== */}
        {/* 3. BELOW THE TIMER: PRIMARY ACTIONS, BREAK BAR & POMODORO DOTS */}
        {/* ============================================================== */}

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 mt-2.5 sm:mt-3">
          {status === 'idle' && (
            <button
              type="button"
              onClick={handleStart}
              className={`flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all active:scale-[0.98] btn-action ${
                sessionType === 'focus'
                  ? 'bg-primary hover:bg-primary-hover shadow-primary/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>{sessionType === 'focus' ? 'Start Focus Session' : 'Start Break Timer'}</span>
            </button>
          )}

          {status === 'running' && (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all active:scale-[0.98]"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Pause</span>
              </button>

              {sessionType !== 'focus' ? (
                <button
                  type="button"
                  onClick={handleSkipBreak}
                  title="Skip break and return to focus"
                  className="flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-elevated hover:bg-card text-text-main rounded-xl sm:rounded-2xl border border-border-subtle font-semibold text-xs transition-colors shadow-sm"
                >
                  <FastForward className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Skip Break</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStop}
                  title="Stop session and save actual focus duration"
                  className="p-2.5 sm:p-3 bg-elevated hover:bg-card text-text-main rounded-xl sm:rounded-2xl border border-border-subtle transition-colors shadow-sm"
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </button>
              )}
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                type="button"
                onClick={handleStart}
                className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all active:scale-[0.98] ${
                  sessionType === 'focus'
                    ? 'bg-primary hover:bg-primary-hover shadow-primary/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset timer to original duration"
                className="p-2.5 sm:p-3 bg-elevated hover:bg-card text-text-muted hover:text-text-main rounded-xl sm:rounded-2xl border border-border-subtle transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleStop}
                title="End session and record elapsed focus"
                className="p-2.5 sm:p-3 bg-elevated hover:bg-card text-text-main rounded-xl sm:rounded-2xl border border-border-subtle transition-colors shadow-sm"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>
            </>
          )}

          {status === 'completed' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-hover text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-primary/30 transition-all"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Start New Session</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenBreakModal('short_break')}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Coffee className="w-4 h-4" />
                <span>Take Break</span>
              </button>
            </div>
          )}
        </div>

        {/* BREAK ACTION CONTROLS BELOW TIMER */}
        <div className="w-full max-w-md sm:max-w-lg mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Break Controls
            </span>
            <span className="text-[11px] text-text-muted">
              {sessionType !== 'focus' ? 'Break active' : 'Rest anytime without penalty'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Short Break */}
            <button
              type="button"
              onClick={() => handleOpenBreakModal('short_break')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-elevated hover:bg-emerald-500/10 border border-border-subtle hover:border-emerald-500/40 text-text-main transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Coffee className="w-3.5 h-3.5" />
                <span>Short Break</span>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 font-medium">
                {focusSettings.shortBreakMinutes}m default
              </span>
            </button>

            {/* Long Break */}
            <button
              type="button"
              onClick={() => handleOpenBreakModal('long_break')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-elevated hover:bg-sky-500/10 border border-border-subtle hover:border-sky-500/40 text-text-main transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Long Break</span>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 font-medium">
                {focusSettings.longBreakMinutes}m default
              </span>
            </button>

            {/* Custom Break */}
            <button
              type="button"
              onClick={() => handleOpenBreakModal('custom')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-elevated hover:bg-primary-soft border border-border-subtle hover:border-primary/40 text-text-main transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom Break</span>
              </div>
              <span className="text-[10px] text-text-muted mt-0.5 font-medium">
                Pick minutes
              </span>
            </button>
          </div>
        </div>

        {/* POMODORO CYCLE PROGRESS INDICATOR (ONLY WHEN POMODORO MODE IS ACTIVE) */}
        {workflowMode === 'pomodoro' && (
          <div className="flex items-center gap-2 mt-2.5 sm:mt-3 px-3.5 py-1.5 bg-elevated rounded-full border border-border-subtle animate-fade-in shadow-sm">
            <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Cycle:
            </span>
            {Array.from({ length: focusSettings.longBreakInterval }).map((_, idx) => {
              const currentInInterval = completedPomodorosInCycle % focusSettings.longBreakInterval;
              const isDone = idx < currentInInterval;
              const isCurrent = idx === currentInInterval && sessionType === 'focus';
              return (
                <div
                  key={idx}
                  title={`Pomodoro ${idx + 1} of ${focusSettings.longBreakInterval}`}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-primary shadow-sm shadow-primary/50 scale-105'
                      : isCurrent
                      ? 'bg-primary/30 ring-2 ring-primary animate-pulse'
                      : 'bg-border-subtle dark:bg-slate-800 border border-border'
                  }`}
                />
              );
            })}
            <span className="text-[11px] text-text-muted ml-1.5 font-mono">
              ({(completedPomodorosInCycle % focusSettings.longBreakInterval)} of {focusSettings.longBreakInterval} sprints)
            </span>
          </div>
        )}

      </div>

      {/* Focus Analytics & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Focus Duration */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Focus Time Today</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-text-main">
            {formatDurationHuman(stats.totalFocusTimeTodaySeconds)}
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            {stats.todaySessionsCount} sessions completed today
          </p>
        </div>

        {/* This Week's Focus Time */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>This Week's Total</span>
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500/20" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-300">
            {formatDurationHuman(stats.totalFocusTimeWeekSeconds)}
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Excludes break times (pure focus)
          </p>
        </div>

        {/* Average Session Duration */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Average Session</span>
            <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-text-main">
            {stats.averageSessionMinutes} mins
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Across {stats.completedFocusCount} recorded sprints
          </p>
        </div>

        {/* Academic Link Coverage */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Subject-Linked</span>
            <BookOpen className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-text-main">
            {stats.subjectBreakdown.length} Subjects
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Deep work mapped to coursework
          </p>
        </div>
      </div>

      {/* 7-Day Daily Study Trend Chart & Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Study Trend Bar Chart */}
        <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Daily Study Hours (Past 7 Days)
            </h3>
            <span className="text-xs text-text-muted">Recorded Study Time</span>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Actual study hours logged through completed focus sessions
          </p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#8490A5" fontSize={11} tickLine={false} axisLine={{ stroke: '#E1E6F0' }} />
                <YAxis stroke="#8490A5" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(101, 88, 232, 0.06)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-card border border-border-subtle rounded-xl shadow-xl text-xs">
                          <div className="font-bold text-text-main">{data.date}</div>
                          <div className="text-primary font-semibold mt-1">
                            {data.hours} hours ({data.minutes} mins)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {stats.dailyTrend.map((entry, index) => (
                    <Cell 
                      key={`trend-${index}`} 
                      fill={entry.hours > 0 ? '#6558E8' : 'var(--color-border-subtle)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Study Time Breakdown */}
        <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              Subject Time Share
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Focus hours allocated per enrolled subject
            </p>

            <div className="space-y-3">
              {stats.subjectBreakdown.length === 0 ? (
                <div className="text-center py-6 text-text-muted text-xs">
                  No subject-linked sessions recorded yet.
                </div>
              ) : (
                stats.subjectBreakdown.map((sb) => {
                  const maxDuration = stats.subjectBreakdown[0]?.durationMinutes || 1;
                  const pct = Math.round((sb.durationMinutes / maxDuration) * 100);
                  return (
                    <div key={sb.subjectId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-text-main flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sb.color }} />
                          {sb.name}
                        </span>
                        <span className="text-text-muted text-[11px] font-mono">
                          {sb.durationHours}h ({sb.sessionsCount} sprints)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden border border-border-subtle/50">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: sb.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle text-center text-[11px] text-text-muted">
            Sessions without a subject are counted in overall study totals.
          </div>
        </div>
      </div>

      {/* Compact Recent Sessions History */}
      <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text-main">Recent Focus Sessions</h3>
          </div>
          <span className="text-xs text-text-muted">
            {focusSessions.length} total logged sessions
          </span>
        </div>

        {focusSessions.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-xs">
            No focus sessions logged yet. Hit "Start Focus Session" to record your first study sprint!
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {focusSessions.slice(0, 8).map((session) => {
              const sub = subjects.find(s => s.id === session.subjectId);
              const asg = assignments.find(a => a.id === session.assignmentId);
              const mins = Math.round(session.actualDurationSeconds / 60);

              return (
                <div key={session.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-main truncate">
                        {session.title || 'Focus Sprint'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-muted mt-0.5">
                        <span>{new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {session.workflowMode && (
                          <span className="px-1.5 py-0.5 rounded bg-elevated text-primary border border-border-subtle font-medium">
                            {session.workflowMode === 'pomodoro' ? 'Pomodoro' : 'Open Focus'}
                          </span>
                        )}
                        {sub && (
                          <span className="flex items-center gap-1 font-semibold text-text-main">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                            {sub.name}
                          </span>
                        )}
                        {asg && <span>• {asg.title}</span>}
                        {session.notes && <span className="italic truncate text-text-muted">• {session.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-primary font-mono">
                      {mins} mins
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteFocusSession(session.id)}
                      title="Delete session"
                      className="p-1 hover:text-rose-500 hover:bg-elevated rounded-md text-text-muted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Break Choice Modal */}
      <BreakChoiceModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        initialType={breakModalType}
        defaultShortMins={focusSettings.shortBreakMinutes}
        defaultLongMins={focusSettings.longBreakMinutes}
        isTimerRunning={status === 'running'}
        onConfirmBreak={handleConfirmBreak}
      />

      {/* Settings Modal */}
      <FocusSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={focusSettings}
        onSave={(s) => {
          saveFocusSettings(s);
          if (status === 'idle' && workflowMode === 'pomodoro') {
            const dur = s.focusDurationMinutes * 60 * 1000;
            setTotalDurationMs(dur);
            setRemainingMs(dur);
          }
        }}
      />

      {/* Complete Modal */}
      <FocusCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        sessionType={sessionType}
        durationSeconds={lastFinishedDuration}
        subject={activeSubject}
        assignment={activeAssignment}
        taskTitle={taskTitle}
        nextSessionType={nextSessionType}
        onSaveAndTransition={handleCompletionTransition}
      />
    </div>
  );
};
