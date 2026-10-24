import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FocusSettings } from '../../types';
import { playChimeSound } from '../../utils/focusCalculations';
import { Volume2, VolumeX, Sliders, Bell } from 'lucide-react';

interface FocusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FocusSettings;
  onSave: (settings: FocusSettings) => void;
}

export const FocusSettingsModal: React.FC<FocusSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [focusMins, setFocusMins] = useState(25);
  const [shortBreakMins, setShortBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setFocusMins(settings.focusDurationMinutes);
      setShortBreakMins(settings.shortBreakMinutes);
      setLongBreakMins(settings.longBreakMinutes);
      setLongBreakInterval(settings.longBreakInterval);
      setAutoStartBreaks(settings.autoStartBreaks);
      setAutoStartFocus(settings.autoStartFocus);
      setSoundEnabled(settings.soundEnabled);
    }
  }, [settings, isOpen]);

  const handleTestSound = () => {
    playChimeSound('focus_complete');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      focusDurationMinutes: Math.max(1, focusMins),
      shortBreakMinutes: Math.max(1, shortBreakMins),
      longBreakMinutes: Math.max(1, longBreakMins),
      longBreakInterval: Math.max(1, longBreakInterval),
      autoStartBreaks,
      autoStartFocus,
      soundEnabled,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Timer Settings"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Durations */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Session Durations (Minutes)
          </label>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-elevated rounded-xl border border-border-subtle shadow-sm">
              <span className="block text-[11px] text-text-muted mb-1 font-medium">Focus</span>
              <input
                type="number"
                min={1}
                max={120}
                value={focusMins}
                onChange={(e) => setFocusMins(Number(e.target.value))}
                className="w-full text-center py-1 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div className="p-3 bg-elevated rounded-xl border border-border-subtle shadow-sm">
              <span className="block text-[11px] text-text-muted mb-1 font-medium">Short Break</span>
              <input
                type="number"
                min={1}
                max={30}
                value={shortBreakMins}
                onChange={(e) => setShortBreakMins(Number(e.target.value))}
                className="w-full text-center py-1 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            <div className="p-3 bg-elevated rounded-xl border border-border-subtle shadow-sm">
              <span className="block text-[11px] text-text-muted mb-1 font-medium">Long Break</span>
              <input
                type="number"
                min={1}
                max={60}
                value={longBreakMins}
                onChange={(e) => setLongBreakMins(Number(e.target.value))}
                className="w-full text-center py-1 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-sm focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Interval */}
        <div className="p-3.5 bg-elevated rounded-xl border border-border-subtle flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-text-main">Long Break Interval</div>
            <div className="text-[11px] text-text-muted">
              Offer a 15-minute break after every N completed focus sessions
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2}
              max={8}
              value={longBreakInterval}
              onChange={(e) => setLongBreakInterval(Number(e.target.value))}
              className="w-16 text-center py-1 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-sm focus:outline-none focus:border-primary shadow-sm"
            />
          </div>
        </div>

        {/* Automation Toggles */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Automation & Transitions
          </label>

          <label className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border-subtle cursor-pointer hover:bg-card transition-colors shadow-sm">
            <div>
              <span className="text-xs font-bold text-text-main block">Auto-start Breaks</span>
              <span className="text-[11px] text-text-muted block">
                Automatically start countdown for short or long break
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border-subtle cursor-pointer hover:bg-card transition-colors shadow-sm">
            <div>
              <span className="text-xs font-bold text-text-main block">Auto-start Focus</span>
              <span className="text-[11px] text-text-muted block">
                Automatically start next focus session when break concludes
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoStartFocus}
              onChange={(e) => setAutoStartFocus(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </label>
        </div>

        {/* Audio notification */}
        <div className="p-3.5 bg-elevated rounded-xl border border-border-subtle flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-text-muted" />
            )}
            <div>
              <div className="text-xs font-bold text-text-main">Session Chime Sound</div>
              <div className="text-[11px] text-text-muted">
                Play harmonious synthesized bell when timer ends
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSound}
              className="px-2.5 py-1 bg-card hover:bg-elevated text-text-main border border-border-subtle rounded-lg text-[10px] font-semibold transition-colors shadow-sm"
            >
              Test Sound
            </button>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md shadow-primary/30 transition-all active:scale-[0.98]"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </Modal>
  );
};
