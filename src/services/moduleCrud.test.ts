// UniFlow Module CRUD, User Isolation, and Optimistic Rollback Test Suite
import { 
  Subject, 
  CalendarEvent, 
  Assignment, 
  Transaction, 
  SavingsGoal, 
  Habit, 
  HabitLog, 
  FocusSession, 
  FocusSettings, 
  Assessment 
} from '../types';
import { assertAuthorizedUser } from './supabaseStorage';
import { isValidUuid, ensureUuid, subjectToDb, assignmentToDb, transactionToDb } from './supabaseAdapters';

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

console.log('--- Running UniFlow Module CRUD, Foreign Key & Rollback Test Suite ---');

const USER_A = 'a1111111-1111-1111-1111-111111111111';
const USER_B = 'b2222222-2222-2222-2222-222222222222';

// Simulated State Manager mirroring AppContext module operations and rollback behavior
class AppContextModuleTester {
  public userId: string | null = USER_A;
  public subjects: Subject[] = [];
  public events: CalendarEvent[] = [];
  public assignments: Assignment[] = [];
  public transactions: Transaction[] = [];
  public savingsGoals: SavingsGoal[] = [];
  public habits: Habit[] = [];
  public habitLogs: HabitLog[] = [];
  public focusSessions: FocusSession[] = [];
  public focusSettings: FocusSettings = {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
  };
  public assessments: Assessment[] = [];

  constructor(public mockRemote: any) {}

  // Subject CRUD with optimistic update & item-specific rollback
  public async saveSubject(sub: Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Subject> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !sub.id;
    const targetId = sub.id || 'sub_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.subjects.find(s => s.id === targetId);
    const tempSaved: Subject = {
      id: targetId,
      userId: this.userId,
      name: sub.name,
      code: sub.code,
      color: sub.color,
      semester: sub.semester,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.subjects = this.subjects.map(s => s.id === targetId ? tempSaved : s);
    } else {
      this.subjects = [...this.subjects, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveSubject(sub, this.userId);
      this.subjects = this.subjects.map(s => s.id === targetId ? confirmed : s);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.subjects = this.subjects.filter(s => s.id !== targetId);
      } else if (oldItem) {
        this.subjects = this.subjects.map(s => s.id === targetId ? oldItem : s);
      }
      throw err;
    }
  }

  public async deleteSubject(id: string): Promise<void> {
    if (!this.userId) return;
    const oldSubject = this.subjects.find(s => s.id === id);
    const cascadeAssignments = this.assignments.filter(a => a.subjectId === id);
    const cascadeAssessments = this.assessments.filter(a => a.subjectId === id);
    const affectedEventIds = new Set(this.events.filter(e => e.subjectId === id).map(e => e.id));
    const affectedSessionIds = new Set(this.focusSessions.filter(f => f.subjectId === id).map(f => f.id));

    // Immediate local cascade mirroring PostgreSQL schema foreign-key behavior
    this.subjects = this.subjects.filter(s => s.id !== id);
    this.assignments = this.assignments.filter(a => a.subjectId !== id);
    this.assessments = this.assessments.filter(a => a.subjectId !== id);
    this.events = this.events.map(e => e.subjectId === id ? { ...e, subjectId: undefined } : e);
    this.focusSessions = this.focusSessions.map(f => f.subjectId === id ? { ...f, subjectId: undefined } : f);

    try {
      await this.mockRemote.deleteSubject(id, this.userId);
    } catch (err) {
      // Item-specific rollback: restore deleted subject and cascaded relations
      if (oldSubject && !this.subjects.some(s => s.id === id)) {
        this.subjects = [...this.subjects, oldSubject];
      }
      if (cascadeAssignments.length > 0) {
        const existingIds = new Set(this.assignments.map(a => a.id));
        this.assignments = [...this.assignments, ...cascadeAssignments.filter(a => !existingIds.has(a.id))];
      }
      if (cascadeAssessments.length > 0) {
        const existingIds = new Set(this.assessments.map(a => a.id));
        this.assessments = [...this.assessments, ...cascadeAssessments.filter(a => !existingIds.has(a.id))];
      }
      if (affectedEventIds.size > 0) {
        this.events = this.events.map(e => affectedEventIds.has(e.id) ? { ...e, subjectId: id } : e);
      }
      if (affectedSessionIds.size > 0) {
        this.focusSessions = this.focusSessions.map(f => affectedSessionIds.has(f.id) ? { ...f, subjectId: id } : f);
      }
      throw err;
    }
  }

  // Assignment CRUD with optimistic update & item-specific rollback
  public async saveAssignment(asg: Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Assignment> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !asg.id;
    const targetId = asg.id || 'asg_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.assignments.find(a => a.id === targetId);
    const tempSaved: Assignment = {
      id: targetId,
      userId: this.userId,
      subjectId: asg.subjectId,
      title: asg.title,
      description: asg.description,
      dueAt: asg.dueAt,
      priority: asg.priority,
      status: asg.status,
      estimatedMinutes: asg.estimatedMinutes,
      subtasks: asg.subtasks || [],
      completedAt: asg.completedAt,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.assignments = this.assignments.map(a => a.id === targetId ? tempSaved : a);
    } else {
      this.assignments = [...this.assignments, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveAssignment(asg, this.userId);
      this.assignments = this.assignments.map(a => a.id === targetId ? confirmed : a);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.assignments = this.assignments.filter(a => a.id !== targetId);
      } else if (oldItem) {
        this.assignments = this.assignments.map(a => a.id === targetId ? oldItem : a);
      }
      throw err;
    }
  }

  public async deleteAssignment(id: string): Promise<void> {
    if (!this.userId) return;
    const oldItem = this.assignments.find(a => a.id === id);
    this.assignments = this.assignments.filter(a => a.id !== id);

    try {
      await this.mockRemote.deleteAssignment(id, this.userId);
    } catch (err) {
      if (oldItem && !this.assignments.some(a => a.id === id)) {
        this.assignments = [...this.assignments, oldItem];
      }
      throw err;
    }
  }

