import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, MoreHorizontal, CheckSquare, Square, Star, Lock, 
  Share2, Filter, Layout, Calendar as CalendarIcon, 
  Table, BarChart2, Clock, ChevronDown, Check, 
  ArrowRightLeft, Inbox, X, Key, Users, 
  ShieldCheck, AlertCircle, Search, Trash2,
  Copy, Maximize2, Minimize2, Globe, ExternalLink, Layers,
  Zap
} from 'lucide-react';
import { api } from '../api';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from '../components/TaskModal';
import { ListActionsPopover } from '../components/ListActionsPopover';
import { CardTemplatesPopover } from '../components/CardTemplatesPopover';
import { BoardFilterDrawer, BoardFilterState, INITIAL_FILTER_STATE } from '../components/BoardFilterDrawer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BoardTableView } from '../components/BoardTableView';
import { BoardCalendarView } from '../components/BoardCalendarView';
import { BoardDashboardView } from '../components/BoardDashboardView';
import { BoardMenuDrawer } from '../components/BoardMenuDrawer';
import { AutomationModal } from '../components/AutomationModal';
import { triggerBoardRulesForEvent, checkDueDateAutomations } from '../utils/automationEngine';
import { assigneeIdList, filterMembers, memberSubtitle, type PortalUser } from '../utils/members';
import { appUrl } from '../utils/routing';

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
  is_template?: boolean;
}

interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color?: string;
}

