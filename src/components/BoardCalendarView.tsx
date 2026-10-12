import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, 
  Check, CheckSquare, Clock, Filter, Eye, X, List, Layers, Tag
} from 'lucide-react';

interface Task {
  id: string;
  board_id: string;
  columnId: string;
  projectId: string;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assignee_ids?: string;
  labels?: string;
  completed?: boolean;
}

interface Column {
  id: string;
  name: string;
  color?: string;
}

interface BoardCalendarViewProps {
  tasks: Task[];
  columns: Column[];
  portalUsers?: { id: string; name: string; email?: string }[];
  onSelectTask: (taskId: string) => void;
  onAddTaskWithDate: (dateStr: string, title: string) => Promise<void>;
  isReadOnly?: boolean;
}

export const BoardCalendarView: React.FC<BoardCalendarViewProps> = ({
  tasks,
  columns,
  portalUsers = [],
  onSelectTask,
  onAddTaskWithDate,
  isReadOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [addingOnDate, setAddingOnDate] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Separate scheduled vs unscheduled
  const { scheduledTasksMap, unscheduledTasks } = useMemo(() => {
    const map: { [dateStr: string]: Task[] } = {};
    const unscheduled: Task[] = [];

    tasks.forEach(task => {
      if (!task.due_date) {
        unscheduled.push(task);
        return;
      }
      try {
        const d = new Date(task.due_date);
        if (isNaN(d.getTime())) {
          unscheduled.push(task);
          return;
        }
        // Normalize to YYYY-MM-DD
        const dateStr = d.toISOString().split('T')[0];
        if (dateStr) {
          if (!map[dateStr]) map[dateStr] = [];
          map[dateStr].push(task);
        } else {
          unscheduled.push(task);
        }
      } catch {
        unscheduled.push(task);
      }
    });

    return { scheduledTasksMap: map, unscheduledTasks: unscheduled };
  }, [tasks]);

  // Calendar dates generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0] ?? '';
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split('T')[0] ?? '';
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill grid to full weeks (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(year, month + 1, d);
        const dateStr = nextDate.toISOString().split('T')[0] ?? '';
        days.push({
          dateStr,
          dayNum: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr
        });
      }
    }

    return days;
  }, [year, month]);

  const handleCreateOnDate = async (dateStr: string) => {
    if (!newCardTitle.trim()) return;
    try {
      await onAddTaskWithDate(dateStr, newCardTitle.trim());
      setNewCardTitle('');
      setAddingOnDate(null);
    } catch (err) {
      console.error(err);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col p-5 max-w-7xl mx-auto w-full pb-24 overflow-hidden">
      {/* Calendar Top Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1 hover:bg-white rounded-lg text-xs font-bold text-gray-800 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-base font-extrabold text-gray-900 tracking-tight ml-2">
            {monthName}
          </h2>
        </div>

        {/* Right side stats & Toggle Unscheduled */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowUnscheduled(!showUnscheduled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showUnscheduled
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock size={13} className="text-gray-500" />
            <span>Unscheduled cards ({unscheduledTasks.length})</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Day Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-bold text-gray-500 py-2.5 uppercase tracking-wider">
            {dayNames.map((d, i) => (
              <div key={i} className={i === 0 || i === 6 ? 'text-gray-400' : 'text-gray-700'}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar divide-x divide-y divide-gray-100">
            {calendarDays.map((day, idx) => {
              const dayTasks = scheduledTasksMap[day.dateStr] || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors group relative ${
                    !day.isCurrentMonth ? 'bg-gray-50/40 text-gray-400' : 'bg-white hover:bg-blue-50/20'
                  }`}
                >
                  {/* Date Header inside cell */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full select-none ${
                        day.isToday
                          ? 'bg-[#0c66e4] text-white font-bold ring-2 ring-blue-100 shadow-2xs'
                          : day.isCurrentMonth
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {!isReadOnly && day.isCurrentMonth && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingOnDate(day.dateStr);
                          setNewCardTitle('');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 rounded text-gray-500 transition-opacity cursor-pointer"
                        title="Add card on this date"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>

                  {/* Tasks List on this date */}
                  <div className="flex flex-col gap-1 overflow-y-auto flex-1 max-h-24 custom-scrollbar">
                    {dayTasks.map(task => {
                      const col = columns.find(c => c.id === task.columnId);
                      const isComplete = Boolean(task.completed);

                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task.id)}
                          className={`px-1.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-all shadow-2xs truncate flex items-center gap-1.5 ${
                            isComplete
                              ? 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                              : 'bg-white hover:bg-blue-50 text-gray-800 border-gray-200 hover:border-blue-400'
                          }`}
                          title={`${task.title} (${col?.name || 'List'})`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: col?.color || '#0c66e4' }}
                          />
                          <span className="truncate flex-1">{task.title}</span>
                          {isComplete && <Check size={10} className="text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}

                    {/* Inline add box */}
                    {addingOnDate === day.dateStr && (
                      <div className="p-1 bg-white border border-blue-400 rounded-lg shadow-md animate-in fade-in">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Card title..."
                          value={newCardTitle}
                          onChange={e => setNewCardTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateOnDate(day.dateStr);
                            if (e.key === 'Escape') setAddingOnDate(null);
                          }}
                          className="w-full text-xs p-1 outline-none font-semibold text-gray-800"
                        />
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCreateOnDate(day.dateStr)}
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingOnDate(null)}
                            className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled Cards Drawer */}
        {showUnscheduled && (
          <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3 shrink-0 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                <Clock size={14} className="text-amber-500" />
                <span>Unscheduled Cards</span>
              </div>
              <button onClick={() => setShowUnscheduled(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              Cards without a due date. Click any card to open details and assign a timeline.
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
              {unscheduledTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 italic">
                  All cards are scheduled!
                </div>
              ) : (
                unscheduledTasks.map(task => {
                  const col = columns.find(c => c.id === task.columnId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-1"
                    >
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col?.color || '#0c66e4' }} />
                        <span>{col?.name || 'List'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
