import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Download, 
  Trash2, 
  Edit2,
  Sparkles
} from 'lucide-react';
import { formatTime, formatDate, exportScheduleToICS } from '../../utils/formatters';
import { EventModal } from '../common/EventModal';
import { CalendarEvent, EventType } from '../../types';
import { detectCalendarConflicts } from '../../utils/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fadeUpVariants, 
  scaleInVariants, 
  staggerContainerVariants, 
  EASE_PREMIUM 
} from '../../utils/motion';

export const CalendarView: React.FC = () => {
  const { 
    events, 
    assignments, 
    subjects, 
    deleteEvent 
  } = useApp();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [initialDateForNewEvent, setInitialDateForNewEvent] = useState<string | undefined>(undefined);

  // Compute current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    // Start on Monday (1)
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + currentWeekOffset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentWeekOffset]);

  // Expand recurring events and integrate assignments
  const calendarItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: EventType | 'assignment_due';
      startAt: string;
      endAt: string;
      location?: string;
      description?: string;
      subjectId?: string;
      isOriginalEvent: boolean;
      originalEvent?: CalendarEvent;
      assignmentPriority?: string;
    }> = [];

    // Add regular and recurring calendar events
    events.forEach(ev => {
      if (filterType !== 'all' && ev.eventType !== filterType) return;

      if (!ev.isRecurring) {
        items.push({
          id: ev.id,
          title: ev.title,
          type: ev.eventType,
          startAt: ev.startAt,
          endAt: ev.endAt,
          location: ev.location,
          description: ev.description,
          subjectId: ev.subjectId,
          isOriginalEvent: true,
          originalEvent: ev,
        });
      } else if (ev.recurringDays && ev.recurringDays.length > 0) {
        // Expand for current view week
        const evStart = new Date(ev.startAt);
        const evEnd = new Date(ev.endAt);
        const durationMs = evEnd.getTime() - evStart.getTime();

        weekDates.forEach(date => {
          const dayOfWeek = date.getDay();
          if (ev.recurringDays?.includes(dayOfWeek)) {
            const occurrenceStart = new Date(date);
            occurrenceStart.setHours(evStart.getHours(), evStart.getMinutes(), 0, 0);
            const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);

            items.push({
              id: `${ev.id}_rec_${date.toISOString().slice(0, 10)}`,
              title: ev.title,
              type: ev.eventType,
              startAt: occurrenceStart.toISOString(),
              endAt: occurrenceEnd.toISOString(),
              location: ev.location,
              description: ev.description,
              subjectId: ev.subjectId,
              isOriginalEvent: true,
              originalEvent: ev,
            });
          }
        });
      }
    });

    // CAL-07: Integrate Assignment Deadlines into Calendar
    if (filterType === 'all' || filterType === 'assignment') {
      assignments.forEach(asg => {
        const dueDate = new Date(asg.dueAt);
        const endDate = new Date(dueDate.getTime() + 30 * 60000); // 30 min block
        items.push({
          id: `asg_${asg.id}`,
          title: `[Due] ${asg.title}`,
          type: 'assignment_due',
          startAt: asg.dueAt,
          endAt: endDate.toISOString(),
          description: `Assignment Deadline • Priority: ${asg.priority}. Status: ${asg.status}`,
          subjectId: asg.subjectId,
          isOriginalEvent: false,
          assignmentPriority: asg.priority,
        });
      });
    }

    return items;
  }, [events, assignments, weekDates, filterType]);

  // Conflict detection for current week items
  const conflicts = useMemo(() => {
    const rawEvents: CalendarEvent[] = calendarItems.map(item => ({
      id: item.id,
      userId: '',
      title: item.title,
      eventType: item.type === 'assignment_due' ? 'assignment' : item.type,
      startAt: item.startAt,
      endAt: item.endAt,
      isRecurring: false,
      createdAt: '',
    }));
    return detectCalendarConflicts(rawEvents);
  }, [calendarItems]);

  const getSubjectColor = (subjectId?: string) => {
    if (!subjectId) return '#8B80FF';
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.color : '#8B80FF';
  };

  const handleEditClick = (ev: CalendarEvent) => {
    setSelectedEvent(null);
    setEventToEdit(ev);
    setIsEventModalOpen(true);
  };

  const handleDeleteClick = (evId: string) => {
    if (window.confirm('Are you sure you want to remove this scheduled event?')) {
      deleteEvent(evId);
      setSelectedEvent(null);
    }
  };

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return (
    <motion.div 
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
          setInitialDateForNewEvent(undefined);
        }}
        eventToEdit={eventToEdit}
        initialDate={initialDateForNewEvent}
      />

      {/* Calendar Header Controls */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border-subtle shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-elevated p-1 rounded-2xl border border-border-subtle">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              aria-label="Previous week"
              className="p-1.5 rounded-xl hover:bg-card text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentWeekOffset(0)}
              className="px-3 py-1 text-xs font-semibold rounded-xl hover:bg-card text-text-main transition-colors"
            >
              Today
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              aria-label="Next week"
              className="p-1.5 rounded-xl hover:bg-card text-text-muted hover:text-text-main transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div>
            <h2 className="text-lg font-bold font-heading text-text-main">
              {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
            </h2>
            <p className="text-xs text-text-muted">
              {calendarItems.length} commitments this week
            </p>
          </div>
        </div>

        {/* Filters, Export & Add Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-elevated border border-border-subtle text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Events & Deadlines</option>
            <option value="class">Classes Only</option>
            <option value="lab">Labs Only</option>
            <option value="exam">Exams Only</option>
            <option value="assignment">Assignment Deadlines Only</option>
            <option value="personal">Personal / Study</option>
          </select>

          {/* CAL-10: Calendar Export */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => exportScheduleToICS(events, assignments)}
            title="Export to standard iCalendar (.ics)"
            className="px-3 py-2 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-main text-xs font-medium flex items-center gap-1.5 transition-all btn-action"
          >
            <Download className="w-3.5 h-3.5 text-primary" /> Export iCal
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary transition-all btn-action"
          >
            <Plus className="w-4 h-4" /> Add Event
          </motion.button>
        </div>
      </motion.div>

      {/* CAL-06: Schedule Conflict Warning Banner */}
      {conflicts.size > 0 && (
        <motion.div 
          variants={fadeUpVariants}
          className="p-4 rounded-2xl bg-status-warning/10 border border-status-warning/40 text-xs flex items-center gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0 animate-pulse" />
          <span className="text-text-main">
            <strong className="text-status-warning">Schedule Conflict Detected (CAL-06):</strong> You have overlapping classes or appointments highlighted with amber borders on your grid.
          </span>
        </motion.div>
      )}

      {/* CAL-08: Subjects Color Legend */}
      <motion.div variants={fadeUpVariants} className="flex items-center gap-2 flex-wrap px-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1">
          Courses:
        </span>
        {subjects.map(sub => (
          <span 
            key={sub.id} 
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-card border border-border-subtle font-medium text-text-main transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
            {sub.name} ({sub.code || 'N/A'})
          </span>
        ))}
      </motion.div>

      {/* CAL-01: Weekly Time Grid View with layout animation */}
      <motion.div 
        variants={fadeUpVariants}
        className="rounded-3xl bg-card border border-border-subtle shadow-sm overflow-x-auto"
      >
        <div className="min-w-[760px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-border-subtle bg-elevated/40">
            <div className="p-3 text-center border-r border-border-subtle text-xs font-semibold text-text-muted">
              Time
            </div>
            {weekDates.map((d, index) => {
              const isToday = d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div 
                  key={index} 
                  className={`p-3 text-center border-r border-border-subtle last:border-r-0 transition-colors ${
                    isToday ? 'bg-primary/10' : ''
                  }`}
                >
                  <p className="text-xs font-medium text-text-muted uppercase">{dayName}</p>
                  <p className={`text-base font-bold font-heading ${isToday ? 'text-primary' : 'text-text-main'}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="divide-y divide-border-subtle">
            {hours.map((hour) => {
              const timeLabel = hour < 12 ? `${hour} AM` : (hour === 12 ? '12 PM' : `${hour - 12} PM`);

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[72px]">
                  {/* Time label column */}
                  <div className="p-2 text-right pr-3 border-r border-border-subtle text-[11px] font-semibold text-text-muted tabular-nums select-none bg-elevated/20">
                    {timeLabel}
                  </div>

                  {/* 7 Days Columns for this hour */}
                  {weekDates.map((d, dIdx) => {
                    const dateStr = d.toISOString().slice(0, 10);

                    // Find events matching this date and starting in this hour
                    const slotEvents = calendarItems.filter(item => {
                      const itemDate = new Date(item.startAt).toISOString().slice(0, 10);
                      const itemHour = new Date(item.startAt).getHours();
                      return itemDate === dateStr && itemHour === hour;
                    });

                    return (
                      <div 
                        key={dIdx} 
                        onClick={() => {
                          if (slotEvents.length === 0) {
                            setInitialDateForNewEvent(dateStr);
                            setIsEventModalOpen(true);
                          }
                        }}
                        className="p-1 border-r border-border-subtle last:border-r-0 hover:bg-elevated/30 transition-colors relative group cursor-pointer"
                      >
                        {slotEvents.map(ev => {
                          const isConflicting = conflicts.has(ev.id);
                          const isDeadline = ev.type === 'assignment_due';
                          const subColor = getSubjectColor(ev.subjectId);

                          return (
                            <motion.div
                              key={ev.id}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.14 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ev.originalEvent) {
                                  setSelectedEvent(ev.originalEvent);
                                }
                              }}
                              style={{ 
                                borderLeftColor: subColor,
                                borderLeftWidth: '4px',
                              }}
                              className={`p-2 rounded-xl text-left mb-1 transition-colors shadow-sm cursor-pointer ${
                                isConflicting 
                                  ? 'bg-status-warning/15 border border-status-warning/60 text-status-warning'
                                  : isDeadline
                                  ? 'bg-primary/20 border border-primary/40 text-primary'
                                  : 'bg-elevated border border-border-subtle text-text-main'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[10px] uppercase font-bold truncate">
                                  {isDeadline ? '⚡ Due' : ev.type}
                                </span>
                                <span className="text-[10px] text-text-muted tabular-nums">
                                  {formatTime(ev.startAt).replace(' ', '')}
                                </span>
                              </div>
                              <p className="font-semibold text-xs truncate">
                                {ev.title}
                              </p>
                              {ev.location && (
                                <p className="text-[10px] text-text-muted truncate flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {ev.location}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Event Details Inspector Card with AnimatePresence */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            variants={scaleInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-6 rounded-3xl bg-card border border-border-subtle shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/20 text-primary">
                  {selectedEvent.eventType}
                </span>
                <h3 className="text-xl font-bold font-heading text-text-main mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleEditClick(selectedEvent)}
                  className="p-2 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-muted hover:text-text-main transition-colors"
                  title="Edit event"
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleDeleteClick(selectedEvent.id)}
                  className="p-2 rounded-xl bg-elevated border border-border-subtle hover:border-status-error text-text-muted hover:text-status-error transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-elevated text-text-muted hover:text-text-main"
                >
                  Close
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div>
                <span className="text-text-muted block mb-1">Time & Duration:</span>
                <span className="font-semibold text-text-main flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {formatDate(selectedEvent.startAt)} • {formatTime(selectedEvent.startAt)} – {formatTime(selectedEvent.endAt)}
                </span>
              </div>

              {selectedEvent.location && (
                <div>
                  <span className="text-text-muted block mb-1">Location / Venue:</span>
                  <span className="font-semibold text-text-main flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {selectedEvent.location}
                  </span>
                </div>
              )}

              {selectedEvent.isRecurring && (
                <div>
                  <span className="text-text-muted block mb-1">Schedule Pattern:</span>
                  <span className="font-semibold text-emerald-custom flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Recurring Weekly
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <p className="mt-4 text-xs text-text-muted p-3 rounded-xl bg-elevated border border-border-subtle">
                {selectedEvent.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
