import { 
  UserAuth, 
  StudentProfile, 
  Subject, 
  CalendarEvent, 
  Assignment, 
  Transaction, 
  SavingsGoal,
  Habit,
  HabitLog,
  FocusSession,
  FocusSettings,
  ActiveFocusState,
  Assessment
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'uniflow_session_user_id',
  USERS_AUTH: 'uniflow_users_auth',
  PROFILES: 'uniflow_profiles',
  SUBJECTS: 'uniflow_subjects',
  EVENTS: 'uniflow_events',
  ASSIGNMENTS: 'uniflow_assignments',
  TRANSACTIONS: 'uniflow_transactions',
  SAVINGS_GOALS: 'uniflow_savings_goals',
  HABITS: 'uniflow_habits',
  HABIT_LOGS: 'uniflow_habit_logs',
  FOCUS_SESSIONS: 'uniflow_focus_sessions',
  FOCUS_SETTINGS: 'uniflow_focus_settings',
  ACTIVE_FOCUS_STATE: 'uniflow_active_focus_state',
  ASSESSMENTS: 'uniflow_assessments',
  INITIALIZED: 'uniflow_seed_initialized_v4',
};

// Helper to securely hash password string (simple client-side digest for mock auth)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16) + '_uf';
}

// Generate realistic UUID
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Safe JSON fetcher from localStorage
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

