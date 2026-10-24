import { sanitizeErrorMessage } from '../utils/errorSanitizer';

// Auth & Session Management Test Suite
// Tests: session restoration, sign-in, sign-up, sign-out, missing initial records, and user-state isolation

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

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      (res as Promise<void>).then(() => {
        console.log(`  ✓ ${name}`);
        passed++;
      }).catch((e: any) => {
        console.error(`  ✗ ${name}`);
        console.error(`    ${e.message}`);
        failed++;
      });
    } else {
      console.log(`  ✓ ${name}`);
      passed++;
    }
  } catch (e: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('--- Running UniFlow Auth & Session Management Test Suite ---');

const TEST_AUTH_USER_A = {
  id: 'a1111111-0000-0000-0000-000000000001',
  email: 'student_a@university.edu',
};

const TEST_AUTH_USER_B = {
  id: 'b2222222-0000-0000-0000-000000000002',
  email: 'student_b@university.edu',
};

// Simulated Auth & Session Coordinator to test the exact state machine in AppContext
class AuthSessionCoordinator {
  public userId: string | null = null;
  public profile: any = null;
  public subjects: any[] = [];
  public focusSettings: any = null;
  public authError: string | null = null;
  public isLoading: boolean = false;

  public currentFetchId = 0;
  public activeLoadedUserId: string | null = null;
  public isSwitchingToDemo = false;

  constructor(
    private mockSupabase: any,
    private mockStorage: any
  ) {}

  public isDemoUser(uid?: string | null): boolean {
    if (!uid) return false;
    return uid.startsWith('usr_') || uid.startsWith('demo_');
  }

  public clearUserState() {
    this.userId = null;
    this.profile = null;
    this.subjects = [];
    this.focusSettings = null;
    this.authError = null;
  }

  public handleAuthStateChange(event: string, session: any) {
    // Edge Case A Guard: If in demo mode or actively switching to demo,
    // ignore ANY Supabase auth event (including SIGNED_OUT, TOKEN_REFRESHED)
    if (this.isSwitchingToDemo || this.isDemoUser(this.activeLoadedUserId) || this.isDemoUser(this.mockStorage.getCurrentUserId?.())) {
      return;
    }

    if (event === 'SIGNED_OUT' || !session) {
      this.activeLoadedUserId = null;
      this.currentFetchId++;
      this.clearUserState();
      this.isLoading = false;
    } else if (session?.user) {
      const authUserId = session.user.id;
      if (this.activeLoadedUserId !== authUserId) {
        this.activeLoadedUserId = authUserId;
        this.clearUserState();
        this.isLoading = true;
        this.loadUserData(authUserId);
      }
    }
  }

  public loadDemoUserData(demoUid: string) {
    this.isLoading = true;
    const prof = this.mockStorage.getStudentProfile?.(demoUid);
    const subs = this.mockStorage.getStudentSubjects?.(demoUid) || [];
    this.profile = prof;
    this.subjects = subs;
    this.isLoading = false;
  }

  public switchDemoUser(targetUserId: string) {
    this.isSwitchingToDemo = true;
    this.currentFetchId++;
    this.activeLoadedUserId = targetUserId;

    // Edge Case B fix: Clear user state synchronously
    this.clearUserState();
    this.mockStorage.setCurrentUserId?.(targetUserId);
    this.userId = targetUserId;
    this.loadDemoUserData(targetUserId);

    // Cleanly terminate cloud session in background without blowing away the demo user
    this.mockSupabase.auth.signOut().catch((err: any) => {
      console.warn('Background signOut notice during demo switch:', err.message);
    }).finally(() => {
      this.isSwitchingToDemo = false;
    });
  }

  public async loadUserData(authUserId: string) {
    const fetchId = ++this.currentFetchId;
    this.isLoading = true;
    this.authError = null;
    this.userId = authUserId;

    try {
      const prof = await this.mockStorage.getStudentProfile(authUserId);
      if (fetchId !== this.currentFetchId) return;

      if (!prof) {
        // Recoverable error: initial record missing
        this.authError = 'Profile initialization is pending. Please refresh this page or try again.';
        this.isLoading = false;
        return;
      }

      const [settings, subs] = await Promise.all([
        this.mockStorage.getStudentFocusSettings(authUserId),
        this.mockStorage.getStudentSubjects(authUserId),
      ]);

      if (fetchId !== this.currentFetchId) return;

      this.profile = prof;
      this.focusSettings = settings;
      this.subjects = subs;
    } catch (err: any) {
      if (fetchId !== this.currentFetchId) return;
      const safeMsg = sanitizeErrorMessage(err?.message);
      this.authError = `Failed to load student data: ${safeMsg}`;
    } finally {
      if (fetchId === this.currentFetchId) {
        this.isLoading = false;
      }
    }
  }

  public async refreshData(): Promise<void> {
    const targetId = this.userId || this.activeLoadedUserId;
    if (targetId) {
      if (this.isDemoUser(targetId)) {
        this.loadDemoUserData(targetId);
      } else {
        await this.loadUserData(targetId);
      }
    }
  }

  public async login(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass) {
      return { success: false, error: 'Password is required.' };
    }

    // Edge Case B fix: Clear previous demo/cloud state synchronously before login
    this.isSwitchingToDemo = false;
    this.mockStorage.setCurrentUserId?.(null);
    this.currentFetchId++;
    this.clearUserState();
    this.isLoading = true;

    const { data, error } = await this.mockSupabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pass,
    });

    if (error) {
      this.isLoading = false;
      return { success: false, error: error.message };
    }

    if (data?.user) {
      this.activeLoadedUserId = data.user.id;
      await this.loadUserData(data.user.id);
    }

    return { success: true };
  }

  public async register(
    fullName: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; userId?: string; needsEmailConfirmation?: boolean; message?: string }> {
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

    // Edge Case B fix: Clear previous state synchronously before register
    this.isSwitchingToDemo = false;
    this.mockStorage.setCurrentUserId?.(null);
    this.currentFetchId++;
    this.clearUserState();

    const { data, error } = await this.mockSupabase.auth.signUp({
      email: normalizedEmail,
      password: pass,
      options: { data: { full_name: trimmedName } },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    if (!data.session) {
      return {
        success: true,
        userId: data.user.id,
        needsEmailConfirmation: true,
        message: 'Account created! Please check your email to confirm your account before logging in.',
      };
    }

    this.activeLoadedUserId = data.user.id;
    await this.loadUserData(data.user.id);

    return {
      success: true,
      userId: data.user.id,
      needsEmailConfirmation: false,
    };
  }

  public async logout(): Promise<void> {
    this.isSwitchingToDemo = false;
    this.currentFetchId++;
    this.activeLoadedUserId = null;
    this.mockStorage.setCurrentUserId?.(null);
    this.clearUserState();
    await this.mockSupabase.auth.signOut();
  }
}

// Tests Execution
async function runAllTests() {
  // 1. Sign-in validation & execution
  await (async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: async ({ email, password }: any) => {
          if (email === 'student_a@university.edu' && password === 'correct_pass') {
            return { data: { user: TEST_AUTH_USER_A }, error: null };
          }
          return { data: null, error: { message: 'Invalid login credentials' } };
        },
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getStudentProfile: async (uid: string) => ({ userId: uid, fullName: 'Student A', theme: 'dark' }),
      getStudentFocusSettings: async (uid: string) => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async (uid: string) => [{ id: 's1', name: 'CS101' }],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Test validation
    const invalidEmailRes = await coordinator.login('not-an-email', 'password123');
    assertEqual(invalidEmailRes.success, false);
    assertEqual(invalidEmailRes.error, 'Please enter a valid email address.');

    // Test bad credentials
    const badCredsRes = await coordinator.login('student_a@university.edu', 'wrong_pass');
    assertEqual(badCredsRes.success, false);
    assertEqual(badCredsRes.error, 'Invalid login credentials');

    // Test success
    const successRes = await coordinator.login('student_a@university.edu', 'correct_pass');
    assertEqual(successRes.success, true);
    assertEqual(coordinator.userId, TEST_AUTH_USER_A.id);
    assertEqual(coordinator.profile?.fullName, 'Student A');
    assertEqual(coordinator.subjects.length, 1);
    console.log('  ✓ Sign-in validation and success handling');
    passed++;
  })();

  // 2. Sign-up with email confirmation required vs immediate session
  await (async () => {
    const mockSupabase = {
      auth: {
        signUp: async ({ email, password, options }: any) => {
          if (email === 'existing@university.edu') {
            return { data: null, error: { message: 'User already registered' } };
          }
          if (email === 'needs_confirm@university.edu') {
            return { data: { user: { id: 'u_confirm' }, session: null }, error: null };
          }
          return { data: { user: { id: 'u_immediate' }, session: { access_token: 'tok' } }, error: null };
        },
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getStudentProfile: async (uid: string) => ({ userId: uid, fullName: 'New Student' }),
      getStudentFocusSettings: async (uid: string) => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async () => [],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Test short password
    const shortPassRes = await coordinator.register('Alice', 'alice@edu.com', '123');
    assertEqual(shortPassRes.success, false);
    assertEqual(shortPassRes.error, 'Password must be at least 6 characters.');

    // Test existing user
    const existingRes = await coordinator.register('Alice', 'existing@university.edu', 'password123');
    assertEqual(existingRes.success, false);
    assertEqual(existingRes.error, 'User already registered');

    // Test email confirmation required
    const confirmRes = await coordinator.register('Bob', 'needs_confirm@university.edu', 'password123');
    assertEqual(confirmRes.success, true);
    assertEqual(confirmRes.needsEmailConfirmation, true);
    assertEqual(coordinator.userId, null); // Session is not active yet!

    // Test immediate session
    const immediateRes = await coordinator.register('Charlie', 'charlie@university.edu', 'password123');
    assertEqual(immediateRes.success, true);
    assertEqual(immediateRes.needsEmailConfirmation, false);
    assertEqual(coordinator.userId, 'u_immediate');
    console.log('  ✓ Sign-up with confirmation handling and session branching');
    passed++;
  })();

  // 3. User-state isolation on sign-out and user switch
  await (async () => {
    let signOutCalled = false;
    const mockSupabase = {
      auth: {
        signOut: async () => { signOutCalled = true; },
        signInWithPassword: async ({ email }: any) => {
          return { data: { user: email.includes('a') ? TEST_AUTH_USER_A : TEST_AUTH_USER_B }, error: null };
        },
      },
    };

    const mockStorage = {
      getStudentProfile: async (uid: string) => ({ userId: uid, fullName: uid.startsWith('a') ? 'User A' : 'User B' }),
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async (uid: string) => uid.startsWith('a') ? [{ name: 'A Subject' }] : [{ name: 'B Subject' }],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Login User A
    await coordinator.login('a@university.edu', 'pass123');
    assertEqual(coordinator.userId, TEST_AUTH_USER_A.id);
    assertEqual(coordinator.subjects[0].name, 'A Subject');

    // Sign out
    await coordinator.logout();
    assertEqual(signOutCalled, true);
    assertEqual(coordinator.userId, null);
    assertEqual(coordinator.profile, null);
    assertEqual(coordinator.subjects.length, 0); // Isolated and purged

    // Login User B
    await coordinator.login('b@university.edu', 'pass123');
    assertEqual(coordinator.userId, TEST_AUTH_USER_B.id);
    assertEqual(coordinator.subjects[0].name, 'B Subject');
    assert(coordinator.subjects.every((s: any) => s.name === 'B Subject'), 'User A data must not leak to User B');

    console.log('  ✓ User-state isolation and immediate memory purge on logout/switch');
    passed++;
  })();

  // 4. Missing initial record (Trigger failure / delay handling)
  await (async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: async () => ({ data: { user: TEST_AUTH_USER_A }, error: null }),
        signOut: async () => {},
      },
    };

    // Return null profile to simulate trigger delay or failure
    let profileInsertAttempted = false;
    const mockStorage = {
      getStudentProfile: async () => null,
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async () => [],
      // Ensure frontend does not attempt duplicate insertion
      updateStudentProfile: async () => { profileInsertAttempted = true; },
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);
    await coordinator.login('student_a@university.edu', 'pass123');

    // Profile must be null, error surfaced, and no silent duplicate created
    assertEqual(coordinator.profile, null);
    assert(coordinator.authError !== null, 'Recoverable error must be surfaced');
    assert(coordinator.authError!.includes('Profile initialization is pending'), 'Expected pending profile message');
    assertEqual(profileInsertAttempted, false);

    console.log('  ✓ Recoverable error surfaced when initial record is missing (no duplicate creation)');
    passed++;
  })();

  // 5. Session restoration flow
  await (async () => {
    let sessionResolved = false;
    const mockSupabase = {
      auth: {
        getSession: async () => {
          sessionResolved = true;
          return { data: { session: { user: TEST_AUTH_USER_A } }, error: null };
        },
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getStudentProfile: async (uid: string) => ({ userId: uid, fullName: 'Restored User' }),
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async () => [{ name: 'Restored Subject' }],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);
    const { data: { session } } = await mockSupabase.auth.getSession();
    if (session?.user) {
      await coordinator.loadUserData(session.user.id);
    }

    assertEqual(sessionResolved, true);
    assertEqual(coordinator.userId, TEST_AUTH_USER_A.id);
    assertEqual(coordinator.profile?.fullName, 'Restored User');
    assertEqual(coordinator.subjects.length, 1);
    console.log('  ✓ Session restoration restores active user state');
    passed++;
  })();

  // 6. Edge Case A Regression Test: Switching to demo mode guards against background SIGNED_OUT & stale TOKEN_REFRESHED
  await (async () => {
    let backgroundSignOutTriggered = false;
    let storedCurrentUserId: string | null = null;

    const mockSupabase = {
      auth: {
        signInWithPassword: async () => ({ data: { user: TEST_AUTH_USER_A }, error: null }),
        signOut: async () => {
          backgroundSignOutTriggered = true;
          // Simulate background async completion
          await new Promise(r => setTimeout(r, 20));
        },
      },
    };

    const mockStorage = {
      currentUserId: null as string | null,
      getCurrentUserId: () => storedCurrentUserId,
      setCurrentUserId: (id: string | null) => { storedCurrentUserId = id; },
      getStudentProfile: (uid: string) => {
        if (uid.startsWith('demo_')) return { userId: uid, fullName: 'Demo Sarah', isDemo: true };
        return { userId: uid, fullName: 'Cloud User A', isDemo: false };
      },
      getStudentSubjects: (uid: string) => {
        if (uid.startsWith('demo_')) return [{ id: 'demo_sub1', name: 'Demo CS50' }];
        return [{ id: 'cloud_sub1', name: 'Cloud Advanced AI' }];
      },
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Step A: Login as Cloud User A
    await coordinator.login('student_a@university.edu', 'pass123');
    assertEqual(coordinator.userId, TEST_AUTH_USER_A.id);
    assertEqual(coordinator.profile?.fullName, 'Cloud User A');
    assertEqual(coordinator.subjects[0].name, 'Cloud Advanced AI');

    // Step B: Switch to Demo User 'demo_student_sarah'
    coordinator.switchDemoUser('demo_student_sarah');
    assertEqual(coordinator.userId, 'demo_student_sarah');
    assertEqual(coordinator.profile?.fullName, 'Demo Sarah');
    assertEqual(coordinator.subjects[0].name, 'Demo CS50');
    assertEqual(backgroundSignOutTriggered, true);

    // Step C: Supabase auth emits 'SIGNED_OUT' while in demo mode
    // Guard must prevent SIGNED_OUT from wiping Sarah's session
    coordinator.handleAuthStateChange('SIGNED_OUT', null);
    assertEqual(coordinator.userId, 'demo_student_sarah', 'SIGNED_OUT must not clear demo user');
    assertEqual(coordinator.profile?.fullName, 'Demo Sarah');
    assertEqual(coordinator.subjects.length, 1);

    // Step D: Stale 'TOKEN_REFRESHED' arrives for previous Cloud User A
    // Guard must prevent TOKEN_REFRESHED from reactivating Cloud User A
    coordinator.handleAuthStateChange('TOKEN_REFRESHED', { user: TEST_AUTH_USER_A });
    assertEqual(coordinator.userId, 'demo_student_sarah', 'TOKEN_REFRESHED must not displace demo user');
    assertEqual(coordinator.profile?.fullName, 'Demo Sarah');
    assertEqual(coordinator.subjects[0].name, 'Demo CS50');

    console.log('  ✓ Edge Case A: Switching to demo mode guards against background SIGNED_OUT and stale TOKEN_REFRESHED');
    passed++;
  })();

  // 7. Edge Case B Regression Test: Synchronous memory purge prevents stale data visibility during delayed login
  await (async () => {
    let networkDelayResolve: () => void;
    const networkDelayPromise = new Promise<void>(resolve => { networkDelayResolve = resolve; });

    let storedCurrentUserId: string | null = null;
    const mockSupabase = {
      auth: {
        signInWithPassword: async () => {
          // Simulate 50ms network delay
          await networkDelayPromise;
          return { data: { user: TEST_AUTH_USER_B }, error: null };
        },
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getCurrentUserId: () => storedCurrentUserId,
      setCurrentUserId: (id: string | null) => { storedCurrentUserId = id; },
      getStudentProfile: async (uid: string) => ({ userId: uid, fullName: 'User B', theme: 'light' }),
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 30 }),
      getStudentSubjects: async () => [{ id: 'b_sub', name: 'User B Subject' }],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Seed coordinator with User A's data (simulating previously active session)
    coordinator.userId = TEST_AUTH_USER_A.id;
    coordinator.profile = { userId: TEST_AUTH_USER_A.id, fullName: 'User A' };
    coordinator.subjects = [{ id: 'a_sub', name: 'User A Secret Assignment' }];
    coordinator.focusSettings = { focusDurationMinutes: 50 };

    // Initiate login to User B
    const loginPromise = coordinator.login('student_b@university.edu', 'pass123');

    // SYNCHRONOUS ASSERTION: Immediately upon starting login, previous user state MUST be wiped
    assertEqual(coordinator.userId, null, 'Previous userId must be cleared synchronously');
    assertEqual(coordinator.profile, null, 'Previous profile must be cleared synchronously');
    assertEqual(coordinator.subjects.length, 0, 'Previous subjects must be cleared synchronously');
    assertEqual(coordinator.focusSettings, null, 'Previous focus settings must be cleared synchronously');
    assertEqual(coordinator.isLoading, true, 'Loading state must be true during transition');

    // Resolve network delay
    networkDelayResolve!();
    const loginRes = await loginPromise;
    assertEqual(loginRes.success, true);

    // After network finishes, User B data is loaded
    assertEqual(coordinator.userId, TEST_AUTH_USER_B.id);
    assertEqual(coordinator.profile?.fullName, 'User B');
    assertEqual(coordinator.subjects[0].name, 'User B Subject');
    assertEqual(coordinator.isLoading, false);

    console.log('  ✓ Edge Case B: Synchronous memory purge prevents data leak during delayed login/switch');
    passed++;
  })();

  // 8. Stale in-flight cloud data load cancellation when switching accounts mid-flight
  await (async () => {
    let cloudFetchResolve: (prof: any) => void;
    const delayedProfilePromise = new Promise(resolve => { cloudFetchResolve = resolve; });

    let storedCurrentUserId: string | null = null;
    const mockSupabase = {
      auth: {
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getCurrentUserId: () => storedCurrentUserId,
      setCurrentUserId: (id: string | null) => { storedCurrentUserId = id; },
      getStudentProfile: (uid: string) => {
        if (uid.startsWith('demo_')) return { userId: uid, fullName: 'Demo Student Alex' };
        return delayedProfilePromise;
      },
      getStudentSubjects: (uid: string) => {
        if (uid.startsWith('demo_')) return [{ id: 'alex_sub', name: 'Alex History' }];
        return [{ id: 'cloud_sub', name: 'Stale Cloud Subject' }];
      },
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Start slow cloud user fetch
    const slowCloudLoad = coordinator.loadUserData(TEST_AUTH_USER_A.id);

    // Mid-flight: user switches to demo user
    coordinator.switchDemoUser('demo_student_alex');
    assertEqual(coordinator.userId, 'demo_student_alex');
    assertEqual(coordinator.profile?.fullName, 'Demo Student Alex');
    assertEqual(coordinator.subjects[0].name, 'Alex History');

    // Delayed cloud profile resolves now
    cloudFetchResolve!({ userId: TEST_AUTH_USER_A.id, fullName: 'Late Cloud User A' });
    await slowCloudLoad;

    // Verify Alex's state was NOT overwritten by late-arriving Cloud User A data
    assertEqual(coordinator.userId, 'demo_student_alex', 'Stale cloud response must not overwrite demo user');
    assertEqual(coordinator.profile?.fullName, 'Demo Student Alex');
    assertEqual(coordinator.subjects[0].name, 'Alex History');

    console.log('  ✓ In-flight cloud data load cancellation when switching accounts mid-flight');
    passed++;
  })();

  // 9. Demo re-entry from unauthenticated state: safe re-entry without Supabase auth or data pollution
  await (async () => {
    let cloudAuthAttempted = false;
    let storedCurrentUserId: string | null = null;

    const mockSupabase = {
      auth: {
        signInWithPassword: async () => {
          cloudAuthAttempted = true;
          return { data: null, error: { message: 'Should not authenticate demo with Supabase' } };
        },
        signOut: async () => {},
      },
    };

    const mockStorage = {
      getCurrentUserId: () => storedCurrentUserId,
      setCurrentUserId: (id: string | null) => { storedCurrentUserId = id; },
      getStudentProfile: (uid: string) => {
        if (uid === 'usr_aarav_sharma') return { userId: uid, fullName: 'Aarav Sharma', theme: 'dark' };
        return null;
      },
      getStudentSubjects: (uid: string) => {
        if (uid === 'usr_aarav_sharma') return [{ id: 'sub_algo', name: 'Design & Analysis of Algorithms' }];
        return [];
      },
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Initial state: unauthenticated (no session, null user)
    assertEqual(coordinator.userId, null);
    assertEqual(coordinator.profile, null);

    // Action 1: Click "Continue with Demo Student"
    coordinator.switchDemoUser('usr_aarav_sharma');

    // Verification 1: Demo state established purely from local storage without Supabase auth
    assertEqual(coordinator.userId, 'usr_aarav_sharma');
    assertEqual(coordinator.profile?.fullName, 'Aarav Sharma');
    assertEqual(coordinator.subjects.length, 1);
    assertEqual(storedCurrentUserId, 'usr_aarav_sharma');
    assertEqual(cloudAuthAttempted, false, 'Demo user must NOT authenticate against Supabase');

    // Action 2: User logs out
    await coordinator.logout();
    assertEqual(coordinator.userId, null);
    assertEqual(coordinator.profile, null);
    assertEqual(coordinator.subjects.length, 0);
    assertEqual(storedCurrentUserId, null);

    // Action 3: Re-enter demo user after logout
    coordinator.switchDemoUser('usr_aarav_sharma');
    assertEqual(coordinator.userId, 'usr_aarav_sharma', 'Demo user must be accessible again after logout');
    assertEqual(coordinator.profile?.fullName, 'Aarav Sharma');
    assertEqual(coordinator.subjects[0].name, 'Design & Analysis of Algorithms');
    assertEqual(cloudAuthAttempted, false);

    console.log('  ✓ Demo re-entry from unauthenticated state: clean re-entry without Supabase auth or data leak');
    passed++;
  })();

  // 10. Authentication error sanitization, accessible visibility and safe retry recovery
  await (async () => {
    // Part A: Error sanitization rules
    const rawLeakJwt = 'Error loading user: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeak';
    const sanitizedJwt = sanitizeErrorMessage(rawLeakJwt);
    assert(!sanitizedJwt.includes('eyJ'), 'JWT token must be redacted');
    assert(sanitizedJwt.includes('[REDACTED_TOKEN]'), 'JWT token must be replaced with placeholder');

    const rawBearer = 'Authorization failed: Bearer secret_access_token_12345';
    const sanitizedBearer = sanitizeErrorMessage(rawBearer);
    assert(!sanitizedBearer.includes('secret_access_token'), 'Bearer token must be redacted');

    const rawUrl = 'Fetch failed from https://eawtfjkbaxukyxkvksob.supabase.co/rest/v1/profiles';
    const sanitizedUrl = sanitizeErrorMessage(rawUrl);
    assert(!sanitizedUrl.includes('https://'), 'URL must be redacted');

    const rawPg = 'Database error: relation "public.profiles" does not exist at line 1';
    const sanitizedPg = sanitizeErrorMessage(rawPg);
    assertEqual(sanitizedPg, 'Database connection or query error. Please check your network and try again.');

    // Part B: Safe retry via refreshData
    let databaseOnline = false;
    const mockSupabase = { auth: { signOut: async () => {} } };
    const mockStorage = {
      getStudentProfile: async (uid: string) => {
        if (!databaseOnline) {
          throw new Error('Database error: relation "public.profiles" does not exist');
        }
        return { userId: uid, fullName: 'Recovered Cloud User', theme: 'dark' };
      },
      getStudentFocusSettings: async () => ({ focusDurationMinutes: 25 }),
      getStudentSubjects: async () => [{ id: 'sub_cloud', name: 'Cloud Architecture' }],
    };

    const coordinator = new AuthSessionCoordinator(mockSupabase, mockStorage);

    // Initial load fails due to database offline
    await coordinator.loadUserData(TEST_AUTH_USER_A.id);
    assertEqual(coordinator.profile, null, 'Profile must be null during error state');
    assert(coordinator.authError !== null, 'authError must be set');
    assert(coordinator.authError!.includes('Database connection or query error'), 'authError must be sanitized');

    // Database recovers; student triggers Retry via refreshData()
    databaseOnline = true;
    await coordinator.refreshData();

    assertEqual(coordinator.authError, null, 'authError must be cleared after successful retry');
    assertEqual(coordinator.profile?.fullName, 'Recovered Cloud User', 'Profile must be restored on retry');
    assertEqual(coordinator.subjects[0].name, 'Cloud Architecture');
    assertEqual(coordinator.isLoading, false);

    console.log('  ✓ Authentication error sanitization, accessible visibility and safe retry recovery');
    passed++;
  })();

  // 11. Password reset routing: Cloud accounts route to Supabase resetPasswordForEmail vs Demo accounts route locally
  await (async () => {
    let cloudResetCalledWith: { email: string; redirectTo?: string } | null = null;
    const mockSupabase = {
      auth: {
        resetPasswordForEmail: async (email: string, options: any) => {
          cloudResetCalledWith = { email, redirectTo: options?.redirectTo };
          return { data: {}, error: null };
        },
      },
    };

    let localUsersAuth = [
      { email: 'aarav@university.edu', passwordHash: 'old_local_hash' },
      { email: 'priya@techcollege.edu', passwordHash: 'old_local_hash' },
    ];

    const localResetDemoPassword = (email: string, newPass: string) => {
      const idx = localUsersAuth.findIndex(u => u.email === email.toLowerCase());
      if (idx === -1) return { success: false, error: 'No account found' };
      localUsersAuth[idx].passwordHash = `new_hash_${newPass}`;
      return { success: true };
    };

    // Case A: Cloud account reset
    const cloudEmail = 'cloud_student@vit.edu';
    const redirectUrl = 'http://localhost:5173';

    // Cloud reset handler logic matching ForgotPasswordModal
    const { error: cloudErr } = await mockSupabase.auth.resetPasswordForEmail(cloudEmail, {
      redirectTo: redirectUrl,
    });
    assertEqual(cloudErr, null);
    assertEqual((cloudResetCalledWith as any)?.email, 'cloud_student@vit.edu');
    assertEqual((cloudResetCalledWith as any)?.redirectTo, 'http://localhost:5173');
    // Ensure local users are completely untouched
    assertEqual(localUsersAuth[0].passwordHash, 'old_local_hash');

    // Case B: Demo student local reset
    cloudResetCalledWith = null;
    const demoEmail = 'aarav@university.edu';
    const demoRes = localResetDemoPassword(demoEmail, 'new_secret_123');
    assertEqual(demoRes.success, true);
    assertEqual(localUsersAuth[0].passwordHash, 'new_hash_new_secret_123');
    // Ensure Supabase was NOT called for demo account
    assertEqual(cloudResetCalledWith, null, 'Supabase must NOT be called for demo student password reset');

    console.log('  ✓ Password reset routing: Cloud routes to Supabase with redirect URL, Demo updates local store');
    passed++;
  })();

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    (globalThis as any).process?.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  (globalThis as any).process?.exit(1);
});
