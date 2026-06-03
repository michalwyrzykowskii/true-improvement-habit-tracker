import { Tracker, MonthlyComparison } from '../types';

// Helper to check if a date is valid
export function isValidDateStr(dateStr: string): boolean {
  return !isNaN(Date.parse(dateStr));
}

// 1. Get days in a given month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-indexed
}

// 2. Format date helper to YYYY-MM-DD
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 3. Get dates for the current calendar week (Monday to Sunday)
export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const current = new Date(referenceDate);
  const day = current.getDay();
  // Adjust so Monday is first day of the week (0: Sunday, 1: Monday, ..., 6: Saturday)
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
}

// 4. Excel calculations for a specific year and month (1-indexed month)
export interface MonthSummary {
  monthName: string;
  totalSum: number;
  monthlyAverage: number; // sum / active days (days with user entries > 0)
  overallDailyAverage: number; // sum / total days in month
  completedDays: number; // count of non-zero entries
  daysInMonth: number;
}

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getExcelMonthStats(tracker: Tracker, year: number, month: number): MonthSummary {
  const days = getDaysInMonth(year, month);
  let totalSum = 0;
  let completedDays = 0;

  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const value = tracker.entries[dateStr] || 0;
    if (value > 0) {
      totalSum += value;
      completedDays += 1;
    }
  }

  return {
    monthName: ENGLISH_MONTHS[month - 1],
    totalSum,
    monthlyAverage: completedDays > 0 ? Number((totalSum / completedDays).toFixed(1)) : 0,
    overallDailyAverage: Number((totalSum / days).toFixed(1)),
    completedDays,
    daysInMonth: days
  };
}

export function getExcelYearStats(tracker: Tracker, year: number): {
  totalSum: number;
  activeMonthsCount: number;
  yearlyAverage: number; // avg per month
} {
  let totalSum = 0;
  let activeMonthsCount = 0;

  for (let m = 1; m <= 12; m++) {
    let monthSum = 0;
    const days = getDaysInMonth(year, m);
    let hasEntries = false;

    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const val = tracker.entries[dateStr] || 0;
      if (val > 0) {
        monthSum += val;
        hasEntries = true;
      }
    }
    totalSum += monthSum;
    if (hasEntries) {
      activeMonthsCount += 1;
    }
  }

  return {
    totalSum,
    activeMonthsCount,
    yearlyAverage: activeMonthsCount > 0 ? Number((totalSum / activeMonthsCount).toFixed(1)) : 0
  };
}

// Monthly summary calculator comparing current month entries vs prior month entries
export function calculateMonthlyComparison(tracker: Tracker, referenceDate: Date = new Date()): MonthlyComparison {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-indexed

  // Calculate previous month and year
  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentDays = getDaysInMonth(currentYear, currentMonth);
  const prevDays = getDaysInMonth(prevYear, prevMonth);

  let currentMonthSum = 0;
  let currentDaysActive = 0;
  for (let d = 1; d <= currentDays; d++) {
    const key = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const val = tracker.entries[key] || 0;
    if (val > 0) {
      currentMonthSum += val;
      currentDaysActive++;
    }
  }

  let prevMonthSum = 0;
  let prevDaysActive = 0;
  for (let d = 1; d <= prevDays; d++) {
    const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const val = tracker.entries[key] || 0;
    if (val > 0) {
      prevMonthSum += val;
      prevDaysActive++;
    }
  }

  let changePercent: number | null = null;
  if (prevMonthSum > 0) {
    changePercent = Number((((currentMonthSum - prevMonthSum) / prevMonthSum) * 100).toFixed(1));
  }

  let status: 'better' | 'worse' | 'neutral' = 'neutral';
  if (currentMonthSum > prevMonthSum) status = 'better';
  else if (currentMonthSum < prevMonthSum) status = 'worse';

  const unit = tracker.unit;
  let text = '';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const curName = monthNames[currentMonth - 1];
  const prevName = monthNames[prevMonth - 1];

  if (prevMonthSum === 0 && currentMonthSum === 0) {
    text = `No activity recorded yet for ${curName} and ${prevName}. Let's make some spreadsheet entries to start analyzing!`;
  } else if (prevMonthSum === 0) {
    text = `Outstanding start for ${curName}! You have accumulated a total of ${currentMonthSum} ${unit} over ${currentDaysActive} active days.`;
  } else {
    const difference = currentMonthSum - prevMonthSum;
    const absDiff = Math.abs(difference);
    if (difference > 0) {
      text = `Excellent performance in ${curName}! You achieved ${absDiff} ${unit} more than in ${prevName} (+${changePercent}%).`;
    } else if (difference < 0) {
      text = `Slight dip in activity compared to ${prevName}. You registered ${absDiff} ${unit} less (-${changePercent !== null ? Math.abs(changePercent) : 0}%).`;
    } else {
      text = `Perfect consistency between ${curName} and ${prevName}! You achieved the exact same volume of ${currentMonthSum} ${unit}.`;
    }
  }

  return {
    currentMonthSum,
    prevMonthSum,
    changePercent,
    currentDaysActive,
    prevDaysActive,
    status,
    text
  };
}

export function getMonthlyActiveDays(tracker: Tracker, year: number, month: number): number {
  const daysInMonthTotal = getDaysInMonth(year, month);
  let active = 0;
  for (let d = 1; d <= daysInMonthTotal; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if ((tracker.entries[key] || 0) > 0) {
      active++;
    }
  }
  return active;
}
