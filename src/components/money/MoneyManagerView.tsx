import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  Search, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3 
} from 'lucide-react';
import { formatCurrency, formatDate, exportTransactionsToCSV } from '../../utils/formatters';
import { TransactionModal } from '../common/TransactionModal';
import { Transaction, TransactionType } from '../../types';
import { calculateCategoryExpenses } from '../../utils/calculations';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fadeUpVariants, 
  staggerContainerVariants, 
  cardHoverMotion, 
  AnimatedNumber, 
  EASE_PREMIUM 
} from '../../utils/motion';

export const MoneyManagerView: React.FC = () => {
  const { 
    transactions, 
    financialSummary, 
    profile, 
    savingsGoals, 
    deleteTransaction, 
    saveSavingsGoal, 
    deleteSavingsGoal, 
    updateProfile, 
    activeTheme 
  } = useApp();

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter] = useState<string>('all');
  
  // Budget edit state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState(profile?.monthlyBudget || 10000);

  // New savings goal modal state
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalProgress, setGoalProgress] = useState('');

  // Category breakdown
  const categoryExpenses = useMemo(() => {
    return calculateCategoryExpenses(transactions);
  }, [transactions]);

  const COLORS = ['#8B80FF', '#38BDF8', '#34D399', '#FBBF24', '#EC4899', '#A855F7', '#F43F5E', '#10B981'];

  // Bar chart data
  const barChartData = useMemo(() => {
    const daysMap: Record<string, { day: string; expense: number; income: number }> = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      daysMap[str] = { day: label, expense: 0, income: 0 };
      last7Days.push(str);
    }

    transactions.forEach(t => {
      if (daysMap[t.transactionDate]) {
        if (t.transactionType === 'expense') {
          daysMap[t.transactionDate].expense += t.amount;
        } else {
          daysMap[t.transactionDate].income += t.amount;
        }
      }
    });

    return last7Days.map(str => daysMap[str]);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCat) return false;
      }
      if (typeFilter !== 'all' && t.transactionType !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ monthlyBudget: Number(newBudgetLimit) || 10000 });
    setIsEditingBudget(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    saveSavingsGoal({
      title: goalTitle.trim(),
      targetAmount: Number(goalTargetAmount) || 1000,
      currentProgress: Number(goalProgress) || 0,
    });
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalProgress('');
    setIsSavingsModalOpen(false);
  };

  return (
    <motion.div 
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setTransactionToEdit(null);
        }}
        transactionToEdit={transactionToEdit}
        defaultType={defaultTxType}
      />

      {/* Header & Primary Actions */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border-subtle shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-custom/20 text-emerald-custom">
              Module D • Personal Finance
            </span>
            <span className="text-xs text-text-muted">
              Currency: {profile?.currency || 'INR (₹)'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-text-main">
            Money Manager & Budgets
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Track allowance, scholarships, cafeteria expenses, course materials, and savings goals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => exportTransactionsToCSV(transactions, profile?.fullName || 'student')}
            title="Export transactions to CSV spreadsheet (FIN-13)"
            className="px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle hover:border-primary text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-primary" /> Export CSV
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setDefaultTxType('income');
              setTransactionToEdit(null);
              setTransactionModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-custom/15 text-emerald-custom border border-emerald-custom/40 hover:bg-emerald-custom/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" /> Add Income
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setDefaultTxType('expense');
              setTransactionToEdit(null);
              setTransactionModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" /> Record Expense
          </motion.button>
        </div>
      </motion.div>

      {/* FIN-10: Budget Warning Banner if over threshold */}
      {financialSummary.budgetUtilization >= 80 && (
        <motion.div 
          variants={fadeUpVariants}
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            financialSummary.budgetUtilization >= 100
              ? 'bg-status-error/15 border-status-error/40 text-status-error'
              : 'bg-status-warning/15 border-status-warning/40 text-status-warning'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold">
                {financialSummary.budgetUtilization >= 100 
                  ? 'Budget Limit Exceeded (FIN-10 Warning)' 
                  : 'Approaching Monthly Budget Limit (80% Threshold Alert)'}
              </p>
              <p className="mt-0.5 opacity-90">
                You have spent {financialSummary.budgetUtilization}% of your configured monthly budget limit.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsEditingBudget(true)}
            className="px-3 py-1.5 rounded-lg bg-card border border-border-subtle font-semibold text-[11px] whitespace-nowrap hover:bg-elevated text-text-main"
          >
            Adjust Budget
          </motion.button>
        </motion.div>
      )}

      {/* FIN-04: Monthly Summary Cards with AnimatedNumber */}
      <motion.div 
        variants={fadeUpVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-card border border-border-subtle shadow-card relative overflow-hidden metric-card-accent-emerald card-hover">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Income</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-custom/15 text-emerald-custom flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-heading text-emerald-custom">
            <AnimatedNumber value={financialSummary.income} formatter={v => formatCurrency(v, profile?.currency)} />
          </p>
          <p className="text-[10px] text-text-muted mt-1.5">Pocket money, stipends & grants</p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-3xl bg-card border border-border-subtle shadow-card relative overflow-hidden card-hover">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-error to-transparent rounded-t-3xl opacity-70" />
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Expenses</span>
            <div className="w-9 h-9 rounded-2xl bg-status-error/15 text-status-error flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-heading text-status-error">
            <AnimatedNumber value={financialSummary.expenses} formatter={v => formatCurrency(v, profile?.currency)} />
          </p>
          <p className="text-[10px] text-text-muted mt-1.5">Recorded this calendar month</p>
        </div>

        {/* Net Cash Flow */}
        <div className="p-5 rounded-3xl bg-card border border-border-subtle shadow-card relative overflow-hidden metric-card-accent-sky card-hover">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Net Cash Flow</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold font-heading ${
            financialSummary.netCashFlow >= 0 ? 'text-emerald-custom' : 'text-status-error'
          }`}>
            <AnimatedNumber value={financialSummary.netCashFlow} formatter={v => formatCurrency(v, profile?.currency)} />
          </p>
          <p className="text-[10px] text-text-muted mt-1.5">Available operational liquidity</p>
        </div>

        {/* Budget Remaining */}
        <div className="p-5 rounded-3xl bg-card border border-border-subtle shadow-card relative overflow-hidden metric-card-accent-violet card-hover">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Budget Remaining</span>
            <button
              onClick={() => setIsEditingBudget(true)}
              className="text-[10px] text-primary font-bold hover:underline"
            >
              Edit Limit
            </button>
          </div>
          <p className={`text-2xl font-extrabold font-heading ${
            financialSummary.remainingBudget >= 0 ? 'text-text-main' : 'text-status-error'
          }`}>
            <AnimatedNumber value={financialSummary.remainingBudget} formatter={v => formatCurrency(v, profile?.currency)} />
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
              <span><strong className="text-text-main">{financialSummary.budgetUtilization}%</strong> utilized</span>
              <span>of {formatCurrency(financialSummary.monthlyBudget, profile?.currency)}</span>
            </div>
            <div className="w-full bg-elevated h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  financialSummary.budgetUtilization >= 100 
                    ? 'bg-status-error progress-striped' 
                    : financialSummary.budgetUtilization >= 80 
                    ? 'bg-status-warning' 
                    : 'bg-primary'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, financialSummary.budgetUtilization)}%` }}
                transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.15 }}
              />
            </div>
          </div>
        </div>
      </motion.div>


      {/* Edit Budget Quick Modal */}
      <AnimatePresence>
        {isEditingBudget && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_PREMIUM }}
            className="overflow-hidden p-4 rounded-2xl bg-elevated border border-primary/40 flex items-center justify-between gap-4"
          >
            <form onSubmit={handleSaveBudget} className="flex items-center gap-3 flex-1 flex-wrap">
              <label className="text-xs font-bold text-text-main">
                Set Monthly Spending Budget (₹):
              </label>
              <input
                type="number"
                step="500"
                min="1000"
                value={newBudgetLimit}
                onChange={(e) => setNewBudgetLimit(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-card border border-border-subtle text-text-main text-xs font-bold w-36"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold"
              >
                Save Budget
              </motion.button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="text-xs text-text-muted hover:text-text-main"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Analytics Charts Grid (FIN-05 & FIN-06) */}
      <motion.div 
        variants={fadeUpVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Chart 1: Expense Distribution Donut Chart with Recharts animation */}
        <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-base text-text-main flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Category Breakdown (FIN-05)
            </h3>
            <span className="text-xs text-text-muted">Monthly Proportions</span>
          </div>

          {categoryExpenses.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-muted">
              No expense records found for this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="amount"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {categoryExpenses.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => formatCurrency(Number(val), profile?.currency)}
                      contentStyle={{
                        backgroundColor: activeTheme === 'dark' ? '#182235' : '#FFFFFF',
                        borderColor: activeTheme === 'dark' ? '#30394D' : '#E5E7EF',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: activeTheme === 'dark' ? '#F8FAFC' : '#172033',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {categoryExpenses.map((item, idx) => (
                  <motion.div 
                    key={item.category} 
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between text-xs py-1 border-b border-border-subtle/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                      <span className="text-text-main capitalize">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-bold text-text-main tabular-nums">
                      {formatCurrency(item.amount, profile?.currency)} ({item.percentage}%)
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: 7-Day Income vs Spending Trend Bar Chart with smooth rising bars */}
        <div className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-base text-text-main flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-custom" />
              7-Day Cash Flow Trend (FIN-06)
            </h3>
            <span className="text-xs text-text-muted">Daily Comparison</span>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={activeTheme === 'dark' ? '#222F45' : '#E5E7EF'} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: activeTheme === 'dark' ? '#A8B3C7' : '#64748B' }} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: activeTheme === 'dark' ? '#A8B3C7' : '#64748B' }} 
                />
                <Tooltip 
                  formatter={(val: any) => formatCurrency(Number(val), profile?.currency)}
                  contentStyle={{
                    backgroundColor: activeTheme === 'dark' ? '#182235' : '#FFFFFF',
                    borderColor: activeTheme === 'dark' ? '#30394D' : '#E5E7EF',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: activeTheme === 'dark' ? '#F8FAFC' : '#172033',
                  }}
                />
                <Bar 
                  dataKey="income" 
                  fill="#34D399" 
                  radius={[4, 4, 0, 0]} 
                  name="Income"
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="expense" 
                  fill="#F87171" 
                  radius={[4, 4, 0, 0]} 
                  name="Expense"
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Savings Goals Tracker (FIN-12 P1) */}
      <motion.div 
        variants={fadeUpVariants}
        className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-text-main flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Student Savings Targets (FIN-12)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Set funds for tech hardware, exam certifications, or semester projects.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsSavingsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Goal
          </motion.button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted bg-elevated/40 rounded-2xl border border-dashed border-border-subtle">
            No active savings goals. Click "+ New Goal" to set a target!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savingsGoals.map(goal => {
              const pct = Math.min(100, Math.round((goal.currentProgress / goal.targetAmount) * 100));

              return (
                <motion.div 
                  key={goal.id} 
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.16 }}
                  className="p-4 rounded-2xl bg-elevated border border-border-subtle"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-text-main">{goal.title}</h4>
                      {goal.targetDate && (
                        <p className="text-[11px] text-text-muted">Target Date: {formatDate(goal.targetDate)}</p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="text-text-muted hover:text-status-error p-1 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-custom tabular-nums">
                      {formatCurrency(goal.currentProgress, profile?.currency)}
                    </span>
                    <span className="text-text-muted tabular-nums">
                      of {formatCurrency(goal.targetAmount, profile?.currency)} ({pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-card h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-custom h-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: EASE_PREMIUM }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Add Savings Goal Modal with AnimatePresence */}
      <AnimatePresence>
        {isSavingsModalOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE_PREMIUM }}
            className="p-5 rounded-3xl bg-card border border-primary/50 shadow-2xl max-w-md mx-auto"
          >
            <h3 className="font-heading font-bold text-base text-text-main mb-3">Create Savings Goal</h3>
            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. M4 MacBook Air Fund"
                  className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    placeholder="85000"
                    className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main tabular-nums font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    value={goalProgress}
                    onChange={(e) => setGoalProgress(e.target.value)}
                    placeholder="20000"
                    className="w-full px-3 py-2 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main tabular-nums font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-text-muted hover:bg-elevated rounded-xl"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-primary text-white rounded-xl font-semibold"
                >
                  Save Target
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIN-07: Searchable and Filterable Transaction History Table */}
      <motion.div 
        variants={fadeUpVariants}
        className="p-6 rounded-3xl bg-card border border-border-subtle shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold text-lg text-text-main">
              Transaction History (FIN-07)
            </h3>
            <p className="text-xs text-text-muted">
              {filteredTransactions.length} records found
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-main focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>
        </div>

        {/* Transactions Table with row hover */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Description</th>
                <th className="pb-3 px-3">Payment</th>
                <th className="pb-3 px-3 text-right">Amount</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isIncome = tx.transactionType === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-elevated/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-text-muted whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          isIncome 
                            ? 'bg-emerald-custom/20 text-emerald-custom' 
                            : 'bg-status-error/20 text-status-error'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-text-main">
                        {tx.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 text-text-muted max-w-xs truncate">
                        {tx.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        <span className="px-2 py-0.5 rounded bg-elevated text-[11px]">
                          {tx.paymentMethod || 'UPI'}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold text-sm tabular-nums whitespace-nowrap ${
                        isIncome ? 'text-emerald-custom' : 'text-status-error'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setTransactionToEdit(tx);
                              setTransactionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-elevated transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              if (window.confirm('Delete this transaction?')) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-elevated transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