// Safe JSON setter to localStorage
function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Initialize rich seed data for two distinct students if not already present
export function initializeSeedData(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  const userAId = 'usr_aarav_sharma';
  const userBId = 'usr_priya_patel';

  const usersAuth: UserAuth[] = [
    {
      id: userAId,
      email: 'aarav@university.edu',
      passwordHash: hashPassword('password123'),
      isEmailVerified: true,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: userBId,
      email: 'priya@techcollege.edu',
      passwordHash: hashPassword('password123'),
      isEmailVerified: true,
      createdAt: '2026-09-05T08:00:00Z',
    }
  ];

  const profiles: Record<string, StudentProfile> = {
    [userAId]: {
      userId: userAId,
      fullName: 'Aarav Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      university: 'Vellore Institute of Technology',
      degree: 'B.Tech',
      department: 'Computer Science & Engineering',
      academicYear: 'Year 3',
      semester: 'Semester 5',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      theme: 'dark',
      weekStartPreference: 'monday',
      monthlyBudget: 15000,
      onboardingCompleted: true,
      createdAt: '2026-09-01T08:30:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    },
    [userBId]: {
      userId: userBId,
      fullName: 'Priya Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
      university: 'IIT Bombay',
      degree: 'B.Tech',
      department: 'Electrical Engineering',
      academicYear: 'Year 2',
      semester: 'Semester 3',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      theme: 'dark',
      weekStartPreference: 'monday',
      monthlyBudget: 12000,
      onboardingCompleted: true,
      createdAt: '2026-09-05T08:30:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    }
  };

  // Subjects for Aarav
  const subjectsA: Subject[] = [
    { id: 'sub_dsa', userId: userAId, name: 'Data Structures & Algorithms', code: 'CSE2001', color: '#8B80FF', semester: 'Sem 5', instructor: 'Dr. R. Raman', credits: 4, targetPercentage: 90, gradingScheme: 'weighted', createdAt: '2026-09-01T09:00:00Z' },
    { id: 'sub_ai', userId: userAId, name: 'Artificial Intelligence', code: 'CSE3002', color: '#38BDF8', semester: 'Sem 5', instructor: 'Prof. S. Nair', credits: 4, targetPercentage: 85, gradingScheme: 'weighted', createdAt: '2026-09-01T09:00:00Z' },
    { id: 'sub_dbms', userId: userAId, name: 'Database Management Systems', code: 'CSE2003', color: '#34D399', semester: 'Sem 5', instructor: 'Dr. V. Rao', credits: 3, targetPercentage: 88, gradingScheme: 'weighted', createdAt: '2026-09-01T09:00:00Z' },
    { id: 'sub_cn', userId: userAId, name: 'Computer Networks', code: 'CSE3004', color: '#FBBF24', semester: 'Sem 5', instructor: 'Dr. M. Joseph', credits: 3, targetPercentage: 85, gradingScheme: 'weighted', createdAt: '2026-09-01T09:00:00Z' },
    { id: 'sub_math', userId: userAId, name: 'Linear Algebra & Discrete Math', code: 'MAT2001', color: '#EC4899', semester: 'Sem 5', instructor: 'Prof. K. Sen', credits: 4, targetPercentage: 80, gradingScheme: 'raw_percentage', createdAt: '2026-09-01T09:00:00Z' },
  ];

  // Subjects for Priya
  const subjectsB: Subject[] = [
    { id: 'sub_circuits', userId: userBId, name: 'Analog Electronic Circuits', code: 'EE201', color: '#F43F5E', semester: 'Sem 3', instructor: 'Prof. A. Ghosh', credits: 4, targetPercentage: 85, gradingScheme: 'weighted', createdAt: '2026-09-05T09:00:00Z' },
    { id: 'sub_signals', userId: userBId, name: 'Signals and Systems', code: 'EE203', color: '#8B80FF', semester: 'Sem 3', instructor: 'Dr. P. Sen', credits: 4, targetPercentage: 80, gradingScheme: 'weighted', createdAt: '2026-09-05T09:00:00Z' },
    { id: 'sub_micro', userId: userBId, name: 'Microprocessors & Interfacing', code: 'EE205', color: '#10B981', semester: 'Sem 3', instructor: 'Dr. M. Roy', credits: 3, targetPercentage: 82, gradingScheme: 'raw_percentage', createdAt: '2026-09-05T09:00:00Z' },
  ];

  // Get current date anchor (e.g. today)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const getRelativeDate = (offsetDays: number, hour: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // Aarav's Calendar Events
  const eventsA: CalendarEvent[] = [
    {
      id: 'ev_1',
      userId: userAId,
      subjectId: 'sub_dsa',
      title: 'DSA Lecture — Advanced Dynamic Programming',
      eventType: 'class',
      startAt: getRelativeDate(0, 9, 0),
      endAt: getRelativeDate(0, 10, 30),
      location: 'Auditorium Hall B',
      description: 'Matrix Chain Multiplication & DP on Trees',
      isRecurring: true,
      recurringDays: [1, 3, 5],
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'ev_2',
      userId: userAId,
      subjectId: 'sub_dbms',
      title: 'DBMS Lab: Indexing & Query Optimization',
      eventType: 'lab',
      startAt: getRelativeDate(0, 11, 0),
      endAt: getRelativeDate(0, 13, 0),
      location: 'Software Lab 3',
      description: 'PostgreSQL EXPLAIN ANALYZE practice',
      isRecurring: true,
      recurringDays: [1, 4],
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'ev_3',
      userId: userAId,
      subjectId: 'sub_ai',
      title: 'AI Tutorial: Heuristic Search & A*',
      eventType: 'class',
      startAt: getRelativeDate(0, 14, 30),
      endAt: getRelativeDate(0, 16, 0),
      location: 'Room 402',
      description: 'Admissible heuristics derivation',
      isRecurring: true,
      recurringDays: [2, 4],
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'ev_4',
      userId: userAId,
      subjectId: 'sub_cn',
      title: 'Computer Networks Mid-Term Assessment',
      eventType: 'exam',
      startAt: getRelativeDate(3, 10, 0),
      endAt: getRelativeDate(3, 12, 0),
      location: 'Examination Block D',
      description: 'Covers Transport Layer, TCP Flow Control, and Subnetting',
      isRecurring: false,
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'ev_5',
      userId: userAId,
      title: 'Coding Club Hackathon Mentoring Session',
      eventType: 'personal',
      startAt: getRelativeDate(1, 17, 0),
      endAt: getRelativeDate(1, 18, 30),
      location: 'Student Activity Center',
      description: 'Prep session for university innovation cup',
      isRecurring: false,
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];

  // Aarav's Assignments
  const assignmentsA: Assignment[] = [
    {
      id: 'asg_1',
      userId: userAId,
      subjectId: 'sub_ai',
      title: 'A* Pathfinding & Minimax Game Agent',
      description: 'Implement A* search for maze routing and Alpha-Beta minimax for Adversarial Tic-Tac-Toe',
      dueAt: getRelativeDate(1, 23, 59), // Due in ~24-36h (Urgent!)
      priority: 'high',
      status: 'in_progress',
      estimatedMinutes: 180,
      referenceUrl: 'https://github.com/ai-course/assignment-2',
      subtasks: [
        { id: 'st_1', title: 'Implement Priority Queue frontier', isCompleted: true },
        { id: 'st_2', title: 'Admissible Manhattan heuristic test', isCompleted: true },
        { id: 'st_3', title: 'Implement Alpha-Beta pruning recursion', isCompleted: false },
        { id: 'st_4', title: 'Write benchmarks & complexity analysis report', isCompleted: false },
      ],
      createdAt: '2026-10-18T10:00:00Z'
    },
    {
      id: 'asg_2',
      userId: userAId,
      subjectId: 'sub_dbms',
      title: 'B+ Tree Indexing & Transaction Concurrency Paper',
      description: 'Write a 4-page paper comparing 2-Phase Locking vs MVCC isolation levels with benchmark queries',
      dueAt: getRelativeDate(4, 18, 0),
      priority: 'medium',
      status: 'not_started',
      estimatedMinutes: 120,
      subtasks: [
        { id: 'st_5', title: 'Literature survey on MVCC in PostgreSQL', isCompleted: false },
        { id: 'st_6', title: 'Run concurrency benchmark on 100k rows', isCompleted: false },
      ],
      createdAt: '2026-10-20T10:00:00Z'
    },
    {
      id: 'asg_3',
      userId: userAId,
      subjectId: 'sub_cn',
      title: 'Packet Sniffer & TCP Handshake Analysis',
      description: 'Capture Wireshark pcap traces and write a packet inspector in Python or C',
      dueAt: getRelativeDate(-2, 23, 59), // Completed 2 days ago
      priority: 'high',
      status: 'completed',
      estimatedMinutes: 150,
      completedAt: getRelativeDate(-2, 21, 30),
      subtasks: [
        { id: 'st_7', title: 'Capture TCP 3-way handshake packets', isCompleted: true },
        { id: 'st_8', title: 'Parse IP header checksum and flags', isCompleted: true },
      ],
      createdAt: '2026-10-14T10:00:00Z'
    },
    {
      id: 'asg_4',
      userId: userAId,
      subjectId: 'sub_math',
      title: 'Eigenvalues & SVD Application Problem Set',
      description: 'Solve questions 1 through 15 from Chapter 6 and submit scanned solutions',
      dueAt: getRelativeDate(6, 17, 0),
      priority: 'low',
      status: 'not_started',
      estimatedMinutes: 90,
      subtasks: [
        { id: 'st_9', title: 'Problems 1-8: Orthogonal projection', isCompleted: false },
        { id: 'st_10', title: 'Problems 9-15: Image compression using SVD', isCompleted: false },
      ],
      createdAt: '2026-10-22T10:00:00Z'
    }
  ];

  // Aarav's Transactions (in INR)
  const currentMonthPrefix = todayStr.slice(0, 7);
  const transactionsA: Transaction[] = [
    {
      id: 'tx_1',
      userId: userAId,
      transactionType: 'income',
      amount: 12000,
      category: 'pocket_money',
      transactionDate: `${currentMonthPrefix}-01`,
      description: 'Monthly student allowance from parents',
      paymentMethod: 'UPI',
      createdAt: `${currentMonthPrefix}-01T09:00:00Z`
    },
    {
      id: 'tx_2',
      userId: userAId,
      transactionType: 'income',
      amount: 4500,
      category: 'scholarship',
      transactionDate: `${currentMonthPrefix}-05`,
      description: 'Merit-based Academic Excellence Grant (VIT)',
      paymentMethod: 'Net Banking',
      createdAt: `${currentMonthPrefix}-05T10:00:00Z`
    },
    {
      id: 'tx_3',
      userId: userAId,
      transactionType: 'expense',
      amount: 2450,
      category: 'education',
      transactionDate: `${currentMonthPrefix}-03`,
      description: 'Algorithms textbook (CLRS) & engineering notebook pack',
      paymentMethod: 'UPI',
      createdAt: `${currentMonthPrefix}-03T11:00:00Z`
    },
    {
      id: 'tx_4',
      userId: userAId,
      transactionType: 'expense',
      amount: 3200,
      category: 'food',
      transactionDate: `${currentMonthPrefix}-07`,
      description: 'Campus cafeteria monthly meal pass reload',
      paymentMethod: 'UPI',
      createdAt: `${currentMonthPrefix}-07T12:00:00Z`
    },
    {
      id: 'tx_5',
      userId: userAId,
      transactionType: 'expense',
      amount: 850,
      category: 'transport',
      transactionDate: `${currentMonthPrefix}-10`,
      description: 'Metro smartcard recharge for town commute',
      paymentMethod: 'Card',
      createdAt: `${currentMonthPrefix}-10T14:00:00Z`
    },
    {
      id: 'tx_6',
      userId: userAId,
      transactionType: 'expense',
      amount: 1499,
      category: 'shopping',
      transactionDate: `${currentMonthPrefix}-12`,
      description: 'Ergonomic study mouse & USB-C hub',
      paymentMethod: 'Card',
      createdAt: `${currentMonthPrefix}-12T16:00:00Z`
    },
    {
      id: 'tx_7',
      userId: userAId,
      transactionType: 'expense',
      amount: 699,
      category: 'entertainment',
      transactionDate: `${currentMonthPrefix}-16`,
      description: 'Weekend movie with hostel room-mates & snacks',
      paymentMethod: 'UPI',
      createdAt: `${currentMonthPrefix}-16T19:00:00Z`
    },
    {
      id: 'tx_8',
      userId: userAId,
      transactionType: 'expense',
      amount: 999,
      category: 'utilities',
      transactionDate: `${currentMonthPrefix}-18`,
      description: 'High-speed hostel room Wi-Fi subscription',
      paymentMethod: 'UPI',
      createdAt: `${currentMonthPrefix}-18T09:30:00Z`
    },
    {
      id: 'tx_9',
      userId: userAId,
      transactionType: 'expense',
      amount: 450,
      category: 'food',
      transactionDate: todayStr,
      description: 'Evening canteen chai & samosa study session with peer group',
      paymentMethod: 'UPI',
      createdAt: `${todayStr}T17:30:00Z`
    }
  ];

  // Aarav's Savings Goals
  const savingsGoalsA: SavingsGoal[] = [
    {
      id: 'sg_1',
      userId: userAId,
      title: 'M4 MacBook Air Fund for Final Year Project',
      targetAmount: 85000,
      currentProgress: 42000,
      targetDate: '2027-04-15',
      createdAt: '2026-09-01T08:00:00Z'
    },
    {
      id: 'sg_2',
      userId: userAId,
      title: 'AWS Certified Solutions Architect Exam Fee',
      targetAmount: 12500,
      currentProgress: 8500,
      targetDate: '2026-12-20',
      createdAt: '2026-09-10T08:00:00Z'
    }
  ];

  // ----------------------------------------------------
  // HABITS SEED DATA (FEATURE 1)
  // ----------------------------------------------------
  const habitsA: Habit[] = [
    {
      id: 'hab_1',
      userId: userAId,
      title: 'Daily LeetCode Problem',
      description: 'Solve at least 1 Medium or Hard DSA challenge',
      category: 'study',
      icon: 'Code',
      color: '#8B80FF',
      scheduleType: 'daily',
      targetType: 'boolean',
      reminderTime: '21:00',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'hab_2',
      userId: userAId,
      title: 'Deep Work DSA Practice',
      description: 'Focused practice on Trees, Graphs & Dynamic Programming',
      category: 'study',
      icon: 'Brain',
      color: '#38BDF8',
      scheduleType: 'daily',
      targetType: 'measurable',
      targetValue: 45,
      unit: 'mins',
      reminderTime: '17:00',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'hab_3',
      userId: userAId,
      title: 'Read System Design & Papers',
      description: 'Read technical whitepapers or O\'Reilly engineering chapters',
      category: 'reading',
      icon: 'BookOpen',
      color: '#34D399',
      scheduleType: 'daily',
      targetType: 'measurable',
      targetValue: 15,
      unit: 'pages',
      reminderTime: '22:00',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'hab_4',
      userId: userAId,
      title: 'Gym & Core Strength Workout',
      description: 'Campus gymnasium conditioning and strength workout',
      category: 'fitness',
      icon: 'Dumbbell',
      color: '#F43F5E',
      scheduleType: 'selected_days',
      selectedDays: [1, 3, 5], // Mon, Wed, Fri
      targetType: 'boolean',
      reminderTime: '06:45',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'hab_5',
      userId: userAId,
      title: 'Optimal Hydration',
      description: 'Track daily water intake throughout study hours',
      category: 'health',
      icon: 'Droplets',
      color: '#06B6D4',
      scheduleType: 'daily',
      targetType: 'measurable',
      targetValue: 3000,
      unit: 'ml',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'hab_6',
      userId: userAId,
      title: 'Sleep Routine by 11:30 PM',
      description: 'Wind down screens by 11:00 PM and protect REM sleep',
      category: 'sleep_routine',
      icon: 'Moon',
      color: '#A855F7',
      scheduleType: 'daily',
      targetType: 'boolean',
      reminderTime: '23:00',
      isArchived: false,
      createdAt: '2026-09-01T08:00:00Z',
    },
  ];

  const habitsB: Habit[] = [
    {
      id: 'hab_b1',
      userId: userBId,
      title: 'Circuit Simulation Practice',
      description: 'Run SPICE simulations for analog amplifier stages',
      category: 'study',
      icon: 'Zap',
      color: '#F43F5E',
      scheduleType: 'daily',
      targetType: 'measurable',
      targetValue: 30,
      unit: 'mins',
      isArchived: false,
      createdAt: '2026-09-05T08:00:00Z',
    },
    {
      id: 'hab_b2',
      userId: userBId,
      title: 'Morning Jogging',
      description: 'Hostel ground 3km run',
      category: 'fitness',
      icon: 'Footprints',
      color: '#10B981',
      scheduleType: 'selected_days',
      selectedDays: [2, 4, 6],
      targetType: 'boolean',
      isArchived: false,
      createdAt: '2026-09-05T08:00:00Z',
    },
  ];

  // 21 days of realistic logs for Aarav
  const habitLogsA: HabitLog[] = [];
  for (let i = 21; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();

    // hab_1: LeetCode (active 9-day streak up to today)
    const isMissedLeetCode = i === 10 || i === 15;
    habitLogsA.push({
      id: `hlog_1_${dateStr}`,
      habitId: 'hab_1',
      userId: userAId,
      date: dateStr,
      isCompleted: !isMissedLeetCode,
      completedAt: !isMissedLeetCode ? `${dateStr}T21:30:00Z` : undefined,
    });

    // hab_2: DSA Practice
    const isMissedDSA = i === 7 || i === 14;
    const dsaMins = isMissedDSA ? 20 : (i === 0 ? 45 : 50 + (i % 3) * 10);
    habitLogsA.push({
      id: `hlog_2_${dateStr}`,
      habitId: 'hab_2',
      userId: userAId,
      date: dateStr,
      isCompleted: dsaMins >= 45,
      currentValue: dsaMins,
      targetValue: 45,
      completedAt: dsaMins >= 45 ? `${dateStr}T18:00:00Z` : undefined,
    });

    // hab_3: Reading
    const pages = (i % 5 === 0) ? 10 : (15 + (i % 4) * 5);
    habitLogsA.push({
      id: `hlog_3_${dateStr}`,
      habitId: 'hab_3',
      userId: userAId,
      date: dateStr,
      isCompleted: pages >= 15,
      currentValue: pages,
      targetValue: 15,
      completedAt: pages >= 15 ? `${dateStr}T22:30:00Z` : undefined,
    });

    // hab_4: Gym (Mon, Wed, Fri)
    if ([1, 3, 5].includes(dayOfWeek)) {
      habitLogsA.push({
        id: `hlog_4_${dateStr}`,
        habitId: 'hab_4',
        userId: userAId,
        date: dateStr,
        isCompleted: true,
        completedAt: `${dateStr}T07:45:00Z`,
      });
    }

    // hab_5: Hydration
    const water = i === 0 ? 3000 : (2800 + (i % 4) * 200);
    habitLogsA.push({
      id: `hlog_5_${dateStr}`,
      habitId: 'hab_5',
      userId: userAId,
      date: dateStr,
      isCompleted: water >= 3000,
      currentValue: water,
      targetValue: 3000,
      completedAt: water >= 3000 ? `${dateStr}T20:00:00Z` : undefined,
    });

    // hab_6: Sleep
    const sleepDone = i % 4 !== 0;
    habitLogsA.push({
      id: `hlog_6_${dateStr}`,
      habitId: 'hab_6',
      userId: userAId,
      date: dateStr,
      isCompleted: sleepDone,
      completedAt: sleepDone ? `${dateStr}T23:15:00Z` : undefined,
    });
  }

  // ----------------------------------------------------
  // FOCUS SESSIONS SEED DATA (FEATURE 2)
  // ----------------------------------------------------
  const focusSessionsA: FocusSession[] = [
    {
      id: 'foc_1',
      userId: userAId,
      subjectId: 'sub_dsa',
      assignmentId: 'asg_1',
      title: 'Red-Black Tree Insertion & Rotations',
      sessionType: 'focus',
      plannedMinutes: 25,
      actualDurationSeconds: 1500,
      completedAt: getRelativeDate(-4, 16, 0),
      notes: 'Completed cases 1, 2, and 3 for node balancing',
      isCompleted: true,
    },
    {
      id: 'foc_2',
      userId: userAId,
      subjectId: 'sub_dsa',
      title: 'Dynamic Programming on Trees Practice',
      sessionType: 'focus',
      plannedMinutes: 50,
      actualDurationSeconds: 3000,
      completedAt: getRelativeDate(-3, 11, 30),
      notes: 'Solved tree diameter and max independent set',
      isCompleted: true,
    },
    {
      id: 'foc_3',
      userId: userAId,
      subjectId: 'sub_dbms',
      title: 'PostgreSQL Index Tuning & EXPLAIN',
      sessionType: 'focus',
      plannedMinutes: 25,
      actualDurationSeconds: 1500,
      completedAt: getRelativeDate(-2, 14, 0),
      notes: 'Compared Seq Scan vs B-Tree Index Scan performance',
      isCompleted: true,
    },
    {
      id: 'foc_4',
      userId: userAId,
      subjectId: 'sub_ai',
      assignmentId: 'asg_3',
      title: 'A* Search Implementation & Admissibility',
      sessionType: 'focus',
      plannedMinutes: 30,
      actualDurationSeconds: 1800,
      completedAt: getRelativeDate(-1, 15, 30),
      notes: 'Verified Manhattan distance heuristic satisfies triangle inequality',
      isCompleted: true,
    },
    {
      id: 'foc_5',
      userId: userAId,
      subjectId: 'sub_cn',
      title: 'CIDR Subnetting Calculations',
      sessionType: 'focus',
      plannedMinutes: 25,
      actualDurationSeconds: 1450,
      completedAt: getRelativeDate(0, 10, 0),
      notes: 'Calculated host ranges for VLSM topology',
      isCompleted: true,
    },
    {
      id: 'foc_6',
      userId: userAId,
      subjectId: 'sub_dsa',
      assignmentId: 'asg_1',
      title: 'Algorithm Proof Verification',
      sessionType: 'focus',
      plannedMinutes: 25,
      actualDurationSeconds: 1500,
      completedAt: getRelativeDate(0, 12, 0),
      notes: 'Wrote induction proof for runtime bounds',
      isCompleted: true,
    },
  ];

  const focusSettingsA: FocusSettings = {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
  };

  // ----------------------------------------------------
  // ASSESSMENTS SEED DATA (FEATURE 3)
  // ----------------------------------------------------
  const assessmentsA: Assessment[] = [
    // DSA
    { id: 'ass_1', userId: userAId, subjectId: 'sub_dsa', title: 'CAT 1 Examination', assessmentType: 'cat1', obtainedMarks: 44, maximumMarks: 50, weightagePercentage: 20, assessmentDate: getRelativeDate(-28, 10, 0).slice(0, 10), status: 'graded', notes: 'Strong performance on algorithmic complexity analysis', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_2', userId: userAId, subjectId: 'sub_dsa', title: 'Algorithm Assignment 1', assessmentType: 'assignment', obtainedMarks: 19, maximumMarks: 20, weightagePercentage: 10, assessmentDate: getRelativeDate(-16, 23, 59).slice(0, 10), status: 'graded', notes: 'Full points on dynamic programming recurrence', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_3', userId: userAId, subjectId: 'sub_dsa', title: 'Quiz 1 — Tree Balancing', assessmentType: 'quiz', obtainedMarks: 9, maximumMarks: 10, weightagePercentage: 10, assessmentDate: getRelativeDate(-8, 11, 0).slice(0, 10), status: 'graded', notes: 'AVL rotation question correct', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_4', userId: userAId, subjectId: 'sub_dsa', title: 'Midterm Examination', assessmentType: 'midterm', obtainedMarks: 88, maximumMarks: 100, weightagePercentage: 30, assessmentDate: getRelativeDate(-3, 10, 0).slice(0, 10), status: 'graded', notes: 'Dijkstra and Prim implementation accurate', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_5', userId: userAId, subjectId: 'sub_dsa', title: 'End-Semester Final Examination', assessmentType: 'final_exam', obtainedMarks: null, maximumMarks: 100, weightagePercentage: 30, assessmentDate: getRelativeDate(24, 9, 30).slice(0, 10), status: 'upcoming', notes: 'Comprehensive syllabus chapters 1-8', createdAt: '2026-09-01T08:00:00Z' },

    // DBMS
    { id: 'ass_6', userId: userAId, subjectId: 'sub_dbms', title: 'SQL & Relational Algebra Lab 1', assessmentType: 'lab_evaluation', obtainedMarks: 28, maximumMarks: 30, weightagePercentage: 20, assessmentDate: getRelativeDate(-22, 14, 0).slice(0, 10), status: 'graded', notes: 'Inner/outer join optimization', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_7', userId: userAId, subjectId: 'sub_dbms', title: 'CAT 1 Examination', assessmentType: 'cat1', obtainedMarks: 42, maximumMarks: 50, weightagePercentage: 25, assessmentDate: getRelativeDate(-14, 10, 0).slice(0, 10), status: 'graded', notes: 'Normalization up to BCNF', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_8', userId: userAId, subjectId: 'sub_dbms', title: 'CAT 2 Examination', assessmentType: 'cat2', obtainedMarks: null, maximumMarks: 50, weightagePercentage: 25, assessmentDate: getRelativeDate(8, 10, 0).slice(0, 10), status: 'upcoming', notes: 'Transaction concurrency & ACID properties', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_9', userId: userAId, subjectId: 'sub_dbms', title: 'Database Application Project', assessmentType: 'project', obtainedMarks: null, maximumMarks: 100, weightagePercentage: 30, assessmentDate: getRelativeDate(28, 17, 0).slice(0, 10), status: 'upcoming', notes: 'Full-stack application with PostgreSQL backend', createdAt: '2026-09-01T08:00:00Z' },

    // AI
    { id: 'ass_10', userId: userAId, subjectId: 'sub_ai', title: 'CAT 1 Examination', assessmentType: 'cat1', obtainedMarks: 39, maximumMarks: 50, weightagePercentage: 30, assessmentDate: getRelativeDate(-18, 14, 0).slice(0, 10), status: 'graded', notes: 'Alpha-beta pruning minimax derivations', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_11', userId: userAId, subjectId: 'sub_ai', title: 'Heuristic Search Assignment', assessmentType: 'assignment', obtainedMarks: 27, maximumMarks: 30, weightagePercentage: 20, assessmentDate: getRelativeDate(-9, 23, 59).slice(0, 10), status: 'graded', notes: 'Pathfinding code in Python', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_12', userId: userAId, subjectId: 'sub_ai', title: 'Final Comprehensive Exam', assessmentType: 'final_exam', obtainedMarks: null, maximumMarks: 100, weightagePercentage: 50, assessmentDate: getRelativeDate(26, 14, 0).slice(0, 10), status: 'upcoming', notes: 'Knowledge representation & probabilistic reasoning', createdAt: '2026-09-01T08:00:00Z' },

    // CN
    { id: 'ass_13', userId: userAId, subjectId: 'sub_cn', title: 'Packet Sniffing Lab Evaluation', assessmentType: 'lab_evaluation', obtainedMarks: 26, maximumMarks: 30, weightagePercentage: 25, assessmentDate: getRelativeDate(-15, 14, 0).slice(0, 10), status: 'graded', notes: 'Wireshark TCP handshake dissection', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_14', userId: userAId, subjectId: 'sub_cn', title: 'CAT 1 Examination', assessmentType: 'cat1', obtainedMarks: 41, maximumMarks: 50, weightagePercentage: 35, assessmentDate: getRelativeDate(-6, 10, 0).slice(0, 10), status: 'graded', notes: 'OSI layers & sliding window protocol', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_15', userId: userAId, subjectId: 'sub_cn', title: 'Final Theory Exam', assessmentType: 'final_exam', obtainedMarks: null, maximumMarks: 100, weightagePercentage: 40, assessmentDate: getRelativeDate(22, 10, 0).slice(0, 10), status: 'upcoming', notes: 'Routing protocols OSPF, BGP & TCP congestion control', createdAt: '2026-09-01T08:00:00Z' },

    // Math (raw percentage scheme)
    { id: 'ass_16', userId: userAId, subjectId: 'sub_math', title: 'Quiz 1 — Linear Independence', assessmentType: 'quiz', obtainedMarks: 18, maximumMarks: 20, assessmentDate: getRelativeDate(-24, 10, 0).slice(0, 10), status: 'graded', notes: 'Rank-nullity theorem calculations', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_17', userId: userAId, subjectId: 'sub_math', title: 'Midterm Examination', assessmentType: 'midterm', obtainedMarks: 76, maximumMarks: 100, assessmentDate: getRelativeDate(-8, 10, 0).slice(0, 10), status: 'graded', notes: 'Eigenvalues and Diagonalization', createdAt: '2026-09-01T08:00:00Z' },
    { id: 'ass_18', userId: userAId, subjectId: 'sub_math', title: 'End Semester Exam', assessmentType: 'final_exam', obtainedMarks: null, maximumMarks: 100, assessmentDate: getRelativeDate(29, 9, 30).slice(0, 10), status: 'upcoming', notes: 'Singular Value Decomposition and Graph Theory', createdAt: '2026-09-01T08:00:00Z' },
  ];

  // Store in LocalStorage
  setStorageItem(STORAGE_KEYS.USERS_AUTH, usersAuth);
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);
  setStorageItem(STORAGE_KEYS.SUBJECTS, [...subjectsA, ...subjectsB]);
  setStorageItem(STORAGE_KEYS.EVENTS, eventsA);
  setStorageItem(STORAGE_KEYS.ASSIGNMENTS, assignmentsA);
  setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactionsA);
  setStorageItem(STORAGE_KEYS.SAVINGS_GOALS, savingsGoalsA);

  // Store new features
  setStorageItem(STORAGE_KEYS.HABITS, [...habitsA, ...habitsB]);
  setStorageItem(STORAGE_KEYS.HABIT_LOGS, habitLogsA);
  setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, focusSessionsA);
  setStorageItem(STORAGE_KEYS.FOCUS_SETTINGS, { [userAId]: focusSettingsA });
  setStorageItem(STORAGE_KEYS.ASSESSMENTS, assessmentsA);

  // Note: Demo users and seed data are stored in localStorage, but no session is automatically created.
  // First-time visitors remain unauthenticated so the public landing page is displayed.
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// ----------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT (AUTH-01..AUTH-08)
// ----------------------------------------------------

export function getCurrentUserId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function registerStudent(
  fullName: string, 
  email: string, 
  password: string
): { success: boolean; error?: string; userId?: string } {
  const users = getStorageItem<UserAuth[]>(STORAGE_KEYS.USERS_AUTH, []);
  const normalizedEmail = email.trim().toLowerCase();

  if (!fullName.trim()) return { success: false, error: 'Full name is required.' };
  if (!normalizedEmail || !normalizedEmail.includes('@')) return { success: false, error: 'Valid email is required.' };
  if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const newUserId = generateId();
  const newUserAuth: UserAuth = {
    id: newUserId,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  };

  const newProfile: StudentProfile = {
    userId: newUserId,
    fullName: fullName.trim(),
    university: '',
    degree: '',
    department: '',
    academicYear: 'Year 1',
    semester: 'Semester 1',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    currency: 'INR',
    theme: 'dark',
    weekStartPreference: 'monday',
    monthlyBudget: 10000,
    onboardingCompleted: false, // New students trigger Onboarding Flow
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUserAuth);
  setStorageItem(STORAGE_KEYS.USERS_AUTH, users);

  const profiles = getStorageItem<Record<string, StudentProfile>>(STORAGE_KEYS.PROFILES, {});
  profiles[newUserId] = newProfile;
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);

  // Set active session
  setCurrentUserId(newUserId);

  return { success: true, userId: newUserId };
}

export function loginStudent(email: string, password: string): { success: boolean; error?: string; user?: UserAuth } {
  const users = getStorageItem<UserAuth[]>(STORAGE_KEYS.USERS_AUTH, []);
  const normalizedEmail = email.trim().toLowerCase();
  const hashed = hashPassword(password);

  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== hashed) {
    return { success: false, error: 'Invalid email or password. Please try again.' };
  }

  setCurrentUserId(user.id);
  return { success: true, user };
}

export function logoutStudent(): void {
  setCurrentUserId(null);
}

export function resetPassword(email: string, newPassword: string): { success: boolean; error?: string } {
  const users = getStorageItem<UserAuth[]>(STORAGE_KEYS.USERS_AUTH, []);
  const normalizedEmail = email.trim().toLowerCase();

  const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) {
    return { success: false, error: 'No account found with this email address.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }

  users[userIndex].passwordHash = hashPassword(newPassword);
  setStorageItem(STORAGE_KEYS.USERS_AUTH, users);
  return { success: true };
}

// ----------------------------------------------------
// PER-STUDENT DATA ACCESS (STRICT ISOLATION ENFORCED)
// ----------------------------------------------------

export function getStudentProfile(userId: string): StudentProfile | null {
  const profiles = getStorageItem<Record<string, StudentProfile>>(STORAGE_KEYS.PROFILES, {});
  return profiles[userId] || null;
}

export function updateStudentProfile(userId: string, updates: Partial<StudentProfile>): StudentProfile {
  const profiles = getStorageItem<Record<string, StudentProfile>>(STORAGE_KEYS.PROFILES, {});
  const current = profiles[userId] || {
    userId,
    fullName: 'Student',
    university: '',
    degree: '',
    department: '',
    academicYear: 'Year 1',
    semester: 'Semester 1',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    theme: 'dark',
    weekStartPreference: 'monday',
    monthlyBudget: 10000,
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated: StudentProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  profiles[userId] = updated;
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);
  return updated;
}

// Subjects
export function getStudentSubjects(userId: string): Subject[] {
  const all = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
  return all.filter(s => s.userId === userId);
}

export function saveStudentSubject(userId: string, subjectData: Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }): Subject {
  const all = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
  
  if (subjectData.id) {
    const index = all.findIndex(s => s.id === subjectData.id && s.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...subjectData };
      setStorageItem(STORAGE_KEYS.SUBJECTS, all);
      return all[index];
    }
  }

  const newSubject: Subject = {
    id: generateId(),
    userId,
    name: subjectData.name,
    code: subjectData.code || '',
    color: subjectData.color || '#8B80FF',
    semester: subjectData.semester || 'Semester 1',
    instructor: subjectData.instructor || '',
    createdAt: new Date().toISOString(),
  };

  all.push(newSubject);
  setStorageItem(STORAGE_KEYS.SUBJECTS, all);
  return newSubject;
}

