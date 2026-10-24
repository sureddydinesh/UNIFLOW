import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CalendarEvent, EventType } from '../../types';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string; // YYYY-MM-DD
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
}) => {
  const { subjects, events, saveEvent } = useApp();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('class');
  const [subjectId, setSubjectId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setEventType(eventToEdit.eventType);
      setSubjectId(eventToEdit.subjectId || '');

      const start = new Date(eventToEdit.startAt);
      const end = new Date(eventToEdit.endAt);
      setEventDate(start.toISOString().split('T')[0]);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);

      setLocation(eventToEdit.location || '');
      setDescription(eventToEdit.description || '');
      setIsRecurring(eventToEdit.isRecurring);
      setRecurringDays(eventToEdit.recurringDays || [1, 3, 5]);
    } else {
      setTitle('');
      setEventType('class');
      setSubjectId(subjects[0]?.id || '');
      setEventDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:30');
      setLocation('');
      setDescription('');
      setIsRecurring(false);
      setRecurringDays([1, 3, 5]);
    }
    setConflictWarning(null);
    setError('');
  }, [eventToEdit, isOpen, subjects, initialDate]);

  // Conflict detection preview
  useEffect(() => {
    if (!eventDate || !startTime || !endTime) return;
    const startMs = new Date(`${eventDate}T${startTime}:00`).getTime();
    const endMs = new Date(`${eventDate}T${endTime}:00`).getTime();

    if (endMs <= startMs) {
      setConflictWarning(null);
      return;
    }

    const overlapping = events.find(e => {
      if (eventToEdit && e.id === eventToEdit.id) return false;
      const eStart = new Date(e.startAt).getTime();
      const eEnd = new Date(e.endAt).getTime();
      return startMs < eEnd && endMs > eStart;
    });

    if (overlapping) {
      setConflictWarning(`Conflict detected: Overlaps with "${overlapping.title}" (${new Date(overlapping.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(overlapping.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`);
    } else {
      setConflictWarning(null);
    }
  }, [eventDate, startTime, endTime, events, eventToEdit]);

  const toggleDay = (dayNum: number) => {
    setRecurringDays(prev => 
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!eventDate) {
      setError('Please select an event date.');
      return;
    }

    const startIso = new Date(`${eventDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${eventDate}T${endTime}:00`).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('End time must be strictly after start time.');
      return;
    }

    saveEvent({
      id: eventToEdit?.id,
      title: title.trim(),
      eventType,
      subjectId: subjectId || undefined,
      startAt: startIso,
      endAt: endIso,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      isRecurring,
      recurringDays: isRecurring ? recurringDays : undefined,
    });

    onClose();
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Schedule Event' : 'Add Schedule Event'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-status-error/15 border border-status-error/40 text-status-error rounded-xl">
            {error}
          </div>
        )}

        {conflictWarning && (
          <div className="p-3 text-xs bg-status-warning/15 border border-status-warning/40 text-status-warning rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Schedule Overlap Alert (CAL-06)</p>
              <p>{conflictWarning}</p>
              <p className="mt-1 text-[11px] opacity-80">You can still proceed if this is an intentional concurrent event.</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Operating Systems Lecture"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Event Category
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm capitalize"
            >
              <option value="class">Class / Lecture</option>
              <option value="lab">Laboratory Session</option>
              <option value="exam">Examination / Test</option>
              <option value="personal">Personal / Study Group</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Linked Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">(None / General)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Start Time *
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> End Time *
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Location / Room / Link
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hall 302, Science Block or Google Meet"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {/* Weekly Recurrence (CAL-04) */}
        <div className="p-3.5 rounded-xl bg-elevated/60 border border-border-subtle space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded text-primary focus:ring-primary accent-primary w-4 h-4"
            />
            <span>Repeat weekly on schedule</span>
          </label>

          {isRecurring && (
            <div className="pt-2">
              <span className="text-xs text-text-muted block mb-1.5">Repeat on days:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map(d => {
                  const active = recurringDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        active 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-card text-text-muted border-border-subtle hover:border-text-muted'
                      }`}
                    >
                      {dayLabels[d]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Notes / Syllabus Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key topics to review, professor office hours..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-glow-primary"
          >
            {eventToEdit ? 'Save Changes' : 'Schedule Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
