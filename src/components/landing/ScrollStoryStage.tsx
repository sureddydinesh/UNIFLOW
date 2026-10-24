import React, { useRef, useState, useEffect } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useReducedMotion 
} from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  ShieldCheck, 
  Clock, 
  GraduationCap
} from 'lucide-react';
import { AtmosUniverseCore } from './AtmosUniverseCore';
import { FloatingMiniCards, MINI_CARDS, MiniCardButton } from './FloatingMiniCards';

interface ScrollStoryStageProps {
  onGoToRegister: () => void;
  onGoToLogin: () => void;
  onExploreDemo: () => void;
  onSelectMiniCard: (cardId: string) => void;
  onScrollToExplore: () => void;
}

export const ScrollStoryStage: React.FC<ScrollStoryStageProps> = ({
  onGoToRegister,
  onGoToLogin,
  onExploreDemo,
  onSelectMiniCard,
  onScrollToExplore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Desktop mouse parallax coordinates (clamped to prevent distortion)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDesktop || shouldReduceMotion) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 16; // max ±8px
    const y = (clientY / innerHeight - 0.5) * 16;
    setMousePos({ x, y });
  };

  // Continuous, 1:1 synchronized scroll tracking (Reversible, Smooth, Non-blocking)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // 1. Hero Text & Headings: Smoothly glide upward, gently scale down, and fade out
  const heroOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.72],
    [1, 0.6, 0]
  );
  const heroY = useTransform(
    scrollYProgress,
    [0, 0.72],
    shouldReduceMotion ? [0, 0] : [0, -65]
  );
  const heroScale = useTransform(
    scrollYProgress,
    [0, 0.72],
    shouldReduceMotion ? [1, 1] : [1, 0.94]
  );

  // 2. Floating Cards: Subtle differential speeds creating dynamic 3D depth
  const leftCardsY = useTransform(
    scrollYProgress,
    [0, 0.75],
    shouldReduceMotion ? [0, 0] : [0, -45]
  );
  const leftCardsX = useTransform(
    scrollYProgress,
    [0, 0.75],
    shouldReduceMotion ? [0, 0] : [0, -35]
  );
  const leftCardsOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75],
    [1, 0.8, 0]
  );

  const rightCardsY = useTransform(
    scrollYProgress,
    [0, 0.75],
    shouldReduceMotion ? [0, 0] : [0, -55]
  );
  const rightCardsX = useTransform(
    scrollYProgress,
    [0, 0.75],
    shouldReduceMotion ? [0, 0] : [0, 35]
  );
  const rightCardsOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 0.75],
    [1, 0.8, 0]
  );

  // 3. Central Universe: Progressively transforms, scales down, and glides upward
  const universeScale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    shouldReduceMotion ? [1, 1, 1] : [1, 1.08, 0.82]
  );
  const universeY = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    shouldReduceMotion ? [0, 0, 0] : [0, 15, -60]
  );
  const universeOpacity = useTransform(
    scrollYProgress,
    [0, 0.6, 0.82],
    [1, 0.9, 0]
  );

  // 4. Scroll Cue: Fades out quickly upon initial scroll
  const scrollCueOpacity = useTransform(
    scrollYProgress,
    [0, 0.22],
    [1, 0]
  );

  return (
    <div
      ref={containerRef}
      id="hero"
      onMouseMove={handleMouseMove}
      className="relative w-full h-auto lg:h-[185vh] bg-atmos-navy text-atmos-white selection:bg-atmos-purple/30"
    >
      {/* DEEP ATMOSPHERIC BACKGROUND GLOWS (Pointer-events-none, -z-10) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(148,113,255,0.22),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-[10%] left-[-8%] w-[500px] h-[500px] bg-gradient-to-br from-atmos-indigo/35 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[25%] right-[-8%] w-[500px] h-[500px] bg-gradient-to-bl from-atmos-violet/35 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Subtle Starry Particle Field */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] -z-10" 
        style={{
          transform: isDesktop && !shouldReduceMotion ? `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)` : undefined,
          transition: 'transform 0.15s ease-out',
        }}
      />

      {/* STICKY CINEMATIC VIEWPORT (Stays Pinned During Scroll, Transforms Continuously & Reversibly) */}
      <div className="lg:sticky lg:top-0 lg:h-screen w-full flex flex-col items-center justify-between pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden max-w-[1440px] mx-auto z-10">
        
        {/* DESKTOP FLOATING CARDS LAYER (Outer Flanks with Differential 3D Depth) */}
        <FloatingMiniCards
          onSelectCard={onSelectMiniCard}
          leftStyle={{
            y: leftCardsY,
            x: leftCardsX,
            opacity: leftCardsOpacity,
          }}
          rightStyle={{
            y: rightCardsY,
            x: rightCardsX,
            opacity: rightCardsOpacity,
          }}
        />

        {/* PROTECTED CENTRAL CONTENT COLUMN (Guaranteed Zero Overlap with Flank Cards) */}
        <motion.div
          style={{
            y: heroY,
            opacity: heroOpacity,
            scale: heroScale,
            x: isDesktop && !shouldReduceMotion ? mousePos.x * 0.25 : 0,
          }}
          className="w-full max-w-xl xl:max-w-2xl mx-auto text-center space-y-5 relative z-30 pointer-events-auto pt-2 sm:pt-4"
        >
          {/* Release Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-xs font-semibold text-atmos-cyan shadow-atmos-glow cursor-pointer hover:border-atmos-cyan/40 transition-colors"
            onClick={onExploreDemo}
          >
            <Sparkles className="w-3.5 h-3.5 text-atmos-cyan" />
            <span>Atmospheric Student OS • Try One-Click Demo</span>
            <span className="text-white/40">→</span>
          </motion.div>

          {/* Main Headline (Clean Line Breaks, Gradient on Second Line) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight text-white leading-[1.12]"
          >
            Your Entire Student Life.{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-atmos-purple via-atmos-periwinkle to-atmos-cyan">
              In One Flow.
            </span>
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
            className="text-sm sm:text-base lg:text-lg text-atmos-muted max-w-xl mx-auto leading-relaxed"
          >
            Classes, assignments, finances, habits, and focus — everything you need to move forward, beautifully connected.
          </motion.p>

          {/* Primary & Secondary Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGoToRegister}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-atmos-purple to-atmos-periwinkle hover:from-atmos-purple hover:to-atmos-cyan text-white font-bold text-sm shadow-atmos-glow flex items-center justify-center gap-2 group transition-all"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 hover:border-atmos-cyan/50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-atmos-cyan" />
              <span>Explore UniFlow Demo</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onScrollToExplore}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-transparent border border-white/10 hover:border-white/20 text-atmos-muted hover:text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Explore Features</span>
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center justify-center gap-5 sm:gap-7 pt-2 text-xs text-atmos-muted flex-wrap"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-custom" />
              <span>100% Student-Isolated Data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-atmos-cyan" />
              <span>Offline-First Persistence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-atmos-lavender" />
              <span>Built for Higher Ed</span>
            </div>
          </motion.div>
        </motion.div>

        {/* CENTRAL UNIVERSE ARTWORK (Transforms Progressively on Scroll) */}
        <motion.div
          style={{
            y: universeY,
            scale: universeScale,
            opacity: universeOpacity,
            x: isDesktop && !shouldReduceMotion ? mousePos.x * 0.15 : 0,
          }}
          className="relative my-auto flex items-center justify-center z-10 pointer-events-none py-2"
        >
          <AtmosUniverseCore />
        </motion.div>

        {/* TABLET & MOBILE RESPONSIVE FLOW (Safe Non-Overlapping Fallback) */}
        <div className="lg:hidden w-full max-w-xl mx-auto mt-4 px-2 pointer-events-auto z-20">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-atmos-muted/80">
              Interactive Student Workspaces
            </span>
            <span className="text-[10px] text-atmos-cyan font-medium">
              Tap card to inspect →
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MINI_CARDS.map((card) => (
              <MiniCardButton
                key={card.id}
                card={card}
                onSelect={() => onSelectMiniCard(card.id)}
              />
            ))}
          </div>
        </div>

        {/* CLEAN SCROLL CUE (Fades Out with Scroll Progress) */}
        <motion.div 
          style={{ opacity: scrollCueOpacity }}
          onClick={onScrollToExplore}
          className="flex flex-col items-center justify-center gap-1.5 mt-2 text-atmos-muted hover:text-white cursor-pointer transition-colors z-30 pointer-events-auto select-none"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest text-atmos-muted/70">
            Scroll to explore product modules
          </span>
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-atmos-cyan" />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};
