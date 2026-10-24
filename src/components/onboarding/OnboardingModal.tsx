import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_PREMIUM } from '../../utils/motion';
import { UniFlowLogo } from '../brand/UniFlowLogo';

interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { profile, completeOnboarding } = useApp();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [university, setUniversity] = useState(profile?.university || 'Vellore Institute of Technology');
  const [degree, setDegree] = useState(profile?.degree || 'B.Tech');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(profile?.academicYear || 'Year 1');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 1');
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [subjectsList, setSubjectsList] = useState<string[]>([
    'Data Structures & Algorithms',
    'Computer Architecture',
    'Discrete Mathematics'
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  if (!isOpen) return null;

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    setSubjectsList(prev => [...prev, newSubjectInput.trim()]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (idx: number) => {
    setSubjectsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = () => {
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 }
    });

    completeOnboarding(
      {
        fullName,
        university,
        degree,
        department,
        academicYear,
        semester,
      },
      subjectsList,
      monthlyBudget
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE_PREMIUM }}
        className="w-full max-w-xl bg-card border border-border-subtle rounded-3xl shadow-2xl p-6 sm:p-8 text-text-main flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UniFlowLogo variant="icon" size="xs" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Setup Wizard
              </span>
            </div>
            <span className="text-xs text-text-muted font-medium">
              Step {step} of 4
            </span>
          </div>

          <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="bg-primary h-full"
              initial={false}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.35, ease: EASE_PREMIUM }}
            />
          </div>
        </div>

        {/* Animated Steps Container */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              className="space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-3">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-heading">Let's set up your student profile</h2>
                <p className="text-sm text-text-muted mt-1">
                  Tell us where you study so we can personalize your timetable, semesters, and assignments.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    University / College Name
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Vellore Institute of Technology"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Degree Program
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. B.Tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Department / Major
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Academic Year
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Year 1">Year 1 (Freshman)</option>
                      <option value="Year 2">Year 2 (Sophomore)</option>
                      <option value="Year 3">Year 3 (Junior)</option>
                      <option value="Year 4">Year 4 (Senior)</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Current Semester
                    </label>
                    <input
                      type="text"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Semester 1"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              className="space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-heading">Add your enrolled subjects</h2>
                <p className="text-sm text-text-muted mt-1">
                  You'll use these to schedule classes, track laboratory hours, and assign deadlines.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    placeholder="Add course name (e.g. Database Systems)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAddSubject}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-primary-hover"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </motion.button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subjectsList.map((sub, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-sm"
                    >
                      <span className="font-medium text-text-main flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {sub}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(idx)}
                        className="text-text-muted hover:text-status-error p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-text-muted">You can easily add, edit, or color-code more subjects anytime later.</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              className="space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-custom/20 text-emerald-custom flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold font-heading">Set your monthly spending budget</h2>
                <p className="text-sm text-text-muted mt-1">
                  UniFlow tracks your daily expenses, food, transit, and courseware against this target.
                </p>
              </div>

              <div className="space-y-4 pt-3">
                <div className="p-4 rounded-2xl bg-elevated border border-border-subtle">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Target Monthly Budget (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xl font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-card border border-border-subtle text-text-main font-bold text-2xl tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[5000, 10000, 15000, 20000].map(amt => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={amt}
                      type="button"
                      onClick={() => setMonthlyBudget(amt)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        monthlyBudget === amt 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-elevated text-text-muted border-border-subtle hover:border-text-muted'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </motion.button>
                  ))}
                </div>

                <div className="text-xs text-text-muted p-3 rounded-xl bg-elevated/50 border border-border-subtle">
                  💡 <span className="font-semibold text-text-main">Automatic Threshold Alerts:</span> UniFlow will alert you when your monthly expenditure crosses 80% and 100% of this budget.
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              className="space-y-4 text-center py-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-custom/20 text-emerald-custom flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold font-heading">You are all set, {fullName.split(' ')[0]}!</h2>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Your personalized workspace has been initialized with your university profile, subjects, and budget.
              </p>

              <div className="p-4 rounded-2xl bg-elevated border border-border-subtle text-left space-y-2 mt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Student:</span>
                  <span className="font-semibold text-text-main">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">University:</span>
                  <span className="font-semibold text-text-main">{university}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Enrolled Subjects:</span>
                  <span className="font-semibold text-text-main">{subjectsList.length} courses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Monthly Budget:</span>
                  <span className="font-semibold text-emerald-custom">₹{monthlyBudget.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Default Theme:</span>
                  <span className="font-semibold text-primary">Theme B — Midnight Intelligence</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-border-subtle flex justify-between items-center mt-auto">
          {step > 1 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-elevated flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover flex items-center gap-1.5 transition-colors shadow-glow-primary"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleComplete}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-custom text-white hover:opacity-90 flex items-center gap-1.5 transition-all shadow-glow-emerald-sm"
            >
              Launch My Workspace <Sparkles className="w-4 h-4" />
            </motion.button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
