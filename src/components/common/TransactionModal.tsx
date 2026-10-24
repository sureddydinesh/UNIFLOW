import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { IndianRupee, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  defaultType = 'expense',
}) => {
  const { profile, saveTransaction } = useApp();

  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [transactionDate, setTransactionDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const expenseCategories = [
    { id: 'food', label: 'Food & Cafeteria' },
    { id: 'transport', label: 'Transit & Metro' },
    { id: 'education', label: 'Books & Courseware' },
    { id: 'accommodation', label: 'Hostel & Rent' },
    { id: 'shopping', label: 'Supplies & Shopping' },
    { id: 'entertainment', label: 'Outings & Movies' },
    { id: 'utilities', label: 'Wi-Fi & Mobile Recharge' },
    { id: 'health', label: 'Health & Pharmacy' },
    { id: 'other_expense', label: 'Other Expense' },
  ];

  const incomeCategories = [
    { id: 'pocket_money', label: 'Pocket Money / Allowance' },
    { id: 'scholarship', label: 'Scholarship / Fellowship' },
    { id: 'part_time', label: 'Part-time Tutoring / Work' },
    { id: 'freelance', label: 'Freelance & Hackathon Prize' },
    { id: 'other_income', label: 'Other Income' },
  ];

  useEffect(() => {
    if (transactionToEdit) {
      setTransactionType(transactionToEdit.transactionType);
      setAmount(String(transactionToEdit.amount));
      setCategory(transactionToEdit.category);
      setTransactionDate(transactionToEdit.transactionDate);
      setPaymentMethod(transactionToEdit.paymentMethod || 'UPI');
      setDescription(transactionToEdit.description || '');
    } else {
      setTransactionType(defaultType);
      setAmount('');
      setCategory(defaultType === 'expense' ? 'food' : 'pocket_money');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setDescription('');
    }
    setError('');
  }, [transactionToEdit, defaultType, isOpen]);

  // When type toggles, adjust default category
  const handleTypeChange = (type: TransactionType) => {
    setTransactionType(type);
    if (type === 'expense' && !expenseCategories.some(c => c.id === category)) {
      setCategory('food');
    } else if (type === 'income' && !incomeCategories.some(c => c.id === category)) {
      setCategory('pocket_money');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!transactionDate) {
      setError('Please select a date.');
      return;
    }

    saveTransaction({
      id: transactionToEdit?.id,
      transactionType,
      amount: numAmount,
      category,
      transactionDate,
      paymentMethod,
      description: description.trim(),
    });

    onClose();
  };

  const currencySymbol = profile?.currency === 'INR' ? '₹' : (profile?.currency === 'USD' ? '$' : '₹');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : (transactionType === 'expense' ? 'Record Expense' : 'Record Income')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-status-error/15 border border-status-error/40 text-status-error rounded-xl">
            {error}
          </div>
        )}

        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-elevated rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              transactionType === 'expense'
                ? 'bg-status-error/20 text-status-error border border-status-error/40 shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              transactionType === 'income'
                ? 'bg-emerald-custom/20 text-emerald-custom border border-emerald-custom/40 shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Income
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Amount ({currencySymbol}) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main font-bold text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['UPI', 'Cash', 'Card', 'Net Banking'] as PaymentMethod[]).map(pm => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                  paymentMethod === pm
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-elevated border-border-subtle text-text-muted hover:border-text-muted'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Description / Memo
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Chai & evening snacks with study group"
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-glow-primary"
          >
            {transactionToEdit ? 'Save Changes' : (transactionType === 'expense' ? 'Record Expense' : 'Record Income')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