export function deleteStudentSubject(userId: string, subjectId: string): void {
  const all = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
  const filtered = all.filter(s => !(s.id === subjectId && s.userId === userId));
  setStorageItem(STORAGE_KEYS.SUBJECTS, filtered);
}

// Calendar Events
export function getStudentCalendarEvents(userId: string): CalendarEvent[] {
  const all = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
  return all.filter(e => e.userId === userId);
}

export function saveStudentCalendarEvent(
  userId: string, 
  eventData: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }
): CalendarEvent {
  const all = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);

  if (eventData.id) {
    const index = all.findIndex(e => e.id === eventData.id && e.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...eventData };
      setStorageItem(STORAGE_KEYS.EVENTS, all);
      return all[index];
    }
  }

  const newEvent: CalendarEvent = {
    id: generateId(),
    userId,
    title: eventData.title,
    eventType: eventData.eventType || 'class',
    startAt: eventData.startAt,
    endAt: eventData.endAt,
    subjectId: eventData.subjectId,
    location: eventData.location,
    description: eventData.description,
    isRecurring: !!eventData.isRecurring,
    recurringDays: eventData.recurringDays || [],
    createdAt: new Date().toISOString(),
  };

  all.push(newEvent);
  setStorageItem(STORAGE_KEYS.EVENTS, all);
  return newEvent;
}

