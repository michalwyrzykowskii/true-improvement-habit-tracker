import { useState, useMemo } from 'react';
import { Tracker } from '../types';
import { getDaysInMonth, formatDate, getWeekDates } from '../utils/statistics';
import { Activity, Percent, TrendingUp, Calendar, AlertCircle, BarChart3 } from 'lucide-react';

import { RankTheme } from '../utils/theme';

interface CustomChartProps {
  tracker: Tracker;
  lineColor?: string;
  themeId?: string;
  theme?: RankTheme;
}

type TimeRange = 'week' | 'month' | 'year';
type ChartType = 'cumulative' | 'daily';

export function CustomChart({ tracker, lineColor: defaultLineColor = '#805C43', themeId: defaultThemeId = 'wood', theme }: CustomChartProps) {
  const lineColor = theme ? theme.chartLineColor : defaultLineColor;
  const themeId = theme ? theme.id : defaultThemeId;

  const range = 'month';

  // Compute 1D time series data
  const chartData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth();

    const lastDay = getDaysInMonth(currentYear, currentMonthNum + 1);
    const currentDay = today.getDate();
    
    const rawDays = [];
    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(currentYear, currentMonthNum, i);
      const dateStr = formatDate(d);
      const val = tracker.entries[dateStr] || 0;
      const isFuture = i > currentDay;
      const isExplicitlyLogged = tracker.entries[dateStr] !== undefined;

      rawDays.push({
        label: String(i),
        fullName: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        rawValue: val,
        dateStr,
        isFuture,
        isExplicitlyLogged
      });
    }

    // Find highest index with a real entry
    let lastLoggedIndex = -1;
    for (let i = 0; i < rawDays.length; i++) {
      if (rawDays[i].isExplicitlyLogged) {
        lastLoggedIndex = i;
      }
    }
    if (lastLoggedIndex === -1) {
      // Fallback: up to today (current day index)
      lastLoggedIndex = Math.max(0, currentDay - 1);
    }

    let runningSum = 0;
    return rawDays.map((d, idx) => {
      runningSum += d.rawValue;
      return {
        ...d,
        value: runningSum,
        hasEntry: idx <= lastLoggedIndex
      };
    });
  }, [tracker]);

  // SVG Dimension configurations
  const width = 800;
  const height = 182;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 10;
  const paddingBottom = 16;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Maximum value mapping & clean integer grid lines mapping
  const { maxValue, horizontalGridLines } = useMemo(() => {
    const loggedVals = chartData.filter(d => d.hasEntry).map(d => d.value);
    const m = loggedVals.length > 0 ? Math.max(...loggedVals) : 0;
    const goal = tracker.dailyGoal || 0;
    const baseline = Math.max(m, goal);
    
    // We want to divide the Y-axis into 4 parts with clean integer ticks
    let rawMax = baseline === 0 ? 10 : baseline;
    // Add minor headspace but keep it integer
    rawMax = Math.ceil(rawMax * 1.05);
    
    const step = Math.max(1, Math.ceil(rawMax / 4));
    const cleanYMax = step * 4;
    
    const ticks = [0, step, step * 2, step * 3, cleanYMax];
    const lines = ticks.map((tickVal) => {
      const ratio = cleanYMax === 0 ? 0 : tickVal / cleanYMax;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      return { y, value: tickVal };
    });
    
    return {
      maxValue: cleanYMax,
      horizontalGridLines: lines
    };
  }, [chartData, tracker.dailyGoal, paddingTop, plotHeight]);

  // Map coordinates for line/area chart (cumulative view)
  const points = useMemo(() => {
    const len = chartData.length;
    if (len === 0) return [];

    return chartData.map((data, idx) => {
      // Scale from Day 1 (idx=0) to Day 30/31 (idx=len-1)
      const dayNum = idx + 1;
      const x = paddingLeft + (dayNum / len) * plotWidth;
      const ratio = data.value / maxValue;
      const y = paddingTop + plotHeight - ratio * plotHeight;
      return { x, y, data, idx };
    });
  }, [chartData, maxValue, plotWidth, plotHeight, paddingLeft, paddingTop]);

  // Day 0 starting point at the origin (x = paddingLeft, y = bottom of plot)
  const dayZeroPoint = useMemo(() => {
    return {
      x: paddingLeft,
      y: paddingTop + plotHeight,
      data: {
        label: '0',
        fullName: 'Start of Month',
        value: 0,
        rawValue: 0,
        dateStr: '',
        isFuture: false,
        isExplicitlyLogged: true,
        hasEntry: true
      },
      idx: -1
    };
  }, [paddingLeft, paddingTop, plotHeight]);

  // Filter points to only draw representing days that are actually logged (i.e. hasEntry === true) plus the Day 0 starting point
  const visiblePoints = useMemo(() => {
    const loggedPoints = points.filter(pt => pt.data.hasEntry);
    if (loggedPoints.length === 0) return [];
    return [dayZeroPoint, ...loggedPoints];
  }, [points, dayZeroPoint]);

  const linePath = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    return visiblePoints.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [visiblePoints]);

  const areaPath = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    const firstPt = visiblePoints[0];
    const lastPt = visiblePoints[visiblePoints.length - 1];
    return `${linePath} L ${lastPt.x} ${paddingTop + plotHeight} L ${firstPt.x} ${paddingTop + plotHeight} Z`;
  }, [visiblePoints, linePath, plotHeight, paddingTop]);

  return (
    <div
      id="chart-section"
      className={`${
        theme 
          ? `${theme.cardBg} ${theme.cardBorder} ${theme.cardText} ${theme.containerGlowClass || ''}` 
          : 'bg-white border-2 border-black text-black shadow-sm'
      } rounded-xl p-3 transition-all duration-300 h-full flex flex-col justify-between`}
    >
      
      {/* Dynamic Header */}
      <div className="flex items-baseline justify-between mb-3 border-b-2 pb-1.5 relative z-10 border-black">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-black uppercase">
          CUMULATIVE PROGRESS
        </h3>
      </div>


      {/* SVG Canvas Content Area */}
      <div className="relative flex-1 flex flex-col justify-center">
        {chartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-black rounded-xl bg-neutral-50 text-black">
            <AlertCircle className="mb-1.5 text-black" size={20} />
            <span className="text-xs font-bold">No recorded data found for this period.</span>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Gradients */}
                <linearGradient id={`chartGradient-${themeId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id={`barGradient-${themeId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id={`activeBarGradient-${themeId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#000000" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {horizontalGridLines.map((line, idx) => (
                <g key={idx} className="opacity-90">
                  <line
                     x1={paddingLeft}
                     y1={line.y}
                     x2={width - paddingRight}
                     y2={line.y}
                     stroke="rgba(0, 0, 0, 0.22)"
                     strokeWidth={1.5}
                     strokeDasharray="3 3"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={line.y + 4}
                    className="text-[10px] font-mono text-right font-black fill-[#000000]"
                    textAnchor="end"
                  >
                    {line.value}
                  </text>
                </g>
              ))}

              {/* CHART RENDERING */}
              <path d={areaPath} fill={`url(#chartGradient-${themeId})`} />
              <path
                d={linePath}
                fill="none"
                stroke="#000000"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
              />
              
              {/* Scatter Point Hot-Circles - Rendered only for logged days */}
              {visiblePoints.map((pt) => {
                if (pt.idx === -1) return null;
                return (
                  <circle
                     key={pt.idx}
                     cx={pt.x}
                     cy={pt.y}
                     r={4.5}
                     fill="#000000"
                     stroke="#FFFFFA"
                     strokeWidth={2}
                     className="transition-all"
                  />
                );
              })}

              {/* Day 0 label at the origin */}
              <text
                x={paddingLeft}
                y={paddingTop + plotHeight + 15}
                className="text-[9px] font-black font-mono text-center fill-[#000000]"
                textAnchor="middle"
              >
                0
              </text>

              {/* Dynamic Bottom X-Axis Labels */}
              {points.map((pt, idx) => {
                const dayNum = idx + 1;
                // Render every 3rd day (3, 6, 9, 12...) plus the final day of the month
                if (dayNum % 3 !== 0 && idx !== points.length - 1) return null;

                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={paddingTop + plotHeight + 15}
                    className="text-[9px] font-black font-mono text-center fill-[#000000]"
                    textAnchor="middle"
                  >
                    {pt.data.label}
                  </text>
                );
              })}
            </svg>
          </>
        )}
      </div>


    </div>
  );
}
