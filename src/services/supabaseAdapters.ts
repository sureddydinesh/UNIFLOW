import {
  StudentProfile,
  Subject,
  Assignment,
  CalendarEvent,
  Transaction,
  SavingsGoal,
  Habit,
  HabitLog,
  FocusSession,
  FocusSettings,
  ActiveFocusState,
  Assessment,
  CurrencyCode,
  ThemePreference,
  WeekStart,
  AssignmentPriority,
  AssignmentStatus,
  EventType,
  TransactionType,
  PaymentMethod,
  HabitCategory,
  HabitScheduleType,
  HabitTargetType,
  FocusModeType,
  FocusWorkflowMode,
  AssessmentType,
  AssessmentStatus
} from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function ensureUuid(id?: string | null): string {
  if (id === undefined || id === null || id === '') {
    return crypto.randomUUID();
  }
  if (!isValidUuid(id)) {
    throw new Error(`Invalid UUID format: "${id}". Existing record IDs must be valid RFC 4122 UUIDs.`);
  }
  return id;
}

/**
 * Asserts that if an explicit userId was supplied from caller code,
 * it strictly matches the verified session userId.
 * Prevents callers from forging or overriding ownership.
 */
export function assertAuthorizedUser(callerUserId: string | undefined, authenticatedUserId: string): void {
  if (callerUserId && callerUserId !== authenticatedUserId) {
    throw new Error(
      `Unauthorized: Caller user ID (${callerUserId}) does not match authenticated user ID (${authenticatedUserId}).`
    );
  }
}

// ====================================================================
// 1. PROFILES ADAPTER
// ====================================================================
export function profileFromDb(row: any): StudentProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name || '',
    avatarUrl: row.avatar_url || undefined,
    university: row.university || '',
    degree: row.degree || '',
    department: row.department || '',
    academicYear: row.academic_year || 'Year 1',
    semester: row.semester || 'Semester 1',
    timezone: row.timezone || 'Asia/Kolkata',
    currency: (row.currency as CurrencyCode) || 'INR',
    theme: (row.theme as ThemePreference) || 'dark',
    weekStartPreference: (row.week_start_preference as WeekStart) || 'monday',
    monthlyBudget: Number(row.monthly_budget) || 10000,
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function profileToDb(profile: Partial<StudentProfile>): Record<string, any> {
  const result: Record<string, any> = {};
  if (profile.fullName !== undefined) result.full_name = profile.fullName.trim();
  if (profile.avatarUrl !== undefined) result.avatar_url = profile.avatarUrl || null;
  if (profile.university !== undefined) result.university = profile.university;
  if (profile.degree !== undefined) result.degree = profile.degree;
  if (profile.department !== undefined) result.department = profile.department;
  if (profile.academicYear !== undefined) result.academic_year = profile.academicYear;
  if (profile.semester !== undefined) result.semester = profile.semester;
  if (profile.timezone !== undefined) result.timezone = profile.timezone;
  if (profile.currency !== undefined) {
    const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
    result.currency = validCurrencies.includes(profile.currency) ? profile.currency : 'INR';
  }
  if (profile.theme !== undefined) {
    const validThemes = ['dark', 'light', 'system'];
    result.theme = validThemes.includes(profile.theme) ? profile.theme : 'dark';
  }
  if (profile.weekStartPreference !== undefined) {
    const validStarts = ['monday', 'sunday'];
    result.week_start_preference = validStarts.includes(profile.weekStartPreference) ? profile.weekStartPreference : 'monday';
  }
  if (profile.monthlyBudget !== undefined) {
    result.monthly_budget = Math.max(1, Number(profile.monthlyBudget) || 10000);
  }
  if (profile.onboardingCompleted !== undefined) {
    result.onboarding_completed = Boolean(profile.onboardingCompleted);
  }
  result.updated_at = new Date().toISOString();
  return result;
}