export function deleteStudentCalendarEvent(userId: string, eventId: string): void {
  const all = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
  const filtered = all.filter(e => !(e.id === eventId && e.userId === userId));
  setStorageItem(STORAGE_KEYS.EVENTS, filtered);
}

// Assignments
export function getStudentAssignments(userId: string): Assignment[] {
  const all = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  return all.filter(a => a.userId === userId);
}

export function saveStudentAssignment(
  userId: string, 
  assignmentData: Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }
): Assignment {
  const all = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);

  if (assignmentData.id) {
    const index = all.findIndex(a => a.id === assignmentData.id && a.userId === userId);
    if (index !== -1) {
      const wasCompleted = all[index].status === 'completed';
      const isNowCompleted = assignmentData.status === 'completed';
      
      all[index] = { 
        ...all[index], 
        ...assignmentData,
        completedAt: (!wasCompleted && isNowCompleted) ? new Date().toISOString() : all[index].completedAt,
      };
      setStorageItem(STORAGE_KEYS.ASSIGNMENTS, all);
      return all[index];
    }
  }

  const newAssignment: Assignment = {
    id: generateId(),
    userId,
    title: assignmentData.title,
    subjectId: assignmentData.subjectId,
    dueAt: assignmentData.dueAt,
    priority: assignmentData.priority || 'medium',
    status: assignmentData.status || 'not_started',
    description: assignmentData.description || '',
    estimatedMinutes: assignmentData.estimatedMinutes || 60,
    referenceUrl: assignmentData.referenceUrl || '',
    subtasks: assignmentData.subtasks || [],
    completedAt: assignmentData.status === 'completed' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  all.push(newAssignment);
  setStorageItem(STORAGE_KEYS.ASSIGNMENTS, all);
  return newAssignment;
}

