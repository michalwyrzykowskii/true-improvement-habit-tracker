import { Tracker } from '../types';
import { getExcelMonthStats, getExcelYearStats } from '../utils/statistics';
import { Award } from 'lucide-react';
import { RankTheme } from '../utils/theme';

interface MonthlyReviewProps {
  tracker: Tracker;
  theme?: RankTheme;
}

export function MonthlyReview({ tracker, theme }: MonthlyReviewProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1; // 1-indexed

  const monthStats = getExcelMonthStats(tracker, currentYear, currentMonthNum);
  const yearStats = getExcelYearStats(tracker, currentYear);

  const ENGLISH_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = ENGLISH_MONTHS[currentMonthNum - 1];

  return (
    <div 
      id="monthly-review-card" 
      className={`${
        theme 
          ? `${theme.cardBg} ${theme.cardBorder} ${theme.cardText} ${theme.containerGlowClass || ''}` 
          : 'bg-white border-2 border-black text-black'
      } rounded-xl p-3 shadow-sm relative overflow-hidden select-none transition-all duration-350 h-full flex flex-col justify-between`}
    >
      {/* Background radial accent flare */}
      {!theme && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-black/5 rounded-full blur-2xl pointer-events-none" />
      )}
 
      {/* Title Header */}
      <div className="flex items-baseline justify-between mb-3 border-b-2 pb-1.5 relative z-10 border-black">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-black uppercase">
          REPORT
        </h3>
        <span className="text-xs sm:text-sm text-black font-black font-mono uppercase">
          {currentMonthName} {currentYear}
        </span>
      </div>

      {/* Score Grid with the 3 relocated metrics - side-by-side on all screens to stay compact */}
      <div className="flex-1 grid grid-cols-3 gap-2 pt-2 relative z-10">
        {/* Metric 1: Month Total */}
        <div className={`rounded-xl p-2 sm:p-3 flex flex-col justify-between border-2 border-black h-full transition-all ${
          theme 
            ? `${theme.innerTileBg}` 
            : 'bg-neutral-50 hover:bg-neutral-100/50'
        }`}>
          <div>
            <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight text-black block leading-tight">
              Month Sum
            </span>
            <p className="text-[7.5px] sm:text-[9px] text-neutral-500 font-extrabold leading-none mt-0.5">Sum this month</p>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-black leading-none font-sans tracking-tight">
              {monthStats.totalSum}
            </div>
            <span className="text-[8px] sm:text-[10px] font-sans font-black text-neutral-500 uppercase tracking-wider block mt-0.5 sm:mt-1 truncate">
              {tracker.unit}
            </span>
          </div>
        </div>

        {/* Metric 2: Daily Average */}
        <div className={`rounded-xl p-2 sm:p-3 flex flex-col justify-between border-2 border-black h-full transition-all ${
          theme 
            ? `${theme.innerTileBg}` 
            : 'bg-neutral-50 hover:bg-neutral-100/50'
        }`}>
          <div>
            <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight text-black block leading-tight">
              Daily Avg
            </span>
            <p className="text-[7.5px] sm:text-[9px] text-neutral-500 font-extrabold leading-none mt-0.5">Active days avg</p>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-black leading-none font-sans tracking-tight">
              {monthStats.monthlyAverage}
            </div>
            <span className="text-[8px] sm:text-[10px] font-sans font-black text-neutral-500 uppercase tracking-wider block mt-0.5 sm:mt-1 truncate">
              {tracker.unit}/day
            </span>
          </div>
        </div>

        {/* Metric 3: Year Total */}
        <div className={`rounded-xl p-2 sm:p-3 flex flex-col justify-between border-2 border-black h-full transition-all ${
          theme 
            ? `${theme.innerTileBg}` 
            : 'bg-neutral-50 hover:bg-neutral-100/50'
        }`}>
          <div>
            <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight text-black block leading-tight">
              Year Total
            </span>
            <p className="text-[7.5px] sm:text-[9px] text-neutral-500 font-extrabold leading-none mt-0.5 font-mono">Accumulated</p>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-black leading-none font-sans tracking-tight">
              {yearStats.totalSum}
            </div>
            <span className="text-[8px] sm:text-[10px] font-sans font-black text-neutral-500 uppercase tracking-wider block mt-0.5 sm:mt-1 truncate">
              {tracker.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
