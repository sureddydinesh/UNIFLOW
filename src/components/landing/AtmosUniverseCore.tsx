import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  GraduationCap, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  Timer, 
  Flame,
  Sparkles
} from 'lucide-react';

interface AtmosUniverseCoreProps {
  scale?: number;
  interactive?: boolean;
}

export const AtmosUniverseCore: React.FC<AtmosUniverseCoreProps> = ({
  interactive = true,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const orbitNodes = [
    { label: 'Classes', angle: 0, icon: GraduationCap, color: '#7197FF' },
    { label: 'Schedule', angle: 60, icon: Calendar, color: '#85DFFF' },
    { label: 'Deadlines', angle: 120, icon: CheckSquare, color: '#9471FF' },
    { label: 'Money ₹', angle: 180, icon: DollarSign, color: '#34D399' },
    { label: 'Focus', angle: 240, icon: Timer, color: '#C9B9FF' },
    { label: 'Habits', angle: 300, icon: Flame, color: '#EC4899' },
  ];

  return (
    <div className="relative w-[340px] sm:w-[460px] md:w-[540px] lg:w-[620px] aspect-square flex items-center justify-center select-none pointer-events-none">
      {/* Background Volumetric Glows */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-atmos-purple/20 via-atmos-periwinkle/15 to-atmos-cyan/15 blur-3xl -z-10" />
      <div className="absolute w-3/4 h-3/4 rounded-full bg-atmos-purple/25 blur-2xl -z-10 animate-pulse-slow" />

      {/* Outer Dotted Orbital Ring */}
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: 120, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-white/10"
      />

      {/* Mid Orbital Ring with Glow Accent */}
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: -360 }}
        transition={{ repeat: Infinity, duration: 90, ease: 'linear' }}
        className="absolute inset-[14%] rounded-full border border-white/[0.12] shadow-[0_0_30px_rgba(148,113,255,0.15)]"
      >
        {/* Orbiting Satellite Marker */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-atmos-cyan shadow-[0_0_12px_#85DFFF]" />
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-atmos-purple shadow-[0_0_10px_#9471FF]" />
      </motion.div>

      {/* Inner Precision Grid Ring */}
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
        className="absolute inset-[28%] rounded-full border border-atmos-purple/30 bg-radial-gradient"
      >
        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-atmos-periwinkle shadow-[0_0_10px_#7197FF]" />
      </motion.div>

      {/* 6 Orbital System Nodes */}
      {orbitNodes.map((node) => {
        const radius = 48; // percentage
        const rad = (node.angle * Math.PI) / 180;
        const x = 50 + radius * Math.cos(rad);
        const y = 50 + radius * Math.sin(rad);
        const Icon = node.icon;

        return (
          <div
            key={node.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-atmos-navy/90 border border-white/15 backdrop-blur-md shadow-atmos-card"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <Icon className="w-3 h-3" style={{ color: node.color }} />
            <span className="text-[10px] font-semibold text-white/90">
              {node.label}
            </span>
          </div>
        );
      })}

      {/* Central Celestial Core / Universe Orb */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 50px -10px rgba(148,113,255,0.4)',
                  '0 0 80px -10px rgba(148,113,255,0.65)',
                  '0 0 50px -10px rgba(148,113,255,0.4)',
                ],
              }
        }
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="relative z-10 w-36 sm:w-44 md:w-52 lg:w-56 aspect-square rounded-3xl bg-gradient-to-b from-atmos-indigo/90 via-atmos-violet/80 to-atmos-navy/95 border border-white/20 backdrop-blur-2xl p-4 flex flex-col items-center justify-center text-center shadow-atmos-glow-lg overflow-hidden group"
      >
        {/* Ambient Core Lighting */}
        <div className="absolute inset-0 bg-gradient-to-tr from-atmos-purple/30 via-transparent to-atmos-cyan/20 pointer-events-none" />

        {/* Central Official UniFlow Icon */}
        <div className="relative w-16 sm:w-20 md:w-24 aspect-square mb-2">
          <img
            src="/brand/uniflow-icon.png"
            alt="UniFlow Universe Core"
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(148,113,255,0.6)]"
            loading="eager"
          />
        </div>

        {/* Core Badge */}
        <div className="relative inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/15 text-[10px] font-bold text-white tracking-wide">
          <Sparkles className="w-2.5 h-2.5 text-atmos-cyan" />
          <span>UniFlow Universe</span>
        </div>
      </motion.div>
    </div>
  );
};