export function deleteStudentAssignment(userId: string, assignmentId: string): void {
  const all = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  const filtered = all.filter(a => !(a.id === assignmentId && a.userId === userId));
  setStorageItem(STORAGE_KEYS.ASSIGNMENTS, filtered);
}

// Transactions
export function getStudentTransactions(userId: string): Transaction[] {
  const all = getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  return all
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
}

export function saveStudentTransaction(
  userId: string, 
  transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }
): Transaction {
  const all = getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

  if (transactionData.id) {
    const index = all.findIndex(t => t.id === transactionData.id && t.userId === userId);
    if (index !== -1) {
      all[index] = { 
        ...all[index], 
        ...transactionData,
        amount: Math.round(Number(transactionData.amount) * 100) / 100,
      };
      setStorageItem(STORAGE_KEYS.TRANSACTIONS, all);
      return all[index];
    }
  }

  const newTx: Transaction = {
    id: generateId(),
    userId,
    transactionType: transactionData.transactionType,
    amount: Math.round(Number(transactionData.amount) * 100) / 100,
    category: transactionData.category,
    transactionDate: transactionData.transactionDate || new Date().toISOString().split('T')[0],
    description: transactionData.description || '',
    paymentMethod: transactionData.paymentMethod || 'UPI',
    createdAt: new Date().toISOString(),
  };

  all.push(newTx);
  setStorageItem(STORAGE_KEYS.TRANSACTIONS, all);
  return newTx;
}

