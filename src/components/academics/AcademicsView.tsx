import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject, Assessment, AssessmentType, AssessmentStatus } from '../../types';
import { 
  calculateSemesterAcademicSummary, 
  getGradeDetails 
} from '../../utils/academicCalculations';
import { AssessmentModal } from './AssessmentModal';
import { TargetGradeModal } from './TargetGradeModal';
import { SubjectModal } from '../common/SubjectModal';
import { 
  Plus, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Filter, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Cell 
} from 'recharts';

export const AcademicsView: React.FC = () => {
  const { 
    subjects, 
    assessments, 
    saveSubject, 
    deleteSubject, 
    saveAssessment, 
    deleteAssessment 
  } = useApp();

  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [targetModalSubject, setTargetModalSubject] = useState<Subject | null>(null);
  const [deleteConfirmAssessmentId, setDeleteConfirmAssessmentId] = useState<string | null>(null);

  // Compute semester-level academic summary
  const semesterSummary = useMemo(() => {
    return calculateSemesterAcademicSummary(subjects, assessments);
  }, [subjects, assessments]);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (selectedSubjectFilter !== 'all' && a.subjectId !== selectedSubjectFilter) return false;
      if (selectedTypeFilter !== 'all' && a.assessmentType !== selectedTypeFilter) return false;
      if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) return false;
      return true;
    });
  }, [assessments, selectedSubjectFilter, selectedTypeFilter, selectedStatusFilter]);

  // Chart Data: Subject Performance vs Target
  const subjectChartData = useMemo(() => {
    return semesterSummary.subjectSummaries.map((s) => ({
      name: s.subject.code || s.subject.name.substring(0, 10),
      fullName: s.subject.name,
      current: s.currentPercentage !== null ? s.currentPercentage : 0,
      target: s.targetPercentage,
      color: s.subject.color,
    }));
  }, [semesterSummary]);

  // Handle Target Update from Calculator Modal
  const handleUpdateTarget = (subjectId: string, newTarget: number) => {
    const sub = subjects.find(s => s.id === subjectId);
    if (sub) {
      saveSubject({
        ...sub,
        targetPercentage: newTarget,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-text-main tracking-tight">
              Academic Progress & Grade Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Semester 4
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Track coursework assessments, compute credit-weighted SGPA, and evaluate target grade feasibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-card border border-border-subtle hover:bg-elevated text-text-main rounded-2xl text-xs font-bold transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Manage Subjects</span>
          </button>

          <button
            onClick={() => {
              setEditingAssessment(null);
              setIsAssessmentModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 transition-all active:scale-[0.98] btn-action"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Credit-weighted SGPA */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Projected SGPA</span>
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary font-mono">
              {semesterSummary.overallSGPA !== null ? semesterSummary.overallSGPA.toFixed(2) : 'N/A'}
            </span>
            <span className="text-xs text-text-muted">/ 10.0</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Credit-weighted across {semesterSummary.totalCredits} enrolled credits
          </p>
        </div>

        {/* Metric 2: Overall Academic Average */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-main font-mono">
              {semesterSummary.averagePercentage !== null ? `${semesterSummary.averagePercentage}%` : 'N/A'}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Grade {getGradeDetails(semesterSummary.averagePercentage).letterGrade}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Weighted across evaluated deliverables
          </p>
        </div>

        {/* Metric 3: Strongest Subject */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Strongest Course</span>
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          {semesterSummary.strongestSubject ? (
            <div>
              <div className="text-base font-bold text-text-main truncate">
                {semesterSummary.strongestSubject.subject.name}
              </div>
              <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {semesterSummary.strongestSubject.currentPercentage}% (Grade {semesterSummary.strongestSubject.letterGrade})
              </div>
            </div>
          ) : (
            <div className="text-xs text-text-muted mt-2">Pending grade data</div>
          )}
          <p className="text-[11px] text-text-muted mt-2">Highest recorded percentage</p>
        </div>

        {/* Metric 4: Upcoming Assessments */}
        <div className="card-hover p-4 rounded-2xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span>Upcoming Tests</span>
            <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-main font-mono">
              {semesterSummary.upcomingAssessments.length}
            </span>
            <span className="text-xs text-text-muted">pending</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            {semesterSummary.recentGradedAssessments.length} assessments already graded
          </p>
        </div>
      </div>

      {/* Performance vs Target Chart & Upcoming Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance vs Target Bar Chart */}
        <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Course Performance vs Target (%)
            </h3>
            <span className="text-xs text-text-muted">Current vs Target</span>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Compare actual evaluated percentage against your set grade targets
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#8490A5" fontSize={11} tickLine={false} axisLine={{ stroke: '#E1E6F0' }} />
                <YAxis stroke="#8490A5" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(101, 88, 232, 0.06)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-card border border-border-subtle rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-bold text-text-main">{data.fullName}</div>
                          <div className="text-primary font-semibold">Current: {data.current}%</div>
                          <div className="text-text-muted">Target: {data.target}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
                />
                <Bar dataKey="current" name="Current Score %" fill="#6558E8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="target" name="Target Goal %" fill="#38BDF8" opacity={0.6} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Assessments Timeline */}
        <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Upcoming Deadlines
              </h3>
              <span className="text-xs text-text-muted font-semibold">
                {semesterSummary.upcomingAssessments.length}
              </span>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Next scheduled evaluations & exams
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {semesterSummary.upcomingAssessments.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-xs">
                  No upcoming assessments scheduled.
                </div>
              ) : (
                semesterSummary.upcomingAssessments.map((a) => {
                  const sub = subjects.find(s => s.id === a.subjectId);
                  return (
                    <div 
                      key={a.id} 
                      className="p-2.5 rounded-xl bg-elevated border border-border-subtle shadow-sm flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-main truncate">
                          {a.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
                          {sub && (
                            <span className="flex items-center gap-1 font-semibold text-text-main">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                              {sub.code || sub.name}
                            </span>
                          )}
                          <span>• {a.maximumMarks} marks</span>
                          {a.weightagePercentage && <span>• {a.weightagePercentage}%</span>}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-card border border-border-subtle text-text-main shadow-sm shrink-0">
                        {new Date(a.assessmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setEditingAssessment(null);
              setIsAssessmentModalOpen(true);
            }}
            className="w-full mt-3 py-2 bg-elevated hover:bg-card text-text-main rounded-xl text-xs font-semibold border border-border-subtle transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Upcoming Test
          </button>
        </div>
      </div>

      {/* Subject-by-Subject Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Subject Scorecards & Target Calculator
          </h3>
          <span className="text-xs text-text-muted">
            {semesterSummary.subjectSummaries.length} Enrolled Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesterSummary.subjectSummaries.map((summary) => {
            const { subject, currentPercentage, projectedPercentage, targetPercentage, letterGrade, gradePoints, isTargetAchievable, gradedWeight } = summary;

            return (
              <div 
                key={subject.id}
                className="card-hover p-4 rounded-3xl bg-card border border-border-subtle shadow-sm flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-bold text-xs shadow-sm"
                        style={{ 
                          backgroundColor: `${subject.color}20`, 
                          borderColor: `${subject.color}45`,
                          color: subject.color 
                        }}
                      >
                        {subject.code ? subject.code.substring(0, 3) : 'SUB'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-text-main truncate">
                          {subject.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                          <span>{subject.code || 'NO-CODE'}</span>
                          <span>• {subject.credits || 3} Credits</span>
                          <span className="capitalize">• {subject.gradingScheme || 'weighted'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grade Badge */}
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-primary/10 text-primary border border-primary/20">
                        {letterGrade} ({gradePoints.toFixed(1)})
                      </span>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="p-3 bg-elevated rounded-2xl border border-border-subtle mb-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text-muted">Current Score</span>
                      <span className="font-black text-text-main font-mono">
                        {currentPercentage !== null ? `${currentPercentage}%` : 'Pending'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-border-subtle dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${currentPercentage || 0}%`, 
                          backgroundColor: subject.color 
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-muted mt-1.5 font-medium">
                      <span>Evaluated: {gradedWeight}% weight</span>
                      <span>Target: {targetPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Target Calculator CTA & Manage Buttons */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                  <button
                    onClick={() => setTargetModalSubject(subject)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-semibold border border-primary/20 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Target Calculator
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSubject(subject);
                        setIsSubjectModalOpen(true);
                      }}
                      title="Edit Course"
                      className="p-1.5 hover:text-text-main hover:bg-elevated rounded-lg text-text-muted transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${subject.name}? This will remove related timetable events and assessments.`)) {
                          deleteSubject(subject.id);
                        }
                      }}
                      title="Delete Course"
                      className="p-1.5 hover:text-rose-500 hover:bg-elevated rounded-lg text-text-muted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Records Table with Filters */}
      <div className="card-hover p-5 rounded-3xl bg-card border border-border-subtle shadow-sm">
        {/* Table Header and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              All Course Assessments & Marks
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Complete evaluation records with obtained marks, weightage, and status
            </p>
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-card border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all" className="bg-card text-text-main">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id} className="bg-card text-text-main">{s.code || s.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-card border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all" className="bg-card text-text-main">All Types</option>
              <option value="cat1" className="bg-card text-text-main">CAT 1</option>
              <option value="cat2" className="bg-card text-text-main">CAT 2</option>
              <option value="midterm" className="bg-card text-text-main">Midterm</option>
              <option value="final_exam" className="bg-card text-text-main">Final Exam</option>
              <option value="quiz" className="bg-card text-text-main">Quiz</option>
              <option value="assignment" className="bg-card text-text-main">Assignment</option>
              <option value="lab_evaluation" className="bg-card text-text-main">Lab Practical</option>
              <option value="project" className="bg-card text-text-main">Project</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-card border border-border-subtle rounded-xl text-xs text-text-main focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all" className="bg-card text-text-main">All Statuses</option>
              <option value="graded" className="bg-card text-text-main">Graded</option>
              <option value="upcoming" className="bg-card text-text-main">Upcoming</option>
              <option value="pending_eval" className="bg-card text-text-main">Pending Eval</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredAssessments.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-xs">
            No assessments match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated text-text-muted font-bold border-b border-border-subtle select-none">
                <tr>
                  <th className="py-3 px-3">Assessment</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-center">Marks</th>
                  <th className="py-3 px-3 text-center">Percentage</th>
                  <th className="py-3 px-3 text-center">Weight</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredAssessments.map((assessment) => {
                  const sub = subjects.find(s => s.id === assessment.subjectId);
                  const isGraded = assessment.status === 'graded' && assessment.obtainedMarks !== null && assessment.obtainedMarks !== undefined;
                  const pct = isGraded 
                    ? Math.round((assessment.obtainedMarks! / assessment.maximumMarks) * 100) 
                    : null;

                  return (
                    <tr key={assessment.id} className="hover:bg-elevated/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-text-main">
                        <div>{assessment.title}</div>
                        {assessment.notes && (
                          <div className="text-[10px] text-text-muted font-normal truncate max-w-xs">
                            {assessment.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {sub ? (
                          <span className="flex items-center gap-1.5 font-semibold text-text-main">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                            {sub.code || sub.name}
                          </span>
                        ) : (
                          <span className="text-text-muted">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-text-muted font-mono text-[11px]">
                        {assessment.assessmentDate}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {isGraded ? (
                          <span className="text-text-main">
                            {assessment.obtainedMarks} / {assessment.maximumMarks}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">-- / {assessment.maximumMarks}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-extrabold">
                        {pct !== null ? (
                          <span className={pct >= 85 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 70 ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}>
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-text-muted">--</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-text-muted">
                        {assessment.weightagePercentage ? `${assessment.weightagePercentage}%` : '--'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          assessment.status === 'graded'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : assessment.status === 'pending_eval'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-elevated text-text-muted border border-border-subtle'
                        }`}>
                          {assessment.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingAssessment(assessment);
                              setIsAssessmentModalOpen(true);
                            }}
                            title="Edit Assessment"
                            className="p-1 hover:text-text-main hover:bg-elevated rounded-md text-text-muted transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmAssessmentId(assessment.id)}
                            title="Delete Assessment"
                            className="p-1 hover:text-rose-500 hover:bg-elevated rounded-md text-text-muted transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => {
          setIsAssessmentModalOpen(false);
          setEditingAssessment(null);
        }}
        subjects={subjects}
        assessmentToEdit={editingAssessment}
        onSave={(a) => saveAssessment(a)}
      />

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        subjectToEdit={editingSubject}
      />

      {/* Target Grade Calculator Modal */}
      <TargetGradeModal
        isOpen={!!targetModalSubject}
        onClose={() => setTargetModalSubject(null)}
        subject={targetModalSubject}
        assessments={assessments}
        onUpdateTarget={handleUpdateTarget}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmAssessmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="p-6 bg-card border border-border-subtle rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Delete Assessment Record?</h3>
              <p className="text-xs text-text-muted mt-1">
                This assessment and its recorded marks will be removed from your grade calculations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmAssessmentId(null)}
                className="px-4 py-2 bg-elevated hover:bg-card text-text-main border border-border-subtle rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAssessment(deleteConfirmAssessmentId);
                  setDeleteConfirmAssessmentId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
