import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Tracker, TrackerCategory } from './types';
import { TrackingGrid } from './components/TrackingGrid';
import { CustomChart } from './components/CustomChart';
import { MonthlyReview } from './components/MonthlyReview';
import { HistoryModal } from './components/HistoryModal';
import { getExcelMonthStats, getExcelYearStats, formatDate, getMonthlyActiveDays, getDaysInMonth } from './utils/statistics';
import { getRankThemeForTracker, RANK_THEMES, RankTheme } from './utils/theme';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Music, 
  Sparkles, 
  Laptop, 
  Dumbbell, 
  FileSpreadsheet, 
  Smartphone,
  TrendingUp,
  Settings
} from 'lucide-react';

// Seeding standard high-quality demonstration trackers
const MOCK_TRACKERS: Tracker[] = [
  {
    id: 'seed-reading',
    name: 'Book Reading',
    unit: 'pages',
    category: 'reading',
    dailyGoal: null,
    createdAt: new Date(2026, 4, 15).toISOString(),
    entries: {
      '2026-05-18': 15,
      '2026-05-19': 22,
      '2026-05-20': 0,
      '2026-05-21': 25,
      '2026-05-22': 20,
      '2026-05-23': 18,
      '2026-05-24': 30,
      '2026-05-25': 22,
      '2026-05-26': 24,
      '2026-05-27': 15,
      '2026-05-28': 28,
      '2026-05-29': 35,
      '2026-05-30': 20,
    }
  },
  {
    id: 'seed-piano',
    name: 'Piano Practice',
    unit: 'minutes',
    category: 'music',
    dailyGoal: null,
    createdAt: new Date(2026, 4, 15).toISOString(),
    entries: {
      '2026-05-18': 15,
      '2026-05-19': 30,
      '2026-05-20': 45,
      '2026-05-21': 0,
      '2026-05-22': 30,
      '2026-05-23': 20,
      '2026-05-24': 35,
      '2026-05-25': 40,
      '2026-05-26': 15,
      '2026-05-27': 31,
      '2026-05-28': 60,
      '2026-05-29': 20,
      '2026-05-30': 45,
    }
  }
];

