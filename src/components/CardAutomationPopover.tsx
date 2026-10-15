import React, { useState } from 'react';
import { 
  X, ChevronLeft, Info, Plus, ArrowRight, Copy, Tag, User, 
  Clock, Settings, Minus, ArrowUpDown, ChevronDown, Play, Trash2
} from 'lucide-react';

export interface ActionItem {
  id: string;
  type: 'move' | 'copy' | 'label' | 'join' | 'date' | 'mark' | 'remove' | 'sort' | 'custom';
  params: {
    position?: 'top' | 'bottom';
    targetColumnId?: string;
    targetColumnName?: string;
    boardName?: string;
    labelColor?: string;
    labelName?: string;
    dateType?: 'due date' | 'start date';
    dateAmount?: number;
    dateUnit?: 'working days' | 'days' | 'weeks';
    dateDirection?: 'later' | 'earlier';
    markStatus?: 'complete' | 'incomplete';
    removeTarget?: 'all labels' | 'all members' | 'due date';
    sortBy?: 'priority' | 'due date' | 'card title';
  };
}

export interface CardAutomationButton {
  id: string;
  icon: string;
  title: string;
  actionType: 'move' | 'copy' | 'label' | 'join' | 'date' | 'mark' | 'remove' | 'sort' | 'custom';
  actions?: ActionItem[];
  params: ActionItem['params'];
}

interface CardAutomationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; name: string }[];
  boardName?: string;
  automationButtons: CardAutomationButton[];
  onAddButton: (button: CardAutomationButton) => void;
  onDeleteButton: (buttonId: string) => void;
  onExecuteButton: (button: CardAutomationButton) => void;
  onOpenAutomationDirectory?: () => void;
}

type ViewState = 'main' | 'templates' | 'edit';

const TEMPLATES: { 
  type: ActionItem['type']; 
  iconKey: string; 
  title: string; 
  badge: string; 
}[] = [
  { type: 'move', iconKey: 'move', title: 'Move card to...', badge: 'Move' },
  { type: 'copy', iconKey: 'copy', title: 'Copy card to...', badge: 'Copy' },
  { type: 'label', iconKey: 'label', title: 'Add label...', badge: 'Labels' },
  { type: 'join', iconKey: 'join', title: 'Join card', badge: 'Members' },
  { type: 'date', iconKey: 'date', title: 'Set due date or start date...', badge: 'Dates' },
  { type: 'mark', iconKey: 'mark', title: 'Mark card...', badge: 'Status' },
  { type: 'remove', iconKey: 'remove', title: 'Remove...', badge: 'Remove' },
  { type: 'sort', iconKey: 'sort', title: 'Sort list...', badge: 'Sort' },
];

