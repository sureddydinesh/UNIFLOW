import React, { useState, useEffect, useRef } from 'react';

export interface CountUpProps {
  /**
   * Target value to count up/down to. (Alias: to)
   */
  value?: number;
  /**
   * Target value to count up/down to. (Takes precedence if provided)
   */
  to?: number;
  /**
   * Starting value. Defaults to 0 on initial mount.
   */
  from?: number;
  /**
   * Animation duration in milliseconds. Defaults to 950ms (between 800–1,400ms).
   */
  duration?: number;
  /**
   * Stagger delay before starting count-up in milliseconds. Defaults to 0ms.
   */
  delay?: number;
  /**
   * Decimal places to display. If omitted, automatically defaults to 0 for integers and 2 for floats.
   */
  decimals?: number;
  /**
   * Prefix string (e.g. "₹", "+", "-").
   */
  prefix?: string;
  /**
   * Suffix string (e.g. "%", "m", "h", " Credits").
   */
  suffix?: string;
  /**
   * Custom formatter function (e.g. formatCurrency, formatDurationHuman).
   */
  formatter?: (val: number) => string;
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Custom easing function. Defaults to smooth Quartic Ease Out.
   */
  ease?: (progress: number) => number;
}

/**
 * CountUp Component
 * Animates numbers smoothly from zero to their actual data values on mount,
 * and transitions gracefully between values when data updates.
 * Respects prefers-reduced-motion, cancels frame loops on unmount, and
 * enforces tabular numerals to prevent layout shifts.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  to,
  from = 0,
  duration = 950,
  delay = 0,
  decimals,
  prefix = '',
  suffix = '',
  formatter,
  className = '',
  ease,
}) => {
  // Resolve target value
  const target = to !== undefined ? to : (value !== undefined ? value : 0);

  // Store the current animated numeric value in a ref
  const currentValueRef = useRef<number>(from);
  
  // Track whether initial count-up from `from` has been initiated
  const hasAnimatedInitialRef = useRef<boolean>(false);

  // Current displayed value in state
  const [displayValue, setDisplayValue] = useState<number>(from);

  const animFrameRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Determine start value:
    // If initial animation has not completed, always start from `from` (0)
    // Otherwise, start from where the current displayed value is
    const startValue = !hasAnimatedInitialRef.current ? from : currentValueRef.current;
    const endValue = target;

    // Clear any pending frame or delay timer
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      currentValueRef.current = endValue;
      hasAnimatedInitialRef.current = true;
      setDisplayValue(endValue);
      return;
    }

    // If already at target value and already animated initially, nothing to do
    if (hasAnimatedInitialRef.current && startValue === endValue) {
      currentValueRef.current = endValue;
      setDisplayValue(endValue);
      return;
    }

    // Default Quartic Ease-Out curve: 1 - (1 - t)^4
    // Provides immediate responsive momentum that decelerates gracefully
    const defaultEase = (t: number) => 1 - Math.pow(1 - t, 4);
    const easingFn = ease || defaultEase;

    // Automatic decimal precision if not explicitly provided
    const resolvedDecimals = decimals !== undefined
      ? decimals
      : (Number.isInteger(endValue) && Number.isInteger(startValue) ? 0 : 2);

    const roundToPrecision = (num: number): number => {
      if (resolvedDecimals <= 0) return Math.round(num);
      const factor = Math.pow(10, resolvedDecimals);
      return Math.round(num * factor) / factor;
    };

    const runAnimation = () => {
      let startTime: number | null = null;
      hasAnimatedInitialRef.current = true;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);

        const current = startValue + (endValue - startValue) * easedProgress;
        const rounded = roundToPrecision(current);
        currentValueRef.current = rounded;
        setDisplayValue(rounded);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          currentValueRef.current = endValue;
          setDisplayValue(endValue);
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    };

    if (delay > 0) {
      setDisplayValue(startValue);
      delayTimeoutRef.current = setTimeout(runAnimation, delay);
    } else {
      runAnimation();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [target, from, duration, delay, decimals, ease]);

  // Format the rendered output
  const resolvedDecimals = decimals !== undefined
    ? decimals
    : (Number.isInteger(target) ? 0 : 2);

  let formattedNum: string;
  if (formatter) {
    formattedNum = formatter(displayValue);
  } else {
    if (resolvedDecimals > 0) {
      formattedNum = displayValue.toFixed(resolvedDecimals);
    } else {
      formattedNum = Math.round(displayValue).toLocaleString('en-IN');
    }
  }

  return (
    <span className={`tabular-nums inline-block ${className}`}>
      {prefix}{formattedNum}{suffix}
    </span>
  );
};
