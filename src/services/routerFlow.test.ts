// Router & Session State Machine Flow Test Suite
// Verifies URL routing, unauthenticated root landing, demo login flow, dashboard route protection, logout transitions, and unknown routes.

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

function normalizePath(rawPath: string): string {
  let path = (rawPath || '/').toLowerCase().trim();
  path = path.replace(/\/+$/, '');
  return path || '/';
}

// Router State Machine Simulator
class MockAppRouterCoordinator {
  public currentPath: string;
  public userId: string | null;
  public isLoading: boolean;
  public history: string[] = [];

  constructor(initialPath: string = '/', initialUserId: string | null = null, isLoading: boolean = false) {
    this.currentPath = normalizePath(initialPath);
    this.userId = initialUserId;
    this.isLoading = isLoading;
    this.history.push(this.currentPath);
  }

  public navigate(to: string, replace = false) {
    const target = normalizePath(to);
    if (replace && this.history.length > 0) {
      this.history[this.history.length - 1] = target;
    } else {
      this.history.push(target);
    }
    this.currentPath = target;
  }

  public checkRouteProtection() {
    if (this.isLoading) return;
    if (this.currentPath === '/dashboard' && !this.userId) {
      this.navigate('/login', true);
    }
  }

  public handleLogout() {
    this.userId = null;
    this.navigate('/', true);
  }

  public handleExploreDemo(demoUserId = 'usr_aarav_sharma') {
    this.userId = demoUserId;
    this.navigate('/dashboard');
  }

  public determineRenderedView(): 'landing' | 'login' | 'signup' | 'dashboard' | 'not_found' | 'loading' {
    if (this.isLoading) return 'loading';
    if (this.currentPath === '/') return 'landing';
    if (this.currentPath === '/login') {
      if (this.userId) return 'dashboard';
      return 'login';
    }
    if (this.currentPath === '/signup' || this.currentPath === '/register') {
      if (this.userId) return 'dashboard';
      return 'signup';
    }
    if (this.currentPath === '/dashboard') {
      if (!this.userId) {
        return 'login'; // After redirect
      }
      return 'dashboard';
    }
    return 'not_found';
  }
}

console.log('--- Running UniFlow Router Flow & Route Protection Test Suite ---');

// 1. Initial load on fresh visit at '/'
runTest('Fresh visitor at root route / renders LandingPage without auto-login', () => {
  const router = new MockAppRouterCoordinator('/', null, false);
  assertEqual(router.userId, null, 'User must be unauthenticated on fresh load');
  assertEqual(router.currentPath, '/');
  assertEqual(router.determineRenderedView(), 'landing');
});

// 2. Refreshing '/' stays on LandingPage
runTest('Refreshing / continues to display LandingPage', () => {
  const router = new MockAppRouterCoordinator('/', null, false);
  assertEqual(router.determineRenderedView(), 'landing');
  // Simulate refresh
  const refreshedRouter = new MockAppRouterCoordinator('/', null, false);
  assertEqual(refreshedRouter.determineRenderedView(), 'landing');
});

// 3. Navigate to /login
runTest('Clicking Sign In navigates to /login and renders LoginPage', () => {
  const router = new MockAppRouterCoordinator('/', null, false);
  router.navigate('/login');
  assertEqual(router.currentPath, '/login');
  assertEqual(router.determineRenderedView(), 'login');
});

// 4. Navigate to /signup
runTest('Clicking Sign Up navigates to /signup and renders RegisterPage', () => {
  const router = new MockAppRouterCoordinator('/', null, false);
  router.navigate('/signup');
  assertEqual(router.currentPath, '/signup');
  assertEqual(router.determineRenderedView(), 'signup');
});

// 5. Try Demo or Demo Login explicitly starts demo flow
runTest('Clicking Explore Demo explicitly initiates demo mode and navigates to /dashboard', () => {
  const router = new MockAppRouterCoordinator('/', null, false);
  router.handleExploreDemo('usr_aarav_sharma');
  assertEqual(router.userId, 'usr_aarav_sharma');
  assertEqual(router.currentPath, '/dashboard');
  assertEqual(router.determineRenderedView(), 'dashboard');
});

// 6. Valid authenticated user can access /dashboard
runTest('Valid authenticated user directly accessing /dashboard renders dashboard', () => {
  const router = new MockAppRouterCoordinator('/dashboard', 'usr_aarav_sharma', false);
  router.checkRouteProtection();
  assertEqual(router.currentPath, '/dashboard');
  assertEqual(router.determineRenderedView(), 'dashboard');
});

// 7. Unauthenticated visitor cannot bypass dashboard protection
runTest('Unauthenticated visitor entering /dashboard is redirected to /login', () => {
  const router = new MockAppRouterCoordinator('/dashboard', null, false);
  router.checkRouteProtection();
  assertEqual(router.currentPath, '/login', 'Must redirect unauthenticated visitor from /dashboard to /login');
  assertEqual(router.determineRenderedView(), 'login');
});

// 8. Logout returns user to sensible public route (/)
runTest('Logout clears session and returns user to root landing route /', () => {
  const router = new MockAppRouterCoordinator('/dashboard', 'usr_aarav_sharma', false);
  assertEqual(router.determineRenderedView(), 'dashboard');
  router.handleLogout();
  assertEqual(router.userId, null);
  assertEqual(router.currentPath, '/');
  assertEqual(router.determineRenderedView(), 'landing');
});

// 9. Unknown routes render 404 Not Found Page
runTest('Unknown or mistyped routes render NotFoundPage', () => {
  const router = new MockAppRouterCoordinator('/random-invalid-page', null, false);
  assertEqual(router.determineRenderedView(), 'not_found');
});

// 10. Trailing slashes and case normalization
runTest('Path normalization correctly handles trailing slashes and casing', () => {
  assertEqual(normalizePath('/LOGIN/'), '/login');
  assertEqual(normalizePath('/Dashboard'), '/dashboard');
  assertEqual(normalizePath('/'), '/');
  assertEqual(normalizePath('///'), '/');
});

setTimeout(() => {
  console.log(`\nRouter Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    (globalThis as any).process?.exit(1);
  }
}, 200);
