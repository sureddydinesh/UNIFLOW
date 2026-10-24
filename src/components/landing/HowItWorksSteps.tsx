import React from 'react';
import { Layers, Target, Timer, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const HowItWorksSteps: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      step: '01',
      title: 'Bring Everything Together',
      subtitle: 'Organize student responsibilities in one place.',
      desc: 'Sign up with your university email or launch the instant demo. Import your weekly timetable, course syllabus, and monthly allowance in INR (₹) without complex setup.',
      icon: Layers,
      color: '#7197FF',
      accentGlow: 'rgba(113, 151, 255, 0.25)',
    },
    {
      step: '02',
      title: 'See What Needs Attention',
      subtitle: 'Understand schedules, assignments, and priorities.',
      desc: 'At a glance, view upcoming lectures with classroom locations, urgent lab assignments with remaining hour countdowns, and budget pacing before you spend.',
      icon: Target,
      color: '#9471FF',
      accentGlow: 'rgba(148, 113, 255, 0.25)',
    },
    {
      step: '03',
      title: 'Build a Consistent Routine',
      subtitle: 'Track progress and make time for focused work.',
      desc: 'Enter deep Pomodoro study sprints, check off daily habits, and watch your semester SGPA trajectory rise as you build measurable discipline.',
      icon: Timer,
      color: '#34D399',
      accentGlow: 'rgba(52, 211, 153, 0.25)',
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atmos-cyan/15 border border-atmos-cyan/25 text-atmos-cyan text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple Setup</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
          How UniFlow Works
        </h2>
        <p className="text-sm sm:text-base text-atmos-muted max-w-lg mx-auto">
          Start organizing your academic journey in three clear steps, zero steep learning curve.
        </p>
      </div>

      {/* 3 Steps Pipeline Grid with Connecting Trail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((st, i) => {
          const Icon = st.icon;

          return (
            <motion.div
              key={st.step}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-8 rounded-3xl bg-atmos-navy/85 border border-white/10 hover:border-white/25 shadow-atmos-card backdrop-blur-xl flex flex-col justify-between relative group overflow-hidden"
            >
              {/* Top Colored Accent Beam */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, ${st.color}, transparent)`,
                }}
              />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span
                    className="font-mono font-black text-3xl tracking-tight"
                    style={{ color: st.color }}
                  >
                    {st.step}
                  </span>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-atmos-card"
                    style={{
                      backgroundColor: `${st.color}15`,
                      color: st.color,
                      border: `1px solid ${st.color}30`,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-white mb-1.5">
                  {st.title}
                </h3>
                <h4 className="text-xs font-semibold text-atmos-cyan mb-3">
                  {st.subtitle}
                </h4>

                <p className="text-xs text-atmos-muted leading-relaxed">
                  {st.desc}
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-white/[0.08] flex items-center gap-2 text-xs font-semibold" style={{ color: st.color }}>
                <CheckCircle2 className="w-4 h-4" />
                <span>Instant Activation</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
