import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, ArrowLeft, ArrowRight, Award } from 'lucide-react';
import { Tracker } from '../types';
import { getExcelMonthStats, getExcelYearStats } from '../utils/statistics';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: Tracker;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  tracker,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  if (!isOpen) return null;

  // Compute 12 months for the selectedYear
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const stats = getExcelMonthStats(tracker, selectedYear, monthIndex);
    return stats;
  });

  // Year stats
  const yearStats = getExcelYearStats(tracker, selectedYear);

  const prevYear = () => setSelectedYear(prev => prev - 1);
  const nextYear = () => setSelectedYear(prev => prev + 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Neo-brutalist Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.35 }}
          className="relative w-full max-w-5xl lg:max-w-6xl border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col z-10 bg-white"
        >
          {/* Top Title/Frame Bar */}
          <div className="bg-black text-white px-3 py-2 border-b-4 border-black flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-yellow-400 stroke-[2.5]" />
              <span className="font-mono font-black tracking-wider uppercase text-[10px] sm:text-xs">
                GOAL RECORD BOOK &bull; ANNUAL LEDGER
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-neutral-800 border border-transparent hover:border-white rounded transition-all cursor-pointer text-white"
              title="Close window"
            >
              <X size={14} className="stroke-[3]" />
            </button>
          </div>

          {/* Modal Content - Padding and layout optimized to prevent ANY scrolling */}
          <div className="p-4 sm:p-5 lg:p-7 flex-1 flex flex-col gap-4 overflow-hidden">
            
            {/* Unified Header: Habit Name, Year Controls, and Year Sum Side-by-Side */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b-2 border-black pb-3 lg:pb-4 shrink-0">
              
              {/* Tracker Name */}
              <div className="flex-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black text-white mb-1">
                  <Award size={8} className="text-yellow-300 stroke-[2.5]" /> HISTORICALS
                </span>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-black tracking-tight leading-none uppercase">
                  {tracker.name}
                </h1>
                <p className="text-[9px] lg:text-[10px] text-neutral-500 font-black uppercase tracking-wider mt-0.5 font-mono">
                  UNIT: {tracker.unit}
                </p>
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={prevYear}
                  className="p-1 px-2 border-2 border-black bg-white hover:bg-neutral-100 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black font-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-xs lg:text-sm lg:px-3"
                  title="Previous Year"
                >
                  &larr;
                </button>
                
                <div className="px-3 py-1 border-2 border-black bg-black text-white rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-mono font-black text-xs lg:text-sm">
                  {selectedYear}
                </div>

                <button
                  onClick={nextYear}
                  className="p-1 px-2 border-2 border-black bg-white hover:bg-neutral-100 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black font-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-xs lg:text-sm lg:px-3"
                  title="Next Year"
                >
                  &rarr;
                </button>
              </div>

              {/* Compact Annual Sum Total Badge */}
              <div className="bg-yellow-100 border-2 border-black px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg flex items-center gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 self-stretch md:self-auto justify-between md:justify-start">
                <div className="text-left font-mono">
                  <div className="text-[8px] lg:text-[9px] font-black uppercase text-neutral-500 tracking-wider">ANNUAL SUM ({selectedYear})</div>
                  <div className="text-[9px] lg:text-[10px] font-black uppercase text-black">TOTAL ACCUMULATED</div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-black leading-none font-sans tracking-tight">
                  {yearStats.totalSum} <span className="text-[10px] lg:text-xs font-black text-neutral-500 uppercase">{tracker.unit}</span>
                </div>
              </div>
            </div>

            {/* 12 Months Grid: 6 columns x 2 rows on lg screen to maximize screen spatial density */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 lg:gap-4 overflow-y-auto max-h-[50vh] lg:max-h-[58vh] scrollbar-thin py-0.5">
              {monthsData.map((m, idx) => {
                const hasData = m.totalSum > 0;
                return (
                  <motion.div
                    key={m.monthName}
                    whileHover={{ y: -1 }}
                    className="border-2 border-black rounded-lg overflow-hidden shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-all bg-white min-h-[75px] lg:min-h-[110px]"
                  >
                    {/* Month header */}
                    <div className="border-b border-black px-2 py-1 lg:px-3 lg:py-1.5 font-mono font-black text-[10px] lg:text-[11px] uppercase flex items-center justify-between bg-neutral-100 text-black">
                      <span>{m.monthName}</span>
                      <span className="text-[8px] lg:text-[9px] px-1 py-0.2 bg-black text-white rounded font-bold">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Month Value Display */}
                    <div className="p-2 lg:p-3.5 flex-1 flex flex-col justify-between">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={`text-lg sm:text-xl lg:text-2xl font-black leading-none font-sans tracking-tight ${hasData ? 'text-black' : 'text-neutral-300'}`}>
                          {m.totalSum}
                        </span>
                        <span className="text-[9px] lg:text-[10px] font-sans font-black text-neutral-400 uppercase tracking-tight truncate max-w-[50px]">
                          {tracker.unit}
                        </span>
                      </div>
                      <div className="text-[8px] lg:text-[9.5px] text-neutral-400 font-bold uppercase mt-1">
                        {hasData ? `${m.completedDays} active days` : 'no activities'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>

          {/* Footer controls */}
          <div className="bg-neutral-50 border-t-2 border-black px-4 py-2 flex justify-end gap-3 select-none shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 text-black font-black text-[10px] uppercase rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all cursor-pointer"
            >
              Back to spreadsheet
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