export function deleteStudentTransaction(userId: string, transactionId: string): void {
  const all = getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  const filtered = all.filter(t => !(t.id === transactionId && t.userId === userId));
  setStorageItem(STORAGE_KEYS.TRANSACTIONS, filtered);
}

// Savings Goals
export function getStudentSavingsGoals(userId: string): SavingsGoal[] {
  const all = getStorageItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
  return all.filter(g => g.userId === userId);
}

export function saveStudentSavingsGoal(
  userId: string, 
  goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }
): SavingsGoal {
  const all = getStorageItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);

  if (goalData.id) {
    const index = all.findIndex(g => g.id === goalData.id && g.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...goalData };
      setStorageItem(STORAGE_KEYS.SAVINGS_GOALS, all);
      return all[index];
    }
  }

  const newGoal: SavingsGoal = {
    id: generateId(),
    userId,
    title: goalData.title,
    targetAmount: Number(goalData.targetAmount) || 1000,
    currentProgress: Number(goalData.currentProgress) || 0,
    targetDate: goalData.targetDate,
    createdAt: new Date().toISOString(),
  };

  all.push(newGoal);
  setStorageItem(STORAGE_KEYS.SAVINGS_GOALS, all);
  return newGoal;
}

export function deleteStudentSavingsGoal(userId: string, goalId: string): void {
  const all = getStorageItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
  const filtered = all.filter(g => !(g.id === goalId && g.userId === userId));
  setStorageItem(STORAGE_KEYS.SAVINGS_GOALS, filtered);
}

