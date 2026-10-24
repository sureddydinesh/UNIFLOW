import React from 'react';

export interface UniFlowLogoProps {
  /**
   * 'icon': Emblem alone in an app-icon style container (ideal for compact sidebar, header badge, mobile header)
   * 'full': Emblem plus typography wordmark and optional badge/subtitle
   * 'lockup': The standalone full image lockup (emblem + graphic wordmark)
   */
  variant?: 'icon' | 'full' | 'lockup';
  /**
   * Size presets
   * 'xs': 24px emblem
   * 'sm': 32px emblem
   * 'md': 40px emblem (default)
   * 'lg': 48px emblem
   * 'xl': 56px emblem
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional custom className for outer wrapper
   */
  className?: string;
  /**
   * Optional custom className for the emblem box or image
   */
  imageClassName?: string;
  /**
   * Optional badge text (e.g. 'v1.2') rendered alongside wordmark when variant === 'full'
   */
  badge?: string;
  /**
   * Optional subtitle rendered under wordmark when variant === 'full'
   */
  subtitle?: React.ReactNode;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Accessible text for screen readers
   */
  alt?: string;
}

const SIZE_STYLES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { box: string; text: string; sub: string }> = {
  xs: { box: 'w-6 h-6 rounded-lg', text: 'text-sm', sub: 'text-[9px]' },
  sm: { box: 'w-8 h-8 rounded-xl', text: 'text-base', sub: 'text-[10px]' },
  md: { box: 'w-10 h-10 rounded-xl', text: 'text-lg', sub: 'text-[11px]' },
  lg: { box: 'w-12 h-12 rounded-2xl', text: 'text-xl', sub: 'text-xs' },
  xl: { box: 'w-14 h-14 rounded-2xl', text: 'text-2xl', sub: 'text-xs' },
};

export const UniFlowLogo: React.FC<UniFlowLogoProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  imageClassName = '',
  badge,
  subtitle,
  onClick,
  alt = 'UniFlow Logo'
}) => {
  const styles = SIZE_STYLES[size];

  // Full image lockup variant
  if (variant === 'lockup') {
    return (
      <div 
        onClick={onClick}
        className={`inline-block select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img 
          src="/brand/uniflow-logo.png" 
          alt={alt} 
          className={`w-full max-w-[280px] h-auto object-contain rounded-2xl shadow-xl ${imageClassName}`} 
        />
      </div>
    );
  }

  // Emblem container with high contrast in both dark and light modes
  const emblem = (
    <div 
      className={`
        ${styles.box} 
        relative overflow-hidden shrink-0 
        bg-[#0B0914] border border-border-subtle 
        shadow-glow-primary/40 shadow-sm 
        flex items-center justify-center 
        transition-transform duration-200
        ${imageClassName}
      `}
    >
      <img 
        src="/brand/uniflow-icon.png" 
        alt={alt} 
        className="w-full h-full object-cover" 
        loading="eager"
      />
    </div>
  );

  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick} 
        className={`inline-flex shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {emblem}
      </div>
    );
  }

  // variant === 'full': Emblem + Typography Wordmark
  return (
    <div 
      onClick={onClick} 
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {emblem}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-heading font-extrabold tracking-tight text-text-main ${styles.text}`}>
            UniFlow
          </span>
          {badge && (
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider shrink-0">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className={`text-text-muted font-medium truncate ${styles.sub}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
