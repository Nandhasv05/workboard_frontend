import React, { useState } from 'react';
import { 
  X, ChevronLeft, UserPlus, Info, Lock, Globe, Share2, Star, 
  Settings, Sliders, Zap, Plug, Tag, Smile, CopyPlus, History, 
  Archive, Eye, ChevronsLeftRight, Copy, Mail, Minus, Flag,
  Check, Printer, Download, Trash2, RotateCcw, AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

type SubView = 
  | 'main' 
  | 'about' 
  | 'visibility' 
  | 'print_export' 
  | 'settings' 
  | 'background' 
  | 'custom_fields' 
  | 'automation' 
  | 'power_ups' 
  | 'labels' 
  | 'stickers' 
  | 'activity' 
  | 'archived' 
  | 'copy_board' 
  | 'email_to_board' 
  | 'close_board' 
  | 'report_abuse';

interface BoardMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  board: any;
  onUpdateBoard: (updated: any) => void;
  tasks: any[];
  columns: any[];
  onCollapseAllLists: (collapse: boolean) => void;
  areAllListsCollapsed: boolean;
  onOpenShare: () => void;
  isStarred: boolean;
  onToggleStar: () => void;
  onRestoreTask?: (taskId: string) => void;
  onOpenAutomation?: () => void;
}

