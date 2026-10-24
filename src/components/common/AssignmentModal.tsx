import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Assignment, AssignmentPriority, AssignmentStatus, AssignmentSubtask } from '../../types';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { generateId } from '../../services/storage';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentToEdit?: Assignment | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignmentToEdit,
}) => {
  const { subjects, saveAssignment } = useApp();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueAtDate, setDueAtDate] = useState('');
  const [dueAtTime, setDueAtTime] = useState('23:59');
  const [priority, setPriority] = useState<AssignmentPriority>('medium');
  const [status, setStatus] = useState<AssignmentStatus>('not_started');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [subtasks, setSubtasks] = useState<AssignmentSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setSubjectId(assignmentToEdit.subjectId);
      
      const dueObj = new Date(assignmentToEdit.dueAt);
      setDueAtDate(dueObj.toISOString().split('T')[0]);
      const hours = String(dueObj.getHours()).padStart(2, '0');
      const mins = String(dueObj.getMinutes()).padStart(2, '0');
      setDueAtTime(`${hours}:${mins}`);

      setPriority(assignmentToEdit.priority);
      setStatus(assignmentToEdit.status);
      setEstimatedMinutes(assignmentToEdit.estimatedMinutes || 60);
      setDescription(assignmentToEdit.description || '');
      setReferenceUrl(assignmentToEdit.referenceUrl || '');
      setSubtasks(assignmentToEdit.subtasks || []);
    } else {
      // Default new assignment
      setTitle('');
      setSubjectId(subjects[0]?.id || '');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setDueAtDate(tomorrow.toISOString().split('T')[0]);
      setDueAtTime('23:59');

      setPriority('medium');
      setStatus('not_started');
      setEstimatedMinutes(90);
      setDescription('');
      setReferenceUrl('');
      setSubtasks([]);
    }
    setError('');
  }, [assignmentToEdit, isOpen, subjects]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: generateId(), title: newSubtaskTitle.trim(), isCompleted: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an assignment title.');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!dueAtDate) {
      setError('Please choose a due date.');
      return;
    }

    const isoDueAt = new Date(`${dueAtDate}T${dueAtTime || '23:59'}:00`).toISOString();

    saveAssignment({
      id: assignmentToEdit?.id,
      title: title.trim(),
      subjectId,
      dueAt: isoDueAt,
      priority,
      status,
      estimatedMinutes: Number(estimatedMinutes) || 60,
      description: description.trim(),
      referenceUrl: referenceUrl.trim(),
      subtasks,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignmentToEdit ? 'Edit Academic Assignment' : 'Create New Assignment'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-status-error/15 border border-status-error/40 text-status-error rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Paper & Simulation"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as AssignmentPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 text-xs font-medium rounded-xl capitalize border transition-all ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-status-error/20 border-status-error text-status-error'
                        : p === 'medium'
                        ? 'bg-status-warning/20 border-status-warning text-status-warning'
                        : 'bg-emerald-custom/20 border-emerald-custom text-emerald-custom'
                      : 'bg-elevated border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Due Date *
            </label>
            <input
              type="date"
              required
              value={dueAtDate}
              onChange={(e) => setDueAtDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Due Time
            </label>
            <input
              type="time"
              value={dueAtTime}
              onChange={(e) => setDueAtTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Est. Minutes
            </label>
            <input
              type="number"
              min="10"
              step="15"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Workflow Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Reference Link / Repo (Optional)
            </label>
            <input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Description / Requirements
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add rubrics, grading notes, or references..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {/* Subtasks (TASK-09) */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Subtasks / Action Checklist ({subtasks.filter(s => s.isCompleted).length}/{subtasks.length})
          </label>
          <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto pr-1">
            {subtasks.map((st) => (
              <div 
                key={st.id} 
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-elevated text-xs border border-border-subtle"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => {
                      setSubtasks(prev => prev.map(item => item.id === st.id ? { ...item, isCompleted: !item.isCompleted } : item));
                    }}
                    className="rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span className={st.isCompleted ? 'line-through text-text-muted' : 'text-text-main'}>
                    {st.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(st.id)}
                  className="text-text-muted hover:text-status-error p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add step (e.g. 'Read Chapter 4', 'Write test harness')..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 rounded-xl text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>
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
            {assignmentToEdit ? 'Save Changes' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
