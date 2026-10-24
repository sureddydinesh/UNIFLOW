import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight 
} from 'lucide-react';
import { ThemeToggle } from '../layout/ThemeToggle';
import { motion } from 'motion/react';
import { EASE_PREMIUM } from '../../utils/motion';
import { UniFlowLogo } from '../brand/UniFlowLogo';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onGoToLanding: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onGoToLogin,
  onGoToLanding,
  onRegisterSuccess,
}) => {
  const { register } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid university email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      setError('Please acknowledge the terms and student privacy policy.');
      return;
    }

    const res = await register(fullName, email, password);
    if (!res.success) {
      setError(res.error || 'Registration failed. An account may already exist with this email.');
    } else if (res.needsEmailConfirmation) {
      setInfoMessage(res.message || 'Account created! Please check your email to confirm your account before logging in.');
    } else {
      onRegisterSuccess?.();
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-center items-center p-4 selection:bg-primary/30">
      {/* Top Bar with back to home & theme toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md flex items-center justify-between mb-6 px-2"
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
        className="w-full max-w-md bg-card border border-border-subtle rounded-3xl shadow-2xl p-8 sm:p-10"
      >
        <UniFlowLogo variant="full" size="sm" className="mb-4" />

        <h2 className="text-2xl font-bold font-heading text-text-main">
          Create Student Account
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Join UniFlow to streamline your academic life and personal budgeting.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 text-xs bg-status-error/15 border border-status-error/40 text-status-error rounded-xl flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        {infoMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 text-xs bg-emerald-custom/15 border border-emerald-custom/40 text-emerald-custom rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{infoMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              University Email Address *
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
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Password (min 6 chars) *
            </label>
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

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
            />
            <label htmlFor="terms" className="text-[11px] text-text-muted leading-relaxed cursor-pointer">
              I agree to the Terms of Service and acknowledge that my academic and financial records remain isolated under my student account (AUTH-08).
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.975 }}
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-xs shadow-glow-primary transition-colors flex items-center justify-center gap-1.5"
          >
            Create Account & Continue <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Already have an account?{' '}
          <button
            onClick={onGoToLogin}
            className="text-primary font-bold hover:underline"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
};