// Account Deletion (AUTH-10)
export function deleteStudentAccount(userId: string): void {
  // Purge auth
  const users = getStorageItem<UserAuth[]>(STORAGE_KEYS.USERS_AUTH, []).filter(u => u.id !== userId);
  setStorageItem(STORAGE_KEYS.USERS_AUTH, users);

  // Purge profile
  const profiles = getStorageItem<Record<string, StudentProfile>>(STORAGE_KEYS.PROFILES, {});
  delete profiles[userId];
  setStorageItem(STORAGE_KEYS.PROFILES, profiles);

  // Purge all associated records
  const subjects = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []).filter(s => s.userId !== userId);
  setStorageItem(STORAGE_KEYS.SUBJECTS, subjects);

  const events = getStorageItem<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []).filter(e => e.userId !== userId);
  setStorageItem(STORAGE_KEYS.EVENTS, events);

  const assignments = getStorageItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []).filter(a => a.userId !== userId);
  setStorageItem(STORAGE_KEYS.ASSIGNMENTS, assignments);

  const transactions = getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []).filter(t => t.userId !== userId);
  setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactions);

  const goals = getStorageItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []).filter(g => g.userId !== userId);
  setStorageItem(STORAGE_KEYS.SAVINGS_GOALS, goals);

  // Purge new feature records
  const habits = getStorageItem<Habit[]>(STORAGE_KEYS.HABITS, []).filter(h => h.userId !== userId);
  setStorageItem(STORAGE_KEYS.HABITS, habits);

  const habitLogs = getStorageItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []).filter(l => l.userId !== userId);
  setStorageItem(STORAGE_KEYS.HABIT_LOGS, habitLogs);

  const focusSessions = getStorageItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []).filter(s => s.userId !== userId);
  setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, focusSessions);

  const focusSettings = getStorageItem<Record<string, FocusSettings>>(STORAGE_KEYS.FOCUS_SETTINGS, {});
  delete focusSettings[userId];
  setStorageItem(STORAGE_KEYS.FOCUS_SETTINGS, focusSettings);

  const activeFocus = getStorageItem<Record<string, ActiveFocusState>>(STORAGE_KEYS.ACTIVE_FOCUS_STATE, {});
  delete activeFocus[userId];
  setStorageItem(STORAGE_KEYS.ACTIVE_FOCUS_STATE, activeFocus);

  const assessments = getStorageItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []).filter(a => a.userId !== userId);
  setStorageItem(STORAGE_KEYS.ASSESSMENTS, assessments);

  if (getCurrentUserId() === userId) {
    setCurrentUserId(null);
  }
}