// ====================================================================
// 2. SUBJECTS ADAPTER
// ====================================================================
export function subjectFromDb(row: any): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    code: row.code,
    color: row.color,
    semester: row.semester,
    instructor: row.instructor || undefined,
    credits: row.credits !== null && row.credits !== undefined ? Number(row.credits) : undefined,
    targetPercentage: row.target_percentage !== null && row.target_percentage !== undefined ? Number(row.target_percentage) : undefined,
    gradingScheme: (row.grading_scheme as 'raw_percentage' | 'weighted') || 'raw_percentage',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function subjectToDb(sub: Partial<Subject> & { id?: string }, userId: string): Record<string, any> {
  const credits = sub.credits !== undefined && sub.credits !== null ? Math.max(0, Number(sub.credits)) : 3.0;
  const targetPct = sub.targetPercentage !== undefined && sub.targetPercentage !== null
    ? Math.min(100, Math.max(0, Number(sub.targetPercentage)))
    : 85.00;
  const scheme = sub.gradingScheme === 'weighted' ? 'weighted' : 'raw_percentage';

  return {
    id: ensureUuid(sub.id),
    user_id: userId,
    name: sub.name || '',
    code: sub.code || '',
    color: sub.color || '#8B80FF',
    semester: sub.semester || 'Semester 1',
    instructor: sub.instructor || null,
    credits,
    target_percentage: targetPct,
    grading_scheme: scheme,
    ...(sub.createdAt ? { created_at: sub.createdAt } : {}),
  };
}

// ====================================================================
// 3. ASSIGNMENTS ADAPTER
// ====================================================================
export function assignmentFromDb(row: any): Assignment {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description || undefined,
    dueAt: row.due_at,
    priority: (row.priority as AssignmentPriority) || 'medium',
    status: (row.status as AssignmentStatus) || 'not_started',
    estimatedMinutes: row.estimated_minutes !== null && row.estimated_minutes !== undefined ? Number(row.estimated_minutes) : undefined,
    referenceUrl: row.reference_url || undefined,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function assignmentToDb(asg: Partial<Assignment> & { id?: string }, userId: string): Record<string, any> {
  const validPriorities = ['low', 'medium', 'high'];
  const validStatuses = ['not_started', 'in_progress', 'completed'];

  return {
    id: ensureUuid(asg.id),
    user_id: userId,
    subject_id: asg.subjectId,
    title: asg.title || '',
    description: asg.description || null,
    due_at: asg.dueAt || new Date().toISOString(),
    priority: validPriorities.includes(asg.priority || '') ? asg.priority : 'medium',
    status: validStatuses.includes(asg.status || '') ? asg.status : 'not_started',
    estimated_minutes: asg.estimatedMinutes !== undefined && asg.estimatedMinutes !== null && Number(asg.estimatedMinutes) > 0
      ? Math.round(Number(asg.estimatedMinutes))
      : null,
    reference_url: asg.referenceUrl || null,
    subtasks: Array.isArray(asg.subtasks) ? asg.subtasks : [],
    completed_at: asg.completedAt || null,
    ...(asg.createdAt ? { created_at: asg.createdAt } : {}),
  };
}

// ====================================================================
// 4. CALENDAR EVENTS ADAPTER
// ====================================================================
export function calendarEventFromDb(row: any): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id || undefined,
    assignmentId: row.assignment_id || undefined,
    title: row.title,
    eventType: (row.event_type as EventType) || 'class',
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location || undefined,
    description: row.description || undefined,
    isRecurring: Boolean(row.is_recurring),
    recurringDays: Array.isArray(row.recurring_days) && row.recurring_days.length > 0 ? row.recurring_days : undefined,
    recurrenceEndAt: row.recurrence_end_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function calendarEventToDb(ev: Partial<CalendarEvent> & { id?: string }, userId: string): Record<string, any> {
  const validEventTypes = ['class', 'lab', 'exam', 'assignment', 'personal'];
  const startAt = ev.startAt || new Date().toISOString();
  let endAt = ev.endAt || new Date(Date.now() + 3600000).toISOString();

  // Enforce DB constraint: end_at > start_at
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    endAt = new Date(new Date(startAt).getTime() + 3600000).toISOString();
  }

  // Enforce DB constraint: recurrence_end_at >= start_at
  let recurrenceEndAt = ev.recurrenceEndAt || null;
  if (recurrenceEndAt && new Date(recurrenceEndAt).getTime() < new Date(startAt).getTime()) {
    recurrenceEndAt = null;
  }

  const validDays = [0, 1, 2, 3, 4, 5, 6];
  const recurringDays = Array.isArray(ev.recurringDays)
    ? ev.recurringDays.filter(d => typeof d === 'number' && validDays.includes(d))
    : [];

  return {
    id: ensureUuid(ev.id),
    user_id: userId,
    subject_id: ev.subjectId && isValidUuid(ev.subjectId) ? ev.subjectId : null,
    assignment_id: ev.assignmentId && isValidUuid(ev.assignmentId) ? ev.assignmentId : null,
    title: ev.title || '',
    event_type: validEventTypes.includes(ev.eventType || '') ? ev.eventType : 'class',
    start_at: startAt,
    end_at: endAt,
    location: ev.location || null,
    description: ev.description || null,
    is_recurring: Boolean(ev.isRecurring),
    recurring_days: recurringDays,
    recurrence_end_at: recurrenceEndAt,
    ...(ev.createdAt ? { created_at: ev.createdAt } : {}),
  };
}

