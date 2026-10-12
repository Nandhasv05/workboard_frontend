import React, { useState } from 'react';
import { 
  X, Search, User, Clock, Calendar, Tag, ChevronDown, Check, 
  AlertCircle, CheckCircle2
} from 'lucide-react';

export interface BoardFilterState {
  keyword: string;
  members: {
    noMembers: boolean;
    assignedToMe: boolean;
    selectedUserIds: string[];
  };
  cardStatus: {
    markedComplete: boolean;
    notMarkedComplete: boolean;
  };
  dueDate: {
    noDates: boolean;
    overdue: boolean;
    nextDay: boolean;
    nextWeek: boolean;
    nextMonth: boolean;
  };
  labels: {
    noLabels: boolean;
    selectedColors: string[];
  };
  activity: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastFourWeeks: boolean;
    withoutActivity: boolean;
  };
  collapseEmptyLists: boolean;
  matchMode: 'any' | 'all';
}

export const INITIAL_FILTER_STATE: BoardFilterState = {
  keyword: '',
  members: {
    noMembers: false,
    assignedToMe: false,
    selectedUserIds: [],
  },
  cardStatus: {
    markedComplete: false,
    notMarkedComplete: false,
  },
  dueDate: {
    noDates: false,
    overdue: false,
    nextDay: false,
    nextWeek: false,
    nextMonth: false,
  },
  labels: {
    noLabels: false,
    selectedColors: [],
  },
  activity: {
    lastWeek: false,
    lastTwoWeeks: false,
    lastFourWeeks: false,
    withoutActivity: false,
  },
  collapseEmptyLists: false,
  matchMode: 'any',
};

interface BoardFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: BoardFilterState;
  onChange: (newFilters: BoardFilterState) => void;
  onClear: () => void;
  portalUsers?: { id: string; name: string; email?: string }[];
  currentUserId?: string;
  totalCardsCount?: number;
  filteredCardsCount?: number;
}

const PRESET_LABEL_BARS = [
  { name: 'Green', color: '#4bce97', pattern: 'stripe-diagonal' },
  { name: 'Yellow', color: '#f5cd47', pattern: 'wave' },
  { name: 'Orange', color: '#fea362', pattern: 'stripe-vertical' },
  { name: 'Red', color: '#f87168', pattern: 'dots' },
  { name: 'Purple', color: '#9f8fef', pattern: 'checkered' },
  { name: 'Blue', color: '#579dff', pattern: 'solid' },
];

