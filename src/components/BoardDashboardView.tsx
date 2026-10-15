import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp, 
  Users, BarChart2
} from 'lucide-react';
import type { PortalUser } from '../utils/members';

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

interface BoardDashboardViewProps {
  board: any;
  tasks: Task[];
  columns: Column[];
  portalUsers?: PortalUser[];
}

export const BoardDashboardView: React.FC<BoardDashboardViewProps> = ({
  board,
  tasks,
  columns,
  portalUsers = []
}) => {
  // Compute Key Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    let completed = 0;
    let overdue = 0;
    let highPriority = 0;
    let dueSoon = 0;

    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    tasks.forEach(t => {
      if (t.completed) {
        completed++;
      } else if (t.due_date) {
        try {
          const dueTime = new Date(t.due_date).getTime();
          if (dueTime < now) {
            overdue++;
          } else if (dueTime - now <= threeDays) {
            dueSoon++;
          }
        } catch {}
      }

      if ((t.priority || '').toLowerCase() === 'high') {
        highPriority++;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, overdue, highPriority, dueSoon, completionRate };
  }, [tasks]);

  // Chart 1: Cards per column
  const columnData = useMemo(() => {
    return columns.map(col => {
      const count = tasks.filter(t => t.columnId === col.id).length;
      return {
        name: col.name,
        cards: count,
        color: col.color || '#0c66e4'
      };
    });
  }, [columns, tasks]);

  // Chart 2: Priority breakdown
  const priorityData = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    tasks.forEach(t => {
      const p = (t.priority || 'medium').toLowerCase();
      if (p === 'high') high++;
      else if (p === 'low') low++;
      else medium++;
    });

    return [
      { name: 'High', value: high, color: '#f87168' },
      { name: 'Medium', value: medium, color: '#f5cd47' },
      { name: 'Low', value: low, color: '#579dff' },
    ].filter(item => item.value > 0);
  }, [tasks]);

  // Chart 3: Due date status breakdown
  const timelineData = useMemo(() => {
    return [
      { name: 'Completed', count: metrics.completed, color: '#10b981' },
      { name: 'Overdue', count: metrics.overdue, color: '#ef4444' },
      { name: 'Due Soon', count: metrics.dueSoon, color: '#f59e0b' },
      { name: 'On Track', count: Math.max(0, metrics.total - metrics.completed - metrics.overdue - metrics.dueSoon), color: '#3b82f6' }
    ];
  }, [metrics]);

  // Member workload breakdown
  const memberWorkload = useMemo(() => {
    const counts: { [userId: string]: number } = {};
    let unassigned = 0;

    tasks.forEach(t => {
      if (!t.assignee_ids || !t.assignee_ids.trim()) {
        unassigned++;
      } else {
        const ids = t.assignee_ids.split(',').filter(Boolean);
        ids.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
      }
    });

    const list = portalUsers.map(u => ({
      name: u.name,
      cards: counts[String(u.id)] || 0
    })).filter(u => u.cards > 0);

    if (unassigned > 0) {
      list.push({ name: 'Unassigned', cards: unassigned });
    }

    return list.sort((a, b) => b.cards - a.cards);
  }, [tasks, portalUsers]);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full pb-28 overflow-y-auto custom-scrollbar gap-4 sm:gap-6">
      {/* Header Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="text-[#0c66e4]" size={22} />
            <span>{board?.name || 'Board'} Analytics</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time delivery progress, bottleneck detection, and timeline metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs text-xs font-semibold text-gray-700">
          <TrendingUp size={14} className="text-emerald-600" />
          <span>Completion Rate: <strong className="text-gray-900 font-bold">{metrics.completionRate}%</strong></span>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Cards</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{metrics.total}</div>
            <div className="text-[11px] text-gray-400 mt-1">Across {columns.length} columns</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>

        {/* Completed Cards */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{metrics.completed}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold">{metrics.completionRate}% done</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Overdue Cards */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overdue</div>
            <div className="text-3xl font-black text-red-600 mt-1">{metrics.overdue}</div>
            <div className="text-[11px] text-red-700 mt-1 font-semibold">Needs attention</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">High Priority</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{metrics.highPriority}</div>
            <div className="text-[11px] text-gray-400 mt-1">Critical urgency</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cards per Column */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Cards by List / Column</h3>
            <span className="text-xs text-gray-400">Workflow volume</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={columnData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(12, 102, 228, 0.05)' }}
                />
                <Bar dataKey="cards" radius={[6, 6, 0, 0]}>
                  {columnData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Priority Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Priority Distribution</h3>
            <span className="text-xs text-gray-400">Card urgency ratio</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {priorityData.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No tasks with priority assigned</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-p-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Timeline & Due Date Status */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Timeline Health</h3>
            <span className="text-xs text-gray-400">Schedule adherence</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell key={`cell-t-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Workload Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              <span>Team Workload Allocation</span>
            </h3>
            <span className="text-xs text-gray-400">{memberWorkload.length} assigned members</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 space-y-2.5 custom-scrollbar pr-1">
            {memberWorkload.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 italic">
                No member assignments yet.
              </div>
            ) : (
              memberWorkload.map((m, idx) => {
                const percent = metrics.total > 0 ? Math.round((m.cards / metrics.total) * 100) : 0;
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">{m.name}</span>
                      <span className="text-gray-500 font-medium">
                        <strong>{m.cards}</strong> cards ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
