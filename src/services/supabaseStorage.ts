import { supabase } from '../lib/supabase';
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
  Assessment
} from '../types';
import * as adapters from './supabaseAdapters';

/**
 * Resolves the authenticated user ID.
 * Asserts that an active, verified Supabase session exists.
 * Prevents client-side authorization spoofing.
 */
export async function getVerifiedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('No authenticated user session found. Please sign in.');
  }
  return user.id;
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
// 1. PROFILES
// ====================================================================

export async function getStudentProfile(userId?: string): Promise<StudentProfile | null> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authId)
    .maybeSingle();

  if (error) {
    console.error('[supabaseStorage] getStudentProfile error:', error);
    throw new Error(`Failed to load student profile: ${error.message}`);
  }

  return data ? adapters.profileFromDb(data) : null;
}

export async function updateStudentProfile(
  arg1: Partial<StudentProfile> | string,
  arg2?: Partial<StudentProfile> | string
): Promise<StudentProfile> {
  const authId = await getVerifiedUserId();
  let updates: Partial<StudentProfile>;

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    updates = (arg2 as Partial<StudentProfile>) || {};
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    updates = arg1;
  }

  const dbPayload = {
    ...adapters.profileToDb(updates),
    user_id: authId,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(dbPayload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] updateStudentProfile error:', error);
    throw new Error(`Failed to update student profile: ${error.message}`);
  }

  return adapters.profileFromDb(data);
}

// ====================================================================
// 2. SUBJECTS
// ====================================================================

export async function getStudentSubjects(userId?: string): Promise<Subject[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', authId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentSubjects error:', error);
    throw new Error(`Failed to load subjects: ${error.message}`);
  }

  return (data || []).map(adapters.subjectFromDb);
}

export async function saveStudentSubject(
  arg1: (Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<Subject> {
  const authId = await getVerifiedUserId();
  let subjectData: Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    subjectData = arg2 as Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    subjectData = arg1;
  }

  if (!subjectData) {
    throw new Error('Missing subject data to save.');
  }

  const dbPayload = adapters.subjectToDb(subjectData, authId);

  const { data, error } = await supabase
    .from('subjects')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentSubject error:', error);
    throw new Error(`Failed to save subject: ${error.message}`);
  }

  return adapters.subjectFromDb(data);
}

export async function deleteStudentSubject(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let subjectId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    subjectId = arg2;
  } else {
    subjectId = arg1;
  }

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentSubject error:', error);
    throw new Error(`Failed to delete subject: ${error.message}`);
  }
}

// ====================================================================
// 3. ASSIGNMENTS
// ====================================================================

export async function getStudentAssignments(userId?: string): Promise<Assignment[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', authId)
    .order('due_at', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentAssignments error:', error);
    throw new Error(`Failed to load assignments: ${error.message}`);
  }

  return (data || []).map(adapters.assignmentFromDb);
}

export async function saveStudentAssignment(
  arg1: (Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<Assignment> {
  const authId = await getVerifiedUserId();
  let assignmentData: Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    assignmentData = arg2 as Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    assignmentData = arg1;
  }

  if (!assignmentData) {
    throw new Error('Missing assignment data to save.');
  }

  const dbPayload = adapters.assignmentToDb(assignmentData, authId);

  const { data, error } = await supabase
    .from('assignments')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentAssignment error:', error);
    throw new Error(`Failed to save assignment: ${error.message}`);
  }

  return adapters.assignmentFromDb(data);
}

export async function deleteStudentAssignment(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let assignmentId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    assignmentId = arg2;
  } else {
    assignmentId = arg1;
  }

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentAssignment error:', error);
    throw new Error(`Failed to delete assignment: ${error.message}`);
  }
}

// ====================================================================
// 4. CALENDAR EVENTS
// ====================================================================

export async function getStudentCalendarEvents(userId?: string): Promise<CalendarEvent[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', authId)
    .order('start_at', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentCalendarEvents error:', error);
    throw new Error(`Failed to load calendar events: ${error.message}`);
  }

  return (data || []).map(adapters.calendarEventFromDb);
}

