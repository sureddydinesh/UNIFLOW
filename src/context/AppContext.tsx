import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { 
  StudentProfile, 
  Subject, 
  CalendarEvent, 
  Assignment, 
  Transaction, 
  SavingsGoal, 
  FinancialSummary, 
  AcademicSummary,
  ThemePreference,
  Habit,
  HabitLog,
  FocusSession,
  FocusSettings,
  ActiveFocusState,
  Assessment
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as supabaseStorage from '../services/supabaseStorage';
import * as storage from '../services/storage';
import { calculateFinancialSummary, calculateAcademicSummary } from '../utils/calculations';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

function isDemoUser(uid?: string | null): boolean {
  if (!uid) return false;
  return uid.startsWith('usr_') || uid.startsWith('demo_');
}

interface AppContextType {
  userId: string | null;
  profile: StudentProfile | null;
  subjects: Subject[];
  events: CalendarEvent[];
  assignments: Assignment[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  financialSummary: FinancialSummary;
  academicSummary: AcademicSummary;
  activeTheme: 'dark' | 'light';
  themePreference: ThemePreference;
  isLoading: boolean;
  authError: string | null;

  // Feature 1: Habits
  habits: Habit[];
  habitLogs: HabitLog[];

  // Feature 2: Focus
  focusSessions: FocusSession[];
  focusSettings: FocusSettings;
  activeFocusState: ActiveFocusState | null;

  // Feature 3: Academics
  assessments: Assessment[];

  // Actions
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string, 
    email: string, 
    pass: string
  ) => Promise<{ success: boolean; error?: string; userId?: string; needsEmailConfirmation?: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
  completeOnboarding: (data: Partial<StudentProfile>, initialSubjects?: string[], initialBudget?: number) => void;
  updateProfile: (data: Partial<StudentProfile>) => void;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  
  // Subject actions
  saveSubject: (sub: Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Subject;
  deleteSubject: (id: string) => void;

  // Calendar actions
  saveEvent: (ev: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }) => CalendarEvent;
  deleteEvent: (id: string) => void;

  // Assignment actions
  saveAssignment: (asg: Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Assignment;
  deleteAssignment: (id: string) => void;
  toggleSubtask: (assignmentId: string, subtaskId: string) => void;
  toggleAssignmentComplete: (assignmentId: string) => void;

  // Money actions
  saveTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Transaction;
  deleteTransaction: (id: string) => void;

  // Savings Goal actions
  saveSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }) => SavingsGoal;
  deleteSavingsGoal: (id: string) => void;

  // Habit actions
  saveHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Habit;
  archiveHabit: (id: string, isArchived: boolean) => void;
  deleteHabit: (id: string) => void;
  recordHabitCompletion: (habitId: string, date: string, isCompleted: boolean, currentValue?: number, notes?: string) => HabitLog;

  // Focus actions
  saveFocusSession: (session: Omit<FocusSession, 'id' | 'userId'> & { id?: string }) => FocusSession;
  deleteFocusSession: (id: string) => void;
  saveFocusSettings: (settings: FocusSettings) => void;
  saveActiveFocusState: (state: ActiveFocusState | null) => void;

  // Assessment actions
  saveAssessment: (assessment: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Assessment;
  deleteAssessment: (id: string) => void;

  // Account
  deleteAccount: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [themePreference, setThemePrefState] = useState<ThemePreference>('dark');
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // New Feature States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusSettings, setFocusSettings] = useState<FocusSettings>({
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
  });
  const [activeFocusState, setActiveFocusState] = useState<ActiveFocusState | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Concurrency & Session-isolation guards
  const activeLoadedUserIdRef = useRef<string | null>(null);
  const currentFetchIdRef = useRef<number>(0);
  const isSwitchingToDemoRef = useRef<boolean>(false);

  const applyTheme = (pref: ThemePreference) => {
    localStorage.setItem('uniflow_theme_preference', pref);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let effective: 'dark' | 'light' = 'dark';

    if (pref === 'light') {
      effective = 'light';
    } else if (pref === 'dark') {
      effective = 'dark';
    } else if (pref === 'system') {
      effective = systemDark ? 'dark' : 'light';
    }

    setActiveTheme(effective);
    document.documentElement.setAttribute('data-theme', effective);
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const setThemePreference = (pref: ThemePreference) => {
    setThemePrefState(pref);
    applyTheme(pref);
    if (userId && profile) {
      if (isDemoUser(userId)) {
        storage.updateStudentProfile(userId, { theme: pref });
      } else {
        supabaseStorage.updateStudentProfile({ theme: pref }, userId).catch(console.error);
      }
      setProfile(prev => prev ? { ...prev, theme: pref } : null);
    }
  };

  const toggleTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
  };

  // Synchronously clears all user-owned in-memory collections (Edge Case B fix)
  const clearUserState = () => {
    setUserId(null);
    setProfile(null);
    setSubjects([]);
    setEvents([]);
    setAssignments([]);
    setTransactions([]);
    setSavingsGoals([]);
    setHabits([]);
    setHabitLogs([]);
    setFocusSessions([]);
    setFocusSettings({
      focusDurationMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true,
    });
    setActiveFocusState(null);
    setAssessments([]);
    setAuthError(null);
  };

  const loadDemoUserData = (uid: string) => {
    setIsLoading(true);
    const prof = storage.getStudentProfile(uid);
    const subs = storage.getStudentSubjects(uid);
    const evs = storage.getStudentCalendarEvents(uid);
    const asgs = storage.getStudentAssignments(uid);
    const txs = storage.getStudentTransactions(uid);
    const goals = storage.getStudentSavingsGoals(uid);

    const hbs = storage.getStudentHabits(uid);
    const hLogs = storage.getStudentHabitLogs(uid);
    const fSessions = storage.getStudentFocusSessions(uid);
    const fSettings = storage.getStudentFocusSettings(uid);
    const fActive = storage.getActiveFocusState(uid);
    const asms = storage.getStudentAssessments(uid);

    setProfile(prof);
    setSubjects(subs);
    setEvents(evs);
    setAssignments(asgs);
    setTransactions(txs);
    setSavingsGoals(goals);

    setHabits(hbs);
    setHabitLogs(hLogs);
    setFocusSessions(fSessions);
    setFocusSettings(fSettings);
    setActiveFocusState(fActive);
    setAssessments(asms);

    if (prof?.theme) {
      setThemePrefState(prof.theme);
      applyTheme(prof.theme);
    }

    setIsLoading(false);
  };

  const loadSupabaseUserData = async (authUserId: string) => {
    const fetchId = ++currentFetchIdRef.current;
    
    // Synchronously clear previous records before beginning fetch (Edge Case B fix)
    clearUserState();
    setIsLoading(true);
    setAuthError(null);
    setUserId(authUserId);

    try {
      // Step 1: Fetch profile with brief retry to allow the signup trigger transaction to finalize
      let prof = await supabaseStorage.getStudentProfile(authUserId);
      if (!prof) {
        await new Promise(r => setTimeout(r, 600));
        if (fetchId !== currentFetchIdRef.current) return;
        prof = await supabaseStorage.getStudentProfile(authUserId);
      }

      if (fetchId !== currentFetchIdRef.current) return;

      // Surface recoverable error if trigger record is missing; do NOT insert duplicate rows
      if (!prof) {
        console.error('[AppContext] Initial profile record not found for user:', authUserId);
        setAuthError('Profile initialization is pending. Please refresh this page or try again.');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch all user-owned records using typed supabaseStorage
      const [
        fSettings,
        fActive,
        subs,
        evs,
        asgs,
        txs,
        goals,
        hbs,
        hLogs,
        fSessions,
        asms
      ] = await Promise.all([
        supabaseStorage.getStudentFocusSettings(authUserId),
        supabaseStorage.getActiveFocusState(authUserId),
        supabaseStorage.getStudentSubjects(authUserId),
        supabaseStorage.getStudentCalendarEvents(authUserId),
        supabaseStorage.getStudentAssignments(authUserId),
        supabaseStorage.getStudentTransactions(authUserId),
        supabaseStorage.getStudentSavingsGoals(authUserId),
        supabaseStorage.getStudentHabits(authUserId),
        supabaseStorage.getStudentHabitLogs(authUserId),
        supabaseStorage.getStudentFocusSessions(authUserId),
        supabaseStorage.getStudentAssessments(authUserId),
      ]);

      if (fetchId !== currentFetchIdRef.current) return;

      setProfile(prof);
      setFocusSettings(fSettings);
      setActiveFocusState(fActive);
      setSubjects(subs);
      setEvents(evs);
      setAssignments(asgs);
      setTransactions(txs);
      setSavingsGoals(goals);
      setHabits(hbs);
      setHabitLogs(hLogs);
      setFocusSessions(fSessions);
      setAssessments(asms);

      if (prof.theme) {
        setThemePrefState(prof.theme);
        applyTheme(prof.theme);
      }
    } catch (err: any) {
      if (fetchId !== currentFetchIdRef.current) return;
      console.error('[AppContext] Error loading user data from Supabase:', err);
      const safeMsg = sanitizeErrorMessage(err?.message);
      setAuthError(`Failed to load student data: ${safeMsg}`);
    } finally {
      if (fetchId === currentFetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Auth state change subscription & session restoration
  useEffect(() => {
    storage.initializeSeedData();

    const savedTheme = (localStorage.getItem('uniflow_theme_preference') as ThemePreference) || 'dark';
    setThemePrefState(savedTheme);
    applyTheme(savedTheme);

    let isMounted = true;

    // 1. Subscribe to auth events (NO direct DB queries inside callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Edge Case A Guard: If in demo mode or actively switching to demo,
        // ignore ANY Supabase auth event (including SIGNED_OUT, TOKEN_REFRESHED)
        if (isSwitchingToDemoRef.current || isDemoUser(activeLoadedUserIdRef.current) || isDemoUser(storage.getCurrentUserId())) {
          return;
        }

        if (event === 'SIGNED_OUT' || !session) {
          activeLoadedUserIdRef.current = null;
          currentFetchIdRef.current++;
          clearUserState();
          setIsLoading(false);
        } else if (session?.user) {
          const authUserId = session.user.id;
          if (activeLoadedUserIdRef.current !== authUserId) {
            activeLoadedUserIdRef.current = authUserId;
            // Clear previous user state synchronously BEFORE scheduling load (Edge Case B fix)
            clearUserState();
            setIsLoading(true);
            setTimeout(() => {
              if (isMounted) {
                loadSupabaseUserData(authUserId);
              }
            }, 0);
          }
        }
      }
    );

    // 2. Initial session restoration
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('[AppContext] getSession notice:', error.message);
      }

      // If already in demo mode, prioritize demo session
      const demoId = storage.getCurrentUserId();
      if (demoId && isDemoUser(demoId)) {
        activeLoadedUserIdRef.current = demoId;
        setUserId(demoId);
        loadDemoUserData(demoId);
        return;
      }

      if (session?.user) {
        const authUserId = session.user.id;
        if (activeLoadedUserIdRef.current !== authUserId) {
          activeLoadedUserIdRef.current = authUserId;
          loadSupabaseUserData(authUserId);
        }
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('[AppContext] Session restoration error:', err);
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshData = () => {
    const targetId = userId || activeLoadedUserIdRef.current;
    if (targetId) {
      if (isDemoUser(targetId)) {
        loadDemoUserData(targetId);
      } else {
        loadSupabaseUserData(targetId);
      }
    }
  };

  // Auth Operations
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass) {
      return { success: false, error: 'Password is required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Authentication service is not configured on this deployment. Please verify that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are configured in your hosting environment.',
      };
    }

    // Edge Case B fix: Clear previous demo/cloud state synchronously before login
    isSwitchingToDemoRef.current = false;
    storage.setCurrentUserId(null);
    currentFetchIdRef.current++;
    clearUserState();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: sanitizeErrorMessage(error.message) };
      }

      if (data.user) {
        activeLoadedUserIdRef.current = data.user.id;
        loadSupabaseUserData(data.user.id);
      }

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: sanitizeErrorMessage(err?.message || 'Network error occurred while connecting to authentication service.'),
      };
    }
  };

  const register = async (
    fullName: string, 
    email: string, 
    pass: string
  ): Promise<{ success: boolean; error?: string; userId?: string; needsEmailConfirmation?: boolean; message?: string }> => {
    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid university email address.' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Authentication service is not configured on this deployment. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to your hosting environment variables.',
      };
    }

    // Edge Case B fix: Clear previous state synchronously before register
    isSwitchingToDemoRef.current = false;
    storage.setCurrentUserId(null);
    currentFetchIdRef.current++;
    clearUserState();

    try {
      const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const emailRedirectTo = siteOrigin ? `${siteOrigin}/dashboard` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: pass,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo,
        },
      });

      if (error) {
        return { success: false, error: sanitizeErrorMessage(error.message) };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      // Handle signup states where email confirmation is required and no active session is returned
      if (!data.session) {
        return {
          success: true,
          userId: data.user.id,
          needsEmailConfirmation: true,
          message: 'Account created! Please check your email to confirm your account before logging in.',
        };
      }

      activeLoadedUserIdRef.current = data.user.id;
      loadSupabaseUserData(data.user.id);

      return {
        success: true,
        userId: data.user.id,
        needsEmailConfirmation: false,
      };
    } catch (err: any) {
      return {
        success: false,
        error: sanitizeErrorMessage(err?.message || 'Network connection failed during registration.'),
      };
    }
  };

  const logout = async (): Promise<void> => {
    isSwitchingToDemoRef.current = false;
    currentFetchIdRef.current++;
    activeLoadedUserIdRef.current = null;
    storage.setCurrentUserId(null);
    clearUserState();

    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.warn('[AppContext] Supabase signOut notice:', err.message);
    }
  };

  // Edge Case A fix: Safely switch to demo user and terminate any active cloud session
  const switchDemoUser = (targetUserId: string) => {
    isSwitchingToDemoRef.current = true;
    currentFetchIdRef.current++;
    activeLoadedUserIdRef.current = targetUserId;
    
    // Edge Case B fix: Clear user state synchronously
    clearUserState();
    storage.setCurrentUserId(targetUserId);
    setUserId(targetUserId);
    loadDemoUserData(targetUserId);

    // Cleanly terminate cloud session in background without blowing away the demo user
    supabase.auth.signOut().catch(err => {
      console.warn('[AppContext] Background signOut notice during demo switch:', err.message);
    }).finally(() => {
      isSwitchingToDemoRef.current = false;
    });
  };

  const completeOnboarding = (
    data: Partial<StudentProfile>, 
    initialSubjects: string[] = [], 
    initialBudget?: number
  ) => {
    if (!userId) return;

    if (isDemoUser(userId)) {
      const updated = storage.updateStudentProfile(userId, {
        ...data,
        monthlyBudget: initialBudget ?? data.monthlyBudget ?? 10000,
        onboardingCompleted: true,
      });
      setProfile(updated);

      if (initialSubjects.length > 0) {
        const palette = ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24', '#EC4899', '#A855F7'];
        initialSubjects.forEach((subName, idx) => {
          if (subName.trim()) {
            storage.saveStudentSubject(userId, {
              name: subName.trim(),
              code: `SUB${101 + idx}`,
              color: palette[idx % palette.length],
              semester: updated.semester || 'Semester 1',
            });
          }
        });
        setSubjects(storage.getStudentSubjects(userId));
      }
    } else {
      const prevProfile = profile;
      const prevSubs = [...subjects];

      supabaseStorage.updateStudentProfile({
        ...data,
        monthlyBudget: initialBudget ?? data.monthlyBudget ?? 10000,
        onboardingCompleted: true,
      }, userId).then((updated) => {
        setProfile(updated);
        if (initialSubjects.length > 0) {
          const palette = ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24', '#EC4899', '#A855F7'];
          Promise.all(initialSubjects.map((subName, idx) => {
            if (subName.trim()) {
              return supabaseStorage.saveStudentSubject({
                name: subName.trim(),
                code: `SUB${101 + idx}`,
                color: palette[idx % palette.length],
                semester: updated.semester || 'Semester 1',
              }, userId);
            }
            return Promise.resolve(null);
          })).then(() => {
            supabaseStorage.getStudentSubjects(userId).then(setSubjects);
          });
        }
      }).catch(err => {
        console.error('[AppContext] completeOnboarding error, rolling back:', err);
        setProfile(prevProfile);
        setSubjects(prevSubs);
      });
    }
  };

  const updateProfile = (data: Partial<StudentProfile>) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      const updated = storage.updateStudentProfile(userId, data);
      setProfile(updated);
    } else {
      const prev = profile;
      if (profile) {
        setProfile({ ...profile, ...data });
      }

      supabaseStorage.updateStudentProfile(data, userId)
        .then(setProfile)
        .catch(err => {
          console.error('[AppContext] Failed to update profile, rolling back:', err);
          setProfile(prev);
        });
    }
  };

  // ==========================================
  // MODULE CRUD ACTIONS (Item-specific Optimistic + Rollback)
  // ==========================================

  // 1. Subject Actions
  const saveSubject = (sub: Omit<Subject, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentSubject(userId, sub);
      setSubjects(storage.getStudentSubjects(userId));
      return saved;
    } else {
      const isNew = !sub.id;
      const targetId = sub.id || crypto.randomUUID();
      const oldSubject = sub.id ? subjects.find(s => s.id === sub.id) : undefined;
      const tempSaved: Subject = {
        id: targetId,
        userId,
        name: sub.name,
        code: sub.code,
        color: sub.color,
        semester: sub.semester,
        instructor: sub.instructor,
        credits: sub.credits,
        targetPercentage: sub.targetPercentage,
        gradingScheme: sub.gradingScheme,
        createdAt: new Date().toISOString(),
      };

      setSubjects(curr => {
        const idx = curr.findIndex(s => s.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentSubject(sub, userId)
        .then(confirmed => {
          setSubjects(curr => curr.map(s => s.id === targetId ? confirmed : s));
        })
        .catch(err => {
          console.error('[AppContext] saveSubject failed, rolling back item:', err);
          if (isNew) {
            setSubjects(curr => curr.filter(s => s.id !== targetId));
          } else if (oldSubject) {
            setSubjects(curr => curr.map(s => s.id === targetId ? oldSubject : s));
          }
        });

      return tempSaved;
    }
  };

  const deleteSubject = (id: string) => {
    if (!userId) return;
    const deletedSubject = subjects.find(s => s.id === id);
    const cascadeAssignments = assignments.filter(a => a.subjectId === id);
    const cascadeAssessments = assessments.filter(a => a.subjectId === id);
    const affectedEventIds = new Set(events.filter(e => e.subjectId === id).map(e => e.id));
    const affectedSessionIds = new Set(focusSessions.filter(f => f.subjectId === id).map(f => f.id));

    if (isDemoUser(userId)) {
      storage.deleteStudentSubject(userId, id);
      setSubjects(storage.getStudentSubjects(userId));
      setAssignments(curr => curr.filter(a => a.subjectId !== id));
      setAssessments(curr => curr.filter(a => a.subjectId !== id));
      setEvents(curr => curr.map(e => e.subjectId === id ? { ...e, subjectId: undefined } : e));
      setFocusSessions(curr => curr.map(f => f.subjectId === id ? { ...f, subjectId: undefined } : f));
    } else {
      // Immediate local cascade matching PostgreSQL schema foreign-key behavior
      setSubjects(curr => curr.filter(s => s.id !== id));
      setAssignments(curr => curr.filter(a => a.subjectId !== id));
      setAssessments(curr => curr.filter(a => a.subjectId !== id));
      setEvents(curr => curr.map(e => e.subjectId === id ? { ...e, subjectId: undefined } : e));
      setFocusSessions(curr => curr.map(f => f.subjectId === id ? { ...f, subjectId: undefined } : f));

      supabaseStorage.deleteStudentSubject(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteSubject failed, rolling back item and relations:', err);
          if (deletedSubject) {
            setSubjects(curr => curr.some(s => s.id === id) ? curr : [...curr, deletedSubject]);
          }
          if (cascadeAssignments.length > 0) {
            setAssignments(curr => [...curr, ...cascadeAssignments.filter(a => !curr.some(c => c.id === a.id))]);
          }
          if (cascadeAssessments.length > 0) {
            setAssessments(curr => [...curr, ...cascadeAssessments.filter(a => !curr.some(c => c.id === a.id))]);
          }
          if (affectedEventIds.size > 0) {
            setEvents(curr => curr.map(e => affectedEventIds.has(e.id) ? { ...e, subjectId: id } : e));
          }
          if (affectedSessionIds.size > 0) {
            setFocusSessions(curr => curr.map(f => affectedSessionIds.has(f.id) ? { ...f, subjectId: id } : f));
          }
        });
    }
  };

  // 2. Calendar Event Actions
  const saveEvent = (ev: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentCalendarEvent(userId, ev);
      setEvents(storage.getStudentCalendarEvents(userId));
      return saved;
    } else {
      const isNew = !ev.id;
      const targetId = ev.id || crypto.randomUUID();
      const oldEvent = ev.id ? events.find(e => e.id === ev.id) : undefined;
      const tempSaved: CalendarEvent = {
        id: targetId,
        userId,
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
        createdAt: new Date().toISOString(),
      };

      setEvents(curr => {
        const idx = curr.findIndex(e => e.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentCalendarEvent(ev, userId)
        .then(confirmed => {
          setEvents(curr => curr.map(e => e.id === targetId ? confirmed : e));
        })
        .catch(err => {
          console.error('[AppContext] saveEvent failed, rolling back item:', err);
          if (isNew) {
            setEvents(curr => curr.filter(e => e.id !== targetId));
          } else if (oldEvent) {
            setEvents(curr => curr.map(e => e.id === targetId ? oldEvent : e));
          }
        });

      return tempSaved;
    }
  };

  const deleteEvent = (id: string) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentCalendarEvent(userId, id);
      setEvents(storage.getStudentCalendarEvents(userId));
    } else {
      const deletedEvent = events.find(e => e.id === id);
      setEvents(curr => curr.filter(e => e.id !== id));

      supabaseStorage.deleteStudentCalendarEvent(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteEvent failed, rolling back item:', err);
          if (deletedEvent) {
            setEvents(curr => curr.some(e => e.id === id) ? curr : [...curr, deletedEvent]);
          }
        });
    }
  };

  // 3. Assignment Actions
  const saveAssignment = (asg: Omit<Assignment, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentAssignment(userId, asg);
      setAssignments(storage.getStudentAssignments(userId));
      return saved;
    } else {
      const isNew = !asg.id;
      const targetId = asg.id || crypto.randomUUID();
      const oldAsg = asg.id ? assignments.find(a => a.id === asg.id) : undefined;
      const tempSaved: Assignment = {
        id: targetId,
        userId,
        subjectId: asg.subjectId,
        title: asg.title,
        description: asg.description,
        dueAt: asg.dueAt,
        priority: asg.priority,
        status: asg.status,
        estimatedMinutes: asg.estimatedMinutes,
        referenceUrl: asg.referenceUrl,
        subtasks: asg.subtasks || [],
        completedAt: asg.completedAt,
        createdAt: new Date().toISOString(),
      };

      setAssignments(curr => {
        const idx = curr.findIndex(a => a.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentAssignment(asg, userId)
        .then(confirmed => {
          setAssignments(curr => curr.map(a => a.id === targetId ? confirmed : a));
        })
        .catch(err => {
          console.error('[AppContext] saveAssignment failed, rolling back item:', err);
          if (isNew) {
            setAssignments(curr => curr.filter(a => a.id !== targetId));
          } else if (oldAsg) {
            setAssignments(curr => curr.map(a => a.id === targetId ? oldAsg : a));
          }
        });

      return tempSaved;
    }
  };

  const deleteAssignment = (id: string) => {
    if (!userId) return;
    const deletedAsg = assignments.find(a => a.id === id);
    const affectedEventIds = new Set(events.filter(e => e.assignmentId === id).map(e => e.id));
    const affectedSessionIds = new Set(focusSessions.filter(f => f.assignmentId === id).map(f => f.id));

    if (isDemoUser(userId)) {
      storage.deleteStudentAssignment(userId, id);
      setAssignments(storage.getStudentAssignments(userId));
      setEvents(curr => curr.map(e => e.assignmentId === id ? { ...e, assignmentId: undefined } : e));
      setFocusSessions(curr => curr.map(f => f.assignmentId === id ? { ...f, assignmentId: undefined } : f));
    } else {
      setAssignments(curr => curr.filter(a => a.id !== id));
      setEvents(curr => curr.map(e => e.assignmentId === id ? { ...e, assignmentId: undefined } : e));
      setFocusSessions(curr => curr.map(f => f.assignmentId === id ? { ...f, assignmentId: undefined } : f));

      supabaseStorage.deleteStudentAssignment(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteAssignment failed, rolling back item:', err);
          if (deletedAsg) {
            setAssignments(curr => curr.some(a => a.id === id) ? curr : [...curr, deletedAsg]);
          }
          if (affectedEventIds.size > 0) {
            setEvents(curr => curr.map(e => affectedEventIds.has(e.id) ? { ...e, assignmentId: id } : e));
          }
          if (affectedSessionIds.size > 0) {
            setFocusSessions(curr => curr.map(f => affectedSessionIds.has(f.id) ? { ...f, assignmentId: id } : f));
          }
        });
    }
  };

  const toggleSubtask = (assignmentId: string, subtaskId: string) => {
    if (!userId) return;
    const asg = assignments.find(a => a.id === assignmentId);
    if (!asg) return;

    const newSubtasks = asg.subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );

    const allDone = newSubtasks.length > 0 && newSubtasks.every(st => st.isCompleted);
    const newStatus = allDone ? 'completed' : (newSubtasks.some(st => st.isCompleted) ? 'in_progress' : asg.status);

    saveAssignment({
      ...asg,
      subtasks: newSubtasks,
      status: newStatus,
    });
  };

  const toggleAssignmentComplete = (assignmentId: string) => {
    if (!userId) return;
    const asg = assignments.find(a => a.id === assignmentId);
    if (!asg) return;

    const nextStatus = asg.status === 'completed' ? 'in_progress' : 'completed';
    const updatedSubtasks = asg.subtasks.map(st => ({
      ...st,
      isCompleted: nextStatus === 'completed',
    }));

    saveAssignment({
      ...asg,
      status: nextStatus,
      subtasks: updatedSubtasks,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  // 4. Transaction Actions
  const saveTransaction = (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentTransaction(userId, tx);
      setTransactions(storage.getStudentTransactions(userId));
      return saved;
    } else {
      const isNew = !tx.id;
      const targetId = tx.id || crypto.randomUUID();
      const oldTx = tx.id ? transactions.find(t => t.id === tx.id) : undefined;
      const tempSaved: Transaction = {
        id: targetId,
        userId,
        transactionType: tx.transactionType,
        amount: tx.amount,
        category: tx.category,
        transactionDate: tx.transactionDate,
        description: tx.description,
        paymentMethod: tx.paymentMethod,
        createdAt: new Date().toISOString(),
      };

      setTransactions(curr => {
        const idx = curr.findIndex(t => t.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentTransaction(tx, userId)
        .then(confirmed => {
          setTransactions(curr => curr.map(t => t.id === targetId ? confirmed : t));
        })
        .catch(err => {
          console.error('[AppContext] saveTransaction failed, rolling back item:', err);
          if (isNew) {
            setTransactions(curr => curr.filter(t => t.id !== targetId));
          } else if (oldTx) {
            setTransactions(curr => curr.map(t => t.id === targetId ? oldTx : t));
          }
        });

      return tempSaved;
    }
  };

  const deleteTransaction = (id: string) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentTransaction(userId, id);
      setTransactions(storage.getStudentTransactions(userId));
    } else {
      const deletedTx = transactions.find(t => t.id === id);
      setTransactions(curr => curr.filter(t => t.id !== id));

      supabaseStorage.deleteStudentTransaction(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteTransaction failed, rolling back item:', err);
          if (deletedTx) {
            setTransactions(curr => curr.some(t => t.id === id) ? curr : [...curr, deletedTx]);
          }
        });
    }
  };

  // 5. Savings Goal Actions
  const saveSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentSavingsGoal(userId, goal);
      setSavingsGoals(storage.getStudentSavingsGoals(userId));
      return saved;
    } else {
      const isNew = !goal.id;
      const targetId = goal.id || crypto.randomUUID();
      const oldGoal = goal.id ? savingsGoals.find(g => g.id === goal.id) : undefined;
      const tempSaved: SavingsGoal = {
        id: targetId,
        userId,
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentProgress: goal.currentProgress,
        targetDate: goal.targetDate,
        createdAt: new Date().toISOString(),
      };

      setSavingsGoals(curr => {
        const idx = curr.findIndex(g => g.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentSavingsGoal(goal, userId)
        .then(confirmed => {
          setSavingsGoals(curr => curr.map(g => g.id === targetId ? confirmed : g));
        })
        .catch(err => {
          console.error('[AppContext] saveSavingsGoal failed, rolling back item:', err);
          if (isNew) {
            setSavingsGoals(curr => curr.filter(g => g.id !== targetId));
          } else if (oldGoal) {
            setSavingsGoals(curr => curr.map(g => g.id === targetId ? oldGoal : g));
          }
        });

      return tempSaved;
    }
  };

  const deleteSavingsGoal = (id: string) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentSavingsGoal(userId, id);
      setSavingsGoals(storage.getStudentSavingsGoals(userId));
    } else {
      const deletedGoal = savingsGoals.find(g => g.id === id);
      setSavingsGoals(curr => curr.filter(g => g.id !== id));

      supabaseStorage.deleteStudentSavingsGoal(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteSavingsGoal failed, rolling back item:', err);
          if (deletedGoal) {
            setSavingsGoals(curr => curr.some(g => g.id === id) ? curr : [...curr, deletedGoal]);
          }
        });
    }
  };

  // 6. Habit Actions
  const saveHabit = (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentHabit(userId, habit);
      setHabits(storage.getStudentHabits(userId));
      return saved;
    } else {
      const isNew = !habit.id;
      const targetId = habit.id || crypto.randomUUID();
      const oldHabit = habit.id ? habits.find(h => h.id === habit.id) : undefined;
      const tempSaved: Habit = {
        id: targetId,
        userId,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        customCategoryName: habit.customCategoryName,
        icon: habit.icon,
        color: habit.color,
        scheduleType: habit.scheduleType,
        selectedDays: habit.selectedDays,
        weeklyTargetDays: habit.weeklyTargetDays,
        targetType: habit.targetType,
        targetValue: habit.targetValue,
        unit: habit.unit,
        reminderTime: habit.reminderTime,
        isArchived: habit.isArchived ?? false,
        createdAt: new Date().toISOString(),
      };

      setHabits(curr => {
        const idx = curr.findIndex(h => h.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentHabit(habit, userId)
        .then(confirmed => {
          setHabits(curr => curr.map(h => h.id === targetId ? confirmed : h));
        })
        .catch(err => {
          console.error('[AppContext] saveHabit failed, rolling back item:', err);
          if (isNew) {
            setHabits(curr => curr.filter(h => h.id !== targetId));
          } else if (oldHabit) {
            setHabits(curr => curr.map(h => h.id === targetId ? oldHabit : h));
          }
        });

      return tempSaved;
    }
  };

  const archiveHabit = (id: string, isArchived: boolean) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.archiveStudentHabit(userId, id, isArchived);
      setHabits(storage.getStudentHabits(userId));
    } else {
      setHabits(curr => curr.map(h => h.id === id ? { ...h, isArchived } : h));

      supabaseStorage.archiveStudentHabit(id, isArchived, userId)
        .catch(err => {
          console.error('[AppContext] archiveHabit failed, rolling back item:', err);
          setHabits(curr => curr.map(h => h.id === id ? { ...h, isArchived: !isArchived } : h));
        });
    }
  };

  const deleteHabit = (id: string) => {
    if (!userId) return;
    const deletedHabit = habits.find(h => h.id === id);
    const deletedLogs = habitLogs.filter(l => l.habitId === id);

    if (isDemoUser(userId)) {
      storage.deleteStudentHabit(userId, id);
      setHabits(storage.getStudentHabits(userId));
      setHabitLogs(storage.getStudentHabitLogs(userId));
    } else {
      setHabits(curr => curr.filter(h => h.id !== id));
      setHabitLogs(curr => curr.filter(l => l.habitId !== id));

      supabaseStorage.deleteStudentHabit(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteHabit failed, rolling back item:', err);
          if (deletedHabit) {
            setHabits(curr => curr.some(h => h.id === id) ? curr : [...curr, deletedHabit]);
          }
          if (deletedLogs.length > 0) {
            setHabitLogs(curr => [...curr, ...deletedLogs.filter(l => !curr.some(c => c.id === l.id))]);
          }
        });
    }
  };

  const recordHabitCompletion = (
    habitId: string, 
    date: string, 
    isCompleted: boolean, 
    currentValue?: number, 
    notes?: string
  ) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const log = storage.recordStudentHabitCompletion(userId, habitId, date, isCompleted, currentValue, notes);
      setHabitLogs(storage.getStudentHabitLogs(userId));
      return log;
    } else {
      const oldLog = habitLogs.find(l => l.habitId === habitId && l.date === date);
      const isNew = !oldLog;
      const tempLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        userId,
        date,
        isCompleted,
        currentValue,
        notes,
      };

      setHabitLogs(curr => {
        const idx = curr.findIndex(l => l.habitId === habitId && l.date === date);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempLog;
          return next;
        }
        return [...curr, tempLog];
      });

      supabaseStorage.recordStudentHabitCompletion(habitId, date, isCompleted, currentValue, notes, userId)
        .then(confirmed => {
          setHabitLogs(curr => curr.map(l => (l.habitId === habitId && l.date === date) ? confirmed : l));
        })
        .catch(err => {
          console.error('[AppContext] recordHabitCompletion failed, rolling back item:', err);
          if (isNew) {
            setHabitLogs(curr => curr.filter(l => !(l.habitId === habitId && l.date === date)));
          } else {
            setHabitLogs(curr => curr.map(l => (l.habitId === habitId && l.date === date) ? oldLog : l));
          }
        });

      return tempLog;
    }
  };

  // 7. Focus Actions
  const saveFocusSession = (session: Omit<FocusSession, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentFocusSession(userId, session);
      setFocusSessions(storage.getStudentFocusSessions(userId));
      return saved;
    } else {
      const isNew = !session.id;
      const targetId = session.id || crypto.randomUUID();
      const oldSession = session.id ? focusSessions.find(f => f.id === session.id) : undefined;
      const tempSaved: FocusSession = {
        id: targetId,
        userId,
        subjectId: session.subjectId,
        assignmentId: session.assignmentId,
        title: session.title,
        sessionType: session.sessionType,
        workflowMode: session.workflowMode,
        plannedMinutes: session.plannedMinutes,
        actualDurationSeconds: session.actualDurationSeconds,
        completedAt: session.completedAt,
        notes: session.notes,
        isCompleted: session.isCompleted,
      };

      setFocusSessions(curr => {
        const idx = curr.findIndex(f => f.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentFocusSession(session, userId)
        .then(confirmed => {
          setFocusSessions(curr => curr.map(f => f.id === targetId ? confirmed : f));
        })
        .catch(err => {
          console.error('[AppContext] saveFocusSession failed, rolling back item:', err);
          if (isNew) {
            setFocusSessions(curr => curr.filter(f => f.id !== targetId));
          } else if (oldSession) {
            setFocusSessions(curr => curr.map(f => f.id === targetId ? oldSession : f));
          }
        });

      return tempSaved;
    }
  };

  const deleteFocusSession = (id: string) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentFocusSession(userId, id);
      setFocusSessions(storage.getStudentFocusSessions(userId));
    } else {
      const deletedSession = focusSessions.find(f => f.id === id);
      setFocusSessions(curr => curr.filter(f => f.id !== id));

      supabaseStorage.deleteStudentFocusSession(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteFocusSession failed, rolling back item:', err);
          if (deletedSession) {
            setFocusSessions(curr => curr.some(f => f.id === id) ? curr : [...curr, deletedSession]);
          }
        });
    }
  };

  const saveFocusSettings = (settings: FocusSettings) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.saveStudentFocusSettings(userId, settings);
      setFocusSettings(settings);
    } else {
      const prev = { ...focusSettings };
      setFocusSettings(settings);

      supabaseStorage.saveStudentFocusSettings(settings, userId).catch(err => {
        console.error('[AppContext] saveFocusSettings failed, rolling back item:', err);
        setFocusSettings(prev);
      });
    }
  };

  const saveActiveFocusState = (state: ActiveFocusState | null) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.saveActiveFocusState(userId, state);
      setActiveFocusState(state);
    } else {
      const prev = activeFocusState;
      setActiveFocusState(state);

      supabaseStorage.saveActiveFocusState(state, userId).catch(err => {
        console.error('[AppContext] saveActiveFocusState failed, rolling back item:', err);
        setActiveFocusState(prev);
      });
    }
  };

  // 8. Assessment Actions
  const saveAssessment = (assessment: Omit<Assessment, 'id' | 'userId' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error("No active user session");
    if (isDemoUser(userId)) {
      const saved = storage.saveStudentAssessment(userId, assessment);
      setAssessments(storage.getStudentAssessments(userId));
      return saved;
    } else {
      const isNew = !assessment.id;
      const targetId = assessment.id || crypto.randomUUID();
      const oldAssessment = assessment.id ? assessments.find(a => a.id === assessment.id) : undefined;
      const tempSaved: Assessment = {
        id: targetId,
        userId,
        subjectId: assessment.subjectId,
        title: assessment.title,
        assessmentType: assessment.assessmentType,
        maximumMarks: assessment.maximumMarks,
        obtainedMarks: assessment.obtainedMarks,
        weightagePercentage: assessment.weightagePercentage,
        assessmentDate: assessment.assessmentDate,
        status: assessment.status,
        notes: assessment.notes,
        createdAt: new Date().toISOString(),
      };

      setAssessments(curr => {
        const idx = curr.findIndex(a => a.id === targetId);
        if (idx !== -1) {
          const next = [...curr];
          next[idx] = tempSaved;
          return next;
        }
        return [...curr, tempSaved];
      });

      supabaseStorage.saveStudentAssessment(assessment, userId)
        .then(confirmed => {
          setAssessments(curr => curr.map(a => a.id === targetId ? confirmed : a));
        })
        .catch(err => {
          console.error('[AppContext] saveAssessment failed, rolling back item:', err);
          if (isNew) {
            setAssessments(curr => curr.filter(a => a.id !== targetId));
          } else if (oldAssessment) {
            setAssessments(curr => curr.map(a => a.id === targetId ? oldAssessment : a));
          }
        });

      return tempSaved;
    }
  };

  const deleteAssessment = (id: string) => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentAssessment(userId, id);
      setAssessments(storage.getStudentAssessments(userId));
    } else {
      const deletedAssessment = assessments.find(a => a.id === id);
      setAssessments(curr => curr.filter(a => a.id !== id));

      supabaseStorage.deleteStudentAssessment(id, userId)
        .catch(err => {
          console.error('[AppContext] deleteAssessment failed, rolling back item:', err);
          if (deletedAssessment) {
            setAssessments(curr => curr.some(a => a.id === id) ? curr : [...curr, deletedAssessment]);
          }
        });
    }
  };

  const deleteAccount = () => {
    if (!userId) return;
    if (isDemoUser(userId)) {
      storage.deleteStudentAccount(userId);
    }
    logout();
  };

  // Computed live summaries
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(transactions, profile?.monthlyBudget || 0);
  }, [transactions, profile?.monthlyBudget]);

  const academicSummary = useMemo(() => {
    return calculateAcademicSummary(assignments);
  }, [assignments]);

  return (
    <AppContext.Provider
      value={{
        userId,
        profile,
        subjects,
        events,
        assignments,
        transactions,
        savingsGoals,
        financialSummary,
        academicSummary,
        activeTheme,
        themePreference,
        isLoading,
        authError,

        // New Features
        habits,
        habitLogs,
        focusSessions,
        focusSettings,
        activeFocusState,
        assessments,

        login,
        register,
        logout,
        switchDemoUser,
        completeOnboarding,
        updateProfile,
        setThemePreference,
        toggleTheme,

        saveSubject,
        deleteSubject,
        saveEvent,
        deleteEvent,
        saveAssignment,
        deleteAssignment,
        toggleSubtask,
        toggleAssignmentComplete,
        saveTransaction,
        deleteTransaction,
        saveSavingsGoal,
        deleteSavingsGoal,

        // Habit Handlers
        saveHabit,
        archiveHabit,
        deleteHabit,
        recordHabitCompletion,

        // Focus Handlers
        saveFocusSession,
        deleteFocusSession,
        saveFocusSettings,
        saveActiveFocusState,

        // Assessment Handlers
        saveAssessment,
        deleteAssessment,

        deleteAccount,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
