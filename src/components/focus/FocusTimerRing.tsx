import React from 'react';
import { FocusModeType, FocusWorkflowMode } from '../../types';
import { formatTimerDisplay } from '../../utils/focusCalculations';

interface FocusTimerRingProps {
  remainingMs: number;
  totalDurationMs: number;
  sessionType: FocusModeType;
  workflowMode?: FocusWorkflowMode;
  isRunning: boolean;
  isPaused: boolean;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

export const FocusTimerRing: React.FC<FocusTimerRingProps> = ({
  remainingMs,
  totalDurationMs,
  sessionType,
  workflowMode = 'open_focus',
  isRunning,
  isPaused,
  status,
}) => {
  const safeRemainingMs = Math.max(0, Math.min(totalDurationMs, remainingMs));
  const fraction = totalDurationMs > 0 ? Math.max(0, Math.min(1, safeRemainingMs / totalDurationMs)) : 0;
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - fraction);

  // Palette based on session mode
  const getColors = () => {
    switch (sessionType) {
      case 'short_break':
        return {
          stroke: '#10B981', // Emerald
          glow: 'rgba(16, 185, 129, 0.25)',
          badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          badgeText: 'text-emerald-700 dark:text-emerald-400',
          badgeBorder: 'border-emerald-500/30',
          label: 'Short Break',
        };
      case 'long_break':
        return {
          stroke: '#38BDF8', // Sky / Cyan
          glow: 'rgba(56, 189, 248, 0.25)',
          badgeBg: 'bg-sky-500/10 dark:bg-sky-500/15',
          badgeText: 'text-sky-700 dark:text-sky-400',
          badgeBorder: 'border-sky-500/30',
          label: 'Long Break',
        };
      default:
        return {
          stroke: 'var(--color-primary)', // UniFlow Violet (#6558E8 light, #8B80FF dark)
          glow: 'rgba(var(--glow-primary-rgb), 0.25)',
          badgeBg: 'bg-primary/10',
          badgeText: 'text-primary',
          badgeBorder: 'border-primary/25',
          label: workflowMode === 'pomodoro' ? 'Pomodoro Focus' : 'Open Focus',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-0.5 sm:py-1">
      {/* Outer ambient glow - proportionally scaled */}
      <div 
        className={`absolute w-44 h-44 sm:w-52 sm:h-52 lg:w-60 lg:h-60 rounded-full blur-2xl sm:blur-3xl transition-opacity duration-700 pointer-events-none ${
          isRunning ? 'opacity-30 dark:opacity-40 animate-pulse' : 'opacity-10 dark:opacity-15'
        }`}
        style={{ backgroundColor: colors.stroke }}
      />

      <div className="relative flex items-center justify-center">
        {/* Subtle pale violet inner circle tint */}
        <div className="absolute w-32 h-32 sm:w-38 sm:h-38 lg:w-44 lg:h-44 rounded-full bg-primary/[0.04] dark:bg-primary/[0.02] pointer-events-none" />

        <svg 
          id="focus-timer-svg"
          className="w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] lg:w-[270px] lg:h-[270px] transform -rotate-90"
          viewBox="0 0 260 260"
        >
          {/* Background Track */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-border-subtle dark:text-slate-800/80"
          />

          {/* Animated Progress Ring */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
            style={{
              filter: isRunning ? `drop-shadow(0 0 6px ${colors.glow})` : undefined,
            }}
          />
        </svg>

        {/* Center Digital Display & Status */}
        <div className="absolute flex flex-col items-center justify-center text-center px-4">
          {/* Session Mode Badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border tracking-wide uppercase mb-1 sm:mb-1.5 ${colors.badgeBg} ${colors.badgeText} ${colors.badgeBorder}`}>
            {colors.label}
          </span>

          {/* Digital Timer Readout - readable, prominent, and proportional */}
          <div className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-text-main font-mono drop-shadow-sm leading-none py-1">
            {formatTimerDisplay(safeRemainingMs)}
          </div>

          {/* Status readout: Ready, Focusing, Paused, On Break, or Completed */}
          <div className="text-[11px] sm:text-xs mt-1 sm:mt-1.5 font-medium">
            {status === 'running' ? (
              sessionType === 'focus' ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Focusing
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping inline-block" />
                  On Break
                </span>
              )
            ) : status === 'paused' ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Paused
              </span>
            ) : status === 'completed' || safeRemainingMs === 0 ? (
              <span className="flex items-center gap-1.5 text-primary font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Completed
              </span>
            ) : (
              <span className="text-text-muted font-medium">Ready</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
