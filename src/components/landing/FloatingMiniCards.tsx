import React from 'react';
import { 
  CheckSquare, 
  DollarSign, 
  Timer, 
  Flame, 
  BookOpen, 
  ChevronRight
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export interface MiniCardData {
  id: string;
  category: string;
  title: string;
  metric: string;
  meta: string;
  statusBadge: string;
  accentColor: string;
  glowColor: string;
  icon: React.ElementType;
  flank: 'left' | 'right';
  floatDelay: number;
  floatDuration: number;
}

export const MINI_CARDS: MiniCardData[] = [
  {
    id: 'focus',
    category: 'Focus Pomodoro',
    title: 'Focus Session',
    metric: '25:00 Focus Timer',
    meta: 'Cycle 3 of 4 • Deep flow',
    statusBadge: 'In Flow',
    accentColor: '#85DFFF',
    glowColor: 'rgba(133, 223, 255, 0.25)',
    icon: Timer,
    flank: 'left',
    floatDelay: 0,
    floatDuration: 5.2,
  },
  {
    id: 'money',
    category: 'Money Manager',
    title: 'Monthly Allowance',
    metric: '₹5,240 / ₹8,500',
    meta: '61% spent • Budget safe',
    statusBadge: 'Budget Safe',
    accentColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.25)',
    icon: DollarSign,
    flank: 'left',
    floatDelay: 1.2,
    floatDuration: 5.6,
  },
  {
    id: 'assignments',
    category: 'Assignments',
    title: 'Assignment Progress',
    metric: '3 of 4 tasks completed',
    meta: 'Upcoming deadlines • Queue',
    statusBadge: 'Due Soon',
    accentColor: '#9471FF',
    glowColor: 'rgba(148, 113, 255, 0.25)',
    icon: CheckSquare,
    flank: 'right',
    floatDelay: 0.4,
    floatDuration: 4.8,
  },
  {
    id: 'notes',
    category: 'Academic Progress',
    title: 'Academic Progress',
    metric: 'Target SGPA: 8.5',
    meta: 'Assessment tracking',
    statusBadge: 'On Track',
    accentColor: '#C9B9FF',
    glowColor: 'rgba(201, 185, 255, 0.25)',
    icon: BookOpen,
    flank: 'right',
    floatDelay: 0.8,
    floatDuration: 5.4,
  },
  {
    id: 'habits',
    category: 'Habit Tracker',
    title: 'Daily Habits Completed',
    metric: '8 / 8 Habits Done',
    meta: '14-day routine streak',
    statusBadge: 'All Clear',
    accentColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.25)',
    icon: Flame,
    flank: 'right',
    floatDelay: 1.6,
    floatDuration: 5.0,
  },
];

interface MiniCardButtonProps {
  card: MiniCardData;
  isActive?: boolean;
  onSelect: () => void;
  className?: string;
}

export const MiniCardButton: React.FC<MiniCardButtonProps> = ({
  card,
  isActive = false,
  onSelect,
  className = '',
}) => {
  const Icon = card.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left w-full p-3 sm:p-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-200 cursor-pointer relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-atmos-purple select-none hover:-translate-y-1 ${
        isActive
          ? 'bg-atmos-indigo/95 border-atmos-purple shadow-atmos-glow'
          : 'bg-atmos-navy/85 hover:bg-atmos-indigo/90 border-white/10 hover:border-atmos-purple/60 shadow-atmos-card hover:shadow-atmos-card-hover'
      } ${className}`}
      style={{
        borderColor: isActive ? card.accentColor : undefined,
      }}
    >
      {/* Luminous Top Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${card.accentColor}, transparent)`,
        }}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{
              backgroundColor: `${card.accentColor}20`,
              color: card.accentColor,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-atmos-muted group-hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none">
            {card.category}
          </span>
        </div>

        <span
          className="text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-colors shrink-0"
          style={{
            backgroundColor: `${card.accentColor}15`,
            color: card.accentColor,
            borderColor: `${card.accentColor}30`,
          }}
        >
          {card.statusBadge}
        </span>
      </div>

      {/* Title & Metric */}
      <h4 className="font-heading font-bold text-xs text-white group-hover:text-atmos-white truncate mb-1">
        {card.title}
      </h4>

      <div className="flex items-baseline justify-between text-[11px] mb-1 gap-2">
        <span className="font-semibold text-atmos-cyan tabular-nums truncate">
          {card.metric}
        </span>
        <span className="text-[10px] text-atmos-muted truncate">
          {card.meta}
        </span>
      </div>

      {/* Action Hint */}
      <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.06] text-[10px] text-atmos-muted group-hover:text-atmos-purple transition-colors">
        <span>View workspace preview</span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};

interface FloatingMiniCardsProps {
  onSelectCard: (cardId: string) => void;
  activeCardId?: string;
  leftStyle?: any;
  rightStyle?: any;
}

export const FloatingMiniCards: React.FC<FloatingMiniCardsProps> = ({
  onSelectCard,
  activeCardId,
  leftStyle,
  rightStyle,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const leftCards = MINI_CARDS.filter((c) => c.flank === 'left');
  const rightCards = MINI_CARDS.filter((c) => c.flank === 'right');

  return (
    <>
      {/* DESKTOP LEFT FLANK (Strictly outside central text column) */}
      <motion.div 
        style={leftStyle}
        className="hidden lg:flex flex-col justify-around absolute left-2 xl:left-6 2xl:left-10 top-24 bottom-16 w-52 xl:w-64 z-20 pointer-events-none"
      >
        {leftCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: -24, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              y: shouldReduceMotion ? 0 : [0, -6, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.2 + card.floatDelay * 0.1 },
              x: { duration: 0.5, delay: 0.2 + card.floatDelay * 0.1 },
              y: shouldReduceMotion
                ? { duration: 0 }
                : {
                    repeat: Infinity,
                    duration: card.floatDuration,
                    ease: 'easeInOut',
                    delay: card.floatDelay,
                  },
            }}
            className="pointer-events-auto"
          >
            <MiniCardButton
              card={card}
              isActive={activeCardId === card.id}
              onSelect={() => onSelectCard(card.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* DESKTOP RIGHT FLANK (Strictly outside central text column) */}
      <motion.div 
        style={rightStyle}
        className="hidden lg:flex flex-col justify-around absolute right-2 xl:right-6 2xl:right-10 top-20 bottom-12 w-52 xl:w-64 z-20 pointer-events-none"
      >
        {rightCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 24, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              y: shouldReduceMotion ? 0 : [0, -6, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.2 + card.floatDelay * 0.1 },
              x: { duration: 0.5, delay: 0.2 + card.floatDelay * 0.1 },
              y: shouldReduceMotion
                ? { duration: 0 }
                : {
                    repeat: Infinity,
                    duration: card.floatDuration,
                    ease: 'easeInOut',
                    delay: card.floatDelay,
                  },
            }}
            className="pointer-events-auto"
          >
            <MiniCardButton
              card={card}
              isActive={activeCardId === card.id}
              onSelect={() => onSelectCard(card.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};
