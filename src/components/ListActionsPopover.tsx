import React, { useState } from 'react';
import { X, Check, ChevronUp, ChevronDown } from 'lucide-react';

export interface ListColor {
  name: string;
  value: string;
}

export const LIST_COLORS: ListColor[] = [
  { name: 'Green', value: '#216e4e' },
  { name: 'Yellow', value: '#7f5f01' },
  { name: 'Orange', value: '#a54800' },
  { name: 'Red', value: '#ae2e24' },
  { name: 'Purple', value: '#5e4db2' },
  { name: 'Blue', value: '#0055cc' },
  { name: 'Teal', value: '#206a83' },
  { name: 'Olive', value: '#4c6b1f' },
  { name: 'Magenta', value: '#943d73' },
  { name: 'Gray', value: '#596773' },
];

interface ListActionsPopoverProps {
  columnId: string;
  columnName: string;
  currentColor?: string | null;
  cardCount: number;
  onAddCard: () => void;
  onCopyList: () => void;
  onMoveList: () => void;
  onMoveAllCards: () => void;
  onWatchToggle?: () => void;
  isWatching?: boolean;
  onChangeColor: (color: string | null) => void;
  onArchiveList: () => void;
  onArchiveAllCards: () => void;
  onClose: () => void;
}

export const ListActionsPopover: React.FC<ListActionsPopoverProps> = ({
  columnId,
  columnName,
  currentColor,
  cardCount,
  onAddCard,
  onCopyList,
  onMoveList,
  onMoveAllCards,
  onWatchToggle,
  isWatching = false,
  onChangeColor,
  onArchiveList,
  onArchiveAllCards,
  onClose
}) => {
  const [showColorSection, setShowColorSection] = useState(true);
  const [automationSelection, setAutomationSelection] = useState('Automation');
  const [watching, setWatching] = useState(isWatching);

  const handleToggleWatch = () => {
    setWatching(!watching);
    onWatchToggle?.();
  };

  return (
    <div 
      className="w-[280px] bg-white text-[#172b4d] rounded-2xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 text-left"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between pb-2 mb-2 border-b border-[#091e4214]">
        <div className="w-5" />
        <h3 className="font-semibold text-xs text-[#44546f] tracking-tight">List actions</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-[#091e420f] text-[#626f86] hover:text-[#172b4d] flex items-center justify-center transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main List Actions */}
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => { onClose(); onAddCard(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-[#091e420f] transition-colors cursor-pointer text-xs font-normal"
        >
          Add card
        </button>

        <button
          type="button"
          onClick={() => { onClose(); onCopyList(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-[#091e420f] transition-colors cursor-pointer text-xs font-normal"
        >
          Copy list
        </button>

        <button
          type="button"
          onClick={() => { onClose(); onMoveList(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-[#091e420f] transition-colors cursor-pointer text-xs font-normal"
        >
          Move list
        </button>

        <button
          type="button"
          onClick={() => { onClose(); onMoveAllCards(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-[#091e420f] transition-colors cursor-pointer text-xs font-normal"
        >
          Move all cards in this list
        </button>

        <button
          type="button"
          onClick={handleToggleWatch}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-[#091e420f] transition-colors cursor-pointer text-xs font-normal flex items-center justify-between"
        >
          <span>Watch</span>
          {watching && <Check size={14} className="text-[#0c66e4]" />}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#091e4214] my-2" />

      {/* Change list color */}
      <div>
        <div 
          onClick={() => setShowColorSection(!showColorSection)}
          className="flex items-center justify-between px-2.5 py-1 text-xs text-[#44546f] font-medium cursor-pointer hover:bg-[#091e420f] rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>Change list color</span>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.2 bg-[#5e4db2] text-white rounded">
              PREMIUM
            </span>
          </div>
          {showColorSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>

        {showColorSection && (
          <div className="mt-2 px-1">
            {/* 10 swatches in 5x2 grid */}
            <div className="grid grid-cols-5 gap-2 mb-2.5">
              {LIST_COLORS.map(c => {
                const isSelected = currentColor?.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onChangeColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className="h-7 rounded-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs relative"
                    title={c.name}
                  >
                    {isSelected && <Check size={15} className="text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onChangeColor(null)}
              className="w-full py-1.5 px-2 rounded-lg bg-[#091e420f] hover:bg-[#091e4224] text-[#44546f] hover:text-[#172b4d] transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5 font-medium"
            >
              <X size={13} />
              <span>Remove color</span>
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#091e4214] my-2" />

      {/* Automation */}
      <div className="px-1 mb-1">
        <div className="relative">
          <select
            value={automationSelection}
            onChange={e => {
              const val = e.target.value;
              setAutomationSelection('Automation');
              if (val !== 'Automation') {
                alert(`Automation rule activated for "${columnName}":\n${val}`);
              }
            }}
            className="w-full bg-[#091e4208] border border-[#091e4224] text-[#172b4d] rounded-lg px-2.5 py-1.5 text-xs outline-none appearance-none cursor-pointer hover:border-blue-500 transition-colors"
          >
            <option value="Automation">Automation</option>
            <option value="When a card is added, assign me">When a card is added, assign me</option>
            <option value="Every day, sort list by due date">Every day, sort list by due date</option>
            <option value="Every Monday, sort list by priority">Every Monday, sort list by priority</option>
            <option value="Archive completed cards every week">Archive completed cards every week</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-[#626f86] pointer-events-none" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#091e4214] my-2" />

      {/* Archive / Delete actions */}
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => { onClose(); onArchiveList(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer text-xs font-normal"
        >
          Archive this list
        </button>

        <button
          type="button"
          onClick={() => { onClose(); onArchiveAllCards(); }}
          className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#172b4d] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer text-xs font-normal"
        >
          Archive all cards in this list
        </button>
      </div>
    </div>
  );
};