export const BoardFilterDrawer: React.FC<BoardFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onClear,
  portalUsers = [],
  currentUserId,
  totalCardsCount = 0,
  filteredCardsCount = 0
}) => {
  if (!isOpen) return null;

  const handleToggleColor = (color: string) => {
    const exists = filters.labels.selectedColors.includes(color);
    const nextColors = exists 
      ? filters.labels.selectedColors.filter(c => c !== color)
      : [...filters.labels.selectedColors, color];
    onChange({
      ...filters,
      labels: {
        ...filters.labels,
        selectedColors: nextColors
      }
    });
  };

  const hasActiveFilters = 
    Boolean(filters.keyword.trim()) ||
    filters.members.noMembers ||
    filters.members.assignedToMe ||
    filters.members.selectedUserIds.length > 0 ||
    filters.cardStatus.markedComplete ||
    filters.cardStatus.notMarkedComplete ||
    filters.dueDate.noDates ||
    filters.dueDate.overdue ||
    filters.dueDate.nextDay ||
    filters.dueDate.nextWeek ||
    filters.dueDate.nextMonth ||
    filters.labels.noLabels ||
    filters.labels.selectedColors.length > 0 ||
    filters.activity.lastWeek ||
    filters.activity.lastTwoWeeks ||
    filters.activity.lastFourWeeks ||
    filters.activity.withoutActivity;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-out Drawer */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[340px] max-w-full bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col font-sans select-none animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172b4d]">Filter</h3>
            {hasActiveFilters && (
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {filteredCardsCount} of {totalCardsCount} cards
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <button 
                type="button" 
                onClick={onClear}
                className="text-xs text-[#0c66e4] hover:underline mr-2 font-semibold cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close filter"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 text-xs text-[#172b4d] custom-scrollbar">
          
          {/* 1. Keyword */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[11px] text-[#44546f]">Keyword</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter a keyword..."
                value={filters.keyword}
                onChange={e => onChange({ ...filters, keyword: e.target.value })}
                className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-3 py-1.5 text-xs text-[#172b4d] outline-none transition-all placeholder:text-[#626f86]"
              />
            </div>
            <span className="text-[11px] text-[#626f86]">
              Search cards, members, labels, and more.
            </span>
          </div>

          {/* 2. Members */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[11px] text-[#44546f]">Members</label>
            
            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.members.noMembers}
                onChange={e => onChange({
                  ...filters,
                  members: { ...filters.members, noMembers: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[#626f86]"><User size={14} /></span>
              <span className="text-xs">No members</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.members.assignedToMe}
                onChange={e => onChange({
                  ...filters,
                  members: { ...filters.members, assignedToMe: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <div className="w-5 h-5 rounded-full bg-[#1f845a] text-white font-bold flex items-center justify-center text-[10px] shrink-0 uppercase">
                M
              </div>
              <span className="text-xs font-medium">Cards assigned to me</span>
            </label>
          </div>

          {/* 3. Card status */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[11px] text-[#44546f]">Card status</label>
            
            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.cardStatus.markedComplete}
                onChange={e => onChange({
                  ...filters,
                  cardStatus: { ...filters.cardStatus, markedComplete: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Marked as complete</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.cardStatus.notMarkedComplete}
                onChange={e => onChange({
                  ...filters,
                  cardStatus: { ...filters.cardStatus, notMarkedComplete: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Not marked as complete</span>
            </label>
          </div>

          {/* 4. Due date */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[11px] text-[#44546f]">Due date</label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.dueDate.noDates}
                onChange={e => onChange({
                  ...filters,
                  dueDate: { ...filters.dueDate, noDates: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Calendar size={14} className="text-[#626f86]" />
              <span className="text-xs">No dates</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.dueDate.overdue}
                onChange={e => onChange({
                  ...filters,
                  dueDate: { ...filters.dueDate, overdue: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">!</div>
              <span className="text-xs">Overdue</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.dueDate.nextDay}
                onChange={e => onChange({
                  ...filters,
                  dueDate: { ...filters.dueDate, nextDay: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Clock size={14} className="text-amber-500" />
              <span className="text-xs">Due in the next day</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.dueDate.nextWeek}
                onChange={e => onChange({
                  ...filters,
                  dueDate: { ...filters.dueDate, nextWeek: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Clock size={14} className="text-[#626f86]" />
              <span className="text-xs">Due in the next week</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.dueDate.nextMonth}
                onChange={e => onChange({
                  ...filters,
                  dueDate: { ...filters.dueDate, nextMonth: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Clock size={14} className="text-[#626f86]" />
              <span className="text-xs">Due in the next month</span>
            </label>
          </div>

          {/* 5. Labels (Colorblind pattern bars - Screenshot 5) */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[11px] text-[#44546f]">Labels</label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.labels.noLabels}
                onChange={e => onChange({
                  ...filters,
                  labels: { ...filters.labels, noLabels: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <Tag size={14} className="text-[#626f86]" />
              <span className="text-xs">No labels</span>
            </label>

            {/* Color Swatch Bars with accessibility patterns */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              {PRESET_LABEL_BARS.map(bar => {
                const isSelected = filters.labels.selectedColors.includes(bar.color) || 
                  filters.labels.selectedColors.includes(bar.name.toLowerCase());
                return (
                  <div 
                    key={bar.name}
                    onClick={() => handleToggleColor(bar.color)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 pointer-events-none"
                    />
                    <div 
                      style={{ backgroundColor: bar.color }}
                      className="flex-1 h-6 rounded-md shadow-2xs group-hover:opacity-90 transition-opacity flex items-center justify-between px-2 text-white font-mono text-[10px] tracking-widest font-black"
                    >
                      {bar.pattern === 'stripe-diagonal' && <span>///</span>}
                      {bar.pattern === 'wave' && <span>∿∿∿</span>}
                      {bar.pattern === 'stripe-vertical' && <span>|||</span>}
                      {bar.pattern === 'dots' && <span>:::</span>}
                      {bar.pattern === 'checkered' && <span>▦▦</span>}
                      {bar.pattern === 'solid' && <span />}
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Activity */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[11px] text-[#44546f]">Activity</label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.activity.lastWeek}
                onChange={e => onChange({
                  ...filters,
                  activity: { ...filters.activity, lastWeek: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Active in the last week</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.activity.lastTwoWeeks}
                onChange={e => onChange({
                  ...filters,
                  activity: { ...filters.activity, lastTwoWeeks: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Active in the last two weeks</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.activity.lastFourWeeks}
                onChange={e => onChange({
                  ...filters,
                  activity: { ...filters.activity, lastFourWeeks: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Active in the last four weeks</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer hover:text-[#0c66e4] transition-colors py-0.5">
              <input 
                type="checkbox" 
                checked={filters.activity.withoutActivity}
                onChange={e => onChange({
                  ...filters,
                  activity: { ...filters.activity, withoutActivity: e.target.checked }
                })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs">Without activity in the last four weeks</span>
            </label>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-3 flex flex-col gap-4">
            
            {/* Collapse lists with no matching cards toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172b4d]">
                Collapse lists with no matching cards
              </span>
              <button
                type="button"
                onClick={() => onChange({
                  ...filters,
                  collapseEmptyLists: !filters.collapseEmptyLists
                })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                  filters.collapseEmptyLists ? 'bg-[#0c66e4]' : 'bg-[#091e4224]'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    filters.collapseEmptyLists ? 'translate-x-4' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>

            {/* Match Mode dropdown */}
            <div className="relative">
              <select
                value={filters.matchMode}
                onChange={e => onChange({ ...filters, matchMode: e.target.value as 'any' | 'all' })}
                className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] rounded-md px-3 py-1.5 text-xs text-[#172b4d] outline-none appearance-none cursor-pointer"
              >
                <option value="any">Any match</option>
                <option value="all">All match</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-[#626f86] pointer-events-none" />
            </div>

          </div>

        </div>
      </div>
    </>
  );
};