export async function saveStudentCalendarEvent(
  arg1: (Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<CalendarEvent> {
  const authId = await getVerifiedUserId();
  let eventData: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    eventData = arg2 as Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    eventData = arg1;
  }

  if (!eventData) {
    throw new Error('Missing calendar event data to save.');
  }

  const dbPayload = adapters.calendarEventToDb(eventData, authId);

  const { data, error } = await supabase
    .from('calendar_events')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentCalendarEvent error:', error);
    throw new Error(`Failed to save calendar event: ${error.message}`);
  }

  return adapters.calendarEventFromDb(data);
}

export async function deleteStudentCalendarEvent(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let eventId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    eventId = arg2;
  } else {
    eventId = arg1;
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentCalendarEvent error:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

// ====================================================================
// 5. TRANSACTIONS
// ====================================================================

export async function getStudentTransactions(userId?: string): Promise<Transaction[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', authId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('[supabaseStorage] getStudentTransactions error:', error);
    throw new Error(`Failed to load transactions: ${error.message}`);
  }

  return (data || []).map(adapters.transactionFromDb);
}

export async function saveStudentTransaction(
  arg1: (Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<Transaction> {
  const authId = await getVerifiedUserId();
  let txData: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    txData = arg2 as Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    txData = arg1;
  }

  if (!txData) {
    throw new Error('Missing transaction data to save.');
  }

  const dbPayload = adapters.transactionToDb(txData, authId);

  const { data, error } = await supabase
    .from('transactions')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentTransaction error:', error);
    throw new Error(`Failed to save transaction: ${error.message}`);
  }

  return adapters.transactionFromDb(data);
}

export async function deleteStudentTransaction(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let transactionId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    transactionId = arg2;
  } else {
    transactionId = arg1;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentTransaction error:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
}

// ====================================================================
// 6. SAVINGS GOALS
// ====================================================================

export async function getStudentSavingsGoals(userId?: string): Promise<SavingsGoal[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', authId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentSavingsGoals error:', error);
    throw new Error(`Failed to load savings goals: ${error.message}`);
  }

  return (data || []).map(adapters.savingsGoalFromDb);
}

export async function saveStudentSavingsGoal(
  arg1: (Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<SavingsGoal> {
  const authId = await getVerifiedUserId();
  let goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    goalData = arg2 as Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    goalData = arg1;
  }

  if (!goalData) {
    throw new Error('Missing savings goal data to save.');
  }

  const dbPayload = adapters.savingsGoalToDb(goalData, authId);

  const { data, error } = await supabase
    .from('savings_goals')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentSavingsGoal error:', error);
    throw new Error(`Failed to save savings goal: ${error.message}`);
  }

  return adapters.savingsGoalFromDb(data);
}

export async function deleteStudentSavingsGoal(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let goalId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    goalId = arg2;
  } else {
    goalId = arg1;
  }

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentSavingsGoal error:', error);
    throw new Error(`Failed to delete savings goal: ${error.message}`);
  }
}

// ====================================================================
// 7. HABITS
// ====================================================================

export async function getStudentHabits(userId?: string): Promise<Habit[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', authId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentHabits error:', error);
    throw new Error(`Failed to load habits: ${error.message}`);
  }

  return (data || []).map(adapters.habitFromDb);
}

export async function saveStudentHabit(
  arg1: (Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<Habit> {
  const authId = await getVerifiedUserId();
  let habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    habitData = arg2 as Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    habitData = arg1;
  }

  if (!habitData) {
    throw new Error('Missing habit data to save.');
  }

  const dbPayload = adapters.habitToDb(habitData, authId);

  const { data, error } = await supabase
    .from('habits')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentHabit error:', error);
    throw new Error(`Failed to save habit: ${error.message}`);
  }

  return adapters.habitFromDb(data);
}