// ====================================================================
// 5. TRANSACTIONS ADAPTER
// ====================================================================
export function transactionFromDb(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    transactionType: (row.transaction_type as TransactionType) || 'expense',
    amount: Number(row.amount) || 0,
    category: row.category,
    transactionDate: row.transaction_date,
    description: row.description || undefined,
    paymentMethod: (row.payment_method as PaymentMethod) || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function transactionToDb(tx: Partial<Transaction> & { id?: string }, userId: string): Record<string, any> {
  const validMethods = ['UPI', 'Cash', 'Card', 'Net Banking', 'Other'];
  const paymentMethod = tx.paymentMethod && validMethods.includes(tx.paymentMethod) ? tx.paymentMethod : null;

  return {
    id: ensureUuid(tx.id),
    user_id: userId,
    transaction_type: tx.transactionType === 'income' ? 'income' : 'expense',
    amount: Math.max(0.01, Math.abs(Number(tx.amount)) || 1.00),
    category: tx.category || 'other_expense',
    transaction_date: tx.transactionDate || new Date().toISOString().split('T')[0],
    description: tx.description || null,
    payment_method: paymentMethod,
    ...(tx.createdAt ? { created_at: tx.createdAt } : {}),
  };
}

// ====================================================================
// 6. SAVINGS GOALS ADAPTER
// ====================================================================
export function savingsGoalFromDb(row: any): SavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetAmount: Number(row.target_amount) || 0,
    currentProgress: Number(row.current_progress) || 0,
    targetDate: row.target_date || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function savingsGoalToDb(goal: Partial<SavingsGoal> & { id?: string }, userId: string): Record<string, any> {
  return {
    id: ensureUuid(goal.id),
    user_id: userId,
    title: goal.title || '',
    target_amount: Math.max(1, Number(goal.targetAmount) || 1),
    current_progress: Math.max(0, Number(goal.currentProgress) || 0),
    target_date: goal.targetDate || null,
    ...(goal.createdAt ? { created_at: goal.createdAt } : {}),
  };
}

// ====================================================================
// 7. HABITS ADAPTER
// ====================================================================
export function habitFromDb(row: any): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    category: (row.category as HabitCategory) || 'study',
    customCategoryName: row.custom_category_name || undefined,
    icon: row.icon || 'BookOpen',
    color: row.color || '#8B80FF',
    scheduleType: (row.schedule_type as HabitScheduleType) || 'daily',
    selectedDays: Array.isArray(row.selected_days) ? row.selected_days : [],
    weeklyTargetDays: row.weekly_target_days !== null && row.weekly_target_days !== undefined ? Number(row.weekly_target_days) : undefined,
    targetType: (row.target_type as HabitTargetType) || 'boolean',
    targetValue: row.target_value !== null && row.target_value !== undefined ? Number(row.target_value) : undefined,
    unit: row.unit || undefined,
    reminderTime: row.reminder_time || undefined,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function habitToDb(habit: Partial<Habit> & { id?: string }, userId: string): Record<string, any> {
  const validScheduleTypes = ['daily', 'weekly', 'selected_days'];
  const scheduleType = validScheduleTypes.includes(habit.scheduleType || '') ? habit.scheduleType : 'daily';

  const validDays = [0, 1, 2, 3, 4, 5, 6];
  const selectedDays = Array.isArray(habit.selectedDays)
    ? habit.selectedDays.filter(d => typeof d === 'number' && validDays.includes(d))
    : [];

  const weeklyTargetDays = habit.weeklyTargetDays !== undefined && habit.weeklyTargetDays !== null
    ? Math.min(7, Math.max(1, Math.round(Number(habit.weeklyTargetDays))))
    : null;

  const targetType = habit.targetType === 'measurable' ? 'measurable' : 'boolean';
  const targetValue = habit.targetValue !== undefined && habit.targetValue !== null && Number(habit.targetValue) > 0
    ? Number(habit.targetValue)
    : null;

  return {
    id: ensureUuid(habit.id),
    user_id: userId,
    title: habit.title || '',
    description: habit.description || null,
    category: habit.category || 'study',
    custom_category_name: habit.customCategoryName || null,
    icon: habit.icon || 'BookOpen',
    color: habit.color || '#8B80FF',
    schedule_type: scheduleType,
    selected_days: selectedDays,
    weekly_target_days: weeklyTargetDays,
    target_type: targetType,
    target_value: targetValue,
    unit: habit.unit || null,
    reminder_time: habit.reminderTime || null,
    is_archived: Boolean(habit.isArchived),
    ...(habit.createdAt ? { created_at: habit.createdAt } : {}),
  };
}

// ====================================================================
// 8. HABIT LOGS ADAPTER
// ====================================================================
export function habitLogFromDb(row: any): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    userId: row.user_id,
    date: row.date,
    isCompleted: Boolean(row.is_completed),
    currentValue: row.current_value !== null && row.current_value !== undefined ? Number(row.current_value) : undefined,
    targetValue: row.target_value !== null && row.target_value !== undefined ? Number(row.target_value) : undefined,
    completedAt: row.completed_at || undefined,
    notes: row.notes || undefined,
  };
}

