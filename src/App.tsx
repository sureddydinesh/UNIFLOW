import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
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

export const AppContent: React.FC = () => {
  const { userId, profile, isLoading } = useApp();

  const [publicRoute, setPublicRoute] = useState<'landing' | 'login' | 'register'>('landing');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

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


  // Unauthenticated Public Pages
  if (!userId) {
    if (publicRoute === 'login') {
      return (
        <LoginPage
          onGoToRegister={() => setPublicRoute('register')}
          onGoToLanding={() => setPublicRoute('landing')}
        />
      );
    }
    if (publicRoute === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setPublicRoute('login')}
          onGoToLanding={() => setPublicRoute('landing')}
        />
      );
    }
    return (
      <LandingPage
        onGoToLogin={() => setPublicRoute('login')}
        onGoToRegister={() => setPublicRoute('register')}
      />
    );
  }

  // Authenticated Student App Pages
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
};

export default function App() {
  return <AppContent />;
}
