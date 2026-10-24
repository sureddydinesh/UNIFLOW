import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_PREMIUM } from '../../utils/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-lg'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and manage body overflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            ref={modalRef}
            key="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.24, ease: EASE_PREMIUM }}
            className={`w-full ${maxWidth} bg-card border border-border-subtle rounded-3xl shadow-2xl p-6 sm:p-7 text-text-main max-h-[90vh] flex flex-col`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <h2 id="modal-title" className="text-xl font-bold font-heading tracking-tight">
                {title}
              </h2>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl text-text-muted hover:text-text-main hover:bg-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="mt-4 overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