function SortableTaskCard({ 
  task, 
  onSelectTask, 
  onToggleComplete 
}: { 
  task: Task; 
  onSelectTask: (t: Task) => void; 
  onToggleComplete: (e: React.MouseEvent, t: Task) => void 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isCompleted = Boolean(task.completed);
  const isTemplate = Boolean(task.is_template || task.description?.includes('<!--is_template:true-->'));

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      onClick={() => onSelectTask(task)}
      className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-500/80 rounded-xl p-3 text-sm cursor-pointer shadow-xs hover:shadow-md transition-all group select-none flex flex-col gap-2"
    >
      {/* Labels stripes */}
      {task.labels && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {task.labels.split(',').map((lbl, idx) => {
            const trimmed = lbl.trim();
            const colorMap: Record<string, string> = {
              green: '#4bce97', yellow: '#f5cd47', orange: '#fea362', red: '#f87168',
              purple: '#9f8fef', blue: '#579dff', sky: '#6cc3e0', lime: '#94c748',
              pink: '#e774bb', slate: '#8590a2'
            };
            const bg = colorMap[trimmed.toLowerCase()] || '#579dff';
            return (
              <span 
                key={idx}
                className="h-2 w-10 rounded-full shadow-2xs"
                style={{ backgroundColor: bg }}
                title={trimmed}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <button 
          onClick={(e) => onToggleComplete(e, task)}
          className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
        >
          {isCompleted ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
        </button>
        <span className={`font-medium flex-1 text-gray-900 leading-snug ${isCompleted ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </span>
      </div>

      {isTemplate && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#e9f2ff] text-[#0055cc] text-[11px] font-semibold self-start ml-6">
          <Layers size={11} />
          <span>This card is a template.</span>
        </div>
      )}

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 pl-6">
          {task.description}
        </p>
      )}

      {/* Badges footer */}
      <div className="flex items-center justify-between pt-1 text-xs text-gray-400 pl-6">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-600 border border-gray-200">
              <Clock size={11} className="text-blue-600" />
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.priority && task.priority !== 'medium' && (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600'}`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ 
  column, 
  tasks, 
  onSelectTask, 
  onToggleComplete, 
  addingToCol, 
  newTaskTitle, 
  setNewTaskTitle, 
  setAddingToCol, 
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onMoveLeft,
  onMoveRight,
  onChangeColor,
  onCopyList,
  onMoveAllCards,
  onArchiveAllCards,
  isFirst,
  isLast,
  isReadOnly,
  templateCards = [],
  onCreateCardFromTemplate,
  onCreateNewTemplate,
  forceCollapsed = false
}: {
  column: Column;
  tasks: Task[];
  onSelectTask: (t: Task) => void;
  onToggleComplete: (e: React.MouseEvent, t: Task) => void;
  addingToCol: string | null;
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  setAddingToCol: (id: string | null) => void;
  onAddTask: (colId: string) => void;
  onRenameColumn: (colId: string, newName: string) => void;
  onDeleteColumn: (colId: string) => void;
  onMoveLeft?: (colId: string) => void;
  onMoveRight?: (colId: string) => void;
  onChangeColor?: (colId: string, color: string | null) => void;
  onCopyList?: (colId: string) => void;
  onMoveAllCards?: (colId: string) => void;
  onArchiveAllCards?: (colId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isReadOnly?: boolean;
  templateCards?: Task[];
  onCreateCardFromTemplate?: (colId: string, tmpl: Task) => void;
  onCreateNewTemplate?: (colId: string) => void;
  forceCollapsed?: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const templateButtonRef = useRef<HTMLButtonElement>(null);
  const [templatePosition, setTemplatePosition] = useState<{ top: number; left: number } | null>(null);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      const left = Math.max(10, Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 10));
      const top = Math.max(10, Math.min(rect.bottom + 6, window.innerHeight - 450));
      setMenuPosition({ top, left });
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  };

  const handleToggleTemplateMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showTemplateMenu && templateButtonRef.current) {
      const rect = templateButtonRef.current.getBoundingClientRect();
      const popoverWidth = 286;
      const popoverHeight = 310;
      let top = rect.bottom + 6;
      if (top + popoverHeight > window.innerHeight) {
        top = Math.max(10, rect.top - popoverHeight - 6);
      }
      const left = Math.max(10, Math.min(rect.left - 180, window.innerWidth - popoverWidth - 10));
      setTemplatePosition({ top, left });
      setShowTemplateMenu(true);
    } else {
      setShowTemplateMenu(false);
    }
  };

  useEffect(() => {
    setTitleText(column.name);
  }, [column.name]);

  const handleSaveTitle = () => {
    if (titleText.trim() && titleText !== column.name) {
      onRenameColumn(column.id, titleText.trim());
    }
    setIsEditingTitle(false);
  };

  const hasCustomColor = Boolean(column.color && column.color !== '#ebecf0' && column.color !== '#ffffff');

  if (isCollapsed || forceCollapsed) {
    return (
      <div 
        onClick={() => setIsCollapsed(false)}
        className="w-11 shrink-0 rounded-2xl border border-gray-300/70 shadow-sm flex flex-col items-center py-4 cursor-pointer hover:opacity-90 transition-all select-none max-h-[calc(100vh-170px)]"
        style={{ 
          backgroundColor: hasCustomColor ? column.color : '#ebecf0', 
          color: hasCustomColor ? '#ffffff' : '#374151' 
        }}
        title={`Click to expand "${column.name}"`}
      >
        <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-3 bg-black/20 text-white">
          <span>{tasks.length}</span>
        </div>
        <div className="[writing-mode:vertical-rl] font-bold text-xs tracking-wider transform rotate-180 uppercase truncate max-h-[350px]">
          {column.name}
        </div>
        <button 
          type="button" 
          className="mt-auto p-1 hover:bg-black/20 rounded transition-colors"
          title="Expand list"
        >
          <ArrowRightLeft size={12} className="rotate-90 transform" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`w-[285px] shrink-0 rounded-2xl bg-[#ebecf0]/95 backdrop-blur-xs border border-gray-300/70 shadow-sm flex flex-col max-h-[calc(100vh-170px)] relative ${showMenu || showTemplateMenu ? 'z-30' : 'z-10'}`}
    >
      {/* List Header */}
      <div 
        className="flex items-center justify-between px-3.5 py-3 shrink-0 border-b border-gray-200/50 transition-colors rounded-t-2xl"
        style={hasCustomColor ? { backgroundColor: column.color, color: '#ffffff' } : undefined}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!hasCustomColor && (
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#0052cc' }}></span>
          )}
          
          {isEditingTitle && !isReadOnly ? (
            <div className="flex items-center gap-1.5 flex-1 mr-1">
              <input
                autoFocus
                type="text"
                value={titleText}
                onChange={e => setTitleText(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setTitleText(column.name); setIsEditingTitle(false); }
                }}
                className="w-full bg-white border border-blue-600 rounded px-2 py-0.5 text-xs font-bold text-gray-900 outline-none shadow-xs"
              />
              <button 
                type="button" 
                onMouseDown={handleSaveTitle}
                className="text-blue-600 hover:text-blue-800 p-0.5 rounded cursor-pointer"
                title="Save title"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <h2 
              onClick={() => { if (!isReadOnly) setIsEditingTitle(true); }}
              className={`font-bold text-sm truncate ${
                hasCustomColor 
                  ? 'text-white hover:text-white/80' 
                  : 'text-gray-800 hover:text-blue-600'
              } ${!isReadOnly ? 'cursor-pointer hover:bg-black/10 px-1 py-0.5 rounded -ml-1 transition-colors' : ''}`}
              title={!isReadOnly ? "Click to rename list" : undefined}
            >
              {column.name}
            </h2>
          )}
          
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
            hasCustomColor ? 'bg-black/25 text-white' : 'bg-gray-200/80 text-gray-600'
          }`}>
            {tasks.length}
          </span>
        </div>

        {/* Right Action Icons: Collapse Toggle & 3-dots Menu */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              hasCustomColor 
                ? 'text-white/80 hover:text-white hover:bg-black/20' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
            }`}
            title="Collapse list"
          >
            <ArrowRightLeft size={13} className="rotate-90 transform" />
          </button>

          {!isReadOnly && (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={handleToggleMenu}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                hasCustomColor 
                  ? 'text-white/80 hover:text-white hover:bg-black/20' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
              }`}
              title="List actions"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Portaled Delete List Confirmation Dialog */}
      {showDeleteConfirm && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3.5">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Delete "{column.name}"?</h3>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete this list? All <strong>{tasks.length} cards</strong> inside it will also be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); onDeleteColumn(column.id); }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete List
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Droppable Cards Container - ONLY cards scroll here */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto px-2.5 py-2 custom-scrollbar min-h-[10px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {tasks.map(task => (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                onSelectTask={onSelectTask} 
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Pinned Column Footer - NEVER scrolls or clips inside cards list */}
      {!isReadOnly && (
        <div className="px-2.5 pb-2.5 pt-1 shrink-0">
          {addingToCol === column.id ? (
            <div className="flex flex-col gap-2 bg-white p-2.5 rounded-xl border border-blue-500 shadow-sm">
              <textarea 
                autoFocus
                placeholder="Enter a title for this card..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onAddTask(column.id);
                  }
                }}
                className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none resize-none h-16"
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onAddTask(column.id)}
                  className="bg-[#0052cc] hover:bg-[#0065ff] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Add card
                </button>
                <button 
                  onClick={() => setAddingToCol(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1">
              <button 
                onClick={() => setAddingToCol(column.id)}
                className="flex-1 py-1.5 px-3 flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/80 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Plus size={14} /> Add a card
              </button>
              <button
                ref={templateButtonRef}
                type="button"
                onClick={handleToggleTemplateMenu}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Card templates"
              >
                <Layers size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Portaled List Actions Popover */}
      {showMenu && menuPosition && createPortal(
        <div 
          className="fixed inset-0 z-[9999]" 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        >
          <div 
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <ListActionsPopover
              columnName={column.name}
              currentColor={column.color}
              onAddCard={() => setAddingToCol(column.id)}
              onCopyList={() => onCopyList?.(column.id)}
              onMoveList={() => {
                if (onMoveRight && !isLast) onMoveRight(column.id);
                else if (onMoveLeft && !isFirst) onMoveLeft(column.id);
              }}
              onMoveAllCards={() => onMoveAllCards?.(column.id)}
              onChangeColor={(color) => onChangeColor?.(column.id, color)}
              onArchiveList={() => setShowDeleteConfirm(true)}
              onArchiveAllCards={() => onArchiveAllCards?.(column.id)}
              onClose={() => setShowMenu(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Portaled Card Templates Popover */}
      {showTemplateMenu && templatePosition && createPortal(
        <div 
          className="fixed inset-0 z-[9999]" 
          onClick={(e) => {
            e.stopPropagation();
            setShowTemplateMenu(false);
          }}
        >
          <div 
            style={{
              position: 'fixed',
              top: `${templatePosition.top}px`,
              left: `${templatePosition.left}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <CardTemplatesPopover
              templates={templateCards || []}
              columnId={column.id}
              onSelectTemplate={(tmpl) => {
                onCreateCardFromTemplate?.(column.id, tmpl);
                setShowTemplateMenu(false);
              }}
              onCreateTemplate={(colId) => {
                onCreateNewTemplate?.(colId);
                setShowTemplateMenu(false);
              }}
              onEditTemplates={() => {
                if (templateCards && templateCards.length > 0 && templateCards[0]) {
                  onSelectTask(templateCards[0]);
                }
                setShowTemplateMenu(false);
              }}
              onClose={() => setShowTemplateMenu(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Board() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFullscreen = searchParams.get('view') === 'fullscreen';
  const isReadOnly = searchParams.get('mode') === 'view' || isFullscreen || searchParams.get('readonly') === 'true' || searchParams.get('public') === 'true';

  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'fullscreen' | 'workspace' | 'passcode' | null>(null);

  // Private board unlock state
  const [isLocked, setIsLocked] = useState(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showCodePopover, setShowCodePopover] = useState(false);
  
  // Adding cards & columns
  const [addingToCol, setAddingToCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Selected Task for Details Modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Board editing
  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [areAllListsCollapsed, setAreAllListsCollapsed] = useState(false);

  // Views switcher
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [currentView, setCurrentView] = useState<'board' | 'table' | 'calendar' | 'dashboard'>('board');

  // Filter Drawer State
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterState, setFilterState] = useState<BoardFilterState>(INITIAL_FILTER_STATE);

  // Automation Modal State
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  // Members Modal State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [boardMemberSearch, setBoardMemberSearch] = useState('');

  // Inbox Drawer State
  const [showInbox, setShowInbox] = useState(false);
  const [inboxTasks, setInboxTasks] = useState<{ assigned: any[]; recent: any[] }>({ assigned: [], recent: [] });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadBoardData();
    loadPortalUsers();
    loadInbox();
  }, [id]);

  const loadPortalUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setPortalUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load portal users', err);
    }
  };

  const loadInbox = async () => {
    try {
      const { data } = await api.get('/tasks/inbox/summary');
      setInboxTasks(data);
    } catch (err) {
      console.error('Failed to load inbox tasks', err);
    }
  };

  const loadBoardData = async () => {
    try {
      setLoading(true);
      let targetBoardId = id;
      if (!targetBoardId || targetBoardId === '00000000-0000-0000-0000-000000000003') {
        const { data: boardsRes } = await api.get('/boards');
        if (boardsRes.boards && boardsRes.boards.length > 0) {
          targetBoardId = boardsRes.boards[0].id;
        } else {
          targetBoardId = '00000000-0000-0000-0000-000000000004';
        }
      }

      const { data: boardData } = await api.get(`/boards/${targetBoardId}`);
      const b = boardData.board;
      setBoard(b);
      setBoardNameInput(b.name);
      setBoardMembers(b.members || []);

      if (b.locked) {
        setIsLocked(true);
        setLoading(false);
        return;
      }
      setIsLocked(false);

      const defaultColors = ['#2563eb', '#7c3aed', '#ea580c', '#0891b2', '#16a34a', '#64748b'];
      const colsWithColors = (b.columns || []).map((c: Column, idx: number) => ({
        ...c,
        color: c.color || defaultColors[idx % defaultColors.length]
      }));
      setColumns(colsWithColors);

      const { data: tasksData } = await api.get(`/tasks?boardId=${b.id}&projectId=${b.project_id}`);
      const mappedTasks = tasksData.tasks.map((t: any) => ({
        ...t,
        columnId: t.column_id,
        projectId: t.project_id
      }));
      setTasks(mappedTasks);

      // Automatically evaluate active Due Date Automations
      checkDueDateAutomations(mappedTasks, colsWithColors).then(triggered => {
        if (triggered && triggered.length > 0) {
          api.get(`/tasks?boardId=${b.id}&projectId=${b.project_id}`).then(res => {
            setTasks(res.data.tasks.map((t: any) => ({
              ...t,
              columnId: t.column_id,
              projectId: t.project_id
            })));
          }).catch(() => {});
        }
      }).catch(err => console.error('Due date automations check failed', err));
    } catch (err) {
      console.error('Failed to load board', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeAttempt.trim()) return;
    try {
      setUnlockError('');
      await api.post(`/boards/${board.id}/verify-access`, { accessCode: passcodeAttempt.trim() });
      setIsLocked(false);
      loadBoardData();
    } catch (err: any) {
      setUnlockError(err.response?.data?.message || 'Invalid passcode or password. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeTaskId = active.id;
    const overId = over.id;
    if (activeTaskId === overId) return;

    const isActiveTask = tasks.some(t => t.id === activeTaskId);
    if (!isActiveTask) return;

    // Check if over a column or over another task
    let destinationColId = columns.find(c => c.id === overId)?.id;
    if (!destinationColId) {
      destinationColId = tasks.find(t => t.id === overId)?.columnId;
    }
    if (!destinationColId) return;

    setTasks(prev => {
      const activeIdx = prev.findIndex(t => t.id === activeTaskId);
      if (activeIdx === -1) return prev;
      
      const currentTask = prev[activeIdx];
      if (currentTask && currentTask.columnId !== destinationColId) {
        const updated = [...prev];
        updated[activeIdx] = { ...currentTask, columnId: destinationColId };
        return updated;
      }
      return prev;
    });
  };

  const evaluateBoardRules = async (
    triggerType: 'card_added_list' | 'card_moved_list' | 'card_marked_complete' | 'member_added',
    eventData: { cardId?: string; listName?: string; card?: any }
  ) => {
    try {
      let taskObj = eventData.card;
      if (!taskObj && eventData.cardId) {
        taskObj = tasks.find(t => t.id === eventData.cardId);
      }
      if (!taskObj) return;

      const colObj = columns.find(c => 
        c.name.toLowerCase() === (eventData.listName || '').toLowerCase() || 
        c.id === (taskObj.columnId || taskObj.column_id)
      );

      let evType: 'CARD_CREATED' | 'CARD_MOVED' | 'CARD_MARKED_COMPLETE' | 'MEMBER_ADDED' = 'CARD_CREATED';
      if (triggerType === 'card_moved_list') evType = 'CARD_MOVED';
      else if (triggerType === 'card_marked_complete') evType = 'CARD_MARKED_COMPLETE';
      else if (triggerType === 'member_added') evType = 'MEMBER_ADDED';

      const executed = await triggerBoardRulesForEvent(
        evType,
        { card: taskObj, toColumn: colObj },
        columns
      );

      if (executed && executed.length > 0) {
        await loadBoardData();
      }
    } catch (e) {
      console.error('Failed to evaluate board rules:', e);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id;
    const overId = over.id;

    let destinationColId = columns.find(c => c.id === overId)?.id;
    if (!destinationColId) {
      destinationColId = tasks.find(t => t.id === overId)?.columnId;
    }
    if (!destinationColId) return;

    let movedTask: any = null;
    setTasks(prev => {
      const activeIdx = prev.findIndex(t => t.id === activeTaskId);
      const overIdx = prev.findIndex(t => t.id === overId);
      if (activeIdx === -1) return prev;
      const currentTask = prev[activeIdx];
      if (!currentTask) return prev;
      movedTask = { ...currentTask, columnId: destinationColId };

      let updated = [...prev];
      updated[activeIdx] = movedTask;

      if (overIdx !== -1 && activeIdx !== overIdx) {
        updated = arrayMove(updated, activeIdx, overIdx);
      }
      return updated;
    });

    try {
      await api.patch(`/tasks/${activeTaskId}/move`, {
        columnId: destinationColId,
        position: 0
      });
      const destCol = columns.find(c => c.id === destinationColId);
      evaluateBoardRules('card_moved_list', { 
        cardId: activeTaskId, 
        listName: destCol?.name,
        card: movedTask || { id: activeTaskId, columnId: destinationColId }
      });
    } catch (err) {
      console.error('Failed to persist task move', err);
    }
  };

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) {
      setAddingToCol(null);
      return;
    }
    try {
      const { data } = await api.post('/tasks', {
        title: newTaskTitle,
        boardId: board.id,
        columnId: columnId,
        projectId: board.project_id
      });
      const createdTask = { ...data.task, columnId: data.task.column_id, projectId: data.task.project_id };
      setTasks(prev => [...prev, createdTask]);
      setNewTaskTitle('');
      setAddingToCol(null);
      const colObj = columns.find(c => c.id === columnId);
      evaluateBoardRules('card_added_list', { 
        cardId: data.task.id, 
        listName: colObj?.name,
        card: createdTask 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const { data } = await api.post('/boards/columns', {
        boardId: board.id,
        name: newListName,
        position: columns.length
      });
      setColumns([...columns, data.column]);
      setNewListName('');
      setIsAddingList(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameColumn = async (colId: string, newName: string) => {
    try {
      await api.put(`/boards/columns/${colId}`, { name: newName });
      setColumns(prev => prev.map(c => c.id === colId ? { ...c, name: newName } : c));
    } catch (err) {
      console.error('Failed to rename column', err);
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    try {
      await api.delete(`/boards/columns/${colId}`);
      setColumns(prev => prev.filter(c => c.id !== colId));
      setTasks(prev => prev.filter(t => t.columnId !== colId));
    } catch (err) {
      console.error('Failed to delete column', err);
      alert('Failed to delete list. Please try again.');
    }
  };

  const handleMoveColumn = async (colId: string, direction: 'left' | 'right') => {
    const idx = columns.findIndex(c => c.id === colId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;

    const updated = [...columns];
    const temp = updated[idx];
    const targetCol = updated[targetIdx];
    if (!temp || !targetCol) return;
    updated[idx] = targetCol;
    updated[targetIdx] = temp;

    setColumns(updated);
    try {
      await api.put(`/boards/${board.id}/columns/reorder`, {
        columnIds: updated.map(c => c.id)
      });
    } catch (err) {
      console.error('Failed to reorder columns', err);
    }
  };

  const handleChangeColumnColor = async (colId: string, color: string | null) => {
    try {
      await api.put(`/boards/columns/${colId}`, { color });
      setColumns(prev => prev.map(c => c.id === colId ? { ...c, color: color || undefined } : c));
    } catch (err) {
      console.error('Failed to change column color', err);
    }
  };

  const handleCopyColumn = async (colId: string) => {
    try {
      await api.post(`/boards/columns/${colId}/copy`);
      loadBoardData();
    } catch (err) {
      console.error('Failed to copy column', err);
    }
  };

  const handleMoveAllCards = async (sourceColId: string) => {
    const otherCols = columns.filter(c => c.id !== sourceColId);
    if (otherCols.length === 0) {
      alert('No other lists available to move cards to.');
      return;
    }
    const targetName = window.prompt(`Move all cards to which list?\nAvailable: ${otherCols.map(c => c.name).join(', ')}`);
    if (!targetName) return;
    const target = otherCols.find(c => c.name.toLowerCase() === targetName.trim().toLowerCase());
    if (!target) {
      alert(`List "${targetName}" not found.`);
      return;
    }
    try {
      await api.post(`/boards/columns/${sourceColId}/move-cards`, { targetColumnId: target.id });
      loadBoardData();
    } catch (err) {
      console.error('Failed to move cards', err);
    }
  };

  const handleArchiveAllCards = async (colId: string) => {
    if (!confirm('Are you sure you want to archive/delete all cards in this list?')) return;
    try {
      await api.delete(`/boards/columns/${colId}/cards`);
      loadBoardData();
    } catch (err) {
      console.error('Failed to archive all cards', err);
    }
  };

  const handleCopy = (text: string, type: 'fullscreen' | 'workspace' | 'passcode') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleToggleVisibility = async () => {
    if (!board) return;
    const nextVis = board.visibility === 'private' ? 'public' : 'private';
    try {
      const { data } = await api.put(`/boards/${board.id}/visibility`, { visibility: nextVis });
      setBoard(data.board);
      if (nextVis === 'public') {
        setIsLocked(false);
      }
    } catch (err) {
      console.error('Failed to toggle visibility', err);
    }
  };

  const handleSaveBoardName = async () => {
    if (!boardNameInput.trim() || boardNameInput === board.name) {
      setIsEditingBoardName(false);
      return;
    }
    try {
      await api.put(`/boards/${board.id}`, { name: boardNameInput });
      setBoard({ ...board, name: boardNameInput });
      setIsEditingBoardName(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCardComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const updated = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t));
    try {
      await api.put(`/tasks/${task.id}`, { completed: updated });
      if (updated) {
        evaluateBoardRules('card_marked_complete', {
          cardId: task.id,
          listName: columns.find(c => c.id === task.columnId)?.name,
          card: { ...task, completed: true }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCardCompleteById = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = !task.completed;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: updated } : t));
    try {
      await api.put(`/tasks/${taskId}`, { completed: updated });
      if (updated) {
        evaluateBoardRules('card_marked_complete', {
          cardId: taskId,
          listName: columns.find(c => c.id === task.columnId)?.name,
          card: { ...task, completed: true }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveTaskToColumn = async (taskId: string, targetColId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, columnId: targetColId } : t));
    try {
      await api.put(`/tasks/${taskId}`, { columnId: targetColId });
    } catch (err) {
      console.error('Failed to move task', err);
    }
  };

  const handleAddDirectTask = async (columnId: string, title: string) => {
    if (!title.trim() || !board) return;
    try {
      const { data } = await api.post('/tasks', {
        title: title.trim(),
        boardId: board.id,
        columnId: columnId,
        projectId: board.project_id
      });
      setTasks(prev => [...prev, { ...data.task, columnId: data.task.column_id, projectId: data.task.project_id }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTaskWithDate = async (dateStr: string, title: string) => {
    if (!title.trim() || !columns[0] || !board) return;
    try {
      const { data } = await api.post('/tasks', {
        title: title.trim(),
        boardId: board.id,
        columnId: columns[0].id,
        projectId: board.project_id,
        due_date: dateStr
      });
      setTasks(prev => [...prev, { ...data.task, columnId: data.task.column_id, projectId: data.task.project_id, due_date: dateStr }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMemberToBoard = async (userId: string) => {
    try {
      const { data } = await api.post(`/boards/${board.id}/members`, { userId });
      setBoardMembers(data.members || []);
    } catch (err) {
      console.error('Failed to add member to board', err);
    }
  };

  const handleRemoveMemberFromBoard = async (userId: string) => {
    try {
      const { data } = await api.delete(`/boards/${board.id}/members/${userId}`);
      setBoardMembers(data.members || []);
    } catch (err) {
      console.error('Failed to remove member from board', err);
    }
  };

  const shareWorkspaceUrl = board ? appUrl(`/boards/${board.id}`) : '';
  const shareFullscreenUrl = board ? appUrl(`/boards/${board.id}?view=fullscreen&mode=view`) : '';

  const addableMembers = filterMembers(
    portalUsers.filter(u => !boardMembers.some(m => m.user_id === u.id)),
    boardMemberSearch
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f5f7] min-h-[60vh]">
        <LoadingSpinner 
          size="xl" 
          label="Loading board..." 
          sublabel="Organizing columns and tasks" 
        />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f5f7] text-gray-500">
        Board not found.
      </div>
    );
  }

  // PASSCODE UNLOCK SCREEN FOR PRIVATE BOARD
  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f172a] text-white p-6 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-purple-900/30 to-amber-900/30 backdrop-blur-3xl"></div>
        
        <div className="relative z-10 w-full max-w-md bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
            <Lock size={32} />
          </div>

          <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Private Board Protected
          </span>

          <h2 className="text-2xl font-extrabold text-gray-900">{board.name}</h2>
          <p className="text-gray-500 text-xs mt-2 leading-relaxed">
            This board is private. Please enter the dynamic access code or password to unlock and collaborate.
          </p>

          <form onSubmit={handleUnlockBoard} className="w-full mt-6 flex flex-col gap-3">
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                autoFocus
                required
                placeholder="Enter access code (e.g. EVOL-8342)"
                value={passcodeAttempt}
                onChange={e => setPasscodeAttempt(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {unlockError && (
              <div className="text-xs text-red-600 flex items-center gap-1.5 justify-center font-medium">
                <AlertCircle size={13} /> {unlockError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-98 mt-1"
            >
              Unlock & Open Board
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 w-full">
            <Link to="/boards" className="text-xs text-gray-500 hover:text-gray-800 hover:underline">
              &larr; Back to all boards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Template cards identification
  const templateCards = tasks.filter(t => Boolean(t.is_template || t.description?.includes('<!--is_template:true-->')));

  const handleCreateNewTemplate = async (colId: string) => {
    try {
      const { data } = await api.post('/tasks', {
        title: 'New Template',
        boardId: board.id,
        columnId: colId,
        projectId: board.project_id,
        description: '<!--is_template:true-->\n\nTemplate instructions and details...',
      });
      const newT: Task = {
        ...data.task,
        columnId: data.task.column_id,
        projectId: data.task.project_id,
        is_template: true
      };
      setTasks(prev => [...prev, newT]);
      setSelectedTaskId(newT.id);
    } catch (err) {
      console.error('Failed to create template', err);
    }
  };

  const handleCreateCardFromTemplate = async (colId: string, templateTask: Task) => {
    try {
      const cleanDesc = (templateTask.description || '').replace(/<!--is_template:true-->/g, '').trim();
      const { data } = await api.post('/tasks', {
        title: `${templateTask.title} (Copy)`,
        boardId: board.id,
        columnId: colId,
        projectId: board.project_id,
        description: cleanDesc,
        priority: templateTask.priority,
        labels: templateTask.labels
      });
      const newT: Task = {
        ...data.task,
        columnId: data.task.column_id,
        projectId: data.task.project_id
      };
      setTasks(prev => [...prev, newT]);
      setSelectedTaskId(newT.id);
    } catch (err) {
      console.error('Failed to instantiate card from template', err);
    }
  };

  // Current logged in user ID
  let currentUserId: string | undefined;
  try {
    const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUserId = cu?.id;
  } catch (e) {
    // ignore
  }

  // Active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterState.keyword.trim()) count++;
    if (filterState.members.noMembers || filterState.members.assignedToMe || filterState.members.selectedUserIds.length > 0) count++;
    if (filterState.cardStatus.markedComplete || filterState.cardStatus.notMarkedComplete) count++;
    if (filterState.dueDate.noDates || filterState.dueDate.overdue || filterState.dueDate.nextDay || filterState.dueDate.nextWeek || filterState.dueDate.nextMonth) count++;
    if (filterState.labels.noLabels || filterState.labels.selectedColors.length > 0) count++;
    if (filterState.activity.lastWeek || filterState.activity.lastTwoWeeks || filterState.activity.lastFourWeeks || filterState.activity.withoutActivity) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Filter Tasks logic supporting 'any' or 'all' match mode
  const filteredTasks = tasks.filter(t => {
    if (activeFiltersCount === 0) return true;

    const tests: { active: boolean; passed: boolean }[] = [];

    // 1. Keyword
    if (filterState.keyword.trim()) {
      const kw = filterState.keyword.toLowerCase();
      const matchesKw = (t.title && t.title.toLowerCase().includes(kw)) ||
        (t.description && t.description.toLowerCase().includes(kw)) ||
        (t.labels && t.labels.toLowerCase().includes(kw));
      tests.push({ active: true, passed: Boolean(matchesKw) });
    }

    // 2. Members
    const hasMembersFilter = filterState.members.noMembers || filterState.members.assignedToMe || filterState.members.selectedUserIds.length > 0;
    if (hasMembersFilter) {
      let passedMembers = false;
      const assigneeIds = assigneeIdList(t.assignee_ids);
      if (filterState.members.noMembers && assigneeIds.length === 0) {
        passedMembers = true;
      }
      if (filterState.members.assignedToMe && currentUserId && assigneeIds.includes(currentUserId)) {
        passedMembers = true;
      }
      if (filterState.members.selectedUserIds.some(uid => assigneeIds.includes(uid))) {
        passedMembers = true;
      }
      tests.push({ active: true, passed: passedMembers });
    }

    // 3. Card status
    const hasStatusFilter = filterState.cardStatus.markedComplete || filterState.cardStatus.notMarkedComplete;
    if (hasStatusFilter) {
      let passedStatus = false;
      if (filterState.cardStatus.markedComplete && t.completed) passedStatus = true;
      if (filterState.cardStatus.notMarkedComplete && !t.completed) passedStatus = true;
      tests.push({ active: true, passed: passedStatus });
    }

    // 4. Due date
    const hasDueFilter = filterState.dueDate.noDates || filterState.dueDate.overdue || filterState.dueDate.nextDay || filterState.dueDate.nextWeek || filterState.dueDate.nextMonth;
    if (hasDueFilter) {
      let passedDue = false;
      const rawDate = t.due_date;
      const hasDate = Boolean(rawDate && rawDate.trim() !== '' && rawDate !== '0000-00-00' && rawDate !== 'null');
      if (filterState.dueDate.noDates && !hasDate) {
        passedDue = true;
      }
      if (hasDate && rawDate) {
        const dueDate = new Date(rawDate).getTime();
        if (!isNaN(dueDate)) {
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          if (filterState.dueDate.overdue && dueDate < now && !t.completed) passedDue = true;
          if (filterState.dueDate.nextDay && dueDate >= now && dueDate <= now + oneDay) passedDue = true;
          if (filterState.dueDate.nextWeek && dueDate >= now && dueDate <= now + (7 * oneDay)) passedDue = true;
          if (filterState.dueDate.nextMonth && dueDate >= now && dueDate <= now + (30 * oneDay)) passedDue = true;
        }
      }
      tests.push({ active: true, passed: passedDue });
    }

    // 5. Labels
    const hasLabelsFilter = filterState.labels.noLabels || filterState.labels.selectedColors.length > 0;
    if (hasLabelsFilter) {
      let passedLabels = false;
      if (filterState.labels.noLabels && (!t.labels || t.labels.trim() === '')) {
        passedLabels = true;
      }
      if (t.labels && filterState.labels.selectedColors.length > 0) {
        const taskLabels = t.labels.split(',').map(l => l.trim().toLowerCase());
        const colorNameMap: Record<string, string> = {
          '#4bce97': 'green',
          '#f5cd47': 'yellow',
          '#fea362': 'orange',
          '#f87168': 'red',
          '#9f8fef': 'purple',
          '#579dff': 'blue',
        };
        const hasSelectedColor = filterState.labels.selectedColors.some(hex => {
          const colorName = colorNameMap[hex.toLowerCase()];
          return taskLabels.some(lbl => lbl === hex.toLowerCase() || (colorName && lbl.includes(colorName)));
        });
        if (hasSelectedColor) passedLabels = true;
      }
      tests.push({ active: true, passed: passedLabels });
    }

    // 6. Activity
    const hasActivityFilter = filterState.activity.lastWeek || filterState.activity.lastTwoWeeks || filterState.activity.lastFourWeeks || filterState.activity.withoutActivity;
    if (hasActivityFilter) {
      let passedAct = false;
      const rawDate = (t as any).updated_at || (t as any).created_at;
      const actTime = rawDate ? new Date(rawDate).getTime() : 0;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const diff = now - actTime;

      if (filterState.activity.lastWeek && diff <= 7 * oneDay) passedAct = true;
      if (filterState.activity.lastTwoWeeks && diff <= 14 * oneDay) passedAct = true;
      if (filterState.activity.lastFourWeeks && diff <= 28 * oneDay) passedAct = true;
      if (filterState.activity.withoutActivity && (diff > 28 * oneDay || !rawDate)) passedAct = true;
      tests.push({ active: true, passed: passedAct });
    }

    if (filterState.matchMode === 'all') {
      return tests.every(test => test.passed);
    } else {
      return tests.some(test => test.passed);
    }
  });

  const getBoardBg = () => {
    const bg = board?.background;
    if (bg) {
      if (bg.startsWith('http') || bg.startsWith('/')) {
        return { 
          style: { 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url("${bg}")`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }, 
          className: '' 
        };
      }
      if (bg.startsWith('#') || bg.startsWith('rgb')) {
        return { style: { backgroundColor: bg }, className: '' };
      }
      if (bg.startsWith('bg-')) {
        return { style: undefined, className: bg };
      }
    }
    return { style: undefined, className: 'bg-[#eef2f6]' };
  };

  const boardBg = getBoardBg();

  return (
    <div 
      style={boardBg.style} 
      className={`flex-1 flex flex-col ${boardBg.className} text-[#172b4d] overflow-hidden select-none transition-colors duration-200`}
    >
      
      {/* Board Top Subheader Bar */}
      {isFullscreen ? (
        <div className="min-h-12 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between border-b border-gray-200/80 shrink-0 z-20 shadow-xs gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-xs">
              e
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight max-w-[140px] sm:max-w-none truncate">{board.name}</h1>
                <span className="hidden sm:inline-flex bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider items-center gap-1">
                  <Maximize2 size={10} /> Full Screen Presentation
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${board.visibility === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {board.visibility}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 hidden sm:block">View-only presentation mode</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 bg-[#0052cc] hover:bg-[#0065ff] text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Share2 size={13} /> <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Exit full-screen mode"
            >
              <Minimize2 size={13} /> <span className="hidden sm:inline">Exit Full Screen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-12 bg-white/95 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between border-b border-gray-200 shrink-0 z-20 shadow-2xs gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        
        {/* Left Side: Board Title & Views dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isEditingBoardName ? (
            <input 
              autoFocus
              type="text"
              value={boardNameInput}
              onChange={e => setBoardNameInput(e.target.value)}
              onBlur={handleSaveBoardName}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveBoardName(); }}
              className="bg-white border-2 border-blue-600 rounded px-2.5 py-1 text-gray-900 font-bold text-sm sm:text-base outline-none max-w-[140px] sm:max-w-none"
            />
          ) : (
            <h1 
              onClick={() => setIsEditingBoardName(true)}
              className="text-sm sm:text-base font-extrabold text-gray-900 hover:bg-gray-100 px-1.5 sm:px-2 py-1 rounded cursor-pointer transition-colors max-w-[120px] sm:max-w-[200px] md:max-w-none truncate"
              title={board.name}
            >
              {board.name}
            </h1>
          )}

          {/* Views Selector Button */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowViewsDropdown(!showViewsDropdown)}
              className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border border-gray-200 cursor-pointer shadow-2xs"
            >
              {currentView === 'board' && <Layout size={14} className="text-[#0c66e4]" />}
              {currentView === 'table' && <Table size={14} className="text-[#0c66e4]" />}
              {currentView === 'calendar' && <CalendarIcon size={14} className="text-[#0c66e4]" />}
              {currentView === 'dashboard' && <BarChart2 size={14} className="text-[#0c66e4]" />}
              <span className="capitalize hidden sm:inline">{currentView}</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {showViewsDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowViewsDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-gray-700 animate-in fade-in zoom-in-95">
                  <div className="p-3.5 border-b border-gray-100 bg-gray-50/80">
                    <h3 className="text-sm font-bold text-gray-900">Board Views</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Switch view modes to manage your timeline.</p>
                  </div>
                  
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button 
                      onClick={() => { setCurrentView('board'); setShowViewsDropdown(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentView === 'board' ? 'bg-blue-50 text-[#0c66e4]' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layout size={16} className={currentView === 'board' ? 'text-[#0c66e4]' : 'text-gray-500'} />
                        <span>Board</span>
                      </div>
                      {currentView === 'board' && <Check size={14} className="text-[#0c66e4]" />}
                    </button>

                    <button 
                      onClick={() => { setCurrentView('table'); setShowViewsDropdown(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentView === 'table' ? 'bg-blue-50 text-[#0c66e4]' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Table size={16} className={currentView === 'table' ? 'text-[#0c66e4]' : 'text-gray-500'} />
                        <span>Table</span>
                      </div>
                      {currentView === 'table' && <Check size={14} className="text-[#0c66e4]" />}
                    </button>

                    <button 
                      onClick={() => { setCurrentView('calendar'); setShowViewsDropdown(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentView === 'calendar' ? 'bg-blue-50 text-[#0c66e4]' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon size={16} className={currentView === 'calendar' ? 'text-[#0c66e4]' : 'text-gray-500'} />
                        <span>Calendar</span>
                      </div>
                      {currentView === 'calendar' && <Check size={14} className="text-[#0c66e4]" />}
                    </button>

                    <button 
                      onClick={() => { setCurrentView('dashboard'); setShowViewsDropdown(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentView === 'dashboard' ? 'bg-blue-50 text-[#0c66e4]' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BarChart2 size={16} className={currentView === 'dashboard' ? 'text-[#0c66e4]' : 'text-gray-500'} />
                        <span>Dashboard</span>
                      </div>
                      {currentView === 'dashboard' && <Check size={14} className="text-[#0c66e4]" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Star Icon */}
          <button 
            onClick={() => setIsStarred(!isStarred)}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0 ${isStarred ? 'text-amber-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Star size={16} fill={isStarred ? 'currentColor' : 'none'} />
          </button>

          {/* Visibility indicator */}
          <div className="relative shrink-0">
            {board.visibility === 'private' ? (
              <button 
                onClick={() => setShowCodePopover(!showCodePopover)}
                className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                title="Private board — Click to view access passcode"
              >
                <Lock size={12} />
                <span>Private</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Public</span>
              </div>
            )}

            {/* Access Code Popover */}
            {showCodePopover && board.access_code && (
              <div className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs text-gray-800">
                <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Key size={14} className="text-amber-600" /> Board Passcode
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 font-mono font-bold text-amber-900 text-sm">
                  {board.access_code}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Share this passcode with teammates to grant access to this private board.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Members, Filter & Share Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Board Members Avatar Stack */}
          <div 
            onClick={() => setShowMembersModal(true)}
            className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity mr-0.5 sm:mr-1 shrink-0" 
            title="View & manage board members"
          >
            {boardMembers.slice(0, 2).map((m, idx) => (
              <div 
                key={m.user_id || idx}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white shadow-xs uppercase"
              >
                {(m.name || 'U').charAt(0)}
              </div>
            ))}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white shadow-xs">
              <Users size={11} />
            </div>
          </div>

          <button 
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-gray-200 shrink-0"
            title="Add member"
          >
            <Plus size={13} /> <span className="hidden sm:inline">Member</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowAutomationModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#0c66e4] hover:border-blue-300 hover:bg-blue-50 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Automation rules & directory"
          >
            <Zap size={13} className="text-[#0c66e4]" fill="#0c66e4" /> <span className="hidden md:inline">Automation</span>
          </button>

          <button 
            onClick={() => setFilterDrawerOpen(true)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer shrink-0 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}
          >
            <Filter size={13} /> <span className="hidden sm:inline">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#0052cc] text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0065ff] transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Share2 size={13} /> <span className="hidden sm:inline">Share</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowBoardMenu(true)}
            className="flex items-center gap-1 sm:gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Show board menu"
          >
            <MoreHorizontal size={14} /> <span className="hidden sm:inline">Menu</span>
          </button>
        </div>

      </div>
      )}

      {/* Board Filter Slide-over Drawer */}
      <BoardFilterDrawer 
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filterState}
        onChange={setFilterState}
        onClear={() => setFilterState(INITIAL_FILTER_STATE)}
        portalUsers={portalUsers}
        currentUserId={currentUserId}
        totalCardsCount={tasks.length}
        filteredCardsCount={filteredTasks.length}
      />

      {/* MAIN KANBAN BOARD VIEW */}
      {currentView === 'board' && (
        <main className="flex-1 overflow-x-auto p-3 sm:p-5 flex items-start gap-3 sm:gap-4 custom-scrollbar pb-24">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragOver={handleDragOver} 
            onDragEnd={handleDragEnd}
          >
            {columns.map((col, colIdx) => {
              const colTasks = filteredTasks.filter(t => t.columnId === col.id);

              return (
                <DroppableColumn
                  key={col.id}
                  column={col}
                  tasks={colTasks}
                  onSelectTask={t => setSelectedTaskId(t.id)}
                  onToggleComplete={handleToggleCardComplete}
                  addingToCol={addingToCol}
                  newTaskTitle={newTaskTitle}
                  setNewTaskTitle={setNewTaskTitle}
                  setAddingToCol={setAddingToCol}
                  onAddTask={handleAddTask}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onMoveLeft={id => handleMoveColumn(id, 'left')}
                  onMoveRight={id => handleMoveColumn(id, 'right')}
                  onChangeColor={handleChangeColumnColor}
                  onCopyList={handleCopyColumn}
                  onMoveAllCards={handleMoveAllCards}
                  onArchiveAllCards={handleArchiveAllCards}
                  isFirst={colIdx === 0}
                  isLast={colIdx === columns.length - 1}
                  isReadOnly={isReadOnly}
                  templateCards={templateCards}
                  onCreateCardFromTemplate={handleCreateCardFromTemplate}
                  onCreateNewTemplate={handleCreateNewTemplate}
                  forceCollapsed={(filterState.collapseEmptyLists && colTasks.length === 0) || areAllListsCollapsed}
                />
              );
            })}
          </DndContext>

          {/* Add Another List (hidden in read-only view) */}
          {!isReadOnly && (
            <div className="w-[285px] shrink-0">
              {isAddingList ? (
                <form onSubmit={handleAddColumn} className="bg-[#ebecf0] p-3 rounded-2xl border border-gray-300 shadow-sm flex flex-col gap-2">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Enter list title..."
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    className="bg-white border border-blue-500 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      type="submit"
                      className="bg-[#0052cc] hover:bg-[#0065ff] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Add list
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingList(false)}
                      className="text-gray-400 hover:text-gray-700 p-1 rounded cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingList(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/50 text-gray-800 text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={16} /> Add another list
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {/* TABLE VIEW */}
      {currentView === 'table' && (
        <BoardTableView
          tasks={filteredTasks}
          totalTasksCount={tasks.length}
          columns={columns}
          portalUsers={portalUsers}
          onSelectTask={id => setSelectedTaskId(id)}
          onMoveTask={handleMoveTaskToColumn}
          onToggleComplete={handleToggleCardCompleteById}
          onAddTask={handleAddDirectTask}
          isReadOnly={isReadOnly}
        />
      )}

      {/* CALENDAR VIEW */}
      {currentView === 'calendar' && (
        <BoardCalendarView
          tasks={filteredTasks}
          columns={columns}
          onSelectTask={id => setSelectedTaskId(id)}
          onAddTaskWithDate={handleAddTaskWithDate}
          isReadOnly={isReadOnly}
        />
      )}

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <BoardDashboardView
          board={board}
          tasks={filteredTasks}
          columns={columns}
          portalUsers={portalUsers}
        />
      )}

      {/* FLOATING BOTTOM NAVIGATION PILL DOCK */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-300 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 z-40 text-xs font-semibold text-gray-700">
        <button 
          onClick={() => {
            loadInbox();
            setShowInbox(true);
          }}
          className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors text-gray-600 cursor-pointer"
        >
          <Inbox size={14} className="text-[#0c66e4]" />
          <span>Inbox</span>
          {inboxTasks.assigned.length > 0 && (
            <span className="bg-[#0c66e4] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {inboxTasks.assigned.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentView('board')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${currentView === 'board' ? 'bg-[#0c66e4] text-white font-bold shadow-xs' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <Layout size={13} />
          <span>Board</span>
        </button>

        <button 
          onClick={() => setCurrentView('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${currentView === 'table' ? 'bg-[#0c66e4] text-white font-bold shadow-xs' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <Table size={13} />
          <span>Table</span>
        </button>

        <button 
          onClick={() => setCurrentView('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${currentView === 'calendar' ? 'bg-[#0c66e4] text-white font-bold shadow-xs' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <CalendarIcon size={13} />
          <span>Calendar</span>
        </button>

        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${currentView === 'dashboard' ? 'bg-[#0c66e4] text-white font-bold shadow-xs' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <BarChart2 size={13} />
          <span>Dashboard</span>
        </button>

        <Link to="/boards" className="flex items-center gap-1.5 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors text-gray-600">
          <MoreHorizontal size={13} />
          <span>All boards</span>
        </Link>
      </div>

      {/* INBOX SLIDE-OVER DRAWER */}
      {showInbox && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end" onClick={() => setShowInbox(false)}>
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Inbox size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Your Inbox & Tasks</h3>
              </div>
              <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
              {/* Assigned to You */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Assigned to You ({inboxTasks.assigned.length})
                </div>
                <div className="flex flex-col gap-2">
                  {inboxTasks.assigned.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        setShowInbox(false);
                        setSelectedTaskId(t.id);
                      }}
                      className="p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all"
                    >
                      <div className="font-semibold text-gray-900 text-xs">{t.title}</div>
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                        <span>{t.board_name}</span> &bull; <span>{t.column_name}</span>
                      </div>
                    </div>
                  ))}
                  {inboxTasks.assigned.length === 0 && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                      No active tasks currently assigned to you.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Tasks */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Recent Workspace Tasks
                </div>
                <div className="flex flex-col gap-2">
                  {inboxTasks.recent.slice(0, 8).map(t => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        setShowInbox(false);
                        setSelectedTaskId(t.id);
                      }}
                      className="p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-medium text-gray-800">{t.title}</div>
                      <span className="text-[10px] text-gray-400">{t.board_name} &bull; {t.column_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOARD MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowMembersModal(false)}>
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">Board Members</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {boardMembers.length}
                </span>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Add Member Search */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search portal users by name, username, emp code, department..."
                    value={boardMemberSearch}
                    onChange={e => setBoardMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                {boardMemberSearch.trim() && (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {addableMembers.map(u => (
                      <div key={u.id} className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-gray-50">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{u.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{memberSubtitle(u)}</div>
                        </div>
                        <button
                          onClick={() => handleAddMemberToBoard(u.id)}
                          className="bg-[#0052cc] hover:bg-[#0065ff] text-white text-[11px] font-bold px-3 py-1 rounded-md transition-colors shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                    {addableMembers.length === 0 && (
                      <div className="p-3 text-center text-xs text-gray-400">No matching users to add.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {boardMembers.map(m => (
                  <div key={m.user_id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase">
                        {(m.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{m.name}</div>
                        <div className="text-[10px] text-gray-500">{memberSubtitle(m)} &bull; <span className="capitalize">{m.role}</span></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveMemberFromBoard(m.user_id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Remove from board"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {boardMembers.length === 0 && (
                  <div className="p-4 text-center text-xs text-gray-400">No members added to this board yet.</div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowMembersModal(false)}
                className="bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      <TaskModal 
        taskId={selectedTaskId}
        columns={columns}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadBoardData}
        onOpenAutomationDirectory={() => setShowAutomationModal(true)}
        readOnly={isReadOnly}
      />

      {/* Share Board Modal (Public URL, Private URL, Full Screen Presentation) */}
      {showShareModal && board && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Share Board</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{board.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Visibility Setting Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${board.visibility === 'private' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {board.visibility === 'private' ? <Lock size={16} /> : <Globe size={16} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <span>{board.visibility === 'private' ? 'Private Board' : 'Public Board'}</span>
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${board.visibility === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {board.visibility}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {board.visibility === 'private' 
                        ? 'Protected with access passcode. Anyone opening requires the code.' 
                        : 'Open access. Anyone with the URL can view without a password.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Switch to {board.visibility === 'private' ? 'Public' : 'Private'}
                </button>
              </div>

              {/* Dynamic Passcode Banner if Private */}
              {board.visibility === 'private' && board.access_code && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Key size={18} className="text-amber-700 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Access Passcode:</span>
                      <span className="font-mono font-extrabold text-sm text-amber-950">{board.access_code}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(board.access_code, 'passcode')}
                    className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedLink === 'passcode' ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                    <span>{copiedLink === 'passcode' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              )}

              {/* 1. Full Screen Presentation URL (Requested Feature) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 size={13} className="text-blue-600" />
                    <span>Full Screen View Link (Recommended for Sharing)</span>
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    View-Only Presentation
                  </span>
                </label>
                <p className="text-[11px] text-gray-500">
                  When another person opens this link, they view the board in full-screen presentation mode only (read-only, no distraction).
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    readOnly
                    type="text"
                    value={shareFullscreenUrl}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-800 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(shareFullscreenUrl, 'fullscreen')}
                    className="bg-[#0052cc] hover:bg-[#0065ff] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    {copiedLink === 'fullscreen' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink === 'fullscreen' ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={shareFullscreenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
                    title="Open preview in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* 2. Standard Workspace URL */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Layout size={13} className="text-gray-500" />
                  <span>Standard Workspace Link</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  For authenticated team members with full editing and management permissions.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    readOnly
                    type="text"
                    value={shareWorkspaceUrl}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-800 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(shareWorkspaceUrl, 'workspace')}
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    {copiedLink === 'workspace' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedLink === 'workspace' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board Trello-style Slide-over Menu Drawer */}
      <BoardMenuDrawer
        isOpen={showBoardMenu}
        onClose={() => setShowBoardMenu(false)}
        board={board}
        onUpdateBoard={(updated) => setBoard(updated)}
        tasks={tasks}
        columns={columns}
        onCollapseAllLists={(collapse) => setAreAllListsCollapsed(collapse)}
        areAllListsCollapsed={areAllListsCollapsed}
        onOpenShare={() => setShowShareModal(true)}
        onOpenAutomation={() => {
          setShowBoardMenu(false);
          setShowAutomationModal(true);
        }}
        isStarred={isStarred}
        onToggleStar={() => setIsStarred(!isStarred)}
        onRestoreTask={async (taskId) => {
          try {
            await api.put(`/tasks/${taskId}`, { completed: false });
            await loadBoardData();
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Trello-style Butler Automation Modal */}
      <AutomationModal
        isOpen={showAutomationModal}
        onClose={() => setShowAutomationModal(false)}
        columns={columns}
        onRuleExecuted={loadBoardData}
      />

    </div>
  );
}
  