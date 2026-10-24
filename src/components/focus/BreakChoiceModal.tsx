import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Coffee, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface BreakChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'short_break' | 'long_break' | 'custom';
  defaultShortMins: number;
  defaultLongMins: number;
  isTimerRunning: boolean;
  onConfirmBreak: (durationMinutes: number, type: 'short_break' | 'long_break') => void;
}

const PRESET_BREAKS = [5, 10, 12, 15, 20, 25, 30];

export const BreakChoiceModal: React.FC<BreakChoiceModalProps> = ({
  isOpen,
  onClose,
  initialType,
  defaultShortMins,
  defaultLongMins,
  isTimerRunning,
  onConfirmBreak,
}) => {
  const [breakType, setBreakType] = useState<'short_break' | 'long_break' | 'custom'>(initialType);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);

  useEffect(() => {
    setBreakType(initialType);
    if (initialType === 'short_break') {
      setDurationMinutes(defaultShortMins || 5);
    } else if (initialType === 'long_break') {
      setDurationMinutes(defaultLongMins || 15);
    } else {
      setDurationMinutes(10);
    }
  }, [initialType, defaultShortMins, defaultLongMins, isOpen]);

  const handleSelectType = (type: 'short_break' | 'long_break' | 'custom') => {
    setBreakType(type);
    if (type === 'short_break') {
      setDurationMinutes(defaultShortMins || 5);
    } else if (type === 'long_break') {
      setDurationMinutes(defaultLongMins || 15);
    }
  };

  const handleConfirm = () => {
    const validMinutes = Math.max(1, Math.min(120, durationMinutes));
    const effectiveType = validMinutes >= 15 ? 'long_break' : 'short_break';
    onConfirmBreak(validMinutes, effectiveType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Take a Study Break"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Banner with Coffee Icon */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-main">Step away & recharge</h4>
            <p className="text-xs text-text-muted mt-0.5">
              Resting helps consolidate knowledge and prevents cognitive fatigue. Break time is strictly excluded from study statistics.
            </p>
          </div>
        </div>

        {/* Running warning */}
        {isTimerRunning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>A focus session is currently running. Starting a break will safely record your study time up to now.</span>
          </div>
        )}

        {/* Break Category Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Break Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('short_break')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                breakType === 'short_break'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                  : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
              }`}
            >
              <div className="text-xs font-bold">Short Break</div>
              <div className="text-[10px] text-text-muted mt-0.5">{defaultShortMins}m default</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('long_break')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                breakType === 'long_break'
                  ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                  : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
              }`}
            >
              <div className="text-xs font-bold">Long Break</div>
              <div className="text-[10px] text-text-muted mt-0.5">{defaultLongMins}m default</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('custom')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                breakType === 'custom'
                  ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                  : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
              }`}
            >
              <div className="text-xs font-bold">Custom</div>
              <div className="text-[10px] text-text-muted mt-0.5">Any duration</div>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Select or Adjust Duration
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_BREAKS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  durationMinutes === mins
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-elevated hover:bg-card text-text-main border border-border-subtle shadow-sm'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration Stepper */}
        <div className="p-3.5 bg-elevated rounded-2xl border border-border-subtle flex items-center justify-between">
          <span className="text-xs font-medium text-text-main flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Break Length:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDurationMinutes((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-lg bg-card hover:bg-elevated border border-border-subtle text-text-main font-bold flex items-center justify-center transition-colors shadow-sm"
            >
              -
            </button>
            <div className="flex items-center">
              <input
                type="number"
                min={1}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                className="w-14 text-center py-1 bg-card border border-border-subtle rounded-lg text-text-main font-extrabold text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              <span className="text-xs text-text-muted ml-1.5 font-semibold">min</span>
            </div>
            <button
              type="button"
              onClick={() => setDurationMinutes((prev) => Math.min(120, prev + 1))}
              className="w-8 h-8 rounded-lg bg-card hover:bg-elevated border border-border-subtle text-text-main font-bold flex items-center justify-center transition-colors shadow-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Selected Duration Preview Banner */}
        <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle text-center">
          <span className="text-xs text-text-muted">Selected Break: </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{durationMinutes} Minutes</span>
        </div>

        {/* Modal Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-card hover:bg-elevated text-text-main text-xs font-semibold border border-border-subtle transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Coffee className="w-4 h-4" />
            <span>Start {durationMinutes}m Break</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
