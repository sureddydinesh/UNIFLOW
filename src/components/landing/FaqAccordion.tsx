import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is my academic, grade, and financial data completely private?',
      a: 'Yes. UniFlow is built on strict student data isolation (AUTH-08). All student profiles, courses, marks, and financial transactions are stored strictly in your private local client storage or your encrypted Supabase user partition. No third-party trackers or data brokers are ever integrated.',
    },
    {
      q: 'Does UniFlow work offline when campus Wi-Fi drops?',
      a: 'Yes. UniFlow is designed offline-first. Your daily timetable, urgent deadlines, and Pomodoro focus timer continue to work seamlessly without an active internet connection. All changes synchronize immediately when you reconnect.',
    },
    {
      q: 'Can I test UniFlow immediately without creating an account?',
      a: 'Absolutely. Click "Explore Demo" anywhere on this page to test-drive Aarav Sharma’s pre-loaded university semester with real classes, assignments, and budget metrics in one click. No registration or credit card required.',
    },
    {
      q: 'How does the INR (₹) Money Manager help with university expenses?',
      a: 'UniFlow lets you set your monthly allowance in Indian Rupees, categorize everyday student costs (cafeteria, xerox notes, transit, books), and sends visual warnings when you cross 80% and 100% of your budget threshold.',
    },
    {
      q: 'Can I export my course schedules, notes, and habits?',
      a: 'Yes. You can export a complete machine-readable JSON backup of your entire student life records at any time from the Profile & Settings workspace with a single click.',
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full relative">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-periwinkle/15 border border-atmos-periwinkle/25 text-atmos-periwinkle text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-atmos-cyan" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
          Got questions? We have answers.
        </h2>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? 'bg-atmos-indigo/70 border-atmos-purple/50 shadow-atmos-card'
                  : 'bg-atmos-navy/80 hover:bg-atmos-navy/95 border-white/10'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-atmos-purple"
              >
                <span className="font-heading font-bold text-sm sm:text-base text-white">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-atmos-cyan shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-atmos-purple' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-atmos-muted leading-relaxed border-t border-white/[0.06]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
