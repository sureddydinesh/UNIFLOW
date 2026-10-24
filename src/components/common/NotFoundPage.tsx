import React from 'react';
import { motion } from 'motion/react';
import { Home, LogIn, ArrowLeft } from 'lucide-react';
import { UniFlowLogo } from '../brand/UniFlowLogo';
import { ThemeToggle } from '../layout/ThemeToggle';

interface NotFoundPageProps {
  onGoHome: () => void;
  onGoToLogin: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onGoHome,
  onGoToLogin,
}) => {
  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-center items-center p-6 selection:bg-primary/30 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(99,102,241,0.15),transparent_80%)]" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Top bar with theme toggle */}
      <div className="w-full max-w-xl flex items-center justify-between mb-8">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to UniFlow Home</span>
        </button>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse" />
            <UniFlowLogo variant="icon" size="xl" className="relative shadow-glow-primary" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-primary/15 text-primary border border-primary/25 mb-4">
          404 ERROR
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-main tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm text-text-muted leading-relaxed mb-8">
          The requested page route doesn't exist or has moved. Explore the landing page or log into your university workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-fg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-glow-primary"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToLogin}
            className="flex-1 py-3 px-4 rounded-xl bg-elevated hover:bg-card border border-border-subtle hover:border-primary/40 text-text-main font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
