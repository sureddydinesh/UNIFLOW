import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Assessment, AssessmentType, AssessmentStatus, Subject } from '../../types';
import { AlertCircle, Calendar, Percent, Award } from 'lucide-react';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  assessmentToEdit?: Assessment | null;
  defaultSubjectId?: string;
  onSave: (assessment: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }) => void;
}

const ASSESSMENT_TYPES: { id: AssessmentType; label: string }[] = [
  { id: 'cat1', label: 'CAT 1 (Continuous Assessment 1)' },
  { id: 'cat2', label: 'CAT 2 (Continuous Assessment 2)' },
  { id: 'midterm', label: 'Midterm Examination' },
  { id: 'final_exam', label: 'End-Semester / Final Exam' },
  { id: 'quiz', label: 'Quiz / Formative Test' },
  { id: 'assignment', label: 'Graded Assignment' },
  { id: 'lab_evaluation', label: 'Lab Evaluation / Practical' },
  { id: 'project', label: 'Course Project / Capstone' },
  { id: 'custom', label: 'Custom Assessment' },
];

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  subjects,
  assessmentToEdit,
  defaultSubjectId,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('cat1');
  const [maximumMarks, setMaximumMarks] = useState<number>(100);
  const [obtainedMarksStr, setObtainedMarksStr] = useState<string>('');
  const [weightagePercentage, setWeightagePercentage] = useState<number>(20);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<AssessmentStatus>('upcoming');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentToEdit) {
      setTitle(assessmentToEdit.title);
      setSubjectId(assessmentToEdit.subjectId);
      setAssessmentType(assessmentToEdit.assessmentType);
      setMaximumMarks(assessmentToEdit.maximumMarks);
      setObtainedMarksStr(
        assessmentToEdit.obtainedMarks !== undefined && assessmentToEdit.obtainedMarks !== null
          ? String(assessmentToEdit.obtainedMarks)
          : ''
      );
      setWeightagePercentage(assessmentToEdit.weightagePercentage || 20);
      setAssessmentDate(assessmentToEdit.assessmentDate);
      setStatus(assessmentToEdit.status);
      setNotes(assessmentToEdit.notes || '');
    } else {
      setTitle('');
      setSubjectId(defaultSubjectId || (subjects[0]?.id || ''));
      setAssessmentType('cat1');
      setMaximumMarks(50);
      setObtainedMarksStr('');
      setWeightagePercentage(20);
      setAssessmentDate(new Date().toISOString().split('T')[0]);
      setStatus('upcoming');
      setNotes('');
    }
    setError(null);
  }, [assessmentToEdit, defaultSubjectId, subjects, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Assessment title is required');
      return;
    }

    if (!subjectId) {
      setError('Please select a subject');
      return;
    }

    if (!maximumMarks || maximumMarks <= 0) {
      setError('Maximum marks must be greater than 0');
      return;
    }

    let parsedObtained: number | null = null;
    if (obtainedMarksStr.trim() !== '') {
      parsedObtained = Number(obtainedMarksStr);
      if (isNaN(parsedObtained)) {
        setError('Obtained marks must be a valid number');
        return;
      }
      if (parsedObtained < 0) {
        setError('Obtained marks cannot be negative');
        return;
      }
      if (parsedObtained > maximumMarks) {
        setError(`Obtained marks cannot exceed maximum marks (${maximumMarks})`);
        return;
      }
    }

    if (weightagePercentage < 0 || weightagePercentage > 100) {
      setError('Weightage percentage must be between 0% and 100%');
      return;
    }

    // Auto set status to graded if obtained marks is provided and status was upcoming
    const finalStatus: AssessmentStatus = 
      parsedObtained !== null 
        ? (status === 'upcoming' ? 'graded' : status) 
        : (status === 'graded' ? 'upcoming' : status);

    onSave({
      id: assessmentToEdit?.id,
      title: title.trim(),
      subjectId,
      assessmentType,
      maximumMarks: Number(maximumMarks),
      obtainedMarks: parsedObtained,
      weightagePercentage: Number(weightagePercentage),
      assessmentDate,
      status: finalStatus,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assessmentToEdit ? 'Edit Assessment' : 'Add Academic Assessment'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
            Assessment Name *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Continuous Assessment Test 1 (CAT-1)"
            className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder:text-text-muted text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>

        {/* Subject & Assessment Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Subject *
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-card text-text-main">
                  {s.code ? `[${s.code}] ` : ''}{s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Assessment Type
            </label>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
              className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id} className="bg-card text-text-main">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Marks and Weightage Row */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-elevated rounded-2xl border border-border-subtle shadow-sm">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Max Marks *
            </label>
            <input
              type="number"
              min={1}
              required
              value={maximumMarks}
              onChange={(e) => setMaximumMarks(Number(e.target.value))}
              className="w-full text-center py-2 bg-card border border-border-subtle rounded-xl text-text-main font-bold text-sm focus:outline-none focus:border-primary shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Obtained Marks
            </label>
            <input
              type="number"
              step="0.5"
              min={0}
              max={maximumMarks}
              value={obtainedMarksStr}
              onChange={(e) => setObtainedMarksStr(e.target.value)}
              placeholder="Ungraded"
              className="w-full text-center py-2 bg-card border border-border-subtle rounded-xl text-primary font-bold text-sm focus:outline-none focus:border-primary placeholder:text-text-muted shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1">
              Weightage %
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={weightagePercentage}
                onChange={(e) => setWeightagePercentage(Number(e.target.value))}
                className="w-full text-center py-2 bg-card border border-border-subtle rounded-xl text-text-main font-bold text-sm focus:outline-none focus:border-primary pr-5 shadow-sm"
              />
              <span className="absolute right-2 top-2 text-xs text-text-muted font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Date & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Assessment Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              <input
                type="date"
                required
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-xs focus:outline-none focus:border-primary transition-colors shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssessmentStatus)}
              className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
            >
              <option value="upcoming" className="bg-card text-text-main">Upcoming (Not Conducted)</option>
              <option value="pending_eval" className="bg-card text-text-main">Pending Evaluation (Conducted)</option>
              <option value="graded" className="bg-card text-text-main">Graded (Marks Published)</option>
            </select>
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
            Syllabus / Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Modules 1, 2, and 3; closed-book examination"
            className="w-full px-3.5 py-2.5 bg-card border border-border-subtle rounded-xl text-text-main placeholder:text-text-muted text-xs focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md shadow-primary/30 transition-all active:scale-[0.98]"
          >
            {assessmentToEdit ? 'Save Changes' : 'Record Assessment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
