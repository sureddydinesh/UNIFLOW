import { 
  Transaction, 
  Assignment, 
  CalendarEvent, 
  FinancialSummary, 
  AcademicSummary 
} from '../types';

/**
 * Accurately calculate financial summaries according to PRD formulas:
 * S = I - E
 * B_remaining = B - E
 * Utilization = (E / B) * 100%
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  monthlyBudget: number,
  selectedMonthYear?: string // format "YYYY-MM", defaults to current
): FinancialSummary {
  const currentMonth = selectedMonthYear || new Date().toISOString().slice(0, 7);

  // Filter transactions for this month
  const monthTransactions = transactions.filter(t => 
    t.transactionDate.startsWith(currentMonth)
  );

  let income = 0;
  let expenses = 0;

  for (const t of monthTransactions) {
    const val = Number(t.amount) || 0;
    if (t.transactionType === 'income') {
      income += val;
    } else if (t.transactionType === 'expense') {
      expenses += val;
    }
  }

  // Rounded to 2 decimal places to avoid floating point issues
  income = Math.round(income * 100) / 100;
  expenses = Math.round(expenses * 100) / 100;
  const netCashFlow = Math.round((income - expenses) * 100) / 100;

  const budget = monthlyBudget > 0 ? monthlyBudget : 0;
  const remainingBudget = Math.round((budget - expenses) * 100) / 100;
  
  let budgetUtilization = 0;
  if (budget > 0) {
    budgetUtilization = Math.round((expenses / budget) * 1000) / 10; // 1 decimal place e.g. 74.5%
  }

  return {
    income,
    expenses,
    netCashFlow,
    monthlyBudget: budget,
    remainingBudget,
    budgetUtilization,
    isOverBudget: budget > 0 && expenses > budget,
  };
}

/**
 * Group expenses by category and calculate percentage share
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  selectedMonthYear?: string
): { category: string; amount: number; percentage: number }[] {
  const currentMonth = selectedMonthYear || new Date().toISOString().slice(0, 7);
  const expenseTransactions = transactions.filter(
    t => t.transactionType === 'expense' && t.transactionDate.startsWith(currentMonth)
  );

  const categoryMap: Record<string, number> = {};
  let totalExpense = 0;

  for (const t of expenseTransactions) {
    const amt = Number(t.amount) || 0;
    categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
    totalExpense += amt;
  }

  const result = Object.entries(categoryMap).map(([category, amount]) => {
    const roundedAmt = Math.round(amount * 100) / 100;
    const percentage = totalExpense > 0 
      ? Math.round((amount / totalExpense) * 1000) / 10 
      : 0;
    return {
      category,
      amount: roundedAmt,
      percentage,
    };
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate academic workload and completion analytics
 */
export function calculateAcademicSummary(assignments: Assignment[]): AcademicSummary {
  const now = new Date().getTime();
  const currentMonth = new Date().toISOString().slice(0, 7);

  let totalPending = 0;
  let dueSoon = 0;
  let overdue = 0;
  let completedThisMonth = 0;
  let totalEstimatedMinutes = 0;

  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  for (const a of assignments) {
    const isCompleted = a.status === 'completed';
    const dueTime = new Date(a.dueAt).getTime();

    if (isCompleted) {
      if (a.completedAt && a.completedAt.startsWith(currentMonth)) {
        completedThisMonth++;
      } else if (!a.completedAt) {
        // Fallback count
        completedThisMonth++;
      }
    } else {
      totalPending++;
      totalEstimatedMinutes += a.estimatedMinutes || 60;

      if (dueTime < now) {
        overdue++;
      } else if (dueTime - now <= fortyEightHoursMs) {
        dueSoon++;
      }
    }
  }

  const totalAssignments = assignments.length;
  const completedTotal = assignments.filter(a => a.status === 'completed').length;
  const completionRate = totalAssignments > 0 
    ? Math.round((completedTotal / totalAssignments) * 100) 
    : 100;

  return {
    totalPending,
    dueSoon,
    overdue,
    completedThisMonth,
    completionRate,
    totalEstimatedHours: Math.round((totalEstimatedMinutes / 60) * 10) / 10,
  };
}

/**
 * Detect calendar event conflicts (CAL-06)
 * Returns a list of event IDs that have overlapping times with other events on the same day.
 */
export function detectCalendarConflicts(events: CalendarEvent[]): Set<string> {
  const conflictingIds = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    const e1 = events[i];
    const start1 = new Date(e1.startAt).getTime();
    const end1 = new Date(e1.endAt).getTime();

    for (let j = i + 1; j < events.length; j++) {
      const e2 = events[j];
      const start2 = new Date(e2.startAt).getTime();
      const end2 = new Date(e2.endAt).getTime();

      // Overlap condition: start1 < end2 && end1 > start2
      if (start1 < end2 && end1 > start2) {
        conflictingIds.add(e1.id);
        conflictingIds.add(e2.id);
      }
    }
  }

  return conflictingIds;
}