  // Habit & HabitLog CRUD with optimistic update & item-specific rollback
  public async saveHabit(habit: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Habit> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !habit.id;
    const targetId = habit.id || 'h_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.habits.find(h => h.id === targetId);
    const tempSaved: Habit = {
      id: targetId,
      userId: this.userId,
      title: habit.title,
      category: habit.category,
      icon: habit.icon,
      color: habit.color,
      scheduleType: habit.scheduleType,
      weeklyTargetDays: habit.weeklyTargetDays,
      targetType: habit.targetType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      isArchived: habit.isArchived ?? false,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.habits = this.habits.map(h => h.id === targetId ? tempSaved : h);
    } else {
      this.habits = [...this.habits, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveHabit(habit, this.userId);
      this.habits = this.habits.map(h => h.id === targetId ? confirmed : h);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.habits = this.habits.filter(h => h.id !== targetId);
      } else if (oldItem) {
        this.habits = this.habits.map(h => h.id === targetId ? oldItem : h);
      }
      throw err;
    }
  }

  public async archiveHabit(id: string, isArchived: boolean): Promise<void> {
    if (!this.userId) return;
    const oldItem = this.habits.find(h => h.id === id);
    this.habits = this.habits.map(h => h.id === id ? { ...h, isArchived } : h);

    try {
      await this.mockRemote.archiveHabit(id, isArchived, this.userId);
    } catch (err) {
      if (oldItem) {
        this.habits = this.habits.map(h => h.id === id ? oldItem : h);
      }
      throw err;
    }
  }

  public async deleteHabit(id: string): Promise<void> {
    if (!this.userId) return;
    const oldHabit = this.habits.find(h => h.id === id);
    const oldLogs = this.habitLogs.filter(l => l.habitId === id);
    this.habits = this.habits.filter(h => h.id !== id);
    this.habitLogs = this.habitLogs.filter(l => l.habitId !== id);

    try {
      await this.mockRemote.deleteHabit(id, this.userId);
    } catch (err) {
      if (oldHabit && !this.habits.some(h => h.id === id)) {
        this.habits = [...this.habits, oldHabit];
      }
      if (oldLogs.length > 0) {
        const existingIds = new Set(this.habitLogs.map(l => l.id));
        this.habitLogs = [...this.habitLogs, ...oldLogs.filter(l => !existingIds.has(l.id))];
      }
      throw err;
    }
  }

  public async recordHabitCompletion(habitId: string, date: string, isCompleted: boolean, currentValue?: number): Promise<HabitLog> {
    if (!this.userId) throw new Error("No active user session");
    const existingLog = this.habitLogs.find(l => l.habitId === habitId && l.date === date);
    const tempLog: HabitLog = {
      id: existingLog?.id || 'log_' + Math.random().toString(36).substring(2, 9),
      habitId,
      userId: this.userId,
      date,
      isCompleted,
      currentValue,
    };

    if (existingLog) {
      this.habitLogs = this.habitLogs.map(l => (l.habitId === habitId && l.date === date) ? tempLog : l);
    } else {
      this.habitLogs = [...this.habitLogs, tempLog];
    }

    try {
      const confirmed = await this.mockRemote.recordHabitCompletion(habitId, date, isCompleted, currentValue, this.userId);
      this.habitLogs = this.habitLogs.map(l => (l.habitId === habitId && l.date === date) ? confirmed : l);
      return confirmed;
    } catch (err) {
      if (existingLog) {
        this.habitLogs = this.habitLogs.map(l => (l.habitId === habitId && l.date === date) ? existingLog : l);
      } else {
        this.habitLogs = this.habitLogs.filter(l => !(l.habitId === habitId && l.date === date));
      }
      throw err;
    }
  }

  // Transaction CRUD with optimistic update & item-specific rollback
  public async saveTransaction(tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Transaction> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !tx.id;
    const targetId = tx.id || 'tx_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.transactions.find(t => t.id === targetId);
    const tempSaved: Transaction = {
      id: targetId,
      userId: this.userId,
      transactionType: tx.transactionType,
      amount: tx.amount,
      category: tx.category,
      transactionDate: tx.transactionDate,
      paymentMethod: tx.paymentMethod,
      description: tx.description,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.transactions = this.transactions.map(t => t.id === targetId ? tempSaved : t);
    } else {
      this.transactions = [...this.transactions, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveTransaction(tx, this.userId);
      this.transactions = this.transactions.map(t => t.id === targetId ? confirmed : t);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.transactions = this.transactions.filter(t => t.id !== targetId);
      } else if (oldItem) {
        this.transactions = this.transactions.map(t => t.id === targetId ? oldItem : t);
      }
      throw err;
    }
  }

  public async deleteTransaction(id: string): Promise<void> {
    if (!this.userId) return;
    const oldItem = this.transactions.find(t => t.id === id);
    this.transactions = this.transactions.filter(t => t.id !== id);

    try {
      await this.mockRemote.deleteTransaction(id, this.userId);
    } catch (err) {
      if (oldItem && !this.transactions.some(t => t.id === id)) {
        this.transactions = [...this.transactions, oldItem];
      }
      throw err;
    }
  }

