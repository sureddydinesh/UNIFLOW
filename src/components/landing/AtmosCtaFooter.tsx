import React, { useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { UniFlowLogo } from '../brand/UniFlowLogo';
import { Modal } from '../common/Modal';

interface AtmosCtaFooterProps {
  onGoToRegister: () => void;
  onGoToLogin: () => void;
  onExploreDemo: () => void;
  onScrollToSection: (id: string) => void;
}

export const AtmosCtaFooter: React.FC<AtmosCtaFooterProps> = ({
  onGoToRegister,
  onGoToLogin,
  onExploreDemo,
  onScrollToSection,
}) => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <>
      {/* FINAL CLOSING CTA SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28 max-w-5xl mx-auto w-full relative">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-atmos-indigo/90 via-atmos-navy/95 to-atmos-navy border border-white/20 shadow-atmos-glow-lg text-center relative overflow-hidden backdrop-blur-2xl">
          {/* Volumetric Radial Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-atmos-purple/30 via-atmos-cyan/20 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-white/[0.08] text-atmos-cyan border border-white/15 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-atmos-cyan" />
              <span>Transform Your Semester</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight leading-tight">
              Ready to Upgrade Your Academic Flow?
            </h2>

            <p className="text-sm sm:text-base text-atmos-muted max-w-lg mx-auto leading-relaxed">
              Classes, assignments, finances, habits, and focus — everything you need to move forward, beautifully connected.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-atmos-purple to-atmos-periwinkle hover:from-atmos-purple hover:to-atmos-cyan text-white font-bold text-sm shadow-atmos-glow flex items-center justify-center gap-2 group transition-all"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-atmos-cyan/15 hover:bg-atmos-cyan/25 border border-atmos-cyan/35 text-atmos-cyan font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Demo Student</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white font-semibold text-sm transition-all"
              >
                Sign In to Existing Account
              </motion.button>
            </div>

            <p className="text-[11px] text-atmos-muted pt-2">
              Instant activation • No credit card required • Dedicated local persistence
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 border-t border-white/10 bg-atmos-navy/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <UniFlowLogo
            variant="full"
            size="sm"
            subtitle="The Unified Student Life Management Platform"
            onClick={() => onScrollToSection('hero')}
            className="cursor-pointer"
          />

          {/* Navigation Links */}
          <div className="flex items-center gap-6 text-xs text-atmos-muted flex-wrap justify-center">
            <button
              onClick={() => onScrollToSection('showcase')}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => onScrollToSection('how-it-works')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => onScrollToSection('benefits')}
              className="hover:text-white transition-colors"
            >
              Benefits
            </button>
            <button
              onClick={() => onScrollToSection('faq')}
              className="hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setLegalModal('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLegalModal('terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>

          <p className="text-xs text-atmos-muted text-center md:text-right">
            © {new Date().getFullYear()} UniFlow. Atmospheric Student OS.
          </p>
        </div>
      </footer>

      {/* Privacy Policy & Terms Modal */}
      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === 'privacy'
            ? 'UniFlow Student Privacy Policy'
            : 'UniFlow Terms of Service'
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs text-atmos-muted leading-relaxed py-2">
          {legalModal === 'privacy' ? (
            <>
              <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-custom shrink-0 mt-0.5" />
                <p className="text-white font-medium">
                  UniFlow is built on strict data isolation (AUTH-08). All student profiles, coursework records, grades, and financial ledger data are maintained strictly on your personal device or isolated database partition.
                </p>
              </div>
              <p>
                1. <strong className="text-white">Data Ownership:</strong> You retain complete ownership of all records, schedules, and financial budgets entered into UniFlow. No third-party ad tracking or data brokers are integrated.
              </p>
              <p>
                2. <strong className="text-white">Local Isolation:</strong> Each student account is cryptographically isolated in client storage. Switching accounts or clearing data strictly affects only the selected session.
              </p>
              <p>
                3. <strong className="text-white">Export Rights:</strong> You can export a complete machine-readable JSON backup of your entire student life records at any time from Profile & Settings.
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-atmos-purple shrink-0 mt-0.5" />
                <p className="text-white font-medium">
                  Welcome to UniFlow. By using the platform, you agree to these student productivity guidelines.
                </p>
              </div>
              <p>
                1. <strong className="text-white">Personal Use:</strong> UniFlow is designed to assist individual undergraduate and postgraduate students in managing their university schedules, study habits, assignments, and budgets.
              </p>
              <p>
                2. <strong className="text-white">Academic Integrity:</strong> The platform tools (focus timers, schedule managers, grade calculators) are study aides and do not replace official university grading portals.
              </p>
              <p>
                3. <strong className="text-white">Availability:</strong> UniFlow operates offline-first with persistent client storage, allowing uninterrupted study even without active Wi-Fi.
              </p>
            </>
          )}

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setLegalModal(null)}
              className="px-4 py-2 rounded-xl bg-atmos-purple text-white text-xs font-semibold shadow-atmos-glow"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