export default function App() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>('');
  // Custom dialog state to bypass iframe window.confirm block
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [showClearAllConfirmation, setShowClearAllConfirmation] = useState(false);
  
  // Create tracker form states with easy visual presets option
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('yes/no');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const PRESETS = [
    { name: 'Book Reading', category: 'reading' as TrackerCategory, unit: 'pages', emoji: '📚' },
    { name: 'Meditation', category: 'workout' as TrackerCategory, unit: 'minutes', emoji: '🧘‍♂️' },
    { name: 'Stretching', category: 'workout' as TrackerCategory, unit: 'minutes', emoji: '🤸‍♂️' },
    { name: 'Journaling', category: 'reading' as TrackerCategory, unit: 'yes/no', emoji: '✍️' },
    { name: 'Deep Work', category: 'side-hustle' as TrackerCategory, unit: 'minutes', emoji: '💻' },
    { name: 'Workout', category: 'workout' as TrackerCategory, unit: 'yes/no', emoji: '🏋️‍♂️' },
    { name: 'Running', category: 'workout' as TrackerCategory, unit: 'km', emoji: '🏃‍♂️' },
    { name: 'Water Intake', category: 'workout' as TrackerCategory, unit: 'ml', emoji: '💧' },
    { name: 'Steps', category: 'workout' as TrackerCategory, unit: 'steps', emoji: '🚶‍♂️' },
    { name: 'Sleep', category: 'social' as TrackerCategory, unit: 'hours', emoji: '🛌' },
    { name: 'No Screen Day', category: 'social' as TrackerCategory, unit: 'yes/no', emoji: '📵' },
    { name: 'No Porn', category: 'social' as TrackerCategory, unit: 'yes/no', emoji: '🙅‍♂️' },
    { name: 'No Smoke', category: 'social' as TrackerCategory, unit: 'yes/no', emoji: '🚬' },
    { name: 'No Alcohol', category: 'social' as TrackerCategory, unit: 'yes/no', emoji: '🍺' },
  ];

  const createTrackerInstantly = (name: string, category: TrackerCategory, unit: string, emoji?: string) => {
    const newTr: Tracker = {
      id: `tracker-${Date.now()}`,
      name: name,
      unit: unit,
      category: category,
      emoji: emoji,
      dailyGoal: null,
      entries: {},
      createdAt: new Date().toISOString()
    };
    const updated = [...trackers, newTr];
    saveTrackers(updated);
    setSelectedTrackerId(newTr.id);
    setIsAddingNew(false);
    setShowCustomForm(false);
    setCustomName('');
  };

  const handleCreateCustomTracker = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    createTrackerInstantly(customName.trim(), 'custom', customUnit.trim() || 'yes/no', '⚙️');
  };

  const getCategoryEmoji = (tr: Tracker) => {
    if (tr.emoji) return tr.emoji;
    switch (tr.category) {
      case 'reading': return '📚';
      case 'music': return '🎹';
      case 'side-hustle': return '💻';
      case 'workout': return '🏋️‍♂️';
      case 'language': return '🗣️';
      case 'social': return '📵';
      case 'custom': return '⚙️';
      default: return '⚙️';
    }
  };

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('excel_habit_trackers');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrackers(parsed);
          setSelectedTrackerId(parsed[0].id);
        } else {
          setTrackers(MOCK_TRACKERS);
          setSelectedTrackerId(MOCK_TRACKERS[0].id);
        }
      } catch (e) {
        setTrackers(MOCK_TRACKERS);
        setSelectedTrackerId(MOCK_TRACKERS[0].id);
      }
    } else {
      setTrackers(MOCK_TRACKERS);
      setSelectedTrackerId(MOCK_TRACKERS[0].id);
    }
  }, []);

  // Sync to LocalStorage
  const saveTrackers = (updated: Tracker[]) => {
    setTrackers(updated);
    localStorage.setItem('excel_habit_trackers', JSON.stringify(updated));
  };

  const handleUpdateTracker = (updatedTr: Tracker) => {
    const updated = trackers.map(t => t.id === updatedTr.id ? updatedTr : t);
    saveTrackers(updated);
  };

  const selectedTracker = trackers.find(t => t.id === selectedTrackerId);

  // Excel Calculations
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  const monthStats = selectedTracker 
    ? getExcelMonthStats(selectedTracker, currentYear, currentMonth) 
    : null;

  const yearStats = selectedTracker 
    ? getExcelYearStats(selectedTracker, currentYear) 
    : null;

  // Calculate current active theme from selected tracker's statistics
  const currentPercentile = (() => {
    if (!selectedTracker) return 0;
    const activeDays = getMonthlyActiveDays(selectedTracker, currentYear, currentMonth);
    const totalDaysInSpan = getDaysInMonth(currentYear, currentMonth);
    return Math.min(100, Math.max(0, (activeDays / totalDaysInSpan) * 100));
  })();

  const currentTheme = selectedTracker ? getRankThemeForTracker(currentPercentile) : RANK_THEMES[0];

  useEffect(() => {
    const classes = Array.from(document.body.classList).filter(c => c.startsWith('rank-'));
    classes.forEach(c => document.body.classList.remove(c));
    if (selectedTracker) {
      document.body.classList.add(`rank-${currentTheme.id}`);
    }
  }, [currentTheme.id, selectedTracker]);

  // Custom headers & tabs classes
  const headerBgClass = "bg-white/80 border-b border-brown-100 backdrop-blur-md";
  const logoTextClass = "text-brown-950 font-black";
  const subtitleTextClass = "text-brown-505";
  const logoBoxClass = "bg-brown-100 border border-brown-200 text-brown-700";
  
  const utilityBtnClass = "bg-brown-50 hover:bg-brown-100/80 border border-brown-150 text-brown-800";

  const tabContainerClass = "bg-white/50 border-t border-brown-100";
  
  const addGoalActiveBtn = "bg-brown-700 text-beige-50 hover:bg-brown-800";
  const addGoalInactiveBtn = "bg-brown-50 hover:bg-brown-100/80 border border-brown-150 text-brown-600 hover:text-brown-900";

  const deleteAllBtnClass = "bg-rose-50 hover:bg-rose-100/80 border border-rose-250 text-rose-700";

  // Legacy handler removed

  // Delete tracker
  const handleDeleteTracker = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDeleteTracker = (id: string) => {
    const remaining = trackers.filter(t => t.id !== id);
    setTrackers(remaining);
    localStorage.setItem('excel_habit_trackers', JSON.stringify(remaining));

    if (selectedTrackerId === id) {
      if (remaining.length > 0) {
        setSelectedTrackerId(remaining[0].id);
      } else {
        setSelectedTrackerId('');
      }
    }
    setDeleteConfirmationId(null);
  };

  // Clear all trackers to start fully fresh
  const handleClearAll = () => {
    setShowClearAllConfirmation(true);
  };

  const confirmClearAll = () => {
    setTrackers([]);
    setSelectedTrackerId('');
    localStorage.setItem('excel_habit_trackers', JSON.stringify([]));
    setShowClearAllConfirmation(false);
  };

  // Cell database edit changes
  const handleUpdateEntry = (dateStr: string, value: number) => {
    if (!selectedTrackerId) return;
    const updated = trackers.map(t => {
      if (t.id === selectedTrackerId) {
        return {
          ...t,
          entries: {
            ...t.entries,
            [dateStr]: value
          }
        };
      }
      return t;
    });
    saveTrackers(updated);
  };

  // Cell database delete changes
  const handleClearEntry = (dateStr: string) => {
    if (!selectedTrackerId) return;
    const updated = trackers.map(t => {
      if (t.id === selectedTrackerId) {
        const entriesCopy = { ...t.entries };
        delete entriesCopy[dateStr];
        return {
          ...t,
          entries: entriesCopy
        };
      }
      return t;
    });
    saveTrackers(updated);
  };



  const getCategoryIcon = (cat: TrackerCategory, size = 16) => {
    switch (cat) {
      case 'reading': return <BookOpen size={size} />;
      case 'music': return <Music size={size} />;
      case 'side-hustle': return <Laptop size={size} />;
      case 'workout': return <Dumbbell size={size} />;
      case 'language': return <BookOpen size={size} />; // fallback or other
      case 'social': return <Smartphone size={size} />;
      case 'custom': return <Settings size={size} />;
      default: return <Settings size={size} />;
    }
  };

  const getCategoryLabel = (cat: TrackerCategory) => {
    switch (cat) {
      case 'reading': return 'Book Reading';
      case 'music': return 'Music & Arts';
      case 'side-hustle': return 'Side Projects / Work';
      case 'workout': return 'Workouts & Sport';
      case 'language': return 'Languages';
      case 'social': return 'Digital Cleanse';
      case 'custom': return 'Custom Goal';
      default: return 'Custom Goal';
    }
  };

  const isPresetView = isAddingNew || trackers.length === 0;

  return (
    <div className={`min-h-screen flex flex-col bg-beige-50 text-brown-900 font-sans antialiased selection:bg-brown-200 selection:text-brown-900 transition-all duration-700 relative ${isPresetView ? 'h-screen overflow-hidden' : 'max-lg:pb-[60px] lg:h-screen lg:overflow-hidden'} ${currentTheme.pageBg} ${currentTheme.selectionBg} ${currentTheme.cardText}`}>

      {/* Sticky Header and Tab Panel Group */}
      <div className={`sticky top-0 z-40 w-full flex flex-col backdrop-blur-md shadow-3xs transition-all duration-500 ${headerBgClass}`}>
        {/* Top Professional Navigation Header - Compact */}
        <header id="main-header" className="max-w-none w-full px-5 py-2 flex flex-row items-center justify-between gap-3 select-none transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-105 ${logoBoxClass}`}>
              <TrendingUp size={16} className="stroke-[3.0]" />
            </div>
            <div>
              <h1 className={`text-xs font-black tracking-tight flex items-center gap-1 ${logoTextClass}`}>
                True Improvement Habit Tracker
              </h1>
            </div>
          </div>
        </header>

        {/* Dynamic Tab bar of active trackers/habits directly under the main header */}
        <div className={`py-1.5 px-5 select-none transition-all duration-500 ${tabContainerClass}`}>
          <div className="max-w-none w-full flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 w-full sm:w-auto">
              {trackers.map(tr => {
                const isSel = tr.id === selectedTrackerId && !isAddingNew;
                const trPercentile = (() => {
                  const activeDays = getMonthlyActiveDays(tr, currentYear, currentMonth);
                  const totalDaysInSpan = getDaysInMonth(currentYear, currentMonth);
                  return Math.min(100, Math.max(0, (activeDays / totalDaysInSpan) * 100));
                })();
                const trTheme = getRankThemeForTracker(trPercentile);

                return (
                  <button
                    key={tr.id}
                    onClick={() => {
                      setSelectedTrackerId(tr.id);
                      setIsAddingNew(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[11px] font-black transition-all active:scale-95 shrink-0 cursor-pointer ${
                      isSel
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white border-black hover:bg-neutral-100 text-black'
                    }`}
                  >
                    <span className="text-xs leading-none">{getCategoryEmoji(tr)}</span>
                    <span>{tr.name}</span>
                  </button>
                );
              })}
              
              <button
                onClick={() => setIsAddingNew(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 transition-all active:scale-95 shrink-0 text-[11px] font-black cursor-pointer ${
                  isAddingNew
                    ? 'bg-black text-white border-black'
                    : 'border-dashed border-black text-black bg-white hover:bg-neutral-50'
                }`}
              >
                <Plus size={13} className="stroke-[3]" />
                <span>Add Goal</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {trackers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`text-[10px] font-bold transition-all flex items-center gap-1 py-1 px-2.5 rounded-lg shadow-2xs ${deleteAllBtnClass}`}
                >
                  <Trash2 size={10} />
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame Layout */}
      <main 
        className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:px-8 lg:pt-3 lg:pb-14"
        style={(isAddingNew || trackers.length === 0) ? {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        } : undefined}
      >
          {isAddingNew || trackers.length === 0 ? (
            <div 
              className="max-w-[1400px] w-full bg-white border-2 border-black rounded-xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200 select-none"
              style={{ margin: '0 auto' }}
            >
              <div className="flex items-center justify-between border-b-2 border-black bg-neutral-50 p-4 sm:p-5">
                <div>
                  <h2 className="text-sm font-black text-black flex items-center gap-1.5 uppercase tracking-wider">
                    {showCustomForm ? '⚙️ Create Custom Goal' : '🎯 New Habit / Goal'}
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5 font-bold">
                    {showCustomForm ? 'Configure your custom tracking habit:' : 'Select a preset to begin tracking:'}
                  </p>
                </div>
                {showCustomForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="p-1 px-3 text-[10px] bg-white hover:bg-neutral-50 text-black rounded-lg transition-all border-2 border-black font-black cursor-pointer shadow-sm active:scale-95"
                  >
                    ← Back to Presets
                  </button>
                ) : (
                  trackers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setShowCustomForm(false);
                      }}
                      className="p-1 px-3 text-[10px] bg-white hover:bg-neutral-50 text-black rounded-lg transition-all border-2 border-black font-black cursor-pointer shadow-sm active:scale-95"
                    >
                      Cancel
                    </button>
                  )
                )}
              </div>

              <div className="px-6 pt-3 pb-10 sm:px-8 sm:pt-4 sm:pb-14 lg:pt-5 lg:pb-16 bg-white">
                {!showCustomForm ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => createTrackerInstantly(p.name, p.category, p.unit, p.emoji)}
                        className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 shadow-sm transition-all duration-200 cursor-pointer text-center group active:scale-95 min-h-[90px] sm:min-h-[110px] lg:min-h-[120px]"
                      >
                        <span className="text-2xl sm:text-3xl lg:text-4xl mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">{p.emoji}</span>
                        <span className="text-[10px] sm:text-[11px] lg:text-xs font-black text-black tracking-tight leading-4 font-mono uppercase">
                          {p.name}
                        </span>
                      </button>
                    ))}

                    {/* Custom Target Tile */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomForm(true);
                        setCustomName('');
                      }}
                      className="flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 rounded-xl border-2 border-black bg-white hover:bg-neutral-100 shadow-sm transition-all duration-200 cursor-pointer text-center group active:scale-95 min-h-[90px] sm:min-h-[110px] lg:min-h-[120px]"
                    >
                      <span className="text-2xl sm:text-3xl lg:text-4xl mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">⚙️</span>
                      <span className="text-[10px] sm:text-[11px] lg:text-xs font-black text-black tracking-tight leading-4 font-mono uppercase">
                        Custom Goal...
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center bg-white animate-in fade-in duration-200">
                    <form onSubmit={handleCreateCustomTracker} className="w-full max-w-md flex flex-col gap-3 animate-in slide-in-from-top-2 duration-250">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-black mb-1 tracking-wider">Goal Name</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Meditation, Language Practice"
                          className="w-full bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs text-black font-black outline-none focus:bg-neutral-50 transition-all font-sans"
                          required
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-black mb-1 tracking-wider">Select Tracking Unit</label>
                        <select
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-xs text-black outline-none font-black cursor-pointer focus:bg-neutral-50"
                        >
                          <option value="yes/no">✓ Daily Completion (yes/no)</option>
                          <option value="minutes">⏱️ Minutes spent</option>
                          <option value="hours">⏳ Hours spent</option>
                          <option value="count">🔢 General Count (reps/times)</option>
                          <option value="pages">📚 Pages read</option>
                          <option value="km">🏃‍♂️ Distance in Kilometers (km)</option>
                          <option value="miles">🗺️ Distance in Miles (mi)</option>
                          <option value="steps">🚶‍♂️ Step Count</option>
                          <option value="ml">💧 Water Intake (ml)</option>
                          <option value="calories">🔥 Calories Burned/Consumed</option>
                          <option value="sessions">🎯 Focused Sessions</option>
                          <option value="success">⭐ Success Index (success units)</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomForm(false)}
                          className="flex-1 bg-white hover:bg-neutral-50 border-2 border-black text-black font-black text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer uppercase font-mono tracking-wider active:scale-98"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-black hover:bg-neutral-900 border-2 border-black text-white font-black text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer uppercase font-mono tracking-wider active:scale-98"
                        >
                          Save & Track
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
            
            {selectedTracker && monthStats && yearStats ? (
              <>
                {/* Header of selected workspace with integrated mini-KPI statistics */}
                <div className="border-2 border-black bg-white rounded-xl p-2.5 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg border-2 border-black bg-neutral-50 text-black flex items-center justify-center w-8 h-8 shrink-0 transition-all">
                      {getCategoryIcon(selectedTracker.category, 15)}
                    </div>
                    <div>
                      <h2 className="text-sm font-black tracking-tight leading-none text-black mb-1">{selectedTracker.name}</h2>
                      <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 flex items-center flex-wrap gap-2">
                        <span>{selectedTracker.unit} • since {new Date(selectedTracker.createdAt).toLocaleDateString('en-US')}</span>
                        <span className="text-neutral-300">|</span>
                        <button
                          onClick={() => setIsHistoryOpen(true)}
                          className="px-2 py-0.5 border border-black bg-black hover:bg-neutral-800 text-white rounded text-[8px] font-black uppercase tracking-wider cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          History
                        </button>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTracker(selectedTracker.id)}
                    className="p-1 border border-transparent rounded-lg transition-all shrink-0 self-end sm:self-auto text-neutral-400 hover:bg-rose-50 hover:text-rose-650 hover:border-rose-100 cursor-pointer"
                    title="Delete this habit and all entries"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Tracking Journal / Sheet Grid spanning full width for a premium high density look */}
                <TrackingGrid
                  tracker={selectedTracker}
                  onUpdateEntry={handleUpdateEntry}
                  onClearEntry={handleClearEntry}
                />

                {/* 2-Column High Density Workspace Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  
                  {/* Left Column: Analytics Charts (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                    {/* Dynamic Analytics Chart */}
                    <CustomChart 
                      tracker={selectedTracker} 
                      lineColor={currentTheme.chartLineColor}
                      themeId={currentTheme.id}
                      theme={currentTheme}
                    />
                  </div>

                  {/* Right Column: Monthly Review Summary (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                    {/* Monthly Analytics Report */}
                    <MonthlyReview tracker={selectedTracker} />
                  </div>

                </div>
              </>
            ) : (
              <div className="bg-white border border-brown-100 rounded-2xl p-12 text-center text-brown-500 flex flex-col items-center justify-center gap-3 shadow-xs">
                <FileSpreadsheet size={36} className="text-brown-500 animate-bounce" />
                <h3 className="font-bold text-brown-800">Create your first goal</h3>
                <p className="text-xs max-w-sm leading-relaxed text-brown-600">
                  Use the "+ Add Goal" button at the top to start tracking immediately.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Modal for deleting a single tracker */}
      {deleteConfirmationId && (() => {
        const trToDelete = trackers.find(t => t.id === deleteConfirmationId);
        if (!trToDelete) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <Trash2 size={24} />
                </div>
                <h3 className="font-extrabold text-lg text-white">Delete Habit?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete the <strong className="text-white">"{trToDelete.name}"</strong> tracker? 
                All historical entries and acquired consistency score points will be lost forever.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmationId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors animate-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteTracker(deleteConfirmationId)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-600/10 transition-colors"
                >
                  Yes, Delete Habit
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Modal for clearing all trackers */}
      {showClearAllConfirmation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 size={24} />
              </div>
              <h3 className="font-extrabold text-lg text-white">Delete All Habits?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently erase <strong className="text-white">EVERY</strong> habit and entry history. 
              You will start with a fresh slate.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearAllConfirmation(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-600/10 transition-colors"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTracker && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          tracker={selectedTracker}
        />
      )}

    </div>
  );
}
