import {
  isValidUuid,
  ensureUuid,
  assertAuthorizedUser,
  profileFromDb,
  profileToDb,
  subjectFromDb,
  subjectToDb,
  assignmentFromDb,
  assignmentToDb,
  calendarEventFromDb,
  calendarEventToDb,
  transactionFromDb,
  transactionToDb,
  savingsGoalFromDb,
  savingsGoalToDb,
  habitFromDb,
  habitToDb,
  habitLogFromDb,
  habitLogToDb,
  focusSessionFromDb,
  focusSessionToDb,
  focusSettingsFromDb,
  focusSettingsToDb,
  assessmentFromDb,
  assessmentToDb
} from './supabaseAdapters';

// Self-contained test runner compatible with tsx, node, and tsc (no @types/node dependencies needed)
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${msg || ''}`);
  }
}

function assertDeepEqual(actual: any, expected: any, msg?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`Assertion failed: expected ${expectedStr}, got ${actualStr}. ${msg || ''}`);
  }
}

function assertThrows(fn: () => void, expectedPattern?: RegExp) {
  let threw = false;
  try {
    fn();
  } catch (e: any) {
    threw = true;
    if (expectedPattern && !expectedPattern.test(e.message)) {
      throw new Error(`Expected error matching ${expectedPattern}, but got "${e.message}"`);
    }
  }
  if (!threw) {
    throw new Error('Expected function to throw, but it did not throw.');
  }
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('--- Running UniFlow Supabase Adapters & Storage Test Suite ---');

const TEST_USER_ID = '11111111-2222-3333-4444-555555555555';
const VALID_UUID = 'a0000000-0000-0000-0000-000000000001';

// 1. UUID Tests
// 1. UUID Tests
runTest('UUID validation & generation', () => {
  assert(isValidUuid(VALID_UUID), 'valid UUID must be true');
  assert(!isValidUuid('mock_id_123'), 'mock id must be false');
  assert(!isValidUuid(''), 'empty string must be false');
  assert(!isValidUuid(undefined), 'undefined must be false');
  assertEqual(ensureUuid(VALID_UUID), VALID_UUID);
  
  // Generating a fresh UUID when omitted or empty
  const generatedUndefined = ensureUuid(undefined);
  assert(isValidUuid(generatedUndefined), 'ensureUuid must return valid UUID when undefined');
  const generatedNull = ensureUuid(null);
  assert(isValidUuid(generatedNull), 'ensureUuid must return valid UUID when null');
  const generatedEmpty = ensureUuid('');
  assert(isValidUuid(generatedEmpty), 'ensureUuid must return valid UUID when empty string');

  // Strict rejection when existing non-null ID is invalid
  let threwInvalid = false;
  try {
    ensureUuid('mock_invalid_id_123');
  } catch (err: any) {
    threwInvalid = true;
    assert(err.message.includes('Invalid UUID format'), 'Expected invalid UUID format error');
  }
  assert(threwInvalid, 'ensureUuid must throw descriptive error on invalid non-null ID');

  // Verify adapter rejection across entities
  let threwSubject = false;
  try {
    subjectToDb({ id: 'bad_sub_id', name: 'Test' } as any, TEST_USER_ID);
  } catch {
    threwSubject = true;
  }
  assert(threwSubject, 'subjectToDb must reject invalid existing ID');

  let threwAssignment = false;
  try {
    assignmentToDb({ id: 'bad_asg_id', title: 'Test' } as any, TEST_USER_ID);
  } catch {
    threwAssignment = true;
  }
  assert(threwAssignment, 'assignmentToDb must reject invalid existing ID');
});

// 2. Profiles Adapter Tests
runTest('Profiles adapter: mapping & positive budget clamp', () => {
  const dbRow = {
    user_id: TEST_USER_ID,
    full_name: 'Test Student',
    avatar_url: 'https://example.com/avatar.jpg',
    university: 'Test University',
    degree: 'B.Tech',
    department: 'CS',
    academic_year: 'Year 2',
    semester: 'Semester 4',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    theme: 'dark',
    week_start_preference: 'monday',
    monthly_budget: '15000.00',
    onboarding_completed: true,
    created_at: '2026-10-24T00:00:00Z',
    updated_at: '2026-10-24T00:00:00Z',
  };

  const profile = profileFromDb(dbRow);
  assertEqual(profile.userId, TEST_USER_ID);
  assertEqual(profile.fullName, 'Test Student');
  assertEqual(profile.monthlyBudget, 15000);
  assertEqual(profile.onboardingCompleted, true);

  const payload = profileToDb({ ...profile, monthlyBudget: -200 });
  assertEqual(payload.full_name, 'Test Student');
  assert(payload.monthly_budget > 0, 'monthly_budget must be strictly positive');
});

// 3. Subjects Adapter Tests
runTest('Subjects adapter: numeric coercion & range clamping', () => {
  const dbRow = {
    id: VALID_UUID,
    user_id: TEST_USER_ID,
    name: 'Data Structures',
    code: 'CS201',
    color: '#8B80FF',
    semester: 'Semester 3',
    instructor: 'Dr. Raman',
    credits: '4.0',
    target_percentage: '90.00',
    grading_scheme: 'weighted',
    created_at: '2026-10-24T00:00:00Z',
  };

  const sub = subjectFromDb(dbRow);
  assertEqual(sub.credits, 4);
  assertEqual(sub.targetPercentage, 90);
  assertEqual(sub.gradingScheme, 'weighted');

  const payload = subjectToDb({
    name: 'DSA',
    code: 'CS201',
    credits: -2,
    targetPercentage: 150,
  }, TEST_USER_ID);

  assertEqual(payload.credits, 0); // credits >= 0
  assertEqual(payload.target_percentage, 100); // 0 <= target_percentage <= 100
  assertEqual(payload.user_id, TEST_USER_ID);
});

// 4. Assignments Adapter Tests
runTest('Assignments adapter: subtasks JSONB & estimated_minutes check', () => {
  const subtasks = [
    { id: 'st1', title: 'Part A', isCompleted: true },
    { id: 'st2', title: 'Part B', isCompleted: false },
  ];

  const dbRow = {
    id: VALID_UUID,
    user_id: TEST_USER_ID,
    subject_id: VALID_UUID,
    title: 'Operating Systems Project',
    description: 'Kernel module',
    due_at: '2026-10-30T18:00:00Z',
    priority: 'high',
    status: 'in_progress',
    estimated_minutes: 180,
    reference_url: 'https://github.com',
    subtasks,
    completed_at: null,
    created_at: '2026-10-24T00:00:00Z',
  };

  const asg = assignmentFromDb(dbRow);
  assertEqual(asg.subtasks.length, 2);
  assertEqual(asg.estimatedMinutes, 180);

  const payload = assignmentToDb({
    ...asg,
    estimatedMinutes: 0, // Should become null to satisfy check (estimated_minutes IS NULL OR estimated_minutes > 0)
  }, TEST_USER_ID);

  assertEqual(payload.estimated_minutes, null);
});

// 5. Calendar Events Adapter Tests
runTest('Calendar events adapter: temporal order & recurring days filter', () => {
  const startAt = '2026-10-24T10:00:00Z';
  const invalidEndAt = '2026-10-24T09:00:00Z'; // Earlier than start!

  const payload = calendarEventToDb({
    title: 'Lab Session',
    startAt,
    endAt: invalidEndAt,
    eventType: 'lab',
    isRecurring: true,
    recurringDays: [1, 3, 5, 12, -2], // 12 and -2 are out of range 0..6
  }, TEST_USER_ID);

  assert(new Date(payload.end_at).getTime() > new Date(payload.start_at).getTime(), 'end_at must be strictly after start_at');
  assertDeepEqual(payload.recurring_days, [1, 3, 5]);
});

// 6. Transactions Adapter Tests
runTest('Transactions adapter: positive amount & valid method', () => {
  const payload = transactionToDb({
    amount: -750,
    transactionType: 'expense',
    paymentMethod: 'UPI',
  }, TEST_USER_ID);

  assert(payload.amount > 0, 'amount must be positive');
  assertEqual(payload.amount, 750);
  assertEqual(payload.payment_method, 'UPI');
});

// 7. Savings Goals Adapter Tests
runTest('Savings goals adapter: positive target amount & non-negative progress', () => {
  const payload = savingsGoalToDb({
    title: 'Conference Registration',
    targetAmount: 0,
    currentProgress: -50,
  }, TEST_USER_ID);

  assert(payload.target_amount > 0, 'target_amount must be positive');
  assertEqual(payload.current_progress, 0);
});

// 8. Habits & Habit Logs Adapter Tests
runTest('Habits adapter: schedule_type, weekly target days clamp', () => {
  const payload = habitToDb({
    title: 'Workout',
    scheduleType: 'weekly',
    weeklyTargetDays: 14, // Clamped to 7
  }, TEST_USER_ID);

  assertEqual(payload.weekly_target_days, 7);
  assertEqual(payload.schedule_type, 'weekly');
});

runTest('Habit logs adapter: completion & numeric progress mapping', () => {
  const logPayload = habitLogToDb({
    habitId: VALID_UUID,
    date: '2026-10-24',
    isCompleted: true,
    currentValue: 45,
  }, TEST_USER_ID);

  assertEqual(logPayload.habit_id, VALID_UUID);
  assertEqual(logPayload.is_completed, true);
  assertEqual(logPayload.current_value, 45);
});

// 9. Focus Sessions & Settings Adapter Tests
runTest('Focus sessions adapter: planned minutes & actual seconds bounds', () => {
  const payload = focusSessionToDb({
    plannedMinutes: -5,
    actualDurationSeconds: -20,
  }, TEST_USER_ID);

  assert(payload.planned_minutes > 0, 'planned_minutes must be > 0');
  assertEqual(payload.actual_duration_seconds, 0);
});

runTest('Focus settings adapter: timer config & active timer state JSONB', () => {
  const settings = {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
  };

  const activeState = {
    status: 'running' as const,
    sessionType: 'focus' as const,
    taskTitle: 'Algorithm Revision',
    totalDurationMs: 1500000,
    remainingMs: 750000,
    startedAtTimestamp: 1729750000000,
    targetEndTimestamp: 1729751500000,
    completedPomodorosInCycle: 2,
  };

  const payload = focusSettingsToDb(settings, activeState);
  assertEqual(payload.focus_duration_minutes, 25);
  assertDeepEqual(payload.active_focus_state, activeState);
});

// 10. Assessments Adapter Tests
runTest('Assessments adapter: obtained marks clamped to maximum marks', () => {
  const payload = assessmentToDb({
    maximumMarks: 50,
    obtainedMarks: 60, // Exceeds max marks!
    weightagePercentage: 110, // Exceeds 100%!
  }, TEST_USER_ID);

  assertEqual(payload.maximum_marks, 50);
  assertEqual(payload.obtained_marks, 50); // Clamped to 50
  assertEqual(payload.weightage_percentage, 100); // Clamped to 100
});

// 11. Authorization Enforcement Tests
runTest('Authorization: assertAuthorizedUser rejects untrusted user IDs', () => {
  assertAuthorizedUser(undefined, TEST_USER_ID); // Allowed (defaults to session user)
  assertAuthorizedUser(TEST_USER_ID, TEST_USER_ID); // Allowed (matches session user)

  assertThrows(
    () => assertAuthorizedUser('spoofed-user-id', TEST_USER_ID),
    /Unauthorized: Caller user ID/
  );
});

console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  (globalThis as any).process?.exit(1);
}