const PRESET_BACKGROUNDS = [
  { name: 'Warm Orange', value: '#e56c24' },
  { name: 'Trello Blue', value: '#0079bf' },
  { name: 'Royal Indigo', value: '#0052cc' },
  { name: 'Emerald Green', value: '#00875a' },
  { name: 'Velvet Purple', value: '#5143a3' },
  { name: 'Crimson Rose', value: '#b04632' },
  { name: 'Sunset Gradient', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)' },
  { name: 'Aurora Glow', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { name: 'Midnight Slate', value: '#172b4d' },
];

const STICKERS = [
  '⭐', '🚀', '👍', '⚠️', '❤️', '🔥', '🎯', '💡',
  '🏆', '✅', '⏰', '💬', '🎉', '💯', '⚡', '👑'
];

export const BoardMenuDrawer: React.FC<BoardMenuDrawerProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateBoard,
  tasks,
  columns,
  onCollapseAllLists,
  areAllListsCollapsed,
  onOpenShare,
  isStarred,
  onToggleStar,
  onRestoreTask,
  onOpenAutomation
}) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<SubView>('main');
  const [isWatching, setIsWatching] = useState(false);
  const [isTemplate, setIsTemplate] = useState(Boolean(board?.template || board?.is_template));
  const [boardDescription, setBoardDescription] = useState(board?.description || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  
  // Copy board state
  const [copyTitle, setCopyTitle] = useState(`Copy of ${board?.name || 'Board'}`);
  const [copyKeepCards, setCopyKeepCards] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  // Email to board state
  const [emailTargetCol, setEmailTargetCol] = useState(columns[0]?.id || '');
  const [emailCopied, setEmailCopied] = useState(false);

  // Custom fields mock/active state
  const [customFields, setCustomFields] = useState([
    { id: '1', name: 'Priority Level', type: 'Dropdown' },
    { id: '2', name: 'Story Points', type: 'Number' },
    { id: '3', name: 'Target Release', type: 'Text' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');

  // Automation rules state
  const [automationRules, setAutomationRules] = useState([
    { id: '1', title: 'When a card is moved to Done, mark it complete', enabled: true },
    { id: '2', title: 'When due date is added, notify assignees', enabled: true },
    { id: '3', title: 'Auto-sort cards in Sprint Backlog by Priority', enabled: false }
  ]);

  // Toast / feedback message
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  const currentBg = board?.background || '#e56c24';
  const visibility = board?.visibility || 'private';

  const handleUpdateBackground = async (bgVal: string) => {
    try {
      await api.put(`/boards/${board.id}`, { background: bgVal });
      onUpdateBoard({ ...board, background: bgVal });
      showToast('Board background updated!', 'success');
    } catch (err) {
      console.error('Failed to update background:', err);
      showToast('Error updating background', 'error');
    }
  };

  const handleToggleTemplate = async () => {
    const nextVal = !isTemplate;
    setIsTemplate(nextVal);
    try {
      await api.put(`/boards/${board.id}`, { template: nextVal ? 'template' : null });
      onUpdateBoard({ ...board, template: nextVal ? 'template' : null });
      showToast(nextVal ? 'Board converted to template!' : 'Template disabled');
    } catch (err) {
      console.error('Failed to toggle template:', err);
    }
  };

  const handleSaveDescription = async () => {
    setIsSavingDesc(true);
    try {
      await api.put(`/boards/${board.id}`, { description: boardDescription });
      onUpdateBoard({ ...board, description: boardDescription });
      showToast('Board description saved', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving description', 'error');
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleUpdateVisibility = async (vis: 'public' | 'private') => {
    try {
      await api.put(`/boards/${board.id}/visibility`, { visibility: vis });
      onUpdateBoard({ ...board, visibility: vis });
      showToast(`Visibility set to ${vis}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update visibility', 'error');
    }
  };

  const handleCopyBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyTitle.trim()) return;
    setIsCopying(true);
    try {
      const res = await api.post(`/boards/${board.id}/copy`, {
        name: copyTitle.trim(),
        keepCards: copyKeepCards
      });
      if (res.data?.board?.id) {
        showToast('Board copied successfully!', 'success');
        setTimeout(() => {
          onClose();
          navigate(`/boards/${res.data.board.id}`);
        }, 600);
      }
    } catch (err: any) {
      console.error('Failed to copy board:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Error copying board';
      showToast(errMsg, 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleCloseBoard = async () => {
    if (!window.confirm(`Are you sure you want to close and archive "${board?.name}"?`)) return;
    try {
      await api.delete(`/boards/${board.id}`);
      showToast('Board closed', 'success');
      setTimeout(() => {
        onClose();
        navigate('/boards');
      }, 500);
    } catch (err) {
      console.error('Failed to close board:', err);
      showToast('Failed to close board', 'error');
    }
  };

  const handleExportJSON = () => {
    const data = {
      board: { id: board.id, name: board.name, visibility: board.visibility, background: board.background },
      columns: columns.map(c => ({ id: c.id, name: c.name, color: c.color })),
      tasks: tasks.map(t => ({
        id: t.id,
        columnId: t.columnId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        due_date: t.due_date,
        completed: t.completed,
        labels: t.labels
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(board?.name || 'board').replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported board to JSON');
  };

  const handleExportCSV = () => {
    const colMap = new Map(columns.map(c => [c.id, c.name]));
    const headers = ['Task Title', 'List/Column', 'Priority', 'Due Date', 'Status', 'Labels'];
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${colMap.get(t.columnId) || ''}"`,
      `"${t.priority || 'medium'}"`,
      `"${t.due_date ? t.due_date.slice(0, 10) : ''}"`,
      t.completed ? 'Completed' : 'Open',
      `"${(t.labels || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(board?.name || 'board').replace(/\s+/g, '_')}_cards.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported cards to CSV');
  };

  const handleCopyBoardEmail = () => {
    const email = `board-${board.id.slice(0, 8)}@todo.evolv.internal`;
    navigator.clipboard.writeText(email);
    setEmailCopied(true);
    showToast('Board email copied to clipboard!');
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // View Title Helper
  const getViewTitle = () => {
    switch (currentView) {
      case 'about': return 'About this board';
      case 'visibility': return 'Change visibility';
      case 'print_export': return 'Print and export';
      case 'settings': return 'Settings';
      case 'background': return 'Change background';
      case 'custom_fields': return 'Custom Fields';
      case 'automation': return 'Automation';
      case 'power_ups': return 'Power-Ups';
      case 'labels': return 'Labels';
      case 'stickers': return 'Stickers';
      case 'activity': return 'Activity';
      case 'archived': return 'Archived items';
      case 'copy_board': return 'Copy board';
      case 'email_to_board': return 'Email-to-board';
      case 'close_board': return 'Close board';
      case 'report_abuse': return 'Report abuse';
      default: return 'Menu';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-[340px] max-w-full h-full bg-white shadow-2xl z-10 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200 text-gray-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
          {currentView !== 'main' ? (
            <button 
              type="button"
              onClick={() => setCurrentView('main')} 
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={18} />
            </button>
          ) : <div className="w-6" />}

          <h3 className="font-semibold text-sm text-gray-800 select-none">
            {getViewTitle()}
          </h3>

          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast alert indicator */}
        {toast && (
          <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white text-xs px-3 py-1.5 text-center font-medium shadow-xs transition-all`}>
            {toast.msg}
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2 py-3 select-none">
          
          {/* ================= MAIN VIEW ================= */}
          {currentView === 'main' && (
            <div className="space-y-0.5">
              
              {/* 1. Share */}
              <button
                type="button"
                onClick={() => { onClose(); onOpenShare(); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <UserPlus size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                  <span>Share</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  N
                </div>
              </button>

              <div className="h-px bg-gray-100 my-1.5" />

              {/* 2. About this board */}
              <button
                type="button"
                onClick={() => setCurrentView('about')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Info size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>About this board</span>
              </button>

              {/* 3. Visibility */}
              <button
                type="button"
                onClick={() => setCurrentView('visibility')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group capitalize"
              >
                {visibility === 'public' ? (
                  <Globe size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                ) : (
                  <Lock size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                )}
                <span>Visibility: {visibility}</span>
              </button>

              {/* 4. Print, export, and share */}
              <button
                type="button"
                onClick={() => setCurrentView('print_export')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Share2 size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Print, export, and share</span>
              </button>

              {/* 5. Star */}
              <button
                type="button"
                onClick={onToggleStar}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Star 
                    size={18} 
                    className={isStarred ? "text-amber-500 fill-amber-500 shrink-0" : "text-gray-600 group-hover:text-gray-900 shrink-0"} 
                  />
                  <span>{isStarred ? 'Starred' : 'Star'}</span>
                </div>
                {isStarred && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Active</span>}
              </button>

              <div className="h-px bg-gray-100 my-1.5" />

              {/* 6. Settings */}
              <button
                type="button"
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Settings size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Settings</span>
              </button>

              {/* 7. Change background */}
              <button
                type="button"
                onClick={() => setCurrentView('background')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-md shrink-0 shadow-xs border border-black/10" 
                    style={{ background: currentBg }}
                  />
                  <span>Change background</span>
                </div>
              </button>

              {/* 8. Custom Fields */}
              <button
                type="button"
                onClick={() => setCurrentView('custom_fields')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Sliders size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Custom Fields</span>
              </button>

              <div className="h-px bg-gray-100 my-1.5" />

              {/* 9. Automation */}
              <button
                type="button"
                onClick={() => setCurrentView('automation')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Zap size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Automation</span>
              </button>

              {/* 10. Power-Ups */}
              <button
                type="button"
                onClick={() => setCurrentView('power_ups')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Plug size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Power-Ups</span>
              </button>

              {/* 11. Labels */}
              <button
                type="button"
                onClick={() => setCurrentView('labels')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Tag size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Labels</span>
              </button>

              {/* 12. Stickers */}
              <button
                type="button"
                onClick={() => setCurrentView('stickers')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Smile size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Stickers</span>
              </button>

              {/* 13. Make template */}
              <button
                type="button"
                onClick={handleToggleTemplate}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <CopyPlus size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                  <span>Make template</span>
                </div>
                {isTemplate && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Template
                  </span>
                )}
              </button>

              {/* 14. Activity */}
              <button
                type="button"
                onClick={() => setCurrentView('activity')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <History size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Activity</span>
              </button>

              {/* 15. Archived items */}
              <button
                type="button"
                onClick={() => setCurrentView('archived')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Archive size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Archived items</span>
              </button>

              <div className="h-px bg-gray-100 my-1.5" />

              {/* 16. Watch */}
              <button
                type="button"
                onClick={() => {
                  const nextWatch = !isWatching;
                  setIsWatching(nextWatch);
                  showToast(nextWatch ? 'You are watching this board' : 'Unwatched board');
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Eye size={18} className={isWatching ? "text-blue-600 shrink-0" : "text-gray-600 group-hover:text-gray-900 shrink-0"} />
                  <span>Watch</span>
                </div>
                {isWatching && <Check size={16} className="text-blue-600" />}
              </button>

              {/* 17. Collapse all lists */}
              <button
                type="button"
                onClick={() => {
                  const nextCollapsed = !areAllListsCollapsed;
                  onCollapseAllLists(nextCollapsed);
                  showToast(nextCollapsed ? 'All lists collapsed' : 'All lists expanded');
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <ChevronsLeftRight size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                  <span>{areAllListsCollapsed ? 'Expand all lists' : 'Collapse all lists'}</span>
                </div>
                {areAllListsCollapsed && (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Collapsed</span>
                )}
              </button>

              {/* 18. Copy board */}
              <button
                type="button"
                onClick={() => setCurrentView('copy_board')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Copy size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Copy board</span>
              </button>

              {/* 19. Email-to-board */}
              <button
                type="button"
                onClick={() => setCurrentView('email_to_board')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Mail size={18} className="text-gray-600 group-hover:text-gray-900 shrink-0" />
                <span>Email-to-board</span>
              </button>

              {/* 20. Close board */}
              <button
                type="button"
                onClick={() => setCurrentView('close_board')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer group"
              >
                <Minus size={18} className="text-red-500 group-hover:text-red-700 shrink-0" />
                <span>Close board</span>
              </button>

              <div className="h-px bg-gray-100 my-1.5" />

              {/* 21. Report abuse */}
              <button
                type="button"
                onClick={() => setCurrentView('report_abuse')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-[#091e420f] transition-colors cursor-pointer group"
              >
                <Flag size={18} className="text-gray-500 group-hover:text-gray-800 shrink-0" />
                <span>Report abuse</span>
              </button>

            </div>
          )}

          {/* ================= SUBVIEW: ABOUT THIS BOARD ================= */}
          {currentView === 'about' && (
            <div className="space-y-4 px-1">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Board Description
                </label>
                <textarea
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="It's your board's time to shine: let your team know what this board is for..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={isSavingDesc}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {isSavingDesc ? 'Saving...' : 'Save Description'}
                </button>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Total Lists:</span>
                  <span>{columns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Total Cards:</span>
                  <span>{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Board Visibility:</span>
                  <span className="capitalize">{visibility}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: VISIBILITY ================= */}
          {currentView === 'visibility' && (
            <div className="space-y-3 px-1">
              <button
                type="button"
                onClick={() => handleUpdateVisibility('private')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${visibility === 'private' ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-gray-900 mb-1">
                  <Lock size={16} className="text-red-500" />
                  <span>Private</span>
                  {visibility === 'private' && <Check size={16} className="text-blue-600 ml-auto" />}
                </div>
                <p className="text-xs text-gray-600">
                  Only board members can see and edit this board.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateVisibility('public')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${visibility === 'public' ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-gray-900 mb-1">
                  <Globe size={16} className="text-emerald-600" />
                  <span>Public</span>
                  {visibility === 'public' && <Check size={16} className="text-blue-600 ml-auto" />}
                </div>
                <p className="text-xs text-gray-600">
                  Anyone with the link can view this board.
                </p>
              </button>
            </div>
          )}

          {/* ================= SUBVIEW: PRINT, EXPORT, AND SHARE ================= */}
          {currentView === 'print_export' && (
            <div className="space-y-2 px-1">
              <button
                type="button"
                onClick={() => { onClose(); window.print(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Printer size={18} className="text-gray-600" />
                <span>Print board</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Download size={18} className="text-blue-600" />
                <span>Export as JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Download size={18} className="text-emerald-600" />
                <span>Export as CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Board link copied to clipboard!');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Copy size={18} className="text-gray-600" />
                <span>Copy Board Link</span>
              </button>
            </div>
          )}

          {/* ================= SUBVIEW: CHANGE BACKGROUND ================= */}
          {currentView === 'background' && (
            <div className="space-y-3 px-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Colors & Gradients
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_BACKGROUNDS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUpdateBackground(p.value)}
                    className="h-16 rounded-xl flex items-end p-2 text-white font-bold text-xs shadow-xs relative overflow-hidden transition-transform hover:scale-102 cursor-pointer border border-black/10"
                    style={{ background: p.value }}
                  >
                    <span className="bg-black/30 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px]">
                      {p.name}
                    </span>
                    {currentBg === p.value && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-xs">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: SETTINGS ================= */}
          {currentView === 'settings' && (
            <div className="space-y-4 px-1 text-xs text-gray-700">
              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <span className="font-bold text-gray-900 block text-sm">Card Covers</span>
                <p className="text-gray-500">Show images and color headers directly on cards in the board view.</p>
                <label className="flex items-center gap-2 cursor-pointer font-medium mt-1">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Enable card covers</span>
                </label>
              </div>

              <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                <span className="font-bold text-gray-900 block text-sm">Commenting Permissions</span>
                <p className="text-gray-500">Control who can add comments to cards on this board.</p>
                <select className="w-full border border-gray-300 rounded-lg p-2 text-xs">
                  <option>Board members</option>
                  <option>Workspace members</option>
                  <option>Any authorized viewer</option>
                </select>
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: CUSTOM FIELDS ================= */}
          {currentView === 'custom_fields' && (
            <div className="space-y-3 px-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Active Custom Fields
              </span>
              <div className="space-y-2">
                {customFields.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="font-bold text-gray-800 block">{f.name}</span>
                      <span className="text-gray-500 text-[11px]">{f.type}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomFields(customFields.filter(x => x.id !== f.id))}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs font-bold text-gray-700 block mb-1.5">Add Custom Field</span>
                <input
                  type="text"
                  placeholder="Field name (e.g. Budget)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 mb-2"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 mb-2"
                >
                  <option>Text</option>
                  <option>Number</option>
                  <option>Dropdown</option>
                  <option>Date</option>
                  <option>Checkbox</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newFieldName.trim()) return;
                    setCustomFields([...customFields, { id: String(Date.now()), name: newFieldName.trim(), type: newFieldType }]);
                    setNewFieldName('');
                    showToast('Field added');
                  }}
                  className="w-full py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700"
                >
                  Add Field
                </button>
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: AUTOMATION ================= */}
          {currentView === 'automation' && (
            <div className="space-y-3 px-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAutomation?.();
                }}
                className="w-full py-2.5 px-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs mb-2"
              >
                <Zap size={15} fill="white" />
                <span>Open Automation Directory</span>
              </button>

              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Quick Rules
              </span>
              <div className="space-y-2">
                {automationRules.map(r => (
                  <div key={r.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <p className="text-xs font-medium text-gray-800">{r.title}</p>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700">
                      <input 
                        type="checkbox" 
                        checked={r.enabled} 
                        onChange={() => {
                          setAutomationRules(automationRules.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x));
                          showToast(r.enabled ? 'Rule disabled' : 'Rule enabled');
                        }}
                        className="rounded text-blue-600"
                      />
                      <span>{r.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: POWER-UPS ================= */}
          {currentView === 'power_ups' && (
            <div className="space-y-2.5 px-1 text-xs">
              <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Table & Calendar Views</span>
                  <span className="text-gray-500">Multi-perspective board workflows</span>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">Active</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Dashboard & Analytics</span>
                  <span className="text-gray-500">Charts, workload, and metrics</span>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">Active</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Evolv SAP Connect</span>
                  <span className="text-gray-500">Sync PR/PO materials directly</span>
                </div>
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold text-[11px]">Connected</span>
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: LABELS ================= */}
          {currentView === 'labels' && (
            <div className="space-y-2 px-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                Board Labels Palette
              </span>
              {[
                { name: 'Priority / Urgent', color: '#ef4444' },
                { name: 'In Progress', color: '#f59e0b' },
                { name: 'Review Needed', color: '#8b5cf6' },
                { name: 'Completed & Verified', color: '#10b981' },
                { name: 'Frontend', color: '#3b82f6' },
                { name: 'Backend API', color: '#06b6d4' }
              ].map((lbl, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div 
                    className="flex-1 px-3 py-1.5 rounded-md text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: lbl.color }}
                  >
                    {lbl.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= SUBVIEW: STICKERS ================= */}
          {currentView === 'stickers' && (
            <div className="space-y-3 px-1">
              <span className="text-xs text-gray-500 block">
                Click any sticker to highlight cards with team badges:
              </span>
              <div className="grid grid-cols-4 gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                {STICKERS.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => showToast(`Sticker ${st} picked!`)}
                    className="w-12 h-12 text-2xl flex items-center justify-center rounded-xl bg-white shadow-xs hover:scale-115 hover:shadow-md transition-all cursor-pointer border border-gray-200"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: ACTIVITY ================= */}
          {currentView === 'activity' && (
            <div className="space-y-3 px-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Recent Board Activity
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { user: 'Nandha Kumar', action: 'updated the board background', time: 'Just now' },
                  { user: 'Nandha Kumar', action: 'moved card to In Progress', time: '10m ago' },
                  { user: 'System', action: 'synced team permissions', time: '1h ago' },
                  { user: 'Nandha Kumar', action: 'added 2 tasks to Sprint Backlog', time: 'Yesterday' }
                ].map((act, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {act.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-800">
                        <span className="font-semibold">{act.user}</span> {act.action}
                      </p>
                      <span className="text-[10px] text-gray-400">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: ARCHIVED ITEMS ================= */}
          {currentView === 'archived' && (
            <div className="space-y-3 px-1 text-xs">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Archived Cards ({tasks.filter(t => t.completed).length})
              </span>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {tasks.filter(t => t.completed).length === 0 ? (
                  <p className="text-gray-400 italic text-center py-6">No archived items found</p>
                ) : (
                  tasks.filter(t => t.completed).map(card => (
                    <div key={card.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                      <span className="font-medium text-gray-800 truncate mr-2">{card.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreTask?.(card.id);
                          showToast(`Restored "${card.title}"`);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <RotateCcw size={12} /> Send to board
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: COPY BOARD ================= */}
          {currentView === 'copy_board' && (
            <form onSubmit={handleCopyBoardSubmit} className="space-y-3 px-1 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">New Board Title</label>
                <input
                  type="text"
                  value={copyTitle}
                  onChange={(e) => setCopyTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={copyKeepCards}
                  onChange={(e) => setCopyKeepCards(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Keep cards ({tasks.length})</span>
              </label>

              <button
                type="submit"
                disabled={isCopying}
                className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCopying ? 'Creating copy...' : 'Create board'}
              </button>
            </form>
          )}

          {/* ================= SUBVIEW: EMAIL TO BOARD ================= */}
          {currentView === 'email_to_board' && (
            <div className="space-y-3 px-1 text-xs text-gray-700">
              <p className="text-gray-500">
                Emails sent to this unique address will automatically convert into cards on this board.
              </p>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Your Board Email</span>
                <span className="font-mono text-[11px] text-gray-900 break-all select-all block mb-2">
                  board-{board?.id?.slice(0, 8)}@todo.evolv.internal
                </span>
                <button
                  type="button"
                  onClick={handleCopyBoardEmail}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy size={12} /> {emailCopied ? 'Copied!' : 'Copy email address'}
                </button>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">List for new incoming cards</label>
                <select
                  value={emailTargetCol}
                  onChange={(e) => setEmailTargetCol(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                >
                  {columns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ================= SUBVIEW: CLOSE BOARD ================= */}
          {currentView === 'close_board' && (
            <div className="space-y-4 px-1 text-xs text-gray-700">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <p>
                  Closing a board archives it and takes it off your active list. You can re-open it at any time from your Boards dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseBoard}
                className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
              >
                Close board
              </button>
            </div>
          )}

          {/* ================= SUBVIEW: REPORT ABUSE ================= */}
          {currentView === 'report_abuse' && (
            <div className="space-y-3 px-1 text-xs text-gray-700">
              <p className="text-gray-500">
                If this board violates internal policy or terms, please file a report to workspace administrators.
              </p>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-xs">
                <option>Inappropriate content or comments</option>
                <option>Confidential or restricted data leak</option>
                <option>Spam or duplicate board</option>
                <option>Other policy issue</option>
              </select>
              <textarea
                placeholder="Additional details..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  showToast('Report submitted to workspace admin');
                  setTimeout(() => setCurrentView('main'), 1000);
                }}
                className="w-full py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
