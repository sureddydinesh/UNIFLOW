import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { resetPassword } from '../../services/storage';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertCircle, Mail, KeyRound, Loader2, Sparkles, Cloud } from 'lucide-react';
import { UniFlowLogo } from '../brand/UniFlowLogo';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResetMode = 'cloud' | 'demo';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<ResetMode>('cloud');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    mode: ResetMode;
    title: string;
    message: string;
  } | null>(null);

  const handleClose = () => {
    setError('');
    setSuccessInfo(null);
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
    onClose();
  };

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please provide a valid student email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Direct cloud password reset to Supabase Auth with redirect URL
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message || 'Unable to request password reset. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessInfo({
        mode: 'cloud',
        title: 'Reset Link Dispatched',
        message: `Password reset instructions have been sent to ${normalizedEmail}. Check your inbox and follow the link to securely set a new password.`,
      });
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while connecting to authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please provide a valid demo student email address.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    const res = resetPassword(normalizedEmail, newPassword);
    if (!res.success) {
      setError(res.error || 'Demo password reset failed.');
    } else {
      setSuccessInfo({
        mode: 'demo',
        title: 'Demo Password Updated (Local)',
        message: `The offline demo credentials for ${normalizedEmail} have been updated in local storage. You can now log in locally with your new password.`,
      });
    }
  };

  const isDemoEmail = email.trim().toLowerCase().includes('aarav') || email.trim().toLowerCase().includes('priya');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Account Password" maxWidth="max-w-md">
      {successInfo ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-custom/20 text-emerald-custom flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text-main">
            {successInfo.title}
          </h3>
          <p className="text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
            {successInfo.message}
          </p>
          {successInfo.mode === 'demo' && (
            <p className="text-[11px] text-amber-500/90 font-medium">
              Note: This change applies exclusively to local demo storage.
            </p>
          )}
          <div className="pt-2">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-glow-primary hover:bg-primary-hover transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <UniFlowLogo variant="full" size="xs" subtitle="Student Identity Recovery" />
          </div>

          {/* Account Mode Segmented Control */}
          <div className="flex p-1 rounded-xl bg-elevated border border-border-subtle text-xs font-medium">
            <button
              type="button"
              onClick={() => { setMode('cloud'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'cloud' 
                  ? 'bg-card text-text-main shadow-sm font-semibold border border-border-subtle' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-primary" />
              <span>Cloud Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('demo'); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'demo' 
                  ? 'bg-card text-text-main shadow-sm font-semibold border border-border-subtle' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Demo Student</span>
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs bg-status-error/15 border border-status-error/40 text-status-error rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'cloud' ? (
            /* Cloud Account Password Reset Flow (via Supabase) */
            <form onSubmit={handleCloudSubmit} className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Enter your registered student email address. We'll dispatch a secure recovery link via Supabase Auth.
              </p>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Registered Cloud Email *
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
                {isDemoEmail && (
                  <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Notice: This email matches a demo student. Switch to the <strong>Demo Student</strong> tab to reset local demo credentials.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:bg-elevated rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-xl shadow-glow-primary hover:bg-primary-hover flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Demo Student Offline Password Reset Flow (Local Storage Only) */
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Reset offline credentials for pre-seeded demo accounts. This directly updates local browser storage without contacting Supabase.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-muted uppercase">
                    Demo Student Email *
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEmail('aarav@university.edu')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Aarav
                    </button>
                    <span className="text-[10px] text-text-muted">•</span>
                    <button
                      type="button"
                      onClick={() => setEmail('priya@techcollege.edu')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Priya
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@university.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  New Local Password (min 6 characters) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-text-muted hover:bg-elevated rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-xl shadow-glow-primary hover:bg-primary-hover transition-colors"
                >
                  Update Local Password
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
