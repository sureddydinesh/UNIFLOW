import { CurrencyCode } from '../types';

/**
 * Format currency with appropriate symbol and locale
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  if (currency === 'INR') {
    // Format for Indian Rupee with lakh/crore grouping and ₹ symbol
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: Number.isInteger(safeAmount) ? 0 : 2,
      }).format(safeAmount);
    } catch {
      return `₹${safeAmount.toLocaleString('en-IN')}`;
    }
  }

  const localeMap: Record<CurrencyCode, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };

  try {
    return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(safeAmount) ? 0 : 2,
    }).format(safeAmount);
  } catch {
    const symbolMap: Record<CurrencyCode, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return `${symbolMap[currency] || '$'}${safeAmount.toFixed(2)}`;
  }
}

/**
 * Format date nicely e.g. "Oct 24, 2026"
 */
export function formatDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time e.g. "10:30 AM"
 */
export function formatTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time e.g. "Oct 24, 2026, 11:59 PM"
 */
export function formatDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/**
 * Calculate remaining human readable time or overdue status
 */
export function getRemainingTimeString(dueAt: string, isCompleted: boolean): { text: string; isOverdue: boolean; isDueSoon: boolean } {
  if (isCompleted) {
    return { text: 'Completed', isOverdue: false, isDueSoon: false };
  }

  const now = new Date().getTime();
  const due = new Date(dueAt).getTime();
  const diffMs = due - now;

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);

    if (overdueDays > 0) {
      return { text: `Overdue by ${overdueDays}d`, isOverdue: true, isDueSoon: false };
    }
    return { text: `Overdue by ${overdueHours}h`, isOverdue: true, isDueSoon: false };
  }

  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
  const remainingDays = Math.floor(remainingHours / 24);

  if (remainingDays > 1) {
    return { text: `Due in ${remainingDays} days`, isOverdue: false, isDueSoon: false };
  } else if (remainingDays === 1) {
    return { text: `Due tomorrow`, isOverdue: false, isDueSoon: true };
  } else if (remainingHours > 0) {
    return { text: `Due in ${remainingHours}h`, isOverdue: false, isDueSoon: true };
  } else {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return { text: `Due in ${Math.max(1, minutes)}m`, isOverdue: false, isDueSoon: true };
  }
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(transactions: any[], studentName: string): void {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Description'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.transactionDate}"`,
    `"${t.transactionType.toUpperCase()}"`,
    `"${t.category.replace(/_/g, ' ')}"`,
    t.amount,
    `"${t.paymentMethod || 'N/A'}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `uniflow_transactions_${studentName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export events and assignments to standard iCalendar (.ics) format
 */
export function exportScheduleToICS(events: any[], assignments: any[], filename = 'uniflow_schedule.ics'): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniFlow//Student Life Management Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  // Helper to format date to iCal string YYYYMMDDTHHMMSSZ
  const toICSDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  events.forEach(ev => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:ev-${ev.id}@uniflow.app`);
    lines.push(`DTSTAMP:${toICSDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${toICSDate(ev.startAt)}`);
    lines.push(`DTEND:${toICSDate(ev.endAt)}`);
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.location) lines.push(`LOCATION:${ev.location}`);
    if (ev.description) lines.push(`DESCRIPTION:${ev.description}`);
    lines.push('END:VEVENT');
  });

  assignments.forEach(asg => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:asg-${asg.id}@uniflow.app`);
    lines.push(`DTSTAMP:${toICSDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${toICSDate(asg.dueAt)}`);
    lines.push(`DTEND:${toICSDate(new Date(new Date(asg.dueAt).getTime() + 30 * 60000).toISOString())}`);
    lines.push(`SUMMARY:[DUE] ${asg.title}`);
    lines.push(`DESCRIPTION:Priority: ${asg.priority}. Status: ${asg.status}. ${asg.description || ''}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
