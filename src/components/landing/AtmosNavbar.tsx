import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UniFlowLogo } from '../brand/UniFlowLogo';
import { ThemeToggle } from '../layout/ThemeToggle';

interface AtmosNavbarProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onExploreDemo: () => void;
  onScrollToSection: (id: string) => void;
}

export const AtmosNavbar: React.FC<AtmosNavbarProps> = ({
  onGoToLogin,
  onGoToRegister,
  onExploreDemo,
  onScrollToSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'Features', id: 'showcase' },
    { label: 'Deep Dive', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Benefits', id: 'benefits' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-atmos-navy/80 dark:bg-atmos-navy/85 backdrop-blur-xl border-b border-white/10 shadow-atmos-card'
            : 'py-5 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand */}
          <UniFlowLogo
            variant="full"
            size="md"
            badge="v1.2"
            subtitle="The Unified Student Operating System"
            onClick={() => onScrollToSection('hero')}
            className="cursor-pointer"
          />

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] dark:bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs font-medium text-atmos-muted"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onScrollToSection(link.id)}
                className="px-3 py-1.5 rounded-full text-atmos-muted hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:ring-1 focus-visible:ring-atmos-purple outline-none"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Instant Demo Sandbox */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onExploreDemo}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-atmos-cyan bg-atmos-cyan/10 hover:bg-atmos-cyan/20 border border-atmos-cyan/25 transition-all"
              title="Instant demo student with sample data"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Demo</span>
            </motion.button>

            {/* Sign In */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoToLogin}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-main bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-atmos-purple/40 transition-all"
            >
              Sign In
            </motion.button>

            {/* Primary Start Journey */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoToRegister}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-atmos-purple to-atmos-periwinkle hover:from-atmos-purple hover:to-atmos-cyan shadow-atmos-glow active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-text-main hover:bg-white/[0.1]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] z-40 lg:hidden p-5 bg-atmos-navy/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl space-y-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onScrollToSection(link.id);
                  }}
                  className="text-left py-2.5 px-3 rounded-xl text-sm font-medium text-atmos-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToLogin();
                  }}
                  className="flex-1 py-2.5 text-center text-xs font-semibold rounded-xl bg-white/[0.06] text-white border border-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToRegister();
                  }}
                  className="flex-1 py-2.5 text-center text-xs font-semibold rounded-xl bg-gradient-to-r from-atmos-purple to-atmos-periwinkle text-white font-bold shadow-atmos-glow"
                >
                  Start Journey
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreDemo();
                }}
                className="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-atmos-cyan/15 text-atmos-cyan border border-atmos-cyan/30 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Demo Student (Aarav Sharma)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
