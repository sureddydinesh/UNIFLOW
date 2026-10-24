import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Subject, Assessment } from '../../types';
import { calculateSubjectAcademicSummary, getGradeDetails } from '../../utils/academicCalculations';
import { Calculator, Target, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface TargetGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  assessments: Assessment[];
  onUpdateTarget: (subjectId: string, targetPercentage: number) => void;
}

export const TargetGradeModal: React.FC<TargetGradeModalProps> = ({
  isOpen,
  onClose,
  subject,
  assessments,
  onUpdateTarget,
}) => {
  const [targetInput, setTargetInput] = useState<number>(
    subject?.targetPercentage || 85
  );

  const subjectAssessments = useMemo(() => {
    if (!subject) return [];
    return assessments.filter(a => a.subjectId === subject.id);
  }, [subject, assessments]);

  // Dynamic academic summary with temporary targetInput
  const summary = useMemo(() => {
    if (!subject) return null;
    const tempSubject: Subject = {
      ...subject,
      targetPercentage: targetInput,
    };
    return calculateSubjectAcademicSummary(tempSubject, subjectAssessments);
  }, [subject, subjectAssessments, targetInput]);

  if (!subject || !summary) return null;

  const currentGrade = getGradeDetails(summary.currentPercentage);
  const targetGrade = getGradeDetails(targetInput);

  const remainingAssessments = subjectAssessments.filter(a => a.obtainedMarks === null);

  const handleSaveTarget = () => {
    onUpdateTarget(subject.id, targetInput);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Target Grade & Score Calculator"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Subject Header */}
        <div className="flex items-center gap-3 p-3.5 bg-elevated rounded-2xl border border-border-subtle shadow-sm">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-bold text-sm shadow-sm"
            style={{ 
              backgroundColor: `${subject.color}20`, 
              borderColor: `${subject.color}40`,
              color: subject.color 
            }}
          >
            {subject.code ? subject.code.substring(0, 3) : 'SUB'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-main">{subject.name}</h4>
            <div className="text-[11px] text-text-muted">
              Scheme: <span className="font-semibold text-text-main capitalize">{subject.gradingScheme || 'weighted'}</span> • {subject.credits || 3} Credits
            </div>
          </div>
        </div>

        {/* Target Slider & Value */}
        <div className="p-4 bg-elevated rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-text-muted">
              Desired Target
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-primary font-mono">
                {targetInput}%
              </span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                Grade {targetGrade.letterGrade}
              </span>
            </div>
          </div>

          <input
            type="range"
            min={50}
            max={100}
            value={targetInput}
            onChange={(e) => setTargetInput(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
            <span>50% (Pass)</span>
            <span>75% (Distinction)</span>
            <span>90% (Outstanding)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-card rounded-xl border border-border-subtle shadow-sm">
              <span className="text-text-muted block text-[11px]">Current Recorded</span>
              <span className="text-base font-extrabold text-text-main">
                {summary.currentPercentage !== null ? `${summary.currentPercentage}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-text-muted block">
                {summary.gradedWeight}% weight evaluated
              </span>
            </div>

            <div className="p-3 bg-card rounded-xl border border-border-subtle shadow-sm">
              <span className="text-text-muted block text-[11px]">Remaining Work</span>
              <span className="text-base font-extrabold text-text-main">
                {100 - summary.gradedWeight}% Weight
              </span>
              <span className="text-[10px] text-text-muted block">
                {remainingAssessments.length} assessments left
              </span>
            </div>
          </div>

          {/* Achievability Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
            summary.isTargetAchievable
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}>
            {summary.isTargetAchievable ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold">
                {summary.isTargetAchievable ? 'Target is Mathematically Achievable!' : 'Target Exceeds Maximum Remaining Marks'}
              </div>
              <div className="mt-0.5 opacity-90 text-[11px] leading-relaxed">
                {summary.requiredRemainingPercentage !== null ? (
                  summary.isTargetAchievable ? (
                    <>
                      You need an average of <span className="font-black text-emerald-600 dark:text-emerald-200">{summary.requiredRemainingPercentage}%</span> across all remaining assessments to attain <span className="font-bold">{targetInput}%</span>.
                    </>
                  ) : (
                    <>
                      Even scoring 100% on all remaining work yields a maximum final projection of <span className="font-bold">{summary.projectedPercentage}%</span>.
                    </>
                  )
                ) : (
                  'All course assessments have already been graded.'
                )}
              </div>
            </div>
          </div>

          {/* Remaining assessments list */}
          {remainingAssessments.length > 0 && (
            <div className="p-3 bg-elevated rounded-xl border border-border-subtle text-xs shadow-sm">
              <span className="text-[11px] font-semibold text-text-muted block mb-1.5 uppercase">
                Remaining Deliverables ({remainingAssessments.length}):
              </span>
              <ul className="space-y-1">
                {remainingAssessments.map(a => (
                  <li key={a.id} className="flex justify-between text-text-main text-[11px]">
                    <span className="truncate">• {a.title}</span>
                    <span className="font-mono text-text-muted shrink-0">
                      {a.maximumMarks} marks {a.weightagePercentage ? `(${a.weightagePercentage}%)` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Institutional disclaimer */}
          <div className="flex items-start gap-1.5 text-[10px] text-text-muted leading-tight">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Disclaimer: Projections are computed strictly from student-entered scores and weights for planning purposes and do not substitute for official university evaluation boards.
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveTarget}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all"
          >
            Save Target ({targetInput}%)
          </button>
        </div>
      </div>
    </Modal>
  );
};
