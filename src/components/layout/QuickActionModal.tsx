import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AssignmentModal } from '../common/AssignmentModal';
import { EventModal } from '../common/EventModal';
import { TransactionModal } from '../common/TransactionModal';
import { HabitModal } from '../habits/HabitModal';
import { AssessmentModal } from '../academics/AssessmentModal';
import { 
  CheckSquare, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight,
  Flame,
  GraduationCap
} from 'lucide-react';
import { TransactionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose }) => {
  const { subjects, saveHabit, saveAssessment } = useApp();

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  const handleOpenAction = (action: 'assignment' | 'event' | 'expense' | 'income' | 'habit' | 'assessment') => {
    onClose();
    if (action === 'assignment') {
      setShowAssignmentModal(true);
    } else if (action === 'event') {
      setShowEventModal(true);
    } else if (action === 'expense') {
      setTransactionType('expense');
      setShowTransactionModal(true);
    } else if (action === 'income') {
      setTransactionType('income');
      setShowTransactionModal(true);
    } else if (action === 'habit') {
      setShowHabitModal(true);
    } else if (action === 'assessment') {
      setShowAssessmentModal(true);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Quick Actions (DASH-06)" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('assignment')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              Assignment
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Add task & deadline
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('event')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              Schedule Event
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Class, lab or exam
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('habit')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 fill-amber-400/20" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              New Routine
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Habit & streak target
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('assessment')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              Assessment
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Marks & CAT score
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('expense')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-status-error/20 text-status-error flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              Expense
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Food, transit, bills
            </p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAction('income')}
            className="p-3.5 rounded-2xl bg-elevated border border-border-subtle text-left group card-hover btn-action"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-custom/20 text-emerald-custom flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors">
              Income
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
              Allowance, stipend
            </p>
          </motion.button>
        </div>
      </Modal>

      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
      />
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        defaultType={transactionType}
      />
      <HabitModal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        onSave={(h) => saveHabit(h)}
      />
      <AssessmentModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        subjects={subjects}
        onSave={(a) => saveAssessment(a)}
      />
    </>
  );
};
