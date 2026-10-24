import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { NotFoundPage } from './components/common/NotFoundPage';
import { AppLayout, NavTab } from './components/layout/AppLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { HabitsView } from './components/habits/HabitsView';
import { FocusView } from './components/focus/FocusView';
import { AcademicsView } from './components/academics/AcademicsView';
import { MoneyManagerView } from './components/money/MoneyManagerView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { UniFlowLogo } from './components/brand/UniFlowLogo';

function normalizePath(rawPath: string): string {
  let path = (rawPath || '/').toLowerCase().trim();
  path = path.replace(/\/+$/, '');
  return path || '/';
}

export const AppContent: React.FC = () => {
  const { userId, profile, isLoading } = useApp();

  const [currentPath, setCurrentPath] = useState<string>(() => normalizePath(window.location.pathname));
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const prevUserIdRef = useRef<string | null>(userId);

  const navigate = useCallback((to: string, replace = false) => {
    const target = normalizePath(to);
    if (replace) {
      window.history.replaceState({}, '', target);
    } else {
      window.history.pushState({}, '', target);
    }
    setCurrentPath(target);
  }, []);

  // Sync browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize route protection and session transitions
  useEffect(() => {
    if (isLoading) return;

    // 1. User explicitly logged out (had active userId, now null) -> return to public root '/'
    if (prevUserIdRef.current && !userId) {
      prevUserIdRef.current = null;
      navigate('/', true);
      return;
    }
    prevUserIdRef.current = userId;

    // 2. Unauthenticated visitor trying to access protected /dashboard -> redirect to '/login'
    if (currentPath === '/dashboard' && !userId) {
      navigate('/login', true);
    }
  }, [isLoading, currentPath, userId, navigate]);

  // Loading Screen (prevents flash of login or landing while restoring session)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          {/* Animated logo with glow pulse */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse" />
            <UniFlowLogo variant="icon" size="xl" className="relative shadow-glow-primary" />
          </div>
          <div className="text-center">
            <p className="font-heading font-extrabold text-base text-text-main tracking-tight">UniFlow</p>
            <p className="text-xs text-text-muted mt-0.5">Loading your workspace...</p>
          </div>
          {/* Three dot pulse */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 1. Root route: Public Landing Page
  if (currentPath === '/') {
    return (
      <LandingPage
        onGoToLogin={() => {
          if (userId) {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        }}
        onGoToRegister={() => {
          if (userId) {
            navigate('/dashboard');
          } else {
            navigate('/signup');
          }
        }}
        onExploreDemo={() => {
          navigate('/dashboard');
        }}
      />
    );
  }

  // 2. Login route
  if (currentPath === '/login') {
    if (userId) {
      navigate('/dashboard', true);
      return null;
    }
    return (
      <LoginPage
        onGoToRegister={() => navigate('/signup')}
        onGoToLanding={() => navigate('/')}
        onLoginSuccess={() => navigate('/dashboard')}
      />
    );
  }

  // 3. Signup / Register routes
  if (currentPath === '/signup' || currentPath === '/register') {
    if (userId) {
      navigate('/dashboard', true);
      return null;
    }
    return (
      <RegisterPage
        onGoToLogin={() => navigate('/login')}
        onGoToLanding={() => navigate('/')}
        onRegisterSuccess={() => navigate('/dashboard')}
      />
    );
  }

  // 4. Dashboard route (protected)
  if (currentPath === '/dashboard') {
    if (!userId) {
      // Waiting for redirect in useEffect
      return null;
    }

    return (
      <>
        {/* Onboarding Wizard (Triggers for newly registered students if incomplete) */}
        <OnboardingModal isOpen={!!profile && !profile.onboardingCompleted} />

        <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
          {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
          {currentTab === 'habits' && <HabitsView />}
          {currentTab === 'focus' && <FocusView onNavigate={setCurrentTab} />}
          {currentTab === 'academics' && <AcademicsView />}
          {currentTab === 'timetable' && <CalendarView />}
          {currentTab === 'assignments' && <AssignmentsView />}
          {currentTab === 'money' && <MoneyManagerView />}
          {currentTab === 'profile' && <ProfileSettingsView />}
        </AppLayout>
      </>
    );
  }

  // 5. Unknown routes -> 404 Not Found Page
  return (
    <NotFoundPage
      onGoHome={() => navigate('/')}
      onGoToLogin={() => navigate('/login')}
    />
  );
};

export default function App() {
  return <AppContent />;
}
