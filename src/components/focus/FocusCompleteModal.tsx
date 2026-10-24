import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FocusModeType, Subject, Assignment } from '../../types';
import { Sparkles, Coffee, Play, CheckCircle2, FileText } from 'lucide-react';

interface FocusCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: FocusModeType;
  durationSeconds: number;
  subject?: Subject;
  assignment?: Assignment;
  taskTitle: string;
  nextSessionType: FocusModeType;
  onSaveAndTransition: (notes: string, nextAction: 'break' | 'focus' | 'dashboard' | 'finish') => void;
}

export const FocusCompleteModal: React.FC<FocusCompleteModalProps> = ({
  isOpen,
  onClose,
  sessionType,
  durationSeconds,
  subject,
  assignment,
  taskTitle,
  nextSessionType,
  onSaveAndTransition,
}) => {
  const [notes, setNotes] = useState('');

  const mins = Math.round(durationSeconds / 60);
  const isFocus = sessionType === 'focus';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFocus ? 'Focus Session Completed!' : 'Break Time Concluded'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Banner */}
        <div className={`p-4 rounded-2xl border text-center ${
          isFocus 
            ? 'bg-primary/10 border-primary/25' 
            : 'bg-emerald-500/10 border-emerald-500/25'
        }`}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"
            style={{ 
              backgroundColor: isFocus ? 'rgba(101, 88, 232, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
              color: isFocus ? 'var(--color-primary)' : '#10B981' 
            }}
          >
            {isFocus ? <Sparkles className="w-6 h-6" /> : <Coffee className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-black text-text-main">
            {isFocus ? 'Great Job! Solid Focus Logged' : 'Refreshed & Ready'}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {isFocus 
              ? `You dedicated ${mins} focused minutes to ${taskTitle || 'your studies'}.`
              : 'Break time is over. Ready to dive into the next study sprint?'}
          </p>
        </div>

        {/* Linked subject/assignment pills */}
        {(subject || assignment) && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-elevated rounded-xl border border-border-subtle text-xs">
            {subject && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card font-semibold text-text-main border border-border-subtle shadow-sm">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
            {assignment && (
              <span className="px-2.5 py-1 rounded-lg bg-card text-text-muted border border-border-subtle shadow-sm">
                Assignment: {assignment.title}
              </span>
            )}
          </div>
        )}

        {/* Accomplishment notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            What did you accomplish? (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Read chapter 4 on B-Trees, solved 3 practice problems"
              className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder:text-text-muted text-xs focus:outline-none focus:border-primary transition-colors custom-scrollbar shadow-sm"
            />
          </div>
        </div>

        {/* Action Choice Buttons: Break, Focus, or Return to Dashboard */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-text-muted mb-2 uppercase tracking-wider">
            Choose what to do next:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {isFocus ? (
              <>
                <button
                  type="button"
                  onClick={() => onSaveAndTransition(notes, 'break')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Take a Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSaveAndTransition(notes, 'focus')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Another Focus</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSaveAndTransition(notes, 'focus')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Study</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSaveAndTransition(notes, 'break')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Another Break</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSaveAndTransition(notes, 'dashboard')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-elevated hover:bg-card text-text-main text-xs font-semibold border border-border-subtle transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>To Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
