import type React from 'react';

// Premium Linear/Notion-grade easing curves
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const SPRING_TACTILE = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
};

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 28,
};

// Reusable Motion Variants
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: EASE_PREMIUM } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.16 } 
  },
};

export const fadeUpVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.28, ease: EASE_PREMIUM } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    transition: { duration: 0.18 } 
  },
};

export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.24, ease: EASE_PREMIUM } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.97, 
    y: 4, 
    transition: { duration: 0.16 } 
  },
};

export const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.26, ease: EASE_PREMIUM } 
  },
  exit: { 
    opacity: 0, 
    y: -6, 
    transition: { duration: 0.16 } 
  },
};

export const cardHoverMotion = {
  whileHover: { 
    y: -2.5, 
    transition: { duration: 0.18, ease: EASE_PREMIUM } 
  },
};

export const buttonTactileMotion = {
  whileHover: { scale: 1.012, transition: { duration: 0.12 } },
  whileTap: { scale: 0.975, transition: { duration: 0.08 } },
};

export { CountUp } from '../components/common/CountUp';
export type { CountUpProps } from '../components/common/CountUp';
import { CountUp, CountUpProps } from '../components/common/CountUp';

export type AnimatedNumberProps = CountUpProps;
export const AnimatedNumber = CountUp;

