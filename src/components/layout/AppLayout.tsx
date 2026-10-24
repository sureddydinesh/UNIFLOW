import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  User, 
  LogOut, 
  Plus, 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronDown,
  Timer,
  Flame,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { QuickActionModal } from './QuickActionModal';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_PREMIUM, pageTransitionVariants } from '../../utils/motion';
import { UniFlowLogo } from '../brand/UniFlowLogo';

export type NavTab = 
  | 'dashboard' 
  | 'habits'
  | 'focus'
  | 'academics'
  | 'timetable' 
  | 'assignments' 
  | 'money' 
  | 'profile';

interface AppLayoutProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const { profile, logout, switchDemoUser, authError, refreshData, isLoading } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [demoSwitchOpen, setDemoSwitchOpen] = useState(false);

  // Persistent sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('uniflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('uniflow_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, mobileMenuOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits' as NavTab, label: 'Habit Tracker', icon: Flame },
    { id: 'focus' as NavTab, label: 'Focus & Pomodoro', icon: Timer },
    { id: 'academics' as NavTab, label: 'Academic Progress', icon: GraduationCap },
    { id: 'timetable' as NavTab, label: 'Timetable & Calendar', icon: Calendar },
    { id: 'assignments' as NavTab, label: 'Assignments', icon: CheckSquare },
    { id: 'money' as NavTab, label: 'Money Manager', icon: DollarSign },
    { id: 'profile' as NavTab, label: 'Profile & Settings', icon: User },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Quick Action Modal */}
      <QuickActionModal 
        isOpen={quickActionOpen} 
        onClose={() => setQuickActionOpen(false)} 
      />

      {/* Desktop Collapsible Sidebar (w-64 expanded, w-[72px] collapsed) */}
      <aside 
        className={`hidden md:flex flex-col bg-sidebar border-r border-border-subtle z-20 select-none shadow-[2px_0_20px_-8px_rgba(0,0,0,0.25)] transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`border-b border-border-subtle transition-all duration-300 ${isCollapsed ? 'py-4 px-3 flex flex-col items-center justify-center' : 'px-5 py-4 flex items-center justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <UniFlowLogo 
                  variant="full" 
                  size="sm" 
                  badge="v1.2" 
                  subtitle="Student Life OS" 
                />
              </div>

              {/* Collapse Toggle Button inside header */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-elevated transition-colors"
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Collapsed Brand Icon */
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleSidebar}
              className="p-0 border-0 bg-transparent cursor-pointer"
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <UniFlowLogo variant="icon" size="md" />
            </motion.button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'p-3 flex justify-center' : 'p-3'}`}>
          {!isCollapsed ? (
            <motion.button
              whileTap={{ scale: 0.965 }}
              onClick={() => setQuickActionOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-glow-primary btn-action"
            >
              <Plus className="w-4 h-4" /> Quick Action
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setQuickActionOpen(true)}
              className="w-11 h-11 rounded-xl bg-primary text-white hover:bg-primary-hover flex items-center justify-center shadow-glow-primary btn-action"
              title="Quick Action"
              aria-label="Quick Action"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Navigation Links with animated active pill (layoutId) */}
        <nav className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2 py-3 flex flex-col items-center' : 'px-2.5 py-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center transition-all ${
                  isCollapsed
                    ? 'w-11 h-11 justify-center rounded-xl'
                    : 'w-full gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] nav-item-hover'
                } ${
                  isActive
                    ? isCollapsed
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow-primary'
                      : 'text-primary font-semibold nav-item-active'
                    : 'text-text-muted hover:bg-card hover:text-text-main'
                }`}
              >
                {/* Active Indicator for expanded mode */}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl z-0 pointer-events-none"
                  />
                )}
                <span className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <span className={`rounded-lg transition-all duration-200 nav-icon ${
                    isCollapsed 
                      ? (isActive ? 'text-primary' : 'text-text-muted') 
                      : (isActive ? 'p-1 bg-primary/20 text-primary' : 'p-1 text-text-muted')
                  }`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {!isCollapsed && (
                    <span className={`text-[12.5px] nav-label truncate transition-colors duration-180 ${isActive ? 'text-primary font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Multi-Student Isolation Switcher (Demo / Testing requirement) */}
        <div className={`border-t border-border-subtle bg-elevated/40 relative ${isCollapsed ? 'p-2.5 flex justify-center' : 'p-3'}`}>
          {!isCollapsed ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoSwitchOpen(prev => !prev)}
                title="Test AUTH-08 Data Isolation: Switch between active student accounts"
                className="w-full p-2 rounded-xl bg-card border border-border-subtle hover:border-primary/50 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="w-4 h-4 text-emerald-custom flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider truncate">
                      Isolated Account
                    </p>
                    <p className="text-xs font-semibold text-text-main truncate">
                      {profile?.fullName || 'Student'}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: demoSwitchOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                </motion.div>
              </button>

              <AnimatePresence>
                {demoSwitchOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                    className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-elevated border border-border-subtle rounded-2xl shadow-xl space-y-1 text-xs z-30"
                  >
                    <p className="px-2.5 py-1 text-[10px] text-text-muted uppercase font-bold">
                      Test Student Accounts
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoUser('usr_aarav_sharma');
                        setDemoSwitchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-card flex items-center justify-between text-text-main transition-colors"
                    >
                      <span>Aarav Sharma (CSE)</span>
                      {profile?.userId === 'usr_aarav_sharma' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-custom" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoUser('usr_priya_patel');
                        setDemoSwitchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-card flex items-center justify-between text-text-main transition-colors"
                    >
                      <span>Priya Patel (EE)</span>
                      {profile?.userId === 'usr_priya_patel' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-custom" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Compact Collapsed Switcher Icon */
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoSwitchOpen(prev => !prev)}
                title={`Active Account: ${profile?.fullName || 'Student'}`}
                className="w-11 h-11 rounded-xl bg-card border border-border-subtle hover:border-primary/50 flex items-center justify-center text-emerald-custom transition-all"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {demoSwitchOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 4 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 4 }}
                    transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                    className="absolute bottom-0 left-full ml-3 w-56 p-2 bg-elevated border border-border-subtle rounded-2xl shadow-2xl space-y-1 text-xs z-40"
                  >
                    <p className="px-2.5 py-1 text-[10px] text-text-muted uppercase font-bold">
                      Switch Student
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoUser('usr_aarav_sharma');
                        setDemoSwitchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-card flex items-center justify-between text-text-main transition-colors"
                    >
                      <span className="truncate">Aarav Sharma (CSE)</span>
                      {profile?.userId === 'usr_aarav_sharma' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-custom shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoUser('usr_priya_patel');
                        setDemoSwitchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-card flex items-center justify-between text-text-main transition-colors"
                    >
                      <span className="truncate">Priya Patel (EE)</span>
                      {profile?.userId === 'usr_priya_patel' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-custom shrink-0" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* User Card & Logout */}
        <div className={`border-t border-border-subtle bg-sidebar transition-all duration-300 ${isCollapsed ? 'p-3 flex flex-col items-center gap-2.5' : 'p-3'}`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs overflow-hidden ring-2 ring-border-subtle">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{profile?.fullName?.[0] || 'U'}</span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-custom border-2 border-sidebar" />
                </div>
                <div className="truncate">
                  <p className="text-[12px] font-semibold text-text-main truncate leading-tight">
                    {profile?.fullName || 'Student'}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">
                    {profile?.degree || 'Undergrad'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(248,113,113,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-text-muted hover:text-status-error rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ) : (
            /* Collapsed Profile Avatar & Logout */
            <>
              <button
                type="button"
                onClick={() => onTabChange('profile')}
                title={`Profile: ${profile?.fullName || 'Student'}`}
                className="relative flex-shrink-0 group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs overflow-hidden ring-2 ring-border-subtle group-hover:ring-primary/60 transition-all">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{profile?.fullName?.[0] || 'U'}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-custom border-2 border-sidebar" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-text-muted hover:text-status-error hover:bg-card rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area — expands smoothly when sidebar collapses */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header — glass blur */}
        <header className="h-16 px-4 sm:px-6 header-glass border-b border-border-subtle flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-xl border border-border-subtle"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>

            {/* Desktop Sidebar Collapse/Expand Toggle Button in Header */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border-subtle hover:border-primary/50 text-text-muted hover:text-text-main transition-colors card-hover"
              title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-primary" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-text-muted hover:text-primary" />
              )}
            </motion.button>

            <h1 className="text-base sm:text-lg font-heading font-bold text-text-main capitalize">
              {navItems.find(i => i.id === currentTab)?.label || 'UniFlow'}
            </h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setQuickActionOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-xs font-semibold transition-all btn-action"
            >
              <Plus className="w-3.5 h-3.5" /> Action
            </motion.button>

            <ThemeToggle />

            {/* Student avatar badge */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl bg-elevated border border-border-subtle hover:border-primary/50 text-xs font-semibold text-text-main transition-all btn-action"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.fullName?.[0] || 'S'
                )}
              </div>
              <span className="text-xs font-semibold text-text-main hidden sm:inline max-w-[100px] truncate">
                {profile?.fullName?.split(' ')[0] || 'Student'}
              </span>
            </motion.button>
          </div>
        </header>

        {/* Mobile Navigation Drawer with Backdrop */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Dimmed backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />

              {/* Slide-over Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-sidebar border-r border-border-subtle z-50 p-4 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto"
              >
                <div>
                  {/* Drawer Brand Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                    <UniFlowLogo 
                      variant="full" 
                      size="sm" 
                      subtitle="Student Life OS" 
                    />
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-elevated"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Nav Links */}
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                            isActive
                              ? 'bg-elevated text-primary font-bold border border-primary/30'
                              : 'text-text-muted hover:text-text-main hover:bg-card'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer Account */}
                <div className="pt-4 border-t border-border-subtle flex justify-between items-center px-1">
                  <div className="truncate min-w-0 pr-2">
                    <p className="text-xs font-semibold text-text-main truncate">{profile?.fullName}</p>
                    <p className="text-[10px] text-text-muted truncate">{profile?.degree || 'Undergrad'}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs text-status-error font-medium flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-elevated shrink-0"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scrollable View Content with Page Transition */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {authError && !profile ? (
              /* Failed profile/data loading recovery state — prevents empty dashboard display */
              <div 
                role="alert" 
                aria-live="assertive" 
                className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto"
              >
                <div className="w-14 h-14 rounded-2xl bg-status-error/15 border border-status-error/30 text-status-error flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold font-heading text-text-main">
                  Workspace Synchronization Error
                </h2>
                <p className="text-xs text-text-muted mt-2 mb-6 leading-relaxed">
                  {authError}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => refreshData()}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-glow-primary flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Retrying...' : 'Retry Connection'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-3.5 py-2 rounded-xl bg-elevated border border-border-subtle text-text-muted hover:text-text-main text-xs font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Accessible alert notification banner for recoverable data sync errors */}
                {authError && (
                  <div 
                    role="alert"
                    aria-live="polite"
                    className="mb-6 p-4 rounded-2xl bg-status-error/15 border border-status-error/40 text-text-main flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-status-error/20 text-status-error shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-status-error">
                          Workspace Sync Warning
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {authError}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => refreshData()}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-status-error/20 hover:bg-status-error/30 text-status-error text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Retrying...' : 'Retry Connection'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab}
                    variants={pageTransitionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
