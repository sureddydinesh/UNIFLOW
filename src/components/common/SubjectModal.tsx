import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Subject } from '../../types';
import { useApp } from '../../context/AppContext';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

const COLOR_PALETTE = [
  '#8B80FF', // Primary Violet
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#EC4899', // Pink
  '#A855F7', // Purple
  '#F43F5E', // Rose
  '#10B981', // Teal
  '#6366F1', // Indigo
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit,
}) => {
  const { profile, saveSubject } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#8B80FF');
  const [semester, setSemester] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [targetPercentage, setTargetPercentage] = useState<number>(85);
  const [gradingScheme, setGradingScheme] = useState<'weighted' | 'raw_percentage'>('weighted');
  const [error, setError] = useState('');

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setCode(subjectToEdit.code || '');
      setColor(subjectToEdit.color || '#8B80FF');
      setSemester(subjectToEdit.semester || profile?.semester || 'Semester 1');
      setInstructor(subjectToEdit.instructor || '');
      setCredits(subjectToEdit.credits || 3);
      setTargetPercentage(subjectToEdit.targetPercentage || 85);
      setGradingScheme(subjectToEdit.gradingScheme || 'weighted');
    } else {
      setName('');
      setCode('');
      setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      setSemester(profile?.semester || 'Semester 1');
      setInstructor('');
      setCredits(3);
      setTargetPercentage(85);
      setGradingScheme('weighted');
    }
    setError('');
  }, [subjectToEdit, isOpen, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    saveSubject({
      id: subjectToEdit?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      color,
      semester,
      instructor: instructor.trim() || undefined,
      credits: Number(credits) || 3,
      targetPercentage: Number(targetPercentage) || 85,
      gradingScheme,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subjectToEdit ? 'Edit Subject' : 'Add Academic Subject'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-status-error/15 border border-status-error/40 text-status-error rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Subject / Course Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Distributed Database Systems"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CSE3002"
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Semester
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Semester 5"
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Credits, Target & Grading Scheme */}
        <div className="grid grid-cols-3 gap-2.5 p-3 bg-elevated rounded-xl border border-border-subtle shadow-sm">
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Credits
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full text-center py-1.5 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-xs focus:outline-none focus:border-primary shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Target %
            </label>
            <input
              type="number"
              min={40}
              max={100}
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full text-center py-1.5 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-xs focus:outline-none focus:border-primary shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Grading
            </label>
            <select
              value={gradingScheme}
              onChange={(e) => setGradingScheme(e.target.value as any)}
              className="w-full py-1.5 bg-card border border-border-subtle rounded-lg text-text-main font-bold text-[11px] focus:outline-none focus:border-primary text-center shadow-sm"
            >
              <option value="weighted" className="bg-card text-text-main">Weighted</option>
              <option value="raw_percentage" className="bg-card text-text-main">Raw %</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Instructor / Professor
          </label>
          <input
            type="text"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            placeholder="e.g. Prof. R. Raman"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Subject Tag Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-canvas' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
              />
            ))}
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
            {subjectToEdit ? 'Save Changes' : 'Add Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
