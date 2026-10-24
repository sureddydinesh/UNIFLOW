import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  BookOpen, 
  Moon, 
  Sun, 
  Laptop, 
  Download, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Edit2 
} from 'lucide-react';
import { SubjectModal } from '../common/SubjectModal';
import { Subject, CurrencyCode, WeekStart } from '../../types';
import { exportAllStudentData } from '../../services/storage';
import { motion } from 'motion/react';
import { 
  fadeUpVariants, 
  staggerContainerVariants, 
  cardHoverMotion, 
  EASE_PREMIUM 
} from '../../utils/motion';

export const ProfileSettingsView: React.FC = () => {
  const { 
    userId, 
    profile, 
    subjects, 
    deleteSubject, 
    updateProfile, 
    themePreference, 
    setThemePreference,
    deleteAccount 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'subjects' | 'appearance' | 'account'>('profile');
  
  // Profile edit state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [academicYear, setAcademicYear] = useState(profile?.academicYear || 'Year 3');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 5');
  const [currency, setCurrency] = useState<CurrencyCode>(profile?.currency || 'INR');
  const [weekStart, setWeekStart] = useState<WeekStart>(profile?.weekStartPreference || 'monday');
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthlyBudget || 15000);
  
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: fullName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      university: university.trim(),
      degree: degree.trim(),
      department: department.trim(),
      academicYear,
      semester: semester.trim(),
      currency,
      weekStartPreference: weekStart,
      monthlyBudget: Number(monthlyBudget) || 10000,
    });
    setSaveSuccessMsg('Profile and preferences updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDeleteAccountConfirm = () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete your student account and all subjects, events, assignments, and financial records. This action cannot be undone.\n\nDo you want to proceed?')) {
      deleteAccount();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Academic & Personal Info', icon: User },
    { id: 'subjects', label: `Enrolled Subjects (${subjects.length})`, icon: BookOpen },
    { id: 'appearance', label: 'Theme & Preferences', icon: Moon },
    { id: 'account', label: 'Account Security & Privacy', icon: ShieldAlert },
  ];

  return (
    <motion.div 
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        subjectToEdit={subjectToEdit}
      />

      {/* Header */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border-subtle shadow-sm"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl overflow-hidden border border-border-subtle flex-shrink-0"
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              profile?.fullName?.[0] || 'S'
            )}
          </motion.div>
          <div>
            <h2 className="text-2xl font-extrabold font-heading text-text-main">
              {profile?.fullName || 'Student Profile'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {profile?.university || 'University Student'} • {profile?.department || 'Department'}
            </p>
          </div>
        </div>

        {/* Data Export Button (PROF-08) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (userId) exportAllStudentData(userId);
          }}
          className="px-4 py-2.5 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-main text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-primary" /> Export My Data (JSON)
        </motion.button>
      </motion.div>

      {/* Tabs with layoutId active pill */}
      <motion.div variants={fadeUpVariants} className="flex items-center gap-2 border-b border-border-subtle pb-2 overflow-x-auto relative">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-text-muted hover:text-text-main hover:bg-elevated'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-primary rounded-xl shadow-glow-primary z-0"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </motion.div>

      {saveSuccessMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-custom/15 border border-emerald-custom/40 text-emerald-custom text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </motion.div>
      )}

      {/* Tab 1: Profile Information (PROF-01) */}
      {activeSubTab === 'profile' && (
        <motion.form 
          variants={fadeUpVariants}
          onSubmit={handleSaveProfile} 
          className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm space-y-4"
        >
          <h3 className="font-heading font-bold text-lg text-text-main">
            Student Identity & Degree Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                University / Institution *
              </label>
              <input
                type="text"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Degree Program
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech"
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Department / Branch
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Current Semester
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Semester 5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-glow-primary transition-colors"
            >
              Save Profile Changes
            </motion.button>
          </div>
        </motion.form>
      )}

      {/* Tab 2: Enrolled Subjects Management (PROF-02) */}
      {activeSubTab === 'subjects' && (
        <motion.div 
          variants={fadeUpVariants}
          className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-main">
                Enrolled Academic Subjects (PROF-02)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Courses configured here automatically appear in your Timetable and Assignments.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setSubjectToEdit(null);
                setSubjectModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {subjects.map(s => (
              <motion.div
                key={s.id}
                {...cardHoverMotion}
                className="p-4 rounded-2xl bg-elevated border border-border-subtle flex items-start justify-between gap-3 group hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {s.code || 'NO CODE'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text-main truncate">
                    {s.name}
                  </h4>
                  {s.instructor && (
                    <p className="text-xs text-text-muted mt-1 truncate">
                      {s.instructor}
                    </p>
                  )}
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {s.semester}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSubjectToEdit(s);
                      setSubjectModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-card transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (window.confirm(`Delete ${s.name}?`)) {
                        deleteSubject(s.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-card transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Appearance & Preferences (UI-THEME-01, PROF-03, PROF-04) */}
      {activeSubTab === 'appearance' && (
        <motion.div 
          variants={fadeUpVariants}
          className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm space-y-6"
        >
          <div>
            <h3 className="font-heading font-bold text-lg text-text-main">
              Appearance & Theme Selection (UI-THEME-01)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Theme B — Midnight Intelligence is the default visual identity. Switch to Light or System anytime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setThemePreference('dark')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  themePreference === 'dark'
                    ? 'bg-elevated border-primary ring-2 ring-primary/40 shadow-glow-primary'
                    : 'bg-elevated/40 border-border-subtle hover:border-text-muted'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-2">
                  <Moon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-text-main">Theme B: Midnight Intelligence</h4>
                <p className="text-[11px] text-text-muted mt-1">
                  Deep charcoal #0B1020 surfaces with violet accents. (Default)
                </p>
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setThemePreference('light')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  themePreference === 'light'
                    ? 'bg-elevated border-primary ring-2 ring-primary/40 shadow-glow-primary'
                    : 'bg-elevated/40 border-border-subtle hover:border-text-muted'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center mb-2">
                  <Sun className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-text-main">Clean Light Mode</h4>
                <p className="text-[11px] text-text-muted mt-1">
                  Soft #F5F7FC surfaces with high-contrast text and crisp borders.
                </p>
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setThemePreference('system')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  themePreference === 'system'
                    ? 'bg-elevated border-primary ring-2 ring-primary/40 shadow-glow-primary'
                    : 'bg-elevated/40 border-border-subtle hover:border-text-muted'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2">
                  <Laptop className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-text-main">System Preference</h4>
                <p className="text-[11px] text-text-muted mt-1">
                  Automatically syncs with your operating system's color scheme.
                </p>
              </motion.button>
            </div>
          </div>

          {/* Currency & Calendar Preferences (PROF-04) */}
          <div className="pt-4 border-t border-border-subtle">
            <h3 className="font-heading font-bold text-base text-text-main mb-3">
              Regional & Financial Units
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Primary Currency (Default: INR ₹)
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const c = e.target.value as CurrencyCode;
                    setCurrency(c);
                    updateProfile({ currency: c });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main"
                >
                  <option value="INR">Indian Rupee (₹ INR) — Primary</option>
                  <option value="USD">US Dollar ($ USD)</option>
                  <option value="EUR">Euro (€ EUR)</option>
                  <option value="GBP">British Pound (£ GBP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Week Starts On
                </label>
                <select
                  value={weekStart}
                  onChange={(e) => {
                    const ws = e.target.value as WeekStart;
                    setWeekStart(ws);
                    updateProfile({ weekStartPreference: ws });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main"
                >
                  <option value="monday">Monday (Academic Standard)</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Account Security & Data Privacy (PROF-07 / PROF-09 / AUTH-10) */}
      {activeSubTab === 'account' && (
        <motion.div 
          variants={fadeUpVariants}
          className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm space-y-6"
        >
          <div>
            <h3 className="font-heading font-bold text-lg text-text-main">
              Account Security & Data Isolation
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              UniFlow strictly isolates your personal student records from all other registered accounts.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-elevated border border-border-subtle text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Account ID:</span>
                <span className="font-mono text-text-main">{userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Data Isolation:</span>
                <span className="text-emerald-custom font-semibold">Active & Enforced (AUTH-08)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Session Status:</span>
                <span className="text-primary font-semibold">Authenticated Session</span>
              </div>
            </div>
          </div>

          {/* Danger Zone: Account Deletion (PROF-09 / AUTH-10) */}
          <div className="pt-4 border-t border-status-error/30">
            <h4 className="font-heading font-bold text-base text-status-error flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-status-error" />
              Danger Zone: Account Deletion (AUTH-10)
            </h4>
            <p className="text-xs text-text-muted mt-1 max-w-xl">
              Permanently delete your profile and purge all registered subjects, calendar timetable events, assignment deadlines, transactions, and savings goals from storage.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleDeleteAccountConfirm}
              className="mt-4 px-4 py-2.5 rounded-xl bg-status-error/20 text-status-error border border-status-error/50 hover:bg-status-error hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete My Student Account
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