// Data Export (PROF-08)
export function exportAllStudentData(userId: string): void {
  const profile = getStudentProfile(userId);
  const subjects = getStudentSubjects(userId);
  const events = getStudentCalendarEvents(userId);
  const assignments = getStudentAssignments(userId);
  const transactions = getStudentTransactions(userId);
  const goals = getStudentSavingsGoals(userId);
  const habits = getStudentHabits(userId);
  const habitLogs = getStudentHabitLogs(userId);
  const focusSessions = getStudentFocusSessions(userId);
  const focusSettings = getStudentFocusSettings(userId);
  const assessments = getStudentAssessments(userId);

  const payload = {
    exportDate: new Date().toISOString(),
    platform: 'UniFlow v1.3 Enterprise Student Edition',
    profile,
    subjects,
    events,
    assignments,
    transactions,
    savingsGoals: goals,
    habits,
    habitLogs,
    focusSessions,
    focusSettings,
    assessments,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `uniflow_export_${profile?.fullName.toLowerCase().replace(/\s+/g, '_') || 'student'}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// FEATURE 1: HABIT TRACKER CRUD
// ==========================================
export function getStudentHabits(userId: string): Habit[] {
  const all = getStorageItem<Habit[]>(STORAGE_KEYS.HABITS, []);
  return all.filter(h => h.userId === userId);
}

export function saveStudentHabit(
  userId: string,
  habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }
): Habit {
  const all = getStorageItem<Habit[]>(STORAGE_KEYS.HABITS, []);

  if (habitData.id) {
    const index = all.findIndex(h => h.id === habitData.id && h.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...habitData };
      setStorageItem(STORAGE_KEYS.HABITS, all);
      return all[index];
    }
  }

  const newHabit: Habit = {
    id: generateId(),
    userId,
    title: habitData.title,
    description: habitData.description || '',
    category: habitData.category || 'study',
    customCategoryName: habitData.customCategoryName,
    icon: habitData.icon || 'BookOpen',
    color: habitData.color || '#8B80FF',
    scheduleType: habitData.scheduleType || 'daily',
    selectedDays: habitData.selectedDays,
    weeklyTargetDays: habitData.weeklyTargetDays,
    targetType: habitData.targetType || 'boolean',
    targetValue: habitData.targetValue,
    unit: habitData.unit,
    reminderTime: habitData.reminderTime,
    isArchived: !!habitData.isArchived,
    createdAt: new Date().toISOString(),
  };

  all.push(newHabit);
  setStorageItem(STORAGE_KEYS.HABITS, all);
  return newHabit;
}

export function archiveStudentHabit(userId: string, habitId: string, isArchived: boolean): void {
  const all = getStorageItem<Habit[]>(STORAGE_KEYS.HABITS, []);
  const index = all.findIndex(h => h.id === habitId && h.userId === userId);
  if (index !== -1) {
    all[index].isArchived = isArchived;
    setStorageItem(STORAGE_KEYS.HABITS, all);
  }
}

export function deleteStudentHabit(userId: string, habitId: string): void {
  const allHabits = getStorageItem<Habit[]>(STORAGE_KEYS.HABITS, []);
  setStorageItem(STORAGE_KEYS.HABITS, allHabits.filter(h => !(h.id === habitId && h.userId === userId)));

  // Remove corresponding logs
  const allLogs = getStorageItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
  setStorageItem(STORAGE_KEYS.HABIT_LOGS, allLogs.filter(l => !(l.habitId === habitId && l.userId === userId)));
}

// Habit Logs
export function getStudentHabitLogs(userId: string): HabitLog[] {
  const all = getStorageItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
  return all.filter(l => l.userId === userId);
}

export function getStudentHabitLogsByDate(userId: string, date: string): HabitLog[] {
  const all = getStorageItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
  return all.filter(l => l.userId === userId && l.date === date);
}

export function recordStudentHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  isCompleted: boolean,
  currentValue?: number,
  notes?: string
): HabitLog {
  const all = getStorageItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
  const index = all.findIndex(l => l.userId === userId && l.habitId === habitId && l.date === date);

  if (index !== -1) {
    all[index] = {
      ...all[index],
      isCompleted,
      currentValue: currentValue !== undefined ? currentValue : all[index].currentValue,
      notes: notes !== undefined ? notes : all[index].notes,
      completedAt: isCompleted ? (all[index].completedAt || new Date().toISOString()) : undefined,
    };
    setStorageItem(STORAGE_KEYS.HABIT_LOGS, all);
    return all[index];
  }

  const newLog: HabitLog = {
    id: generateId(),
    habitId,
    userId,
    date,
    isCompleted,
    currentValue: currentValue !== undefined ? currentValue : (isCompleted ? 1 : 0),
    notes: notes || '',
    completedAt: isCompleted ? new Date().toISOString() : undefined,
  };

  all.push(newLog);
  setStorageItem(STORAGE_KEYS.HABIT_LOGS, all);
  return newLog;
}

// ==========================================
// FEATURE 2: FOCUS MODE & POMODORO TIMER
// ==========================================
export function getStudentFocusSessions(userId: string): FocusSession[] {
  const all = getStorageItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  return all
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function saveStudentFocusSession(
  userId: string,
  sessionData: Omit<FocusSession, 'id' | 'userId'> & { id?: string }
): FocusSession {
  const all = getStorageItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);

  if (sessionData.id) {
    const index = all.findIndex(s => s.id === sessionData.id && s.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...sessionData };
      setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, all);
      return all[index];
    }
  }

  const newSession: FocusSession = {
    id: generateId(),
    userId,
    title: sessionData.title || 'Focus Session',
    sessionType: sessionData.sessionType || 'focus',
    plannedMinutes: sessionData.plannedMinutes || 25,
    actualDurationSeconds: sessionData.actualDurationSeconds,
    completedAt: sessionData.completedAt || new Date().toISOString(),
    subjectId: sessionData.subjectId,
    assignmentId: sessionData.assignmentId,
    notes: sessionData.notes || '',
    isCompleted: !!sessionData.isCompleted,
  };

  all.push(newSession);
  setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, all);
  return newSession;
}

export function deleteStudentFocusSession(userId: string, sessionId: string): void {
  const all = getStorageItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const filtered = all.filter(s => !(s.id === sessionId && s.userId === userId));
  setStorageItem(STORAGE_KEYS.FOCUS_SESSIONS, filtered);
}

export function getStudentFocusSettings(userId: string): FocusSettings {
  const all = getStorageItem<Record<string, FocusSettings>>(STORAGE_KEYS.FOCUS_SETTINGS, {});
  return all[userId] || {
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
  };
}

export function saveStudentFocusSettings(userId: string, settings: FocusSettings): void {
  const all = getStorageItem<Record<string, FocusSettings>>(STORAGE_KEYS.FOCUS_SETTINGS, {});
  all[userId] = settings;
  setStorageItem(STORAGE_KEYS.FOCUS_SETTINGS, all);
}

export function getActiveFocusState(userId: string): ActiveFocusState | null {
  const all = getStorageItem<Record<string, ActiveFocusState>>(STORAGE_KEYS.ACTIVE_FOCUS_STATE, {});
  return all[userId] || null;
}

export function saveActiveFocusState(userId: string, state: ActiveFocusState | null): void {
  const all = getStorageItem<Record<string, ActiveFocusState>>(STORAGE_KEYS.ACTIVE_FOCUS_STATE, {});
  if (state) {
    all[userId] = state;
  } else {
    delete all[userId];
  }
  setStorageItem(STORAGE_KEYS.ACTIVE_FOCUS_STATE, all);
}

// ==========================================
// FEATURE 3: ACADEMIC PROGRESS TRACKER
// ==========================================
export function getStudentAssessments(userId: string): Assessment[] {
  const all = getStorageItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
  return all
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime());
}

export function saveStudentAssessment(
  userId: string,
  assessmentData: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }
): Assessment {
  const all = getStorageItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);

  if (assessmentData.id) {
    const index = all.findIndex(a => a.id === assessmentData.id && a.userId === userId);
    if (index !== -1) {
      all[index] = { ...all[index], ...assessmentData };
      setStorageItem(STORAGE_KEYS.ASSESSMENTS, all);
      return all[index];
    }
  }

  const newAssessment: Assessment = {
    id: generateId(),
    userId,
    subjectId: assessmentData.subjectId,
    title: assessmentData.title,
    assessmentType: assessmentData.assessmentType || 'quiz',
    maximumMarks: Number(assessmentData.maximumMarks) || 100,
    obtainedMarks: assessmentData.obtainedMarks !== undefined && assessmentData.obtainedMarks !== null ? Number(assessmentData.obtainedMarks) : null,
    weightagePercentage: assessmentData.weightagePercentage !== undefined && assessmentData.weightagePercentage !== null ? Number(assessmentData.weightagePercentage) : undefined,
    assessmentDate: assessmentData.assessmentDate || new Date().toISOString().split('T')[0],
    status: assessmentData.status || (assessmentData.obtainedMarks !== null && assessmentData.obtainedMarks !== undefined ? 'graded' : 'upcoming'),
    notes: assessmentData.notes || '',
    createdAt: new Date().toISOString(),
  };

  all.push(newAssessment);
  setStorageItem(STORAGE_KEYS.ASSESSMENTS, all);
  return newAssessment;
}

export function deleteStudentAssessment(userId: string, assessmentId: string): void {
  const all = getStorageItem<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
  const filtered = all.filter(a => !(a.id === assessmentId && a.userId === userId));
  setStorageItem(STORAGE_KEYS.ASSESSMENTS, filtered);
}
