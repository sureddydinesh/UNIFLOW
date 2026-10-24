import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Timer, 
  Sparkles, 
  Layers, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const BenefitsGrid: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const benefits = [
    {
      title: '100% Student-Isolated Data',
      desc: 'Strict multi-student cryptographic isolation prevents data leakage. Your courses, grades, notes, and budgets are isolated to your device.',
      icon: ShieldCheck,
      color: '#34D399',
    },
    {
      title: 'Offline-First Independence',
      desc: 'No campus Wi-Fi? No problem. UniFlow functions fully offline with local persistence and synchronizes seamlessly when reconnected.',
      icon: Clock,
      color: '#85DFFF',
    },
    {
      title: 'INR (₹) Financial Pacing',
      desc: 'Tailored for Indian college allowances. Track pocket money, canteen meals, xerox prints, and transit with automatic 80%/100% alerts.',
      icon: DollarSign,
      color: '#F59E0B',
    },
    {
      title: 'Synchronized Study & Focus',
      desc: 'Pomodoro timer cycles connect directly to your subjects. Know exactly how many hours you devoted to Data Structures vs. Operating Systems.',
      icon: Timer,
      color: '#9471FF',
    },
    {
      title: 'Atmospheric Dual Theme',
      desc: 'Engineered with deep Midnight Navy for late-night hostel study sessions and Clean Light appearance for bright morning classrooms.',
      icon: Sparkles,
      color: '#C9B9FF',
    },
    {
      title: 'One-Click Demo Student Access',
      desc: 'Explore Aarav Sharma’s pre-populated university workspace with complete schedule, assignments, and ledger in a single click.',
      icon: Layers,
      color: '#7197FF',
    },
  ];

  return (
    <section id="benefits" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-purple/15 border border-atmos-purple/25 text-atmos-lavender text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-atmos-cyan" />
          <span>Core Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
          Built for the reality of higher education.
        </h2>
        <p className="text-sm sm:text-base text-atmos-muted max-w-xl mx-auto">
          Every layer is calibrated to reduce student cognitive overload and keep academic momentum high.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((b, idx) => {
          const Icon = b.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-7 rounded-3xl bg-atmos-navy/80 border border-white/10 hover:border-white/20 shadow-atmos-card backdrop-blur-xl flex items-start gap-4 transition-all group"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${b.color}15`,
                  color: b.color,
                  border: `1px solid ${b.color}30`,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading font-bold text-sm text-white group-hover:text-atmos-white transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-atmos-muted leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
