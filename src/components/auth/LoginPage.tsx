import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '../layout/ThemeToggle';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { motion } from 'motion/react';
import { EASE_PREMIUM } from '../../utils/motion';
import { UniFlowLogo } from '../brand/UniFlowLogo';

interface LoginPageProps {
  onGoToRegister: () => void;
  onGoToLanding: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoToRegister,
  onGoToLanding,
  onLoginSuccess,
}) => {
  const { login, switchDemoUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      onLoginSuccess?.();
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-center items-center p-4 selection:bg-primary/30">
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />

      {/* Top Bar with back to home & theme toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl flex items-center justify-between mb-6 px-2"
      >
        <button
          onClick={onGoToLanding}
          className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          ← Back to Overview
        </button>
        <ThemeToggle />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_PREMIUM }}
        className="w-full max-w-4xl bg-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
      >
        
        {/* Left Form Column */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <UniFlowLogo variant="full" size="sm" className="mb-4" />

            <h2 className="text-2xl font-bold font-heading text-text-main">
              Student Sign In
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Access your personal schedule, deadlines, and finances.
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 text-xs bg-status-error/15 border border-status-error/40 text-status-error rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-muted uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-xs shadow-glow-primary transition-colors flex items-center justify-center gap-1.5"
              >
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-card px-2 text-text-muted">Or Instant Access</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                type="button"
                onClick={() => {
                  switchDemoUser('usr_aarav_sharma');
                  onLoginSuccess?.();
                }}
                className="w-full py-2.5 rounded-xl bg-elevated border border-border-subtle hover:border-primary/50 text-text-main font-semibold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-card shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Continue with Demo Student</span>
              </motion.button>
            </form>
          </div>

          {/* Account Registration Link */}
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <p className="text-center text-xs text-text-muted">
              Don't have an account?{' '}
              <button
                onClick={onGoToRegister}
                className="text-primary font-bold hover:underline"
              >
                Register now
              </button>
            </p>
          </div>

        </div>

        {/* Right Brand Panel (Theme B Highlight) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-elevated via-card to-card border-l border-border-subtle relative overflow-hidden ambient-banner-gradient light-sweep-effect">
          <div className="space-y-4 relative z-10">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/20 text-primary uppercase tracking-wider">
              Theme B • Midnight Intelligence
            </span>
            <h3 className="text-3xl font-extrabold font-heading text-text-main leading-tight">
              One Unified Workspace for University Life.
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              No more jumping between calendar apps, expense spreadsheets, and fragmented to-do notes. UniFlow brings everything together under your verified student identity.
            </p>
          </div>

          <div className="space-y-3 relative z-10 pt-8">
            <div className="p-3.5 rounded-2xl bg-canvas/70 border border-border-subtle backdrop-blur-sm flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-custom flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-text-main">Strict Per-Student Data Isolation</p>
                <p className="text-text-muted text-[11px]">Private academic records & finances</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-canvas/70 border border-border-subtle backdrop-blur-sm flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-text-main">Autonomous Cross-Module Sync</p>
                <p className="text-text-muted text-[11px]">Deadlines sync with timetable & dashboard</p>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
