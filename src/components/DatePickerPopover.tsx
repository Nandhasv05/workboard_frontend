import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, ChevronDown } from 'lucide-react';

interface DatePickerPopoverProps {
  initialStartDate?: string | null;
  initialDueDate?: string | null;
  initialDueTime?: string | null;
  initialRecurring?: string | null;
  initialReminder?: string | null;
  onSave: (data: {
    startDate: string | null;
    dueDate: string | null;
    dueTime: string | null;
    recurring: string | null;
    reminder: string | null;
  }) => void;
  onRemove: () => void;
  onClose: () => void;
}

// Helper to convert Date to YYYY-MM-DD
function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format ISO date (YYYY-MM-DD) to D/M/YYYY
function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return iso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${day}/${month}/${year}`;
}

// Helper to parse D/M/YYYY or DD/MM/YYYY into YYYY-MM-DD
function parseDisplayDate(str: string): string | null {
  const clean = str.trim();
  const parts = clean.split(/[/\-.]/);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const monthStr = String(m).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      return `${y}-${monthStr}-${dayStr}`;
    }
  }
  return null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REMINDER_OPTIONS = [
  'None',
  'At time of due date',
  '5 Minutes before',
  '10 Minutes before',
  '15 Minutes before',
  '1 Hour before',
  '2 Hours before',
  '1 Day before',
  '2 Days before'
];

const RECURRING_OPTIONS = [
  'Never',
  'Every day',
  'Every week',
  'Every 2 weeks',
  'Every month',
  'Every year'
];

const TIME_OPTIONS = [
  '00:00', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:17', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  initialStartDate,
  initialDueDate,
  initialDueTime,
  initialRecurring,
  initialReminder,
  onSave,
  onRemove,
  onClose
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);

  // Convert raw inputs to ISO string
  const cleanIso = (val?: string | null) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return toIsoDate(d);
    } catch {}
    return '';
  };

  const initStart = cleanIso(initialStartDate);
  const initDue = cleanIso(initialDueDate) || todayIso;

  const [hasStartDate, setHasStartDate] = useState(Boolean(initialStartDate));
  const [startDateIso, setStartDateIso] = useState(initStart || todayIso);
  const [startDateInput, setStartDateInput] = useState(initStart ? formatDisplayDate(initStart) : '');

  const [hasDueDate, setHasDueDate] = useState<boolean>(initialDueDate !== undefined && initialDueDate !== null ? Boolean(initialDueDate) : true);
  const [dueDateIso, setDueDateIso] = useState(initDue);
  const [dueDateInput, setDueDateInput] = useState(formatDisplayDate(initDue));

  const [dueTime, setDueTime] = useState(initialDueTime || '10:17');
  const [recurring, setRecurring] = useState(initialRecurring || 'Never');
  const [reminder, setReminder] = useState(initialReminder || '1 Day before');

  const [activeField, setActiveField] = useState<'start' | 'due'>(hasDueDate ? 'due' : 'start');

  // Calendar View month & year
  const initialRefDate = initDue ? new Date(initDue) : today;
  const [viewYear, setViewYear] = useState(initialRefDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialRefDate.getMonth()); // 0-11

  // Month/year navigation
  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build calendar matrix (Mon-Sun layout)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    let dayOfWeek = firstDayOfMonth.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      monthType: 'prev' | 'current' | 'next';
      isoDate: string;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const iso = toIsoDate(prevDate);
      cells.push({
        day: dayNum,
        monthType: 'prev',
        isoDate: iso,
        isToday: iso === todayIso,
        isSelected: (hasDueDate && iso === dueDateIso) || (hasStartDate && iso === startDateIso),
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const curDate = new Date(viewYear, viewMonth, dayNum);
      const iso = toIsoDate(curDate);
      cells.push({
        day: dayNum,
        monthType: 'current',
        isoDate: iso,
        isToday: iso === todayIso,
        isSelected: (hasDueDate && iso === dueDateIso) || (hasStartDate && iso === startDateIso),
      });
    }

    // Trailing days from next month to fill complete grid rows (35 or 42 cells)
    const totalFilled = cells.length;
    const targetLength = totalFilled > 35 ? 42 : 35;
    let nextMonthDay = 1;
    for (let i = totalFilled; i < targetLength; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, nextMonthDay);
      const iso = toIsoDate(nextDate);
      cells.push({
        day: nextMonthDay,
        monthType: 'next',
        isoDate: iso,
        isToday: iso === todayIso,
        isSelected: (hasDueDate && iso === dueDateIso) || (hasStartDate && iso === startDateIso),
      });
      nextMonthDay++;
    }

    return cells;
  }, [viewYear, viewMonth, todayIso, hasDueDate, dueDateIso, hasStartDate, startDateIso]);

  // Handle cell click
  const handleSelectCalendarDate = (cellIso: string) => {
    if (activeField === 'start') {
      setHasStartDate(true);
      setStartDateIso(cellIso);
      setStartDateInput(formatDisplayDate(cellIso));
      if (hasDueDate && dueDateIso && cellIso > dueDateIso) {
        setDueDateIso(cellIso);
        setDueDateInput(formatDisplayDate(cellIso));
      }
    } else {
      setHasDueDate(true);
      setDueDateIso(cellIso);
      setDueDateInput(formatDisplayDate(cellIso));
      if (hasStartDate && startDateIso && cellIso < startDateIso) {
        setStartDateIso(cellIso);
        setStartDateInput(formatDisplayDate(cellIso));
      }
    }
  };

  // Toggle start date checkbox
  const handleToggleStartDate = (checked: boolean) => {
    setHasStartDate(checked);
    if (checked) {
      setActiveField('start');
      if (!startDateIso) {
        setStartDateIso(todayIso);
        setStartDateInput(formatDisplayDate(todayIso));
      }
    } else {
      setActiveField('due');
    }
  };

  // Toggle due date checkbox
  const handleToggleDueDate = (checked: boolean) => {
    setHasDueDate(checked);
    if (checked) {
      setActiveField('due');
      if (!dueDateIso) {
        setDueDateIso(todayIso);
        setDueDateInput(formatDisplayDate(todayIso));
      }
    } else if (hasStartDate) {
      setActiveField('start');
    }
  };

  // Manual input edit for start date
  const handleStartDateInputChange = (val: string) => {
    setStartDateInput(val);
    const parsed = parseDisplayDate(val);
    if (parsed) {
      setStartDateIso(parsed);
      const parts = parsed.split('-').map(Number);
      if (parts[0] !== undefined && parts[1] !== undefined) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  };

  // Manual input edit for due date
  const handleDueDateInputChange = (val: string) => {
    setDueDateInput(val);
    const parsed = parseDisplayDate(val);
    if (parsed) {
      setDueDateIso(parsed);
      const parts = parsed.split('-').map(Number);
      if (parts[0] !== undefined && parts[1] !== undefined) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  };

  const handleSave = () => {
    onSave({
      startDate: hasStartDate && startDateIso ? startDateIso : null,
      dueDate: hasDueDate && dueDateIso ? dueDateIso : null,
      dueTime: hasDueDate ? dueTime : null,
      recurring,
      reminder: hasDueDate ? reminder : null
    });
  };

  return (
    <div 
      className="w-[316px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3.5 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="relative flex items-center justify-center pb-2 mb-2 border-b border-[#091e4224]">
        <h3 className="text-sm font-semibold text-[#44546f] tracking-tight">Dates</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="absolute right-0 p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between mb-2 px-1 text-[#172b4d]">
        <div className="flex items-center gap-0.5">
          <button 
            type="button" 
            onClick={handlePrevYear}
            className="p-1 hover:bg-[#091e420f] text-[#44546f] hover:text-[#172b4d] rounded transition-colors cursor-pointer"
            title="Previous Year"
          >
            <ChevronsLeft size={14} />
          </button>
          <button 
            type="button" 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-[#091e420f] text-[#44546f] hover:text-[#172b4d] rounded transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <span className="font-semibold text-xs text-[#172b4d]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <div className="flex items-center gap-0.5">
          <button 
            type="button" 
            onClick={handleNextMonth}
            className="p-1 hover:bg-[#091e420f] text-[#44546f] hover:text-[#172b4d] rounded transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={14} />
          </button>
          <button 
            type="button" 
            onClick={handleNextYear}
            className="p-1 hover:bg-[#091e420f] text-[#44546f] hover:text-[#172b4d] rounded transition-colors cursor-pointer"
            title="Next Year"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-[#44546f] mb-1">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-0.5">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {calendarCells.map((cell, idx) => {
          const isCurrentMonth = cell.monthType === 'current';
          const isSelected = cell.isSelected;
          const isToday = cell.isToday;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectCalendarDate(cell.isoDate)}
              className={`h-7 w-full flex items-center justify-center text-xs font-normal transition-colors relative cursor-pointer rounded ${
                isSelected
                  ? 'bg-[#cce0ff] text-[#0c66e4] font-bold'
                  : isCurrentMonth
                    ? 'text-[#172b4d] hover:bg-[#091e420f]'
                    : 'text-[#8c9bab] hover:bg-[#091e420f]'
              }`}
            >
              <span className={isToday && !isSelected ? 'border-b-2 border-[#0c66e4] font-semibold text-[#0c66e4] pb-[1px]' : ''}>
                {cell.day}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Section */}
      <div className="flex flex-col gap-2.5 pt-1">
        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Start date</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={hasStartDate}
              onChange={e => handleToggleStartDate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0c66e4] focus:ring-0 cursor-pointer"
            />
            <input 
              type="text"
              placeholder="D/M/YYYY"
              value={hasStartDate ? startDateInput : ''}
              disabled={!hasStartDate}
              onFocus={() => setActiveField('start')}
              onChange={e => handleStartDateInputChange(e.target.value)}
              className={`w-32 px-2.5 py-1.5 text-xs rounded-md border outline-none font-medium transition-colors ${
                hasStartDate 
                  ? 'bg-white border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 text-[#172b4d]' 
                  : 'bg-[#091e420f] border-transparent text-[#8c9bab] cursor-not-allowed'
              }`}
            />
          </div>
        </div>

        {/* Due Date & Time */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Due date</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={hasDueDate}
              onChange={e => handleToggleDueDate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0c66e4] focus:ring-0 cursor-pointer"
            />
            <input 
              type="text"
              placeholder="D/M/YYYY"
              value={hasDueDate ? dueDateInput : ''}
              disabled={!hasDueDate}
              onFocus={() => setActiveField('due')}
              onChange={e => handleDueDateInputChange(e.target.value)}
              className={`flex-1 px-2.5 py-1.5 text-xs rounded-md border outline-none font-medium transition-colors ${
                hasDueDate 
                  ? 'bg-white border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 text-[#172b4d]' 
                  : 'bg-[#091e420f] border-transparent text-[#8c9bab] cursor-not-allowed'
              }`}
            />
            <div className="relative w-24">
              <select
                disabled={!hasDueDate}
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className={`w-full appearance-none px-2 py-1.5 pr-6 text-xs rounded-md border outline-none font-medium transition-colors ${
                  hasDueDate 
                    ? 'bg-white border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 text-[#172b4d] cursor-pointer' 
                    : 'bg-[#091e420f] border-transparent text-[#8c9bab] cursor-not-allowed'
                }`}
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#44546f] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Recurring */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Recurring</label>
          <div className="relative">
            <select
              value={recurring}
              onChange={e => setRecurring(e.target.value)}
              className="w-full appearance-none bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 pr-7 text-xs text-[#172b4d] font-medium outline-none cursor-pointer"
            >
              {RECURRING_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#44546f] pointer-events-none" />
          </div>
        </div>

        {/* Reminder */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Set due date reminder</label>
          <div className="relative">
            <select
              disabled={!hasDueDate}
              value={reminder}
              onChange={e => setReminder(e.target.value)}
              className={`w-full appearance-none bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 pr-7 text-xs text-[#172b4d] font-medium outline-none ${
                hasDueDate ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              {REMINDER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#44546f] pointer-events-none" />
          </div>
        </div>

        {/* Explanatory note */}
        <p className="text-[11px] text-[#44546f] leading-snug my-1">
          Reminders will be sent to all members and watchers of this card.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5 mt-1">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-1.5 px-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-medium rounded-md text-xs transition-colors cursor-pointer shadow-xs text-center"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-full py-1.5 px-3 bg-[#091e420f] hover:bg-[#091e4214] text-[#172b4d] font-medium rounded-md text-xs transition-colors cursor-pointer text-center"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