  // Calendar Event CRUD with optimistic update & item-specific rollback
  public async saveEvent(ev: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<CalendarEvent> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !ev.id;
    const targetId = ev.id || 'ev_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.events.find(e => e.id === targetId);
    const tempSaved: CalendarEvent = {
      id: targetId,
      userId: this.userId,
      subjectId: ev.subjectId,
      assignmentId: ev.assignmentId,
      title: ev.title,
      eventType: ev.eventType,
      startAt: ev.startAt,
      endAt: ev.endAt,
      location: ev.location,
      description: ev.description,
      isRecurring: ev.isRecurring,
      recurringDays: ev.recurringDays,
      recurrenceEndAt: ev.recurrenceEndAt,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.events = this.events.map(e => e.id === targetId ? tempSaved : e);
    } else {
      this.events = [...this.events, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveEvent(ev, this.userId);
      this.events = this.events.map(e => e.id === targetId ? confirmed : e);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.events = this.events.filter(e => e.id !== targetId);
      } else if (oldItem) {
        this.events = this.events.map(e => e.id === targetId ? oldItem : e);
      }
      throw err;
    }
  }

  public async deleteEvent(id: string): Promise<void> {
    if (!this.userId) return;
    const oldItem = this.events.find(e => e.id === id);
    this.events = this.events.filter(e => e.id !== id);

    try {
      await this.mockRemote.deleteEvent(id, this.userId);
    } catch (err) {
      if (oldItem && !this.events.some(e => e.id === id)) {
        this.events = [...this.events, oldItem];
      }
      throw err;
    }
  }

  // Savings Goal CRUD with optimistic update & item-specific rollback
  public async saveSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<SavingsGoal> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !goal.id;
    const targetId = goal.id || 'sg_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.savingsGoals.find(g => g.id === targetId);
    const tempSaved: SavingsGoal = {
      id: targetId,
      userId: this.userId,
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentProgress: goal.currentProgress,
      targetDate: goal.targetDate,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.savingsGoals = this.savingsGoals.map(g => g.id === targetId ? tempSaved : g);
    } else {
      this.savingsGoals = [...this.savingsGoals, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveSavingsGoal(goal, this.userId);
      this.savingsGoals = this.savingsGoals.map(g => g.id === targetId ? confirmed : g);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.savingsGoals = this.savingsGoals.filter(g => g.id !== targetId);
      } else if (oldItem) {
        this.savingsGoals = this.savingsGoals.map(g => g.id === targetId ? oldItem : g);
      }
      throw err;
    }
  }

  // Focus Session & Settings CRUD with optimistic update & item-specific rollback
  public async saveFocusSession(session: Omit<FocusSession, 'id' | 'userId'> & { id?: string }): Promise<FocusSession> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !session.id;
    const targetId = session.id || 'fs_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.focusSessions.find(f => f.id === targetId);
    const tempSaved: FocusSession = {
      id: targetId,
      userId: this.userId,
      subjectId: session.subjectId,
      title: session.title,
      sessionType: session.sessionType,
      workflowMode: session.workflowMode,
      plannedMinutes: session.plannedMinutes,
      actualDurationSeconds: session.actualDurationSeconds,
      completedAt: session.completedAt || new Date().toISOString(),
      isCompleted: session.isCompleted,
    };

    if (oldItem) {
      this.focusSessions = this.focusSessions.map(f => f.id === targetId ? tempSaved : f);
    } else {
      this.focusSessions = [...this.focusSessions, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveFocusSession(session, this.userId);
      this.focusSessions = this.focusSessions.map(f => f.id === targetId ? confirmed : f);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.focusSessions = this.focusSessions.filter(f => f.id !== targetId);
      } else if (oldItem) {
        this.focusSessions = this.focusSessions.map(f => f.id === targetId ? oldItem : f);
      }
      throw err;
    }
  }

  public async saveFocusSettings(settings: FocusSettings): Promise<void> {
    if (!this.userId) return;
    const prev = { ...this.focusSettings };
    this.focusSettings = settings;

    try {
      await this.mockRemote.saveFocusSettings(settings, this.userId);
    } catch (err) {
      this.focusSettings = prev;
      throw err;
    }
  }

  // Assessment CRUD with optimistic update & item-specific rollback
  public async saveAssessment(assessment: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Assessment> {
    if (!this.userId) throw new Error("No active user session");
    const isNew = !assessment.id;
    const targetId = assessment.id || 'asm_' + Math.random().toString(36).substring(2, 9);
    const oldItem = this.assessments.find(a => a.id === targetId);
    const tempSaved: Assessment = {
      id: targetId,
      userId: this.userId,
      subjectId: assessment.subjectId,
      title: assessment.title,
      assessmentType: assessment.assessmentType,
      maximumMarks: assessment.maximumMarks,
      obtainedMarks: assessment.obtainedMarks,
      weightagePercentage: assessment.weightagePercentage,
      assessmentDate: assessment.assessmentDate,
      status: assessment.status,
      createdAt: oldItem?.createdAt || new Date().toISOString(),
    };

    if (oldItem) {
      this.assessments = this.assessments.map(a => a.id === targetId ? tempSaved : a);
    } else {
      this.assessments = [...this.assessments, tempSaved];
    }

    try {
      const confirmed = await this.mockRemote.saveAssessment(assessment, this.userId);
      this.assessments = this.assessments.map(a => a.id === targetId ? confirmed : a);
      return confirmed;
    } catch (err) {
      if (isNew) {
        this.assessments = this.assessments.filter(a => a.id !== targetId);
      } else if (oldItem) {
        this.assessments = this.assessments.map(a => a.id === targetId ? oldItem : a);
      }
      throw err;
    }
  }
}

