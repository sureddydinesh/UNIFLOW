// Core types for UniFlow Platform

export type ThemePreference = 'dark' | 'light' | 'system';
export type WeekStart = 'monday' | 'sunday';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface UserAuth {
  id: string;
  email: string;
  passwordHash: string; // Stored securely in storage layer
  isEmailVerified: boolean;
  createdAt: string;
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  university: string;
  degree: string;
  department: string;
  academicYear: string; // e.g. "Year 3"
  semester: string;     // e.g. "Semester 5"
  timezone: string;
  currency: CurrencyCode;
  theme: ThemePreference;
  weekStartPreference: WeekStart;
  monthlyBudget: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code: string;
  color: string; // hex code e.g. "#8B80FF"
  semester: string;
  instructor?: string;
  credits?: number; // e.g. 3 or 4
  targetPercentage?: number; // e.g. 85
  gradingScheme?: 'raw_percentage' | 'weighted';
  createdAt: string;
}

export type EventType = 'class' | 'lab' | 'exam' | 'assignment' | 'personal';

export interface CalendarEvent {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  eventType: EventType;
  startAt: string; // ISO 8601 string
  endAt: string;   // ISO 8601 string
  location?: string;
  description?: string;
  isRecurring: boolean;
  recurringDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  recurrenceEndAt?: string;
  assignmentId?: string; // If auto-linked from assignment deadline
  createdAt: string;
}

export type AssignmentPriority = 'low' | 'medium' | 'high';
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface AssignmentSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueAt: string; // ISO 8601 string
  priority: AssignmentPriority;
  status: AssignmentStatus;
  estimatedMinutes?: number;
  referenceUrl?: string;
  subtasks: AssignmentSubtask[];
  completedAt?: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'pocket_money' | 'scholarship' | 'part_time' | 'allowance' | 'freelance' | 'other_income';

export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'education'
  | 'accommodation'
  | 'shopping'
  | 'entertainment'
  | 'utilities'
  | 'health'
  | 'other_expense';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking' | 'Other';

export interface Transaction {
  id: string;
  userId: string;
  transactionType: TransactionType;
  amount: number; // Stored in major units (e.g. 250.50)
  category: IncomeCategory | ExpenseCategory | string;
  transactionDate: string; // YYYY-MM-DD
  description?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentProgress: number;
  targetDate?: string;
  createdAt: string;
}

export interface NotificationPreference {
  userId: string;
  assignmentReminders: boolean;
  budgetAlerts: boolean;
  dailyScheduleSummary: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  netCashFlow: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUtilization: number; // percentage e.g. 68.5%
  isOverBudget: boolean;
}

export interface AcademicSummary {
  totalPending: number;
  dueSoon: number;      // within 48h
  overdue: number;
  completedThisMonth: number;
  completionRate: number; // percentage
  totalEstimatedHours: number;
}

// ─────────────────────────────────────────
// HABIT TRACKER TYPES
// ─────────────────────────────────────────

export type HabitCategory = 
  | 'study' 
  | 'health' 
  | 'fitness' 
  | 'reading' 
  | 'personal_development' 
  | 'sleep_routine' 
  | 'custom';

export type HabitScheduleType = 'daily' | 'weekly' | 'selected_days';

export type HabitTargetType = 'boolean' | 'measurable';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: HabitCategory | string;
  customCategoryName?: string;
  icon: string; // Lucide icon name string e.g. "BookOpen", "Dumbbell", "Brain", "Droplets", "Moon", "Code", "Coffee", "Flame", "Target", "Heart", "Smile", "CheckCircle"
  color: string; // hex code e.g. "#8B80FF"
  scheduleType: HabitScheduleType;
  selectedDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  weeklyTargetDays?: number; // e.g. 4 days/week
  targetType: HabitTargetType;
  targetValue?: number; // e.g. 30 (mins) or 20 (pages)
  unit?: string; // e.g. "mins", "pages", "glasses", "problems"
  reminderTime?: string; // "HH:MM" e.g. "08:30"
  isArchived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  currentValue?: number;
  targetValue?: number;
  completedAt?: string; // ISO 8601
  notes?: string;
}

export interface HabitStreakInfo {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRateMonth: number; // percentage e.g. 85.5%
  isScheduledToday: boolean;
  isCompletedToday: boolean;
  historyLast7Days: { date: string; isCompleted: boolean; isScheduled: boolean }[];
}

// ─────────────────────────────────────────
// FOCUS MODE & POMODORO TYPES
// ─────────────────────────────────────────

export type FocusModeType = 'focus' | 'short_break' | 'long_break';
export type FocusWorkflowMode = 'open_focus' | 'pomodoro';

export interface FocusSettings {
  focusDurationMinutes: number; // default: 25
  shortBreakMinutes: number;    // default: 5
  longBreakMinutes: number;     // default: 15
  longBreakInterval: number;    // default: 4 (long break after every 4 focus sessions)
  autoStartBreaks: boolean;     // default: false
  autoStartFocus: boolean;      // default: false
  soundEnabled: boolean;        // default: true
}

export interface FocusSession {
  id: string;
  userId: string;
  subjectId?: string;
  assignmentId?: string;
  title: string;
  sessionType: FocusModeType;
  workflowMode?: FocusWorkflowMode;
  plannedMinutes: number;
  actualDurationSeconds: number;
  completedAt: string; // ISO 8601
  notes?: string;
  isCompleted: boolean;
}

export interface ActiveFocusState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  sessionType: FocusModeType;
  workflowMode?: FocusWorkflowMode;
  subjectId?: string;
  assignmentId?: string;
  taskTitle: string;
  totalDurationMs: number;
  remainingMs: number;
  startedAtTimestamp: number | null; // Date.now() when timer was started/resumed
  targetEndTimestamp: number | null;  // Date.now() + remainingMs
  completedPomodorosInCycle: number;
}

// ─────────────────────────────────────────
// ACADEMIC PROGRESS TYPES
// ─────────────────────────────────────────

export type AssessmentType = 
  | 'cat1'
  | 'cat2'
  | 'midterm'
  | 'final_exam'
  | 'assignment'
  | 'quiz'
  | 'lab_evaluation'
  | 'project'
  | 'custom';

export type AssessmentStatus = 'upcoming' | 'pending_eval' | 'graded';

export interface Assessment {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  assessmentType: AssessmentType;
  obtainedMarks?: number | null; // null if ungraded/upcoming
  maximumMarks: number;          // e.g. 50 or 100
  weightagePercentage?: number;  // e.g. 20%
  assessmentDate: string;        // YYYY-MM-DD
  status: AssessmentStatus;
  notes?: string;
  createdAt: string;
}

export interface SubjectAcademicSummary {
  subject: Subject;
  assessments: Assessment[];
  totalConfiguredWeight: number;
  gradedWeight: number;
  currentPercentage: number | null;
  projectedPercentage: number | null;
  targetPercentage: number;
  isTargetAchievable: boolean;
  requiredRemainingPercentage: number | null;
  letterGrade: string;
  gradePoints: number;
}

