import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Habit, HabitCategory, HabitScheduleType, HabitTargetType } from '../../types';
import { HABIT_AVAILABLE_ICONS, HABIT_COLORS, renderHabitIcon } from './HabitIconHelper';
import { Clock, Target, Calendar, Check, AlertCircle } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }) => void;
  habitToEdit?: Habit | null;
}

const CATEGORIES: { id: HabitCategory; label: string }[] = [
  { id: 'study', label: 'Study & Academic' },
  { id: 'health', label: 'Health & Hydration' },
  { id: 'fitness', label: 'Fitness & Workout' },
  { id: 'reading', label: 'Reading & Lit' },
  { id: 'personal_development', label: 'Personal Growth' },
  { id: 'sleep_routine', label: 'Sleep & Rest' },
  { id: 'custom', label: 'Custom Category' },
];

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  habitToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory | string>('study');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [color, setColor] = useState('#8B80FF');
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyTargetDays, setWeeklyTargetDays] = useState<number>(4);
  const [targetType, setTargetType] = useState<HabitTargetType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(30);
  const [unit, setUnit] = useState<string>('mins');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setCustomCategoryName(habitToEdit.customCategoryName || '');
      setIcon(habitToEdit.icon || 'BookOpen');
      setColor(habitToEdit.color || '#8B80FF');
      setScheduleType(habitToEdit.scheduleType || 'daily');
      setSelectedDays(habitToEdit.selectedDays || [1, 2, 3, 4, 5]);
      setWeeklyTargetDays(habitToEdit.weeklyTargetDays || 4);
      setTargetType(habitToEdit.targetType || 'boolean');
      setTargetValue(habitToEdit.targetValue || 30);
      setUnit(habitToEdit.unit || 'mins');
      setReminderTime(habitToEdit.reminderTime || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('study');
      setCustomCategoryName('');
      setIcon('BookOpen');
      setColor('#8B80FF');
      setScheduleType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setWeeklyTargetDays(4);
      setTargetType('boolean');
      setTargetValue(30);
      setUnit('mins');
      setReminderTime('');
    }
    setError(null);
  }, [habitToEdit, isOpen]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        setError('At least one day must be scheduled');
        return;
      }
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required');
      return;
    }

    if (category === 'custom' && !customCategoryName.trim()) {
      setError('Please provide a name for your custom category');
      return;
    }

    if (scheduleType === 'selected_days' && selectedDays.length === 0) {
      setError('Please select at least one day of the week');
      return;
    }

    if (targetType === 'measurable' && (!targetValue || targetValue <= 0)) {
      setError('Measurable habit target must be greater than 0');
      return;
    }

    onSave({
      id: habitToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      category: category === 'custom' ? 'custom' : category,
      customCategoryName: category === 'custom' ? customCategoryName.trim() : undefined,
      icon,
      color,
      scheduleType,
      selectedDays: scheduleType === 'selected_days' ? selectedDays : undefined,
      weeklyTargetDays: scheduleType === 'weekly' ? weeklyTargetDays : undefined,
      targetType,
      targetValue: targetType === 'measurable' ? Number(targetValue) : 1,
      unit: targetType === 'measurable' ? unit.trim() : undefined,
      reminderTime: reminderTime.trim() || undefined,
      isArchived: habitToEdit?.isArchived || false,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habitToEdit ? 'Edit Habit' : 'Create New Habit'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title & Preview */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Habit Name *
          </label>
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors shadow-sm"
              style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, color }}
            >
              {renderHabitIcon(icon, { className: 'w-5 h-5' })}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily LeetCode Problem, Read 20 Pages..."
              className="w-full px-4 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder-text-muted/60 text-sm focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Description or Motivation (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Master dynamic programming before campus placements"
            className="w-full px-4 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder-text-muted/60 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Icon & Color Picker Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-elevated border border-border-subtle rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
              {HABIT_AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    title={item.label}
                    onClick={() => setIcon(item.id)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary ring-2 ring-primary scale-105'
                        : 'text-text-muted hover:text-text-main hover:bg-card'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5 p-3 bg-elevated border border-border-subtle rounded-xl">
              {HABIT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-white/60 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-card text-text-main">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {category === 'custom' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Custom Category Name *
              </label>
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="e.g. Music Practice"
                className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Optional Reminder Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Schedule Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Routine Schedule
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily', label: 'Every Day', desc: '7 days a week' },
              { id: 'selected_days', label: 'Specific Days', desc: 'Custom weekdays' },
              { id: 'weekly', label: 'Weekly Target', desc: 'e.g. 4x / week' },
            ].map((st) => (
              <button
                type="button"
                key={st.id}
                onClick={() => setScheduleType(st.id as HabitScheduleType)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  scheduleType === st.id
                    ? 'bg-primary/10 border-primary text-primary font-medium'
                    : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
                }`}
              >
                <div className="text-xs font-bold">{st.label}</div>
                <div className="text-[10px] opacity-75">{st.desc}</div>
              </button>
            ))}
          </div>

          {/* Days of week selector if selected_days */}
          {scheduleType === 'selected_days' && (
            <div className="mt-3 flex items-center justify-between gap-1.5 p-2 bg-elevated rounded-xl border border-border-subtle">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d.day);
                return (
                  <button
                    type="button"
                    key={d.day}
                    onClick={() => toggleDay(d.day)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-muted hover:text-text-main hover:bg-card'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Weekly target count if weekly */}
          {scheduleType === 'weekly' && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-elevated rounded-xl border border-border-subtle">
              <span className="text-xs text-text-muted">Days per week:</span>
              <input
                type="range"
                min={1}
                max={6}
                value={weeklyTargetDays}
                onChange={(e) => setWeeklyTargetDays(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-xs font-bold text-primary min-w-14 text-right">
                {weeklyTargetDays} days / wk
              </span>
            </div>
          )}
        </div>

        {/* Target Type: Boolean vs Measurable */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Measurement & Goal
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setTargetType('boolean')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                targetType === 'boolean'
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
              }`}
            >
              <div className="text-xs font-bold">Yes / No Completion</div>
              <div className="text-[10px] opacity-75">Check off when done</div>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('measurable')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                targetType === 'measurable'
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-elevated border-border-subtle text-text-muted hover:text-text-main hover:bg-card'
              }`}
            >
              <div className="text-xs font-bold">Measurable Target</div>
              <div className="text-[10px] opacity-75">Track minutes, pages, ml...</div>
            </button>
          </div>

          {targetType === 'measurable' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-elevated rounded-xl border border-border-subtle">
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Daily Target Value *
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-card border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Unit of Measurement *
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. mins, pages, ml, sets"
                  className="w-full px-3 py-1.5 bg-card border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main hover:bg-elevated text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
          >
            {habitToEdit ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
