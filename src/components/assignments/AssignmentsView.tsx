import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { formatDate, formatTime, getRemainingTimeString } from '../../utils/formatters';
import { AssignmentModal } from '../common/AssignmentModal';
import { Assignment, AssignmentPriority, AssignmentStatus } from '../../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fadeUpVariants, 
  staggerContainerVariants, 
  AnimatedNumber, 
  EASE_PREMIUM 
} from '../../utils/motion';

export const AssignmentsView: React.FC = () => {
  const { 
    assignments, 
    subjects, 
    deleteAssignment, 
    toggleSubtask, 
    toggleAssignmentComplete,
    academicSummary 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus | 'overdue'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'priority' | 'status'>('due_asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(asg => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = asg.title.toLowerCase().includes(query);
        const matchesDesc = (asg.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Subject Filter
      if (subjectFilter !== 'all' && asg.subjectId !== subjectFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'all' && asg.priority !== priorityFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'overdue') {
        const isOverdue = new Date(asg.dueAt).getTime() < new Date().getTime() && asg.status !== 'completed';
        return isOverdue;
      }
      return asg.status === statusFilter;
    }).sort((a, b) => {
      if (sortBy === 'due_asc') {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      } else if (sortBy === 'due_desc') {
        return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
      } else if (sortBy === 'priority') {
        const pOrder: Record<AssignmentPriority, number> = { high: 3, medium: 2, low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      } else if (sortBy === 'status') {
        const sOrder: Record<AssignmentStatus, number> = { not_started: 1, in_progress: 2, completed: 3 };
        return sOrder[a.status] - sOrder[b.status];
      }
      return 0;
    });
  }, [assignments, searchQuery, statusFilter, subjectFilter, priorityFilter, sortBy]);

  const toggleSubtasksExpand = (id: string) => {
    setExpandedSubtasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCompleteWithCelebration = (asg: Assignment) => {
    const willBeCompleted = asg.status !== 'completed';
    toggleAssignmentComplete(asg.id);
    if (willBeCompleted) {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 }
      });
    }
  };

  const getSubject = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  return (
    <motion.div 
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAssignmentToEdit(null);
        }}
        assignmentToEdit={assignmentToEdit}
      />

      {/* Header and Task Metrics Banner (TASK-08) */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border-subtle shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary">
              Module C • Academic Workload
            </span>
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-text-main">
            Assignments & Deadlines
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Track problem sets, lab reports, essays, and exam deliverables.
          </p>
        </div>

        {/* Analytics Pills with AnimatedNumber */}
        <div className="flex items-center gap-3">
          <div className="p-3 px-4 rounded-2xl bg-elevated border border-border-subtle text-center">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Completion</p>
            <p className="text-lg font-extrabold font-heading text-emerald-custom">
              <AnimatedNumber value={academicSummary.completionRate} formatter={v => `${v}%`} />
            </p>
          </div>
          <div className="p-3 px-4 rounded-2xl bg-elevated border border-border-subtle text-center">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Workload</p>
            <p className="text-lg font-extrabold font-heading text-primary">
              <AnimatedNumber value={academicSummary.totalEstimatedHours} formatter={v => `${v}h`} />
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setAssignmentToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-3 rounded-2xl bg-primary text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-2 shadow-glow-primary transition-all whitespace-nowrap btn-action"
          >
            <Plus className="w-4 h-4" /> Add Assignment
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filters Bar with sliding tab indicator */}
      <motion.div 
        variants={fadeUpVariants}
        className="p-4 rounded-2xl bg-card border border-border-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title or notes..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter Tabs with Animated active indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 relative">
          {[
            { id: 'all', label: 'All' },
            { id: 'not_started', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Done' },
            { id: 'overdue', label: 'Overdue' },
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-text-muted hover:text-text-main hover:bg-elevated/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-primary rounded-xl shadow-sm z-0"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none"
          >
            <option value="due_asc">Earliest Due</option>
            <option value="due_desc">Latest Due</option>
            <option value="priority">Highest Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </motion.div>

      {/* Assignment Cards List with AnimatePresence */}
      {filteredAssignments.length === 0 ? (
        <motion.div 
          variants={fadeUpVariants}
          className="p-12 text-center rounded-3xl bg-card border border-dashed border-border-subtle"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-custom/40 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-text-main">No assignments found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try modifying your search query or status filter.'
              : 'You have not added any assignments yet. Click "+ Add Assignment" to get started.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setAssignmentToEdit(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-glow-primary"
          >
            + Create Assignment
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAssignments.map((asg) => {
              const isCompleted = asg.status === 'completed';
              const sub = getSubject(asg.subjectId);
              const remaining = getRemainingTimeString(asg.dueAt, isCompleted);
              const isOverdue = remaining.isOverdue;
              const isDueSoon = remaining.isDueSoon;
              const hasSubtasks = asg.subtasks && asg.subtasks.length > 0;
              const completedSubtasks = asg.subtasks?.filter(s => s.isCompleted).length || 0;
              const isExpanded = expandedSubtasks[asg.id];

              return (
                <motion.div
                  key={asg.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: EASE_PREMIUM }}
                  className={`p-4 sm:p-5 rounded-3xl bg-card border shadow-card card-hover cursor-pointer ${
                    isCompleted 
                      ? 'border-border-subtle opacity-70 hover:opacity-100' 
                      : isOverdue 
                      ? 'border-status-error/50 bg-status-error/5 row-overdue' 
                      : isDueSoon
                      ? 'border-status-warning/40 row-conflict'
                      : 'border-border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleCompleteWithCelebration(asg)}
                        title={isCompleted ? 'Mark not completed' : 'Mark completed'}
                        className="mt-0.5 text-text-muted hover:text-emerald-custom transition-colors flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-custom" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </motion.button>

                      <div className="min-w-0">
                        {/* Subject & Priority Chips */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {sub && (
                            <span 
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}

                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            asg.priority === 'high' 
                              ? 'bg-status-error/20 text-status-error'
                              : asg.priority === 'medium'
                              ? 'bg-status-warning/20 text-status-warning'
                              : 'bg-emerald-custom/20 text-emerald-custom'
                          }`}>
                            {asg.priority} priority
                          </span>

                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-elevated text-text-muted capitalize">
                            {asg.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-base font-bold font-heading text-text-main ${
                          isCompleted ? 'line-through text-text-muted' : ''
                        }`}>
                          {asg.title}
                        </h3>

                        {/* Description */}
                        {asg.description && (
                          <p className="text-xs text-text-muted mt-1 max-w-2xl">
                            {asg.description}
                          </p>
                        )}

                        {/* Deadline & Meta info */}
                        <div className="flex items-center gap-4 mt-2.5 text-xs text-text-muted flex-wrap">
                          <span className={`font-semibold flex items-center gap-1 ${
                            isOverdue 
                              ? 'text-status-error font-bold' 
                              : isDueSoon 
                              ? 'text-status-warning font-bold' 
                              : 'text-text-main'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {remaining.text} ({formatDate(asg.dueAt)} • {formatTime(asg.dueAt)})
                          </span>

                          {asg.estimatedMinutes && (
                            <span>Est: {Math.round(asg.estimatedMinutes / 60 * 10) / 10}h</span>
                          )}

                          {asg.referenceUrl && (
                            <a
                              href={asg.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Reference Link
                            </a>
                          )}

                          {hasSubtasks && (
                            <button
                              onClick={() => toggleSubtasksExpand(asg.id)}
                              className="text-primary font-semibold hover:underline flex items-center gap-1"
                            >
                              <span>Subtasks ({completedSubtasks}/{asg.subtasks.length})</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setAssignmentToEdit(asg);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-muted hover:text-text-main transition-colors"
                        title="Edit assignment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          if (window.confirm('Delete this assignment?')) {
                            deleteAssignment(asg.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-elevated border border-border-subtle hover:border-status-error text-text-muted hover:text-status-error transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                  </div>

                  {/* Subtasks Accordion with AnimatePresence */}
                  <AnimatePresence>
                    {hasSubtasks && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE_PREMIUM }}
                        className="overflow-hidden mt-4 pt-3 border-t border-border-subtle space-y-1.5 pl-8"
                      >
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                          Checklist Action Items
                        </p>
                        {asg.subtasks.map((st) => (
                          <motion.div 
                            key={st.id} 
                            whileHover={{ x: 2 }}
                            onClick={() => toggleSubtask(asg.id, st.id)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 hover:bg-elevated cursor-pointer transition-colors text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={st.isCompleted}
                              onChange={() => {}} // handled by parent onClick
                              className="rounded text-primary focus:ring-primary accent-primary"
                            />
                            <span className={st.isCompleted ? 'line-through text-text-muted' : 'text-text-main font-medium'}>
                              {st.title}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
