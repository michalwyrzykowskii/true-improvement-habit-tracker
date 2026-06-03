export type TrackerCategory =
  | 'reading'
  | 'music'
  | 'side-hustle'
  | 'workout'
  | 'language'
  | 'social'
  | 'custom';

export interface Tracker {
  id: string;
  name: string;
  unit: string;
  category: TrackerCategory;
  emoji?: string;
  dailyGoal: number | null;
  entries: Record<string, number>; // key YYYY-MM-DD, value is numeric input
  createdAt: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface MonthlyComparison {
  currentMonthSum: number;
  prevMonthSum: number;
  changePercent: number | null;
  currentDaysActive: number;
  prevDaysActive: number;
  status: 'better' | 'worse' | 'neutral';
  text: string;
}
