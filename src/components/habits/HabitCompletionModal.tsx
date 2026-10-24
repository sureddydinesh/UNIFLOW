import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Habit, HabitLog } from '../../types';
import { renderHabitIcon } from './HabitIconHelper';
import { CheckCircle2, Plus, Minus, FileText } from 'lucide-react';

interface HabitCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  existingLog?: HabitLog;
  selectedDate: string;
  onSave: (habitId: string, date: string, isCompleted: boolean, currentValue?: number, notes?: string) => void;
}

export const HabitCompletionModal: React.FC<HabitCompletionModalProps> = ({
  isOpen,
  onClose,
  habit,
  existingLog,
  selectedDate,
  onSave,
}) => {
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const target = habit?.targetValue || 1;
  const unit = habit?.unit || 'units';

  useEffect(() => {
    if (existingLog) {
      setValue(existingLog.currentValue || (existingLog.isCompleted ? target : 0));
      setNotes(existingLog.notes || '');
    } else {
      setValue(0);
      setNotes('');
    }
  }, [existingLog, habit, isOpen]);

  if (!habit) return null;

  const progressPct = Math.min(100, Math.round((value / target) * 100));
  const isTargetReached = value >= target;

  const handleAdjust = (delta: number) => {
    setValue((prev) => Math.max(0, prev + delta));
  };

  const handleQuickComplete = () => {
    setValue(target);
    onSave(habit.id, selectedDate, true, target, notes);
    onClose();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const completed = value >= target;
    onSave(habit.id, selectedDate, completed, value, notes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Habit Progress"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Habit Header */}
        <div className="flex items-center gap-3 p-3.5 bg-elevated border border-border-subtle rounded-2xl">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ 
              backgroundColor: `${habit.color}20`, 
              borderColor: `${habit.color}45`,
              color: habit.color 
            }}
          >
            {renderHabitIcon(habit.icon, { className: 'w-6 h-6' })}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text-main truncate">{habit.title}</h4>
            <div className="text-xs text-text-muted mt-0.5">
              Target: <span className="font-semibold text-text-main">{target} {unit}</span> for {selectedDate}
            </div>
          </div>
        </div>

        {/* Live Progress Ring / Bar */}
        <div className="p-4 bg-elevated rounded-2xl border border-border-subtle">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-text-muted">Current Progress</span>
            <span className="font-bold text-text-main">
              {value} / {target} {unit} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${progressPct}%`,
                backgroundColor: habit.color 
              }}
            />
          </div>
          {isTargetReached && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Target reached! Daily completion achieved.
            </div>
          )}
        </div>

        {/* Counter Adjuster */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Record Progress ({unit})
          </label>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleAdjust(-10)}
              className="px-2.5 py-2 bg-elevated hover:bg-card border border-border-subtle text-text-main rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(-10 ? -1 : -1)}
              className="p-2 bg-elevated hover:bg-card border border-border-subtle text-text-main rounded-xl transition-colors shadow-sm"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
              className="w-24 text-center py-2 bg-card border border-border-subtle rounded-xl text-xl font-bold text-text-main focus:outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="p-2 bg-elevated hover:bg-card border border-border-subtle text-text-main rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(10)}
              className="px-2.5 py-2 bg-elevated hover:bg-card border border-border-subtle text-text-main rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              +10
            </button>
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Reflection / Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Solved two Hard DP problems today"
              className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder-text-muted/60 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleQuickComplete}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Target Reached ({target})
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-text-muted hover:text-text-main text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition-all"
            >
              Save Progress
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
