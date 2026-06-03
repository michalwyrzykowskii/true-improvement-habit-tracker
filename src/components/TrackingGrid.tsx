import { useState, useEffect, KeyboardEvent } from 'react';
import { Tracker } from '../types';
import { formatDate, getWeekDates } from '../utils/statistics';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, Check, Flame } from 'lucide-react';
import { RankTheme } from '../utils/theme';

interface TrackingGridProps {
  tracker: Tracker;
  onUpdateEntry: (dateStr: string, value: number) => void;
  onClearEntry: (dateStr: string) => void;
  theme?: RankTheme;
}

export function TrackingGrid({ tracker, onUpdateEntry, onClearEntry, theme }: TrackingGridProps) {
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Compute 7 days of the active week based on reference date
  const weekDates = getWeekDates(referenceDate);

  // Consecutive tracking elements streak ending today
  const currentStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const val = tracker.entries[dateStr] || 0;
      if (val > 0) {
        streak++;
      } else {
        if (i === 0) {
          continue;
        }
        break;
      }
    }
    return streak;
  })();

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    for (const date of weekDates) {
      const dateStr = formatDate(date);
      const existingVal = tracker.entries[dateStr];
      initialValues[dateStr] = existingVal !== undefined && existingVal !== 0 ? String(existingVal) : '';
    }
    setLocalValues(initialValues);
  }, [tracker.entries, referenceDate]);

  const handlePrevWeek = () => {
    const newD = new Date(referenceDate);
    newD.setDate(newD.getDate() - 7);
    setReferenceDate(newD);
  };

  const handleNextWeek = () => {
    const newD = new Date(referenceDate);
    newD.setDate(newD.getDate() + 7);
    setReferenceDate(newD);
  };

  const handleResetToCurrent = () => {
    setReferenceDate(new Date());
  };

  const handleInputChange = (dateStr: string, rawVal: string) => {
    const sanitized = rawVal.replace(/[^0-9.]/g, '');
    setLocalValues(prev => ({
      ...prev,
      [dateStr]: sanitized
    }));
  };

  const handleInputBlur = (dateStr: string) => {
    const rawVal = localValues[dateStr];
    if (rawVal === '') {
      onClearEntry(dateStr);
    } else {
      const parsed = parseFloat(rawVal);
      if (!isNaN(parsed)) {
        onUpdateEntry(dateStr, parsed);
      }
    }
  };

  // Keyboard navigation for focus
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`week-day-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      } else {
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === 'ArrowRight') {
      const nextInput = document.getElementById(`week-day-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`week-day-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  // Human friendly week range labels
  const startRangeStr = weekDates[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const endRangeStr = weekDates[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div 
      id="grid-container" 
      className={`${
        theme 
          ? `${theme.cardBg} ${theme.cardBorder} ${theme.cardText} ${theme.containerGlowClass || ''}` 
          : 'bg-white border-2 border-black text-black shadow-sm'
      } rounded-xl overflow-hidden select-none`}
    >

      {/* Grid Header with controls */}
      <div className={`py-1.5 px-2 sm:py-2.5 sm:px-3.5 border-b-2 border-black flex flex-row items-center justify-between gap-1.5 sm:gap-3 ${
        theme 
          ? `${theme.cardHeaderBg}` 
          : 'bg-neutral-50 border-b-2 border-black text-black'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`p-0.5 sm:p-1 border-2 border-black rounded-lg shrink-0 ${
            theme 
              ? `${theme.innerTileBg} ${theme.textClass}` 
              : 'bg-neutral-100 text-black'
          }`}>
            <Calendar size={11} className="text-black sm:hidden" />
            <Calendar size={14} className="text-black hidden sm:block" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[10.5px] sm:text-xs font-black leading-tight text-black">Weekly Log</h3>
              {currentStreak > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10.5px] sm:text-xs font-black tracking-wider uppercase leading-none select-none transition-all duration-300 bg-red-500 border-2 border-black text-black">
                  <Flame 
                    size={13} 
                    className="stroke-[3.0] text-black fill-black" 
                  />
                  <span>{currentStreak}D</span>
                </div>
              )}
            </div>
            <p className="text-[8.5px] sm:text-[10px] font-bold leading-none mt-0.5 text-black">Quick log</p>
          </div>
        </div>

        {/* Pager & Action controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleResetToCurrent}
            className={`py-0.5 px-1.5 sm:py-1 sm:px-2 text-[9px] sm:text-[10px] font-bold border-2 border-black rounded-lg transition-all flex items-center gap-0.5 sm:gap-1 active:scale-95 shadow-sm cursor-pointer ${
              theme 
                ? `${theme.innerTileBg} ${theme.textClass}` 
                : 'text-black bg-white hover:bg-neutral-100'
            }`}
            title="Return to current week"
          >
            <RotateCcw size={8} className="sm:hidden" />
            <RotateCcw size={10} className="hidden sm:inline" />
            <span className="hidden sm:inline">Today</span>
          </button>

          <div className={`flex items-center gap-0.5 border-2 border-black p-0.5 rounded-lg shadow-sm ${
            theme 
              ? `${theme.innerTileBg}` 
              : 'bg-white font-mono'
          }`}>
            <button
              onClick={handlePrevWeek}
              className="p-0.5 sm:p-1 rounded transition-colors cursor-pointer text-black hover:bg-neutral-105"
              title="Previous week"
            >
              <ChevronLeft size={10} className="stroke-[2.5] sm:hidden" />
              <ChevronLeft size={12} className="stroke-[2.5] hidden sm:block" />
            </button>
            <span className="text-[8.5px] sm:text-[10px] font-black min-w-[90px] sm:min-w-[125px] text-center font-mono tracking-tight text-black">
              {startRangeStr} - {endRangeStr}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-0.5 sm:p-1 rounded transition-colors cursor-pointer text-black hover:bg-neutral-105"
              title="Next week"
            >
              <ChevronRight size={10} className="stroke-[2.5] sm:hidden" />
              <ChevronRight size={12} className="stroke-[2.5] hidden sm:block" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal row of 7 days */}
      <div className="p-1 sm:p-2.5 bg-transparent">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
          {weekDates.map((date, index) => {
            const dateStr = formatDate(date);
            const val = tracker.entries[dateStr] || 0;
            const isToday = formatDate(new Date()) === dateStr;

            const shortWeekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const shortDayName = shortWeekdaysEn[date.getDay()];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const displayDayStr = String(date.getDate()).padStart(2, '0');
            const displayMonthStr = String(date.getMonth() + 1).padStart(2, '0');

            const isBinary = tracker.category === 'social' || 
                             tracker.unit === 'success' || 
                             tracker.unit === 'successes' || 
                             tracker.unit === 'yes/no' || 
                             tracker.unit === 'sukces' || 
                             tracker.unit === 'sukcesy' || 
                             tracker.unit === 'tak/nie';

            return (
              <div
                key={dateStr}
                className={`flex flex-col border-2 rounded-lg sm:rounded-xl p-1 sm:p-2.5 transition-all relative ${
                  val > 0
                    ? theme
                      ? `${theme.innerTileBg} ${theme.cardBorder} shadow-sm`
                      : isBinary 
                        ? 'bg-emerald-50 border-2 border-black text-black shadow-sm'
                        : 'bg-neutral-50 border-2 border-black text-black shadow-sm'
                    : isToday
                      ? theme
                        ? `bg-amber-400/20 border-2 border-amber-500 ring-1 ring-amber-450`
                        : 'bg-neutral-100 border-2 border-black ring-1 ring-neutral-300'
                      : theme
                        ? `${theme.cardBg} ${theme.innerTileBorder} hover:brightness-110`
                        : 'bg-white border-2 border-black hover:bg-neutral-50'
                }`}
              >

                {/* Header of the day */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-1 mb-1 sm:mb-2 text-center">
                  <span className={`text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight ${
                    isWeekend ? 'text-red-650' : 'text-neutral-900'
                  }`}>
                    <span className="sm:hidden">{shortDayName[0]}</span>
                    <span className="hidden sm:inline">{shortDayName}</span>
                  </span>
                  
                  <span className={`text-[8px] sm:text-[10px] font-mono font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded border-2 border-black ${
                    isToday 
                      ? 'bg-amber-400 text-black shadow-3xs' 
                      : 'bg-neutral-100 text-black shadow-3xs'
                  }`}>
                    <span className="sm:hidden">{displayDayStr}</span>
                    <span className="hidden sm:inline">{displayDayStr}.{displayMonthStr}</span>
                  </span>
                </div>

                {/* Input slot or Toggle button */}
                <div className="relative flex items-center justify-center my-0.5 sm:my-1.5 h-6 sm:h-8">
                  {isBinary ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (val > 0) {
                          onClearEntry(dateStr);
                        } else {
                          onUpdateEntry(dateStr, 1);
                        }
                      }}
                      className={`w-full h-6 sm:h-8 rounded-md sm:rounded-lg border-2 border-black flex items-center justify-center transition-all duration-305 font-black text-[9px] sm:text-xs select-none cursor-pointer ${
                        val > 0
                          ? theme 
                            ? `${theme.primaryButton} shadow-sm`
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : theme
                            ? `${theme.innerTileBg} ${theme.textClass} hover:bg-neutral-100`
                            : 'bg-white hover:bg-neutral-50 text-black'
                      }`}
                      title={val > 0 ? "Mark as uncompleted" : "Mark as success!"}
                    >
                      {val > 0 ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <Check size={9} className="stroke-[3.5] sm:hidden" />
                          <Check size={11} className="stroke-[3.5] hidden sm:block" />
                          <span className="hidden sm:inline">Done</span>
                        </div>
                      ) : (
                        <span className="font-extrabold">+</span>
                      )}
                    </button>
                  ) : (
                    <input
                      id={`week-day-input-${index}`}
                      type="text"
                      inputMode="decimal"
                      className={`w-full h-6 sm:h-8 py-0.5 px-0.5 sm:py-1 sm:px-2 text-[10px] sm:text-sm font-mono text-center border-2 border-black rounded-md sm:rounded-lg outline-none transition-all ${
                        val > 0
                          ? 'bg-white text-black font-black focus:ring-1 focus:ring-black'
                          : 'bg-white text-black focus:ring-1 focus:ring-black'
                      }`}
                      placeholder="—"
                      value={localValues[dateStr] ?? ''}
                      onChange={(e) => handleInputChange(dateStr, e.target.value)}
                      onBlur={() => handleInputBlur(dateStr)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                  )}
                </div>

                {/* Bottom state indicator */}
                <div className="text-center h-3 sm:h-4 flex items-center justify-center overflow-hidden">
                  {val > 0 ? (
                    <span className="text-[7.5px] sm:text-[9px] font-black leading-none truncate block max-w-full text-black">
                      {isBinary ? (
                        tracker.category === 'social' ? (
                          <span className="sm:hidden">No</span>
                        ) : (
                          <span className="sm:hidden">Yes</span>
                        )
                      ) : (
                        `${val}`
                      )}
                      {isBinary && (
                        <span className="hidden sm:inline">
                          {tracker.category === 'social' ? 'No Social' : 'Completed'}
                        </span>
                      )}
                      {!isBinary && <span className="hidden sm:inline ml-0.5 text-[7px] text-neutral-500">{tracker.unit}</span>}
                    </span>
                  ) : (
                    <span className="text-[7.5px] sm:text-[9px] font-semibold sm:font-bold leading-none text-neutral-400">
                      Empty
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Spreadsheet footer */}
      <div className={`py-1 px-3 border-t-2 border-black flex items-center justify-between ${
        theme 
          ? `${theme.cardHeaderBg}` 
          : 'bg-neutral-50 text-black'
      }`}>
        <span className="text-[8px] font-mono text-black font-bold">
          Autosave active
        </span>
        {tracker.dailyGoal && (
          <span className="text-[8px] font-black text-black">
            Goal: {tracker.dailyGoal}
          </span>
        )}
      </div>
    </div>
  );
}