export async function archiveStudentHabit(
  arg1: string,
  arg2: boolean | string,
  arg3?: boolean | string
): Promise<void> {
  const authId = await getVerifiedUserId();
  let habitId: string;
  let isArchived: boolean;

  if (typeof arg2 === 'string') {
    // (userId, habitId, isArchived)
    assertAuthorizedUser(arg1, authId);
    habitId = arg2;
    isArchived = Boolean(arg3);
  } else {
    // (habitId, isArchived, userId?)
    if (typeof arg3 === 'string') {
      assertAuthorizedUser(arg3, authId);
    }
    habitId = arg1;
    isArchived = Boolean(arg2);
  }

  const { error } = await supabase
    .from('habits')
    .update({ is_archived: isArchived })
    .eq('id', habitId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] archiveStudentHabit error:', error);
    throw new Error(`Failed to archive habit: ${error.message}`);
  }
}

export async function deleteStudentHabit(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let habitId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    habitId = arg2;
  } else {
    habitId = arg1;
  }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentHabit error:', error);
    throw new Error(`Failed to delete habit: ${error.message}`);
  }
}

// ====================================================================
// 8. HABIT LOGS
// ====================================================================

export async function getStudentHabitLogs(userId?: string): Promise<HabitLog[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', authId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[supabaseStorage] getStudentHabitLogs error:', error);
    throw new Error(`Failed to load habit logs: ${error.message}`);
  }

  return (data || []).map(adapters.habitLogFromDb);
}

export async function recordStudentHabitCompletion(
  habitId: string,
  date: string,
  isCompleted: boolean,
  currentValue?: number,
  notes?: string,
  userId?: string
): Promise<HabitLog> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const dbPayload = adapters.habitLogToDb(
    { habitId, date, isCompleted, currentValue, notes },
    authId
  );

  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(dbPayload, { onConflict: 'habit_id,date' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] recordStudentHabitCompletion error:', error);
    throw new Error(`Failed to record habit completion: ${error.message}`);
  }

  return adapters.habitLogFromDb(data);
}

// ====================================================================
// 9. FOCUS SESSIONS
// ====================================================================

export async function getStudentFocusSessions(userId?: string): Promise<FocusSession[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', authId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[supabaseStorage] getStudentFocusSessions error:', error);
    throw new Error(`Failed to load focus sessions: ${error.message}`);
  }

  return (data || []).map(adapters.focusSessionFromDb);
}

export async function saveStudentFocusSession(
  arg1: (Omit<FocusSession, 'id' | 'userId'> & { id?: string }) | string,
  arg2?: (Omit<FocusSession, 'id' | 'userId'> & { id?: string }) | string
): Promise<FocusSession> {
  const authId = await getVerifiedUserId();
  let sessionData: Omit<FocusSession, 'id' | 'userId'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    sessionData = arg2 as Omit<FocusSession, 'id' | 'userId'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    sessionData = arg1;
  }

  if (!sessionData) {
    throw new Error('Missing focus session data to save.');
  }

  const dbPayload = adapters.focusSessionToDb(sessionData, authId);

  const { data, error } = await supabase
    .from('focus_sessions')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentFocusSession error:', error);
    throw new Error(`Failed to save focus session: ${error.message}`);
  }

  return adapters.focusSessionFromDb(data);
}

export async function deleteStudentFocusSession(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let sessionId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    sessionId = arg2;
  } else {
    sessionId = arg1;
  }

  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentFocusSession error:', error);
    throw new Error(`Failed to delete focus session: ${error.message}`);
  }
}

// ====================================================================
// 10. FOCUS SETTINGS & ACTIVE STATE
// ====================================================================

export async function getStudentFocusSettings(userId?: string): Promise<FocusSettings> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('focus_settings')
    .select('*')
    .eq('user_id', authId)
    .maybeSingle();

  if (error) {
    console.error('[supabaseStorage] getStudentFocusSettings error:', error);
    throw new Error(`Failed to load focus settings: ${error.message}`);
  }

  if (!data) {
    return {
      focusDurationMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true,
    };
  }

  return adapters.focusSettingsFromDb(data);
}