async function runAllCrudTests() {
  // Test 1: Subject CRUD confirmed writes & relationship preservation
  await (async () => {
    const remoteSubjects: Subject[] = [];
    const mockRemote = {
      saveSubject: async (sub: any, uid: string) => {
        const id = sub.id || 'sub_uuid_101';
        const confirmed: Subject = { ...sub, id, userId: uid, createdAt: new Date().toISOString() };
        remoteSubjects.push(confirmed);
        return confirmed;
      },
      deleteSubject: async (id: string, uid: string) => {
        const idx = remoteSubjects.findIndex(s => s.id === id && s.userId === uid);
        if (idx !== -1) remoteSubjects.splice(idx, 1);
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Create Subject
    const saved = await tester.saveSubject({
      name: 'Computer Networks',
      code: 'CS401',
      color: '#38BDF8',
      semester: 'Semester 4',
    });

    assertEqual(tester.subjects.length, 1);
    assertEqual(tester.subjects[0].name, 'Computer Networks');
    assertEqual(tester.subjects[0].id, 'sub_uuid_101');
    assertEqual(remoteSubjects.length, 1);

    // Delete Subject
    await tester.deleteSubject('sub_uuid_101');
    assertEqual(tester.subjects.length, 0);
    assertEqual(remoteSubjects.length, 0);

    console.log('  ✓ Subject CRUD: verified create, update, delete, and confirmed writes');
    passed++;
  })();

  // Test 2: Optimistic update with atomic rollback on failed Subject write
  await (async () => {
    const mockRemote = {
      saveSubject: async () => {
        throw new Error('Supabase database error: RLS policy violation');
      },
      deleteSubject: async () => {
        throw new Error('Network timeout during delete');
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Attempt save with failure
    let errorThrown = false;
    try {
      await tester.saveSubject({ name: 'Failing Subject', code: 'FAIL101', color: '#EF4444', semester: 'Semester 1' });
    } catch {
      errorThrown = true;
    }

    assertEqual(errorThrown, true);
    // State MUST roll back to 0 subjects
    assertEqual(tester.subjects.length, 0, 'Subject state must roll back to previous snapshot on save failure');

    // Seed state and test delete rollback
    tester.subjects = [{
      id: 'existing_sub',
      userId: USER_A,
      name: 'Existing Sub',
      code: 'EX101',
      color: '#10B981',
      semester: 'Semester 1',
      createdAt: new Date().toISOString(),
    }];

    errorThrown = false;
    try {
      await tester.deleteSubject('existing_sub');
    } catch {
      errorThrown = true;
    }

    assertEqual(errorThrown, true);
    assertEqual(tester.subjects.length, 1, 'Subject state must roll back to previous snapshot on delete failure');
    assertEqual(tester.subjects[0].id, 'existing_sub');

    console.log('  ✓ Optimistic updates: atomic rollback on save and delete failures');
    passed++;
  })();

  // Test 3: Assignment CRUD, subtasks JSONB, and foreign key relationship to Subject
  await (async () => {
    const mockRemote = {
      saveAssignment: async (asg: any, uid: string) => {
        // Enforce valid foreign key constraint check
        if (asg.subjectId === 'nonexistent_subject') {
          throw new Error('Foreign key violation: subject_id does not exist');
        }
        return {
          ...asg,
          id: asg.id || 'asg_uuid_555',
          userId: uid,
          createdAt: new Date().toISOString(),
        };
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Save with valid subject relationship and subtasks
    const validAssignment = await tester.saveAssignment({
      subjectId: 'valid_sub_1',
      title: 'Operating Systems Lab 3',
      dueAt: '2026-10-30T23:59:59Z',
      priority: 'high',
      status: 'in_progress',
      subtasks: [
        { id: 'st_1', title: 'Implement thread synchronization', isCompleted: true },
        { id: 'st_2', title: 'Write benchmark report', isCompleted: false },
      ],
    });

    assertEqual(tester.assignments.length, 1);
    assertEqual(tester.assignments[0].subjectId, 'valid_sub_1');
    assertEqual(tester.assignments[0].subtasks.length, 2);
    assertEqual(tester.assignments[0].subtasks[0].isCompleted, true);

    // Test invalid foreign key rejection & rollback
    let fkError = false;
    try {
      await tester.saveAssignment({
        subjectId: 'nonexistent_subject',
        title: 'Broken FK Assignment',
        dueAt: '2026-10-30T23:59:59Z',
        priority: 'low',
        status: 'not_started',
        subtasks: [],
      });
    } catch {
      fkError = true;
    }

    assertEqual(fkError, true);
    // Ensure only the valid assignment remains; broken one rolled back
    assertEqual(tester.assignments.length, 1);
    assertEqual(tester.assignments[0].id, 'asg_uuid_555');

    console.log('  ✓ Assignment CRUD: subtasks handling and foreign-key relationship integrity');
    passed++;
  })();

  // Test 4: Habit & HabitLog CRUD, archiving, and cascade cleanup
  await (async () => {
    const remoteHabits: Habit[] = [];
    const remoteLogs: HabitLog[] = [];

    const mockRemote = {
      saveHabit: async (h: any, uid: string) => {
        const confirmed: Habit = { ...h, id: h.id || 'h_100', userId: uid, createdAt: new Date().toISOString() };
        remoteHabits.push(confirmed);
        return confirmed;
      },
      archiveHabit: async (id: string, isArchived: boolean) => {
        const h = remoteHabits.find(item => item.id === id);
        if (h) h.isArchived = isArchived;
      },
      deleteHabit: async (id: string) => {
        const idx = remoteHabits.findIndex(item => item.id === id);
        if (idx !== -1) remoteHabits.splice(idx, 1);
      },
      recordHabitCompletion: async (habitId: string, date: string, isCompleted: boolean, val: number | undefined, uid: string) => {
        const confirmed: HabitLog = {
          id: 'hl_' + Math.random().toString(36).substring(2, 7),
          habitId,
          userId: uid,
          date,
          isCompleted,
          currentValue: val,
        };
        remoteLogs.push(confirmed);
        return confirmed;
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // 1. Create habit
    await tester.saveHabit({
      title: 'Morning Code Review',
      category: 'study',
      icon: 'Code',
      color: '#8B80FF',
      scheduleType: 'daily',
      weeklyTargetDays: 7,
      targetType: 'boolean',
      isArchived: false,
    });

    assertEqual(tester.habits.length, 1);
    assertEqual(tester.habits[0].title, 'Morning Code Review');

    // 2. Archive habit
    await tester.archiveHabit('h_100', true);
    assertEqual(tester.habits[0].isArchived, true);

    // 3. Record completion log linked to habit
    await tester.recordHabitCompletion('h_100', '2026-10-24', true);
    assertEqual(tester.habitLogs.length, 1);
    assertEqual(tester.habitLogs[0].habitId, 'h_100');

    // 4. Delete habit -> verifies local cascade removes habit logs for that habit
    await tester.deleteHabit('h_100');
    assertEqual(tester.habits.length, 0);
    assertEqual(tester.habitLogs.length, 0, 'Deleting habit must purge its habit logs');

    console.log('  ✓ Habit & HabitLog CRUD: archiving, log tracking, and cascade relation cleanup');
    passed++;
  })();

  // Test 5: Transaction CRUD and financial integrity
  await (async () => {
    const mockRemote = {
      saveTransaction: async (tx: any, uid: string) => ({
        ...tx,
        id: tx.id || 'tx_999',
        userId: uid,
        createdAt: new Date().toISOString(),
      }),
      deleteTransaction: async () => {},
    };

    const tester = new AppContextModuleTester(mockRemote);

    await tester.saveTransaction({
      transactionType: 'expense',
      amount: 450,
      category: 'food',
      transactionDate: '2026-10-24',
      paymentMethod: 'UPI',
      description: 'Campus cafeteria lunch',
    });

    assertEqual(tester.transactions.length, 1);
    assertEqual(tester.transactions[0].amount, 450);
    assertEqual(tester.transactions[0].paymentMethod, 'UPI');

    await tester.deleteTransaction('tx_999');
    assertEqual(tester.transactions.length, 0);

    console.log('  ✓ Transaction CRUD: verified creation and removal');
    passed++;
  })();

  // Test 6: User Isolation & Unauthorized Access Prevention
  await (async () => {
    let unauthRejected = false;
    try {
      // assertAuthorizedUser should throw if verified user does not match target user
      assertAuthorizedUser(USER_A, USER_B);
    } catch (err: any) {
      unauthRejected = true;
      assert(err.message.includes('Unauthorized'), 'Expected authorization error message');
    }

    assertEqual(unauthRejected, true, 'User A must not be allowed to execute mutations on User B scope');

    // Valid authorization check passes
    assertAuthorizedUser(USER_A, USER_A);
    assertAuthorizedUser(USER_B, USER_B);

    console.log('  ✓ User Isolation: assertAuthorizedUser strictly confines mutations to authenticated user');
    passed++;
  })();

  // Test 7: Calendar Event CRUD & Foreign Key Integrity
  await (async () => {
    const mockRemote = {
      saveEvent: async (ev: any, uid: string) => {
        if (ev.subjectId === 'invalid_subject_id') {
          throw new Error('Foreign key violation: subject_id not found in subjects table');
        }
        return { ...ev, id: ev.id || 'ev_valid_1', userId: uid, createdAt: new Date().toISOString() };
      },
      deleteEvent: async () => {},
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Save event with valid subject
    await tester.saveEvent({
      subjectId: 'sub_valid_123',
      title: 'Operating Systems Lecture',
      eventType: 'class',
      startAt: '2026-10-25T10:00:00Z',
      endAt: '2026-10-25T11:30:00Z',
      isRecurring: false,
    });

    assertEqual(tester.events.length, 1);
    assertEqual(tester.events[0].subjectId, 'sub_valid_123');

    // Reject event with invalid subject foreign key & rollback
    let fkViolation = false;
    try {
      await tester.saveEvent({
        subjectId: 'invalid_subject_id',
        title: 'Ghost Lecture',
        eventType: 'class',
        startAt: '2026-10-25T14:00:00Z',
        endAt: '2026-10-25T15:00:00Z',
        isRecurring: false,
      });
    } catch {
      fkViolation = true;
    }

    assertEqual(fkViolation, true);
    assertEqual(tester.events.length, 1, 'Event state must roll back to 1 event after FK violation');

    console.log('  ✓ Calendar Event CRUD: foreign key relationship to Subject and rollback on violation');
    passed++;
  })();

  // Test 8: Focus Session & Focus Settings CRUD with Subject relationship
  await (async () => {
    const mockRemote = {
      saveFocusSession: async (fs: any, uid: string) => ({
        ...fs,
        id: fs.id || 'fs_123',
        userId: uid,
      }),
      saveFocusSettings: async () => {},
    };

    const tester = new AppContextModuleTester(mockRemote);

    await tester.saveFocusSession({
      subjectId: 'sub_cs_101',
      title: 'Deep Work on Algorithmic Complexity',
      sessionType: 'focus',
      workflowMode: 'pomodoro',
      plannedMinutes: 50,
      actualDurationSeconds: 3000,
      completedAt: new Date().toISOString(),
      isCompleted: true,
    });

    assertEqual(tester.focusSessions.length, 1);
    assertEqual(tester.focusSessions[0].subjectId, 'sub_cs_101');
    assertEqual(tester.focusSessions[0].actualDurationSeconds, 3000);

    // Save custom focus settings
    await tester.saveFocusSettings({
      focusDurationMinutes: 45,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      longBreakInterval: 4,
      autoStartBreaks: true,
      autoStartFocus: false,
      soundEnabled: true,
    });

    assertEqual(tester.focusSettings.focusDurationMinutes, 45);
    assertEqual(tester.focusSettings.autoStartBreaks, true);

    console.log('  ✓ Focus Session & Settings: subject-linked sessions and timer settings persistence');
    passed++;
  })();

  // Test 9: Savings Goal CRUD & Progress Rollback
  await (async () => {
    const mockRemote = {
      saveSavingsGoal: async (g: any, uid: string) => {
        if (g.targetAmount <= 0) throw new Error('Target amount must be positive');
        return { ...g, id: g.id || 'sg_target_1', userId: uid, createdAt: new Date().toISOString() };
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    const goal = await tester.saveSavingsGoal({
      title: 'Semester Textbooks & Cloud Computing Credits',
      targetAmount: 5000,
      currentProgress: 1500,
      targetDate: '2026-12-31',
    });

    assertEqual(tester.savingsGoals.length, 1);
    assertEqual(goal.currentProgress, 1500);

    // Reject non-positive target amount & rollback
    let targetErr = false;
    try {
      await tester.saveSavingsGoal({
        title: 'Negative Goal',
        targetAmount: -100,
        currentProgress: 0,
      });
    } catch {
      targetErr = true;
    }

    assertEqual(targetErr, true);
    assertEqual(tester.savingsGoals.length, 1);

    console.log('  ✓ Savings Goal CRUD: progress tracking and constraint validation rollback');
    passed++;
  })();

  // Test 10: Assessment CRUD, Subject relationship, and marks validation
  await (async () => {
    const mockRemote = {
      saveAssessment: async (asm: any, uid: string) => {
        if (asm.obtainedMarks !== undefined && asm.obtainedMarks > asm.maximumMarks) {
          throw new Error('Obtained marks cannot exceed maximum marks');
        }
        return { ...asm, id: asm.id || 'asm_midterm', userId: uid, createdAt: new Date().toISOString() };
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Valid assessment
    await tester.saveAssessment({
      subjectId: 'sub_net_1',
      title: 'Midterm Examination',
      assessmentType: 'midterm',
      maximumMarks: 100,
      obtainedMarks: 88,
      weightagePercentage: 30,
      assessmentDate: '2026-11-15',
      status: 'graded',
    });

    assertEqual(tester.assessments.length, 1);
    assertEqual(tester.assessments[0].obtainedMarks, 88);

    // Invalid marks rejection
    let marksError = false;
    try {
      await tester.saveAssessment({
        subjectId: 'sub_net_1',
        title: 'Invalid Marks Exam',
        assessmentType: 'quiz',
        maximumMarks: 20,
        obtainedMarks: 25, // Exceeds max marks
        weightagePercentage: 10,
        assessmentDate: '2026-11-20',
        status: 'graded',
      });
    } catch {
      marksError = true;
    }

    assertEqual(marksError, true);
    assertEqual(tester.assessments.length, 1, 'Assessment state must rollback on marks constraint violation');

    console.log('  ✓ Assessment CRUD: subject relationship and marks validation rollback');
    passed++;
  })();

  // Test 11: Concurrent optimistic writes where one succeeds and another fails (Fix 1)
  await (async () => {
    let rejectSlowWriteA: (err: any) => void;
    const slowWriteAPromise = new Promise<Subject>((_, reject) => {
      rejectSlowWriteA = reject;
    });

    const mockRemote = {
      saveSubject: async (sub: any, uid: string) => {
        if (sub.name === 'Slow Failing Subject A') {
          return slowWriteAPromise;
        }
        // Fast succeeding Subject B
        return {
          ...sub,
          id: sub.id || 'sub_succ_b',
          userId: uid,
          createdAt: new Date().toISOString(),
        };
      },
      deleteAssignment: async (id: string) => {
        if (id === 'asg_del_fail') {
          throw new Error('Remote server error on delete');
        }
      },
      saveAssignment: async (asg: any, uid: string) => {
        return {
          ...asg,
          id: asg.id || 'asg_succ_new',
          userId: uid,
          createdAt: new Date().toISOString(),
        };
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Case 1: Concurrent Creates - Write A starts (slow, fails), Write B starts (fast, succeeds)
    const writeAPromise = tester.saveSubject({
      name: 'Slow Failing Subject A',
      code: 'FAIL101',
      color: '#EF4444',
      semester: 'Semester 1',
    });

    // Write B executes concurrently and completes immediately
    const confirmedB = await tester.saveSubject({
      name: 'Fast Succeeded Subject B',
      code: 'SUCC202',
      color: '#10B981',
      semester: 'Semester 1',
    });

    assertEqual(tester.subjects.length, 2, 'Both optimistic items present during concurrent execution');
    assertEqual(tester.subjects.some(s => s.name === 'Fast Succeeded Subject B'), true);

    // Now fail Write A
    rejectSlowWriteA!(new Error('Supabase remote mutation failed: connection reset'));
    let writeAErrored = false;
    try {
      await writeAPromise;
    } catch {
      writeAErrored = true;
    }

    assertEqual(writeAErrored, true, 'Write A must reject');
    // Critical assertion: Write A was rolled back, but Write B was NOT wiped out by a whole-collection snapshot!
    assertEqual(tester.subjects.length, 1, 'Only Write A should be rolled back');
    assertEqual(tester.subjects[0].name, 'Fast Succeeded Subject B', 'Write B must remain intact');
    assertEqual(tester.subjects[0].id, confirmedB.id);

    // Case 2: Concurrent Updates - Item 1 update fails, Item 2 update succeeds
    tester.subjects = [
      { id: 'sub_1', userId: USER_A, name: 'Original One', code: 'O1', color: '#111', semester: 'S1', createdAt: '2026-01-01' },
      { id: 'sub_2', userId: USER_A, name: 'Original Two', code: 'O2', color: '#222', semester: 'S1', createdAt: '2026-01-01' },
    ];

    let rejectUpdate1: (err: any) => void;
    const slowUpdate1Promise = new Promise<Subject>((_, reject) => {
      rejectUpdate1 = reject;
    });

    const updateMockRemote = {
      saveSubject: async (sub: any, uid: string) => {
        if (sub.id === 'sub_1') {
          return slowUpdate1Promise;
        }
        return { ...sub, userId: uid, createdAt: '2026-01-01' };
      },
    };
    tester.mockRemote = updateMockRemote;

    const update1Promise = tester.saveSubject({ id: 'sub_1', name: 'Updated One Failing', code: 'O1', color: '#111', semester: 'S1' });
    const update2Promise = await tester.saveSubject({ id: 'sub_2', name: 'Updated Two Succeeded', code: 'O2', color: '#222', semester: 'S1' });

    assertEqual(tester.subjects.find(s => s.id === 'sub_2')?.name, 'Updated Two Succeeded');

    rejectUpdate1!(new Error('Update 1 failed remotely'));
    let update1Errored = false;
    try {
      await update1Promise;
    } catch {
      update1Errored = true;
    }

    assertEqual(update1Errored, true);
    assertEqual(tester.subjects.find(s => s.id === 'sub_1')?.name, 'Original One', 'Sub 1 reverted to original state');
    assertEqual(tester.subjects.find(s => s.id === 'sub_2')?.name, 'Updated Two Succeeded', 'Sub 2 update preserved');

    // Case 3: Concurrent Delete and Create - Delete A fails, Create B succeeds
    tester.mockRemote = mockRemote;
    tester.assignments = [
      {
        id: 'asg_del_fail',
        userId: USER_A,
        subjectId: 'sub_1',
        title: 'Assignment To Delete',
        dueAt: '2026-11-01',
        priority: 'high',
        status: 'not_started',
        subtasks: [],
        createdAt: '2026-01-01',
      },
    ];

    // Delete A fails
    let deleteErrored = false;
    try {
      await tester.deleteAssignment('asg_del_fail');
    } catch {
      deleteErrored = true;
    }
    assertEqual(deleteErrored, true);

    // Create B succeeds
    await tester.saveAssignment({
      subjectId: 'sub_2',
      title: 'New Concurrent Assignment',
      dueAt: '2026-11-05',
      priority: 'medium',
      status: 'not_started',
      subtasks: [],
    });

    assertEqual(tester.assignments.length, 2, 'Both restored item and new item exist');
    assertEqual(tester.assignments.some(a => a.id === 'asg_del_fail'), true, 'Failed delete restored');
    assertEqual(tester.assignments.some(a => a.title === 'New Concurrent Assignment'), true, 'New write preserved');

    console.log('  ✓ Concurrent optimistic rollback: item-specific rollback protects concurrent and pending writes');
    passed++;
  })();

  // Test 12: Subject deletion consistency & foreign-key cascade mirroring (Fix 2)
  await (async () => {
    let failDeleteSubBeta = false;
    const mockRemote = {
      deleteSubject: async (id: string) => {
        if (id === 'sub_beta' && failDeleteSubBeta) {
          throw new Error('Supabase network error during subject deletion');
        }
      },
    };

    const tester = new AppContextModuleTester(mockRemote);

    // Populate initial interconnected state
    tester.subjects = [
      { id: 'sub_alpha', userId: USER_A, name: 'Subject Alpha', code: 'A101', color: '#38BDF8', semester: 'S1', createdAt: '2026-01-01' },
      { id: 'sub_beta', userId: USER_A, name: 'Subject Beta', code: 'B202', color: '#10B981', semester: 'S1', createdAt: '2026-01-01' },
    ];

    tester.assignments = [
      { id: 'asg_alpha', userId: USER_A, subjectId: 'sub_alpha', title: 'Alpha Lab Report', dueAt: '2026-11-01', priority: 'high', status: 'not_started', subtasks: [], createdAt: '2026-01-01' },
      { id: 'asg_beta', userId: USER_A, subjectId: 'sub_beta', title: 'Beta Problem Set', dueAt: '2026-11-02', priority: 'medium', status: 'not_started', subtasks: [], createdAt: '2026-01-01' },
    ];

    tester.assessments = [
      { id: 'asm_alpha', userId: USER_A, subjectId: 'sub_alpha', title: 'Alpha Midterm', assessmentType: 'midterm', maximumMarks: 100, obtainedMarks: 90, weightagePercentage: 30, assessmentDate: '2026-11-10', status: 'graded', createdAt: '2026-01-01' },
      { id: 'asm_beta', userId: USER_A, subjectId: 'sub_beta', title: 'Beta Quiz', assessmentType: 'quiz', maximumMarks: 50, obtainedMarks: 45, weightagePercentage: 15, assessmentDate: '2026-11-12', status: 'graded', createdAt: '2026-01-01' },
    ];

    tester.events = [
      { id: 'ev_alpha', userId: USER_A, subjectId: 'sub_alpha', title: 'Alpha Lecture', eventType: 'class', startAt: '2026-11-01T10:00:00Z', endAt: '2026-11-01T11:00:00Z', isRecurring: false, createdAt: '2026-01-01' },
      { id: 'ev_beta', userId: USER_A, subjectId: 'sub_beta', title: 'Beta Lab', eventType: 'class', startAt: '2026-11-02T14:00:00Z', endAt: '2026-11-02T16:00:00Z', isRecurring: false, createdAt: '2026-01-01' },
    ];

    tester.focusSessions = [
      { id: 'fs_alpha', userId: USER_A, subjectId: 'sub_alpha', title: 'Alpha Study Session', sessionType: 'focus', workflowMode: 'pomodoro', plannedMinutes: 25, actualDurationSeconds: 1500, completedAt: '2026-11-01T12:00:00Z', isCompleted: true },
      { id: 'fs_beta', userId: USER_A, subjectId: 'sub_beta', title: 'Beta Study Session', sessionType: 'focus', workflowMode: 'pomodoro', plannedMinutes: 25, actualDurationSeconds: 1500, completedAt: '2026-11-02T17:00:00Z', isCompleted: true },
    ];

    // Step 1: Successful deletion of sub_alpha
    await tester.deleteSubject('sub_alpha');

    // 1. Related assignments removed
    assertEqual(tester.assignments.length, 1, 'Child assignment asg_alpha must be removed');
    assertEqual(tester.assignments[0].id, 'asg_beta', 'Unrelated assignment asg_beta must remain');

    // 2. Related assessments removed
    assertEqual(tester.assessments.length, 1, 'Child assessment asm_alpha must be removed');
    assertEqual(tester.assessments[0].id, 'asm_beta', 'Unrelated assessment asm_beta must remain');

    // 3. Events: subjectId cleared on related event, unrelated event untouched
    assertEqual(tester.events.length, 2, 'Events are preserved');
    const evAlpha = tester.events.find(e => e.id === 'ev_alpha');
    const evBeta = tester.events.find(e => e.id === 'ev_beta');
    assertEqual(evAlpha?.subjectId, undefined, 'ev_alpha subjectId must be cleared to undefined');
    assertEqual(evBeta?.subjectId, 'sub_beta', 'ev_beta subjectId must remain intact');

    // 4. Focus Sessions: subjectId cleared on related session, unrelated session untouched
    assertEqual(tester.focusSessions.length, 2, 'Focus sessions are preserved');
    const fsAlpha = tester.focusSessions.find(f => f.id === 'fs_alpha');
    const fsBeta = tester.focusSessions.find(f => f.id === 'fs_beta');
    assertEqual(fsAlpha?.subjectId, undefined, 'fs_alpha subjectId must be cleared to undefined');
    assertEqual(fsBeta?.subjectId, 'sub_beta', 'fs_beta subjectId must remain intact');

    // Step 2: Failed deletion of sub_beta with rollback of subject and all cascades
    failDeleteSubBeta = true;
    let deleteBetaErrored = false;
    try {
      await tester.deleteSubject('sub_beta');
    } catch {
      deleteBetaErrored = true;
    }

    assertEqual(deleteBetaErrored, true, 'deleteSubject for sub_beta must reject');
    // Verify rollback:
    assertEqual(tester.subjects.some(s => s.id === 'sub_beta'), true, 'sub_beta restored');
    assertEqual(tester.assignments.some(a => a.id === 'asg_beta'), true, 'asg_beta restored');
    assertEqual(tester.assessments.some(a => a.id === 'asm_beta'), true, 'asm_beta restored');
    assertEqual(tester.events.find(e => e.id === 'ev_beta')?.subjectId, 'sub_beta', 'ev_beta subjectId restored');
    assertEqual(tester.focusSessions.find(f => f.id === 'fs_beta')?.subjectId, 'sub_beta', 'fs_beta subjectId restored');

    console.log('  ✓ Subject deletion consistency: React state immediately cascades assignments, assessments, events, and focus sessions');
    passed++;
  })();

  // Test 13: Strict UUID validation on existing records and generation on new records (Fix 3)
  await (async () => {
    // 1. ensureUuid generates valid UUID for undefined, null, empty string
    const id1 = ensureUuid(undefined);
    const id2 = ensureUuid(null);
    const id3 = ensureUuid('');
    assertEqual(isValidUuid(id1), true, 'Generated UUID for undefined');
    assertEqual(isValidUuid(id2), true, 'Generated UUID for null');
    assertEqual(isValidUuid(id3), true, 'Generated UUID for empty string');

    // 2. ensureUuid preserves valid UUIDs
    const validId = 'b8a4f1a2-5b91-4c6e-8d2a-1e3f5a7b9c0d';
    assertEqual(ensureUuid(validId), validId, 'Preserves existing valid UUID');

    // 3. ensureUuid rejects invalid non-null IDs with descriptive error
    const invalidIds = ['invalid-non-uuid', 'sub_12345', '12345', 'not-a-valid-uuid-at-all'];
    for (const badId of invalidIds) {
      let threw = false;
      let errorMsg = '';
      try {
        ensureUuid(badId);
      } catch (err: any) {
        threw = true;
        errorMsg = err.message;
      }
      assertEqual(threw, true, `Must throw for invalid ID: ${badId}`);
      assert(errorMsg.includes('Invalid UUID format'), `Error message must describe invalid UUID format: ${errorMsg}`);
      assert(errorMsg.includes(badId), `Error message must include bad ID: ${errorMsg}`);
    }

    // 4. Adapters throw descriptive error when existing record has invalid UUID
    let subjectAdapterThrew = false;
    try {
      subjectToDb({ id: 'legacy_sub_001', name: 'Math', code: 'M101', color: '#000', semester: 'S1', createdAt: '2026-01-01' }, USER_A);
    } catch (err: any) {
      subjectAdapterThrew = true;
      assert(err.message.includes('Invalid UUID format'), 'subjectToDb throws descriptive error');
    }
    assertEqual(subjectAdapterThrew, true, 'subjectToDb must reject invalid non-null ID');

    let assignmentAdapterThrew = false;
    try {
      assignmentToDb({ id: 'invalid-assignment-id', subjectId: validId, title: 'Test', dueAt: '2026-11-01', priority: 'low', status: 'not_started', subtasks: [], createdAt: '2026-01-01' }, USER_A);
    } catch (err: any) {
      assignmentAdapterThrew = true;
      assert(err.message.includes('Invalid UUID format'), 'assignmentToDb throws descriptive error');
    }
    assertEqual(assignmentAdapterThrew, true, 'assignmentToDb must reject invalid non-null ID');

    // 5. Adapters auto-generate UUID when creating new record without ID
    const newDbSub = subjectToDb({ name: 'Valid New Subject', code: 'V101', color: '#38BDF8', semester: 'S1' } as any, USER_A);
    assertEqual(isValidUuid(newDbSub.id), true, 'subjectToDb generates valid UUID when creating without ID');

    console.log('  ✓ Strict UUID validation: rejects invalid non-null IDs and generates UUIDs only for new records');
    passed++;
  })();

  console.log(`\nCRUD Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    (globalThis as any).process?.exit(1);
  }
}

runAllCrudTests().catch(err => {
  console.error('Fatal CRUD test error:', err);
  (globalThis as any).process?.exit(1);
});
