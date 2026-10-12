import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, ChevronDown, Check, CheckSquare, Square, 
  Calendar, AlertCircle, Clock, ExternalLink, Trash2, ArrowUpDown,
  Tag, User, Eye, X
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

interface BoardTableViewProps {
  tasks: Task[];
  totalTasksCount?: number;
  columns: Column[];
  portalUsers?: { id: string; name: string; email?: string }[];
  onSelectTask: (taskId: string) => void;
  onMoveTask: (taskId: string, targetColId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onAddTask: (colId: string, title: string) => Promise<void>;
  isReadOnly?: boolean;
}

export const BoardTableView: React.FC<BoardTableViewProps> = ({
  tasks,
  totalTasksCount,
  columns,
  portalUsers = [],
  onSelectTask,
  onMoveTask,
  onToggleComplete,
  onAddTask,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCol, setFilterCol] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeColMenuTaskId, setActiveColMenuTaskId] = useState<string | null>(null);

  // New inline card state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColId, setNewColId] = useState<string>(columns[0]?.id || '');

  // Filtered & Sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search title or labels
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(term);
        const matchesLabels = (t.labels || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesLabels) return false;
      }

      // Filter Column
      if (filterCol !== 'all' && t.columnId !== filterCol) {
        return false;
      }

      // Filter Priority
      if (filterPriority !== 'all') {
        const p = (t.priority || 'medium').toLowerCase();
        if (p !== filterPriority.toLowerCase()) return false;
      }

      return true;
    });
  }, [tasks, searchTerm, filterCol, filterPriority]);

  const handleCreateInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newColId) return;
    try {
      await onAddTask(newColId, newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          High
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Medium
      </span>
    );
  };

  const getDueDateBadge = (dueDateStr?: string, completed?: boolean) => {
    if (!dueDateStr) return <span className="text-gray-400 text-xs">—</span>;
    try {
      const d = new Date(dueDateStr);
      const isPast = d.getTime() < Date.now() && !completed;
      const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (completed) {
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <Check size={12} className="text-emerald-600" /> {formatted}
          </span>
        );
      }
      if (isPast) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <Clock size={11} /> {formatted} (Overdue)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-700 font-medium">
          <Calendar size={12} className="text-gray-400" /> {formatted}
        </span>
      );
    } catch {
      return <span className="text-gray-400 text-xs">—</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 max-w-7xl mx-auto w-full pb-24 overflow-hidden">
      {/* Table Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by card title or tag..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">List:</span>
            <select
              value={filterCol}
              onChange={e => setFilterCol(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-semibold outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Lists ({tasks.length})</option>
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({tasks.filter(t => t.columnId === c.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Priority:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-semibold outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Right side stats & Add Card */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">
            Showing <strong className="text-gray-800">{filteredTasks.length}</strong> of {totalTasksCount ?? tasks.length} cards
          </span>

          {!isReadOnly && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Card
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 min-w-[240px]">Card Title</th>
                <th className="py-3 px-4 w-44">List / Column</th>
                <th className="py-3 px-4 w-32">Priority</th>
                <th className="py-3 px-4 w-40">Due Date</th>
                <th className="py-3 px-4 w-36">Assignees</th>
                <th className="py-3 px-4 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Inline Add Card Row */}
              {isAdding && (
                <tr className="bg-blue-50/50 border-b-2 border-blue-200 animate-in fade-in">
                  <td className="py-2.5 px-4 text-center">
                    <Plus size={15} className="text-blue-600 inline" />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      autoFocus
                      type="text"
                      placeholder="What needs to be done? Press Enter to save..."
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateInline(e);
                        if (e.key === 'Escape') setIsAdding(false);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-xs outline-none shadow-xs font-medium"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      value={newColId}
                      onChange={e => setNewColId(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-semibold"
                    >
                      {columns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-4 text-gray-400">Medium (Default)</td>
                  <td className="py-2.5 px-4 text-gray-400">No date</td>
                  <td className="py-2.5 px-4 text-gray-400">Unassigned</td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={handleCreateInline}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={32} className="text-gray-300" />
                      <span className="font-semibold text-gray-600 text-sm">No cards found</span>
                      <span className="text-xs text-gray-400 max-w-sm">
                        Try adjusting your search query, list selector, or priority filter to find cards.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const column = columns.find(c => c.id === task.columnId);
                  const isComplete = Boolean(task.completed);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors group ${
                        isComplete ? 'bg-gray-50/40 text-gray-500' : 'text-gray-800'
                      }`}
                    >
                      {/* Checkbox Status */}
                      <td 
                        className="py-3 px-4 text-center"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleComplete?.(task.id);
                        }}
                      >
                        <button 
                          type="button"
                          className="text-gray-400 hover:text-blue-600 transition-colors inline-flex cursor-pointer"
                        >
                          {isComplete ? (
                            <CheckSquare size={16} className="text-emerald-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Card Title */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-semibold text-xs leading-snug ${isComplete ? 'line-through text-gray-400 font-normal' : 'text-gray-900 group-hover:text-blue-600'}`}>
                            {task.title}
                          </span>
                          {task.labels && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {task.labels.split(',').filter(Boolean).map((label, lIdx) => (
                                <span key={lIdx} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                  {label.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* List / Column with quick switcher */}
                      <td className="py-3 px-4 relative" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => !isReadOnly && setActiveColMenuTaskId(activeColMenuTaskId === task.id ? null : task.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                          >
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: column?.color || '#0c66e4' }} 
                            />
                            <span>{column?.name || 'Unassigned List'}</span>
                            {!isReadOnly && <ChevronDown size={11} className="text-gray-400" />}
                          </button>

                          {activeColMenuTaskId === task.id && !isReadOnly && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveColMenuTaskId(null)} />
                              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs animate-in fade-in">
                                <div className="px-3 py-1 font-bold text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                  Move to column
                                </div>
                                {columns.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      onMoveTask(task.id, c.id);
                                      setActiveColMenuTaskId(null);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-blue-50 cursor-pointer ${
                                      c.id === task.columnId ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#0c66e4' }} />
                                      <span>{c.name}</span>
                                    </div>
                                    {c.id === task.columnId && <Check size={12} />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4">
                        {getDueDateBadge(task.due_date, task.completed)}
                      </td>

                      {/* Assignees */}
                      <td className="py-3 px-4">
                        {task.assignee_ids ? (
                          <div className="flex items-center -space-x-1.5">
                            {task.assignee_ids.split(',').filter(Boolean).map((uid, uIdx) => {
                              const user = portalUsers.find(u => String(u.id) === String(uid));
                              const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
                              return (
                                <div
                                  key={uIdx}
                                  title={user?.name || 'Assigned member'}
                                  className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white select-none uppercase shadow-2xs"
                                >
                                  {initial}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task.id);
                          }}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Open card details"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