export async function saveStudentFocusSettings(
  arg1: FocusSettings | string,
  arg2?: FocusSettings | string
): Promise<void> {
  const authId = await getVerifiedUserId();
  let settings: FocusSettings;

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    settings = arg2 as FocusSettings;
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    settings = arg1;
  }

  if (!settings) {
    throw new Error('Missing focus settings to save.');
  }

  const dbPayload = {
    ...adapters.focusSettingsToDb(settings),
    user_id: authId,
  };

  const { error } = await supabase
    .from('focus_settings')
    .upsert(dbPayload, { onConflict: 'user_id' });

  if (error) {
    console.error('[supabaseStorage] saveStudentFocusSettings error:', error);
    throw new Error(`Failed to save focus settings: ${error.message}`);
  }
}

export async function getActiveFocusState(userId?: string): Promise<ActiveFocusState | null> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('focus_settings')
    .select('active_focus_state')
    .eq('user_id', authId)
    .maybeSingle();

  if (error) {
    console.error('[supabaseStorage] getActiveFocusState error:', error);
    throw new Error(`Failed to get active focus state: ${error.message}`);
  }

  return (data?.active_focus_state as ActiveFocusState) || null;
}

export async function saveActiveFocusState(
  arg1: (ActiveFocusState | null) | string,
  arg2?: (ActiveFocusState | null) | string
): Promise<void> {
  const authId = await getVerifiedUserId();
  let state: ActiveFocusState | null;

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    state = arg2 !== undefined ? (arg2 as ActiveFocusState | null) : null;
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    state = arg1;
  }

  const { error } = await supabase
    .from('focus_settings')
    .upsert({
      user_id: authId,
      active_focus_state: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('[supabaseStorage] saveActiveFocusState error:', error);
    throw new Error(`Failed to save active focus state: ${error.message}`);
  }
}

// ====================================================================
// 11. ASSESSMENTS
// ====================================================================

export async function getStudentAssessments(userId?: string): Promise<Assessment[]> {
  const authId = await getVerifiedUserId();
  assertAuthorizedUser(userId, authId);

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', authId)
    .order('assessment_date', { ascending: true });

  if (error) {
    console.error('[supabaseStorage] getStudentAssessments error:', error);
    throw new Error(`Failed to load assessments: ${error.message}`);
  }

  return (data || []).map(adapters.assessmentFromDb);
}

export async function saveStudentAssessment(
  arg1: (Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string,
  arg2?: (Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }) | string
): Promise<Assessment> {
  const authId = await getVerifiedUserId();
  let assessmentData: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string };

  if (typeof arg1 === 'string') {
    assertAuthorizedUser(arg1, authId);
    assessmentData = arg2 as Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string };
  } else {
    if (typeof arg2 === 'string') {
      assertAuthorizedUser(arg2, authId);
    }
    assessmentData = arg1;
  }

  if (!assessmentData) {
    throw new Error('Missing assessment data to save.');
  }

  const dbPayload = adapters.assessmentToDb(assessmentData, authId);

  const { data, error } = await supabase
    .from('assessments')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[supabaseStorage] saveStudentAssessment error:', error);
    throw new Error(`Failed to save assessment: ${error.message}`);
  }

  return adapters.assessmentFromDb(data);
}

export async function deleteStudentAssessment(arg1: string, arg2?: string): Promise<void> {
  const authId = await getVerifiedUserId();
  let assessmentId: string;

  if (arg2) {
    assertAuthorizedUser(arg1, authId);
    assessmentId = arg2;
  } else {
    assessmentId = arg1;
  }

  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', assessmentId)
    .eq('user_id', authId);

  if (error) {
    console.error('[supabaseStorage] deleteStudentAssessment error:', error);
    throw new Error(`Failed to delete assessment: ${error.message}`);
  }
}