export function habitLogToDb(log: Partial<HabitLog> & { id?: string; habitId: string; date: string }, userId: string): Record<string, any> {
  const currentValue = log.currentValue !== undefined && log.currentValue !== null
    ? Math.max(0, Number(log.currentValue))
    : null;
  const targetValue = log.targetValue !== undefined && log.targetValue !== null && Number(log.targetValue) > 0
    ? Number(log.targetValue)
    : null;

  return {
    id: ensureUuid(log.id),
    habit_id: log.habitId,
    user_id: userId,
    date: log.date,
    is_completed: Boolean(log.isCompleted),
    current_value: currentValue,
    target_value: targetValue,
    completed_at: log.completedAt || (log.isCompleted ? new Date().toISOString() : null),
    notes: log.notes || null,
  };
}

// ====================================================================
// 9. FOCUS SESSIONS ADAPTER
// ====================================================================
export function focusSessionFromDb(row: any): FocusSession {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id || undefined,
    assignmentId: row.assignment_id || undefined,
    title: row.title,
    sessionType: (row.session_type as FocusModeType) || 'focus',
    workflowMode: (row.workflow_mode as FocusWorkflowMode) || 'open_focus',
    plannedMinutes: Number(row.planned_minutes) || 25,
    actualDurationSeconds: Number(row.actual_duration_seconds) || 0,
    completedAt: row.completed_at,
    notes: row.notes || undefined,
    isCompleted: Boolean(row.is_completed),
  };
}

export function focusSessionToDb(session: Partial<FocusSession> & { id?: string }, userId: string): Record<string, any> {
  const validSessionTypes = ['focus', 'short_break', 'long_break'];
  const sessionType = validSessionTypes.includes(session.sessionType || '') ? session.sessionType : 'focus';
  const workflowMode = session.workflowMode === 'pomodoro' ? 'pomodoro' : 'open_focus';

  return {
    id: ensureUuid(session.id),
    user_id: userId,
    subject_id: session.subjectId && isValidUuid(session.subjectId) ? session.subjectId : null,
    assignment_id: session.assignmentId && isValidUuid(session.assignmentId) ? session.assignmentId : null,
    title: session.title || 'Focus Session',
    session_type: sessionType,
    workflow_mode: workflowMode,
    planned_minutes: Math.max(1, Math.round(Number(session.plannedMinutes) || 25)),
    actual_duration_seconds: Math.max(0, Math.round(Number(session.actualDurationSeconds) || 0)),
    completed_at: session.completedAt || new Date().toISOString(),
    notes: session.notes || null,
    is_completed: session.isCompleted !== undefined ? Boolean(session.isCompleted) : true,
  };
}