const AVAILABLE_COLORS = [
  { name: 'Green', color: '#22c55e' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Lime', color: '#84cc16' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Dark', color: '#334155' }
];

export const CardAutomationPopover: React.FC<CardAutomationPopoverProps> = ({
  isOpen,
  onClose,
  columns,
  boardName = 'test',
  automationButtons,
  onAddButton,
  onDeleteButton,
  onExecuteButton,
  onOpenAutomationDirectory
}) => {
  const [view, setView] = useState<ViewState>('main');
  const [showInfo, setShowInfo] = useState(false);

  // Edit Button State
  const [selectedIconKey, setSelectedIconKey] = useState('move');
  const [buttonTitle, setButtonTitle] = useState('');
  const [titlePlaceholder, setTitlePlaceholder] = useState('Move card to...');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Multi-actions state (matching Screenshot 4)
  const [actionsList, setActionsList] = useState<ActionItem[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isOpen) return null;

  const renderIcon = (key: string, size = 16, className = 'text-[#0c66e4]') => {
    switch (key) {
      case 'move': return <ArrowRight size={size} className={className} />;
      case 'copy': return <Copy size={size} className={className} />;
      case 'label': return <Tag size={size} className={className} />;
      case 'join': return <User size={size} className={className} />;
      case 'date': return <Clock size={size} className={className} />;
      case 'mark': return <Settings size={size} className={className} />;
      case 'remove': return <Minus size={size} className={className} />;
      case 'sort': return <ArrowUpDown size={size} className={className} />;
      default: return <ArrowRight size={size} className={className} />;
    }
  };

  const createDefaultAction = (type: ActionItem['type']): ActionItem => {
    return {
      id: `act-${Date.now()}-${Math.random()}`,
      type,
      params: {
        position: 'top',
        targetColumnId: columns[0]?.id || '',
        targetColumnName: columns[0]?.name || 'list name',
        boardName: boardName || 'test',
        labelColor: '#22c55e',
        labelName: 'Green',
        dateType: 'due date',
        dateAmount: 3,
        dateUnit: 'working days',
        dateDirection: 'later',
        markStatus: 'complete',
        removeTarget: 'all labels',
        sortBy: 'priority'
      }
    };
  };

  const handleSelectTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setSelectedIconKey(tmpl.iconKey);
    setTitlePlaceholder(tmpl.title);
    
    // For "Join card" set prefilled text as in Screenshot 4, otherwise empty with placeholder
    if (tmpl.type === 'join') {
      setButtonTitle('Join card');
    } else {
      setButtonTitle('');
    }

    setActionsList([createDefaultAction(tmpl.type)]);
    setView('edit');
  };

  const handleAddAction = () => {
    const currentType = actionsList[0]?.type || 'join';
    setActionsList([...actionsList, createDefaultAction(currentType)]);
  };

  const handleRemoveAction = (actionId: string) => {
    if (actionsList.length <= 1) return;
    setActionsList(actionsList.filter(a => a.id !== actionId));
  };

  const updateActionParam = (actionId: string, paramKey: keyof ActionItem['params'], value: any) => {
    setActionsList(actionsList.map(act => {
      if (act.id !== actionId) return act;
      return {
        ...act,
        params: {
          ...act.params,
          [paramKey]: value
        }
      };
    }));
  };

  const handleSaveButton = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = buttonTitle.trim() || titlePlaceholder;
    if (!finalTitle) return;

    const firstAction = actionsList[0] || createDefaultAction('move');

    const newBtn: CardAutomationButton = {
      id: `btn-${Date.now()}`,
      icon: selectedIconKey,
      title: finalTitle,
      actionType: firstAction.type,
      actions: actionsList,
      params: firstAction.params
    };

    onAddButton(newBtn);
    setView('main');
  };

  return (
    <div 
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-[320px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* ================= VIEW 1: MAIN AUTOMATION MENU (Image 3) ================= */}
      {view === 'main' && (
        <div className="p-4 flex flex-col gap-3">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-800">Automation</h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="w-7 h-7 rounded-full border-2 border-[#1976d2] text-[#1976d2] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Automation Information"
              >
                <Info size={15} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Info Banner when (i) clicked */}
          {showInfo && (
            <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed animate-in fade-in">
              Card buttons allow you to automate multi-step repetitive actions like moving cards, adding assignees, setting dates, or updating labels in one click.
            </div>
          )}

          {/* Active Buttons on this card */}
          {automationButtons.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Card Buttons</span>
              {automationButtons.map(btn => (
                <div 
                  key={btn.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80 hover:bg-blue-50/50 hover:border-blue-300 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => { onExecuteButton(btn); onClose(); }}
                    className="flex items-center gap-2.5 text-xs font-semibold text-gray-800 hover:text-blue-600 flex-1 text-left cursor-pointer truncate"
                  >
                    <span className="shrink-0">{renderIcon(btn.icon, 14)}</span>
                    <span className="truncate">{btn.title}</span>
                  </button>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => { onExecuteButton(btn); onClose(); }}
                      className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md cursor-pointer"
                      title="Run button"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteButton(btn.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-md cursor-pointer"
                      title="Delete button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* + Add button */}
          <button
            type="button"
            onClick={() => setView('templates')}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors cursor-pointer w-full text-left"
          >
            <Plus size={16} className="text-gray-600" />
            <span>Add button</span>
          </button>

        </div>
      )}

      {/* ================= VIEW 2: BUTTON TEMPLATES (Matching Screenshot 1) ================= */}
      {view === 'templates' && (
        <div className="p-3.5 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setView('main')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="font-bold text-sm text-gray-800">Add button</h4>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-xs font-bold text-gray-800">Button templates</div>

          {/* Templates List */}
          <div className="flex flex-col gap-1.5">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200/90 hover:border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-800 transition-all text-left cursor-pointer group"
              >
                <span className="shrink-0">{renderIcon(tmpl.iconKey, 16)}</span>
                <span className="truncate">{tmpl.title}</span>
              </button>
            ))}
          </div>

          {/* Explanatory note */}
          <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
            All members on the board can see your card buttons. You can edit the visibility in the{' '}
            <span 
              onClick={() => {
                onClose();
                onOpenAutomationDirectory?.();
              }}
              className="text-blue-600 underline cursor-pointer hover:text-blue-800"
            >
              automation directory
            </span>.
          </p>

          <div className="h-px bg-gray-200 my-0.5" />

          {/* Create a custom button */}
          <button
            type="button"
            onClick={() => {
              setSelectedIconKey('move');
              setTitlePlaceholder('Custom button');
              setButtonTitle('');
              setActionsList([createDefaultAction('move')]);
              setView('edit');
            }}
            className="w-full py-2.5 px-3 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
          >
            Create a custom button
          </button>

        </div>
      )}

      {/* ================= VIEW 3: EDIT BUTTON (Matching Screenshots 2, 3, 4, 5) ================= */}
      {view === 'edit' && (
        <form onSubmit={handleSaveButton} className="p-3.5 flex flex-col gap-3 max-h-[520px] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setView('templates')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="font-bold text-sm text-gray-800">Edit button</h4>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Icon & Title Row */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Icon</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-10 h-9 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                {renderIcon(selectedIconKey, 18)}
              </button>

              {/* Icon selector dropdown */}
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-white rounded-xl shadow-xl border border-gray-200 grid grid-cols-4 gap-2 w-40">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedIconKey(t.iconKey); setShowIconPicker(false); }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 rounded-lg cursor-pointer"
                    >
                      {renderIcon(t.iconKey, 16)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Title</label>
              <input
                type="text"
                value={buttonTitle}
                onChange={e => setButtonTitle(e.target.value)}
                placeholder={titlePlaceholder}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Actions</span>

            {/* List of Action Cards (Can be multiple as in Screenshot 4) */}
            <div className="flex flex-col gap-2.5">
              {actionsList.map(action => (
                <div 
                  key={action.id}
                  className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex flex-col gap-2.5 text-xs text-gray-800"
                >
                  
                  {/* Top Bar inside Action Card: Badge on Left, X on Right (Screenshot 4) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                      <span>{renderIcon(action.type, 13, 'text-gray-600')}</span>
                      <span className="capitalize">
                        {action.type === 'move' ? 'Move' : 
                         action.type === 'copy' ? 'Copy' : 
                         action.type === 'label' ? 'Labels' : 
                         action.type === 'join' ? 'Members' : 
                         action.type === 'date' ? 'Dates' : 
                         action.type === 'mark' ? 'Status' : 
                         action.type === 'remove' ? 'Remove' : 
                         action.type === 'sort' ? 'Sort' : 'Action'}
                      </span>
                    </div>

                    {actionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(action.id)}
                        className="text-gray-400 hover:text-gray-700 p-0.5 rounded-md cursor-pointer"
                        title="Remove action"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* 1. Move Card To... (Screenshot 2) */}
                  {action.type === 'move' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-2">
                      <span>Move the card to the</span>
                      <select 
                        value={action.params.position || 'top'} 
                        onChange={e => updateActionParam(action.id, 'position', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="top">top ⌄</option>
                        <option value="bottom">bottom ⌄</option>
                      </select>
                      <span>of the</span>
                      <span>list</span>
                      <select 
                        value={action.params.targetColumnId || columns[0]?.id} 
                        onChange={e => {
                          const col = columns.find(c => c.id === e.target.value);
                          updateActionParam(action.id, 'targetColumnId', e.target.value);
                          if (col) updateActionParam(action.id, 'targetColumnName', col.name);
                        }}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs max-w-[130px] truncate focus:outline-hidden"
                      >
                        {columns.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ⌄</option>
                        ))}
                      </select>
                      <span>on</span>
                      <span className="font-semibold text-gray-800 px-1 py-0.5 bg-transparent hover:bg-gray-100 rounded cursor-pointer">
                        {boardName} ⌄
                      </span>
                    </div>
                  )}

                  {/* 2. Copy Card To... */}
                  {action.type === 'copy' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-2">
                      <span>Copy the card to the</span>
                      <select 
                        value={action.params.position || 'top'} 
                        onChange={e => updateActionParam(action.id, 'position', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="top">top ⌄</option>
                        <option value="bottom">bottom ⌄</option>
                      </select>
                      <span>of list</span>
                      <select 
                        value={action.params.targetColumnId || columns[0]?.id} 
                        onChange={e => updateActionParam(action.id, 'targetColumnId', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        {columns.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ⌄</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 3. Add Label... (Screenshot 3) */}
                  {action.type === 'label' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-2 relative">
                      <span>Add the</span>
                      
                      {/* Colored Label Pill with Chevron */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="h-5 px-2 rounded flex items-center justify-between gap-1.5 shadow-2xs border border-black/10 cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: action.params.labelColor || '#22c55e' }}
                        >
                          <span className="w-6 h-2 rounded-xs bg-white/20" />
                          <ChevronDown size={11} className="text-white drop-shadow-xs" />
                        </button>

                        {/* Color Selector Popover */}
                        {showColorPicker && (
                          <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-white rounded-xl shadow-xl border border-gray-200 grid grid-cols-5 gap-1.5 w-44">
                            {AVAILABLE_COLORS.map((col, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => {
                                  updateActionParam(action.id, 'labelColor', col.color);
                                  updateActionParam(action.id, 'labelName', col.name);
                                  setShowColorPicker(false);
                                }}
                                className="w-6 h-5 rounded hover:scale-110 transition-transform shadow-2xs border border-black/10"
                                style={{ backgroundColor: col.color }}
                                title={col.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <span>label to the</span>
                      <span>card</span>
                    </div>
                  )}

                  {/* 4. Join Card (Screenshot 4) */}
                  {action.type === 'join' && (
                    <div className="text-xs text-gray-800 font-medium py-0.5">
                      Join the card
                    </div>
                  )}

                  {/* 5. Set due date or start date... (Screenshot 5) */}
                  {action.type === 'date' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-2">
                      <span>Set the</span>
                      <select 
                        value={action.params.dateType || 'due date'} 
                        onChange={e => updateActionParam(action.id, 'dateType', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="due date">due date ⌄</option>
                        <option value="start date">start date ⌄</option>
                      </select>
                      <span>to</span>
                      
                      {/* Number box matching Screenshot 5 */}
                      <input 
                        type="number"
                        min="1"
                        max="365"
                        value={action.params.dateAmount ?? 3}
                        onChange={e => updateActionParam(action.id, 'dateAmount', parseInt(e.target.value) || 1)}
                        className="w-9 h-6 text-center bg-gray-100 rounded font-semibold text-gray-800 text-xs border border-transparent focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />

                      <select 
                        value={action.params.dateUnit || 'working days'} 
                        onChange={e => updateActionParam(action.id, 'dateUnit', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="working days">working days ⌄</option>
                        <option value="days">days ⌄</option>
                        <option value="weeks">weeks ⌄</option>
                      </select>

                      <span>later</span>
                    </div>
                  )}

                  {/* 6. Mark card... */}
                  {action.type === 'mark' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex items-center gap-1.5">
                      <span>Mark the card as</span>
                      <select 
                        value={action.params.markStatus || 'complete'} 
                        onChange={e => updateActionParam(action.id, 'markStatus', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="complete">complete ⌄</option>
                        <option value="incomplete">incomplete ⌄</option>
                      </select>
                    </div>
                  )}

                  {/* 7. Remove... */}
                  {action.type === 'remove' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex items-center gap-1.5">
                      <span>Remove</span>
                      <select 
                        value={action.params.removeTarget || 'all labels'} 
                        onChange={e => updateActionParam(action.id, 'removeTarget', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="all labels">all labels ⌄</option>
                        <option value="all members">all members ⌄</option>
                        <option value="due date">due date ⌄</option>
                      </select>
                      <span>from the card</span>
                    </div>
                  )}

                  {/* 8. Sort list... */}
                  {action.type === 'sort' && (
                    <div className="text-xs text-gray-700 leading-relaxed flex items-center gap-1.5">
                      <span>Sort the list by</span>
                      <select 
                        value={action.params.sortBy || 'priority'} 
                        onChange={e => updateActionParam(action.id, 'sortBy', e.target.value)}
                        className="border-none font-semibold text-gray-800 bg-transparent hover:bg-gray-100 rounded px-1 py-0.5 cursor-pointer text-xs focus:outline-hidden"
                      >
                        <option value="priority">priority ⌄</option>
                        <option value="due date">due date ⌄</option>
                        <option value="card title">card title ⌄</option>
                      </select>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* + Add action button (Screenshots 2, 3, 4, 5) */}
            <button
              type="button"
              onClick={handleAddAction}
              className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} className="text-gray-500" /> 
              <span>Add action</span>
            </button>
          </div>

          <div className="h-px bg-gray-200 my-0.5" />

          {/* Submit: Add button (Screenshots 2, 3, 4, 5) */}
          <button
            type="submit"
            disabled={!buttonTitle.trim() && !titlePlaceholder}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              buttonTitle.trim()
                ? 'bg-[#0c66e4] hover:bg-[#0055cc] text-white cursor-pointer shadow-xs'
                : 'bg-[#091e4208] text-[#a5adba] border border-gray-200 cursor-not-allowed'
            }`}
          >
            Add button
          </button>

        </form>
      )}

    </div>
  );
};