// ====================================================================
// 10. FOCUS SETTINGS & ACTIVE TIMER STATE ADAPTER
// ====================================================================
export function focusSettingsFromDb(row: any): FocusSettings {
  return {
    focusDurationMinutes: Number(row.focus_duration_minutes) || 25,
    shortBreakMinutes: Number(row.short_break_minutes) || 5,
    longBreakMinutes: Number(row.long_break_minutes) || 15,
    longBreakInterval: Number(row.long_break_interval) || 4,
    autoStartBreaks: Boolean(row.auto_start_breaks),
    autoStartFocus: Boolean(row.auto_start_focus),
    soundEnabled: row.sound_enabled !== undefined ? Boolean(row.sound_enabled) : true,
  };
}

export function focusSettingsToDb(settings: FocusSettings, activeState?: ActiveFocusState | null): Record<string, any> {
  const result: Record<string, any> = {
    focus_duration_minutes: Math.max(1, Math.round(Number(settings.focusDurationMinutes) || 25)),
    short_break_minutes: Math.max(1, Math.round(Number(settings.shortBreakMinutes) || 5)),
    long_break_minutes: Math.max(1, Math.round(Number(settings.longBreakMinutes) || 15)),
    long_break_interval: Math.max(1, Math.round(Number(settings.longBreakInterval) || 4)),
    auto_start_breaks: Boolean(settings.autoStartBreaks),
    auto_start_focus: Boolean(settings.autoStartFocus),
    sound_enabled: Boolean(settings.soundEnabled),
    updated_at: new Date().toISOString(),
  };
  if (activeState !== undefined) {
    result.active_focus_state = activeState;
  }
  return result;
}

// ====================================================================
// 11. ASSESSMENTS ADAPTER
// ====================================================================
export function assessmentFromDb(row: any): Assessment {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    title: row.title,
    assessmentType: row.assessment_type as AssessmentType,
    obtainedMarks: row.obtained_marks !== null && row.obtained_marks !== undefined ? Number(row.obtained_marks) : null,
    maximumMarks: Number(row.maximum_marks) || 100,
    weightagePercentage: row.weightage_percentage !== null && row.weightage_percentage !== undefined ? Number(row.weightage_percentage) : undefined,
    assessmentDate: row.assessment_date,
    status: (row.status as AssessmentStatus) || 'upcoming',
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function assessmentToDb(assessment: Partial<Assessment> & { id?: string }, userId: string): Record<string, any> {
  const maxMarks = Math.max(1, Number(assessment.maximumMarks) || 100);
  let obtainedMarks: number | null = null;
  if (assessment.obtainedMarks !== null && assessment.obtainedMarks !== undefined) {
    obtainedMarks = Math.min(maxMarks, Math.max(0, Number(assessment.obtainedMarks)));
  }

  let weightage: number | null = null;
  if (assessment.weightagePercentage !== undefined && assessment.weightagePercentage !== null) {
    weightage = Math.min(100, Math.max(0, Number(assessment.weightagePercentage)));
  }

  const validStatuses = ['upcoming', 'pending_eval', 'graded'];
  const status = validStatuses.includes(assessment.status || '') ? assessment.status : 'upcoming';

  return {
    id: ensureUuid(assessment.id),
    user_id: userId,
    subject_id: assessment.subjectId,
    title: assessment.title || '',
    assessment_type: assessment.assessmentType || 'cat1',
    maximum_marks: maxMarks,
    obtained_marks: obtainedMarks,
    weightage_percentage: weightage,
    assessment_date: assessment.assessmentDate || new Date().toISOString().split('T')[0],
    status,
    notes: assessment.notes || null,
    ...(assessment.createdAt ? { created_at: assessment.createdAt } : {}),
  };
}
