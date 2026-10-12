import React, { useState, useMemo } from 'react';
import { 
  X, ChevronLeft, Search, Check, Edit2, Plus, Sparkles, Trash2 
} from 'lucide-react';

export interface LabelItem {
  id?: string;
  name: string;
  color: string;
}

interface LabelsPopoverProps {
  cardLabels: LabelItem[];
  availableLabels?: LabelItem[];
  onToggleLabel: (label: LabelItem) => void;
  onCreateLabel: (label: { name: string; color: string }) => void;
  onUpdateLabel?: (oldLabel: LabelItem, newLabel: { name: string; color: string }) => void;
  onDeleteLabel?: (label: LabelItem) => void;
  onBack?: () => void;
  onClose: () => void;
}

// 30 Trello colors arranged in a 5x6 grid
export const TRELLO_COLOR_GRID = [
  // Row 1: Subtle
  { name: 'subtle green', hex: '#baf3db', text: '#172b4d' },
  { name: 'subtle yellow', hex: '#f8e6a0', text: '#172b4d' },
  { name: 'subtle orange', hex: '#fedec8', text: '#172b4d' },
  { name: 'subtle red', hex: '#ffd5d2', text: '#172b4d' },
  { name: 'subtle purple', hex: '#dfd8fd', text: '#172b4d' },

  // Row 2: Moderate
  { name: 'green', hex: '#4bce97', text: '#172b4d' },
  { name: 'yellow', hex: '#f5cd47', text: '#172b4d' },
  { name: 'orange', hex: '#fea362', text: '#172b4d' },
  { name: 'red', hex: '#f87168', text: '#ffffff' },
  { name: 'purple', hex: '#9f8fef', text: '#ffffff' },

  // Row 3: Bold
  { name: 'bold green', hex: '#1f845a', text: '#ffffff' },
  { name: 'bold yellow', hex: '#946f00', text: '#ffffff' },
  { name: 'bold orange', hex: '#c25e00', text: '#ffffff' },
  { name: 'bold red', hex: '#c9372c', text: '#ffffff' },
  { name: 'bold purple', hex: '#6e5dc6', text: '#ffffff' },

  // Row 4: Subtle Cool
  { name: 'subtle blue', hex: '#cce0ff', text: '#172b4d' },
  { name: 'subtle sky', hex: '#c6edfb', text: '#172b4d' },
  { name: 'subtle lime', hex: '#d3f1a7', text: '#172b4d' },
  { name: 'subtle pink', hex: '#fdd0ec', text: '#172b4d' },
  { name: 'subtle black', hex: '#dcdfe4', text: '#172b4d' },

  // Row 5: Moderate Cool
  { name: 'blue', hex: '#579dff', text: '#172b4d' },
  { name: 'sky', hex: '#6cc3e0', text: '#172b4d' },
  { name: 'lime', hex: '#94c748', text: '#172b4d' },
  { name: 'pink', hex: '#e774bb', text: '#ffffff' },
  { name: 'black', hex: '#8590a2', text: '#ffffff' },

  // Row 6: Bold Cool
  { name: 'bold blue', hex: '#0c66e4', text: '#ffffff' },
  { name: 'bold sky', hex: '#206a83', text: '#ffffff' },
  { name: 'bold lime', hex: '#4c6b1f', text: '#ffffff' },
  { name: 'bold pink', hex: '#943d73', text: '#ffffff' },
  { name: 'bold black', hex: '#626f86', text: '#ffffff' },
];

export const DEFAULT_BOARD_LABELS: LabelItem[] = [
  { name: '', color: '#4bce97' }, // green
  { name: '', color: '#f5cd47' }, // yellow
  { name: '', color: '#fea362' }, // orange
  { name: '', color: '#f87168' }, // red
  { name: '', color: '#9f8fef' }, // purple
  { name: '', color: '#579dff' }, // blue
];

export const LabelsPopover: React.FC<LabelsPopoverProps> = ({
  cardLabels,
  availableLabels,
  onToggleLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onBack,
  onClose
}) => {
  // Navigation view: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [colorblindMode, setColorblindMode] = useState(false);

  // Create / Edit state
  const [targetLabel, setTargetLabel] = useState<LabelItem | null>(null);
  const [labelTitle, setLabelTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('#579dff');
  const [hoveredColorName, setHoveredColorName] = useState<string | null>(null);

  // Combine default labels with any user-created labels and card-specific labels
  const allLabels = useMemo(() => {
    const list: LabelItem[] = [...(availableLabels && availableLabels.length > 0 ? availableLabels : DEFAULT_BOARD_LABELS)];
    // Add any card labels that might not be in the default list
    for (const cl of cardLabels) {
      const exists = list.some(l => 
        (l.name && l.name.toLowerCase() === cl.name.toLowerCase()) || 
        (!l.name && !cl.name && l.color.toLowerCase() === cl.color.toLowerCase())
      );
      if (!exists) {
        list.push(cl);
      }
    }
    return list;
  }, [availableLabels, cardLabels]);

  // Filtered labels
  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) return allLabels;
    const q = searchQuery.toLowerCase().trim();
    return allLabels.filter(lbl => {
      const nameMatch = lbl.name.toLowerCase().includes(q);
      const colorMatch = TRELLO_COLOR_GRID.some(c => c.hex.toLowerCase() === lbl.color.toLowerCase() && c.name.includes(q));
      return nameMatch || colorMatch;
    });
  }, [allLabels, searchQuery]);

  const isLabelActive = (lbl: LabelItem) => {
    return cardLabels.some(cl => {
      if (lbl.name && cl.name) {
        return lbl.name.toLowerCase() === cl.name.toLowerCase();
      }
      return lbl.color.toLowerCase() === cl.color.toLowerCase();
    });
  };

  const openCreateView = () => {
    setTargetLabel(null);
    setLabelTitle('');
    setSelectedColor('#579dff');
    setView('create');
  };

  const openEditView = (lbl: LabelItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetLabel(lbl);
    setLabelTitle(lbl.name || '');
    setSelectedColor(lbl.color || '#579dff');
    setView('edit');
  };

  const handleSaveCreateOrEdit = () => {
    if (view === 'create') {
      onCreateLabel({
        name: labelTitle.trim(),
        color: selectedColor || '#579dff'
      });
      setView('list');
    } else if (view === 'edit' && targetLabel) {
      if (onUpdateLabel) {
        onUpdateLabel(targetLabel, {
          name: labelTitle.trim(),
          color: selectedColor || '#579dff'
        });
      } else {
        onCreateLabel({
          name: labelTitle.trim(),
          color: selectedColor || '#579dff'
        });
      }
      setView('list');
    }
  };

  const handleDelete = () => {
    if (targetLabel && onDeleteLabel) {
      onDeleteLabel(targetLabel);
      setView('list');
    }
  };

  // Colorblind pattern generator
  const getColorblindStyle = (color: string) => {
    if (!colorblindMode) return {};
    const hex = color.toLowerCase();
    // Distinct accessibility background textures
    if (hex.includes('4bce97') || hex.includes('1f845a') || hex.includes('baf3db')) {
      return { backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 2px)', backgroundSize: '8px 8px' };
    }
    if (hex.includes('f5cd47') || hex.includes('946f00') || hex.includes('f8e6a0')) {
      return { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)' };
    }
    if (hex.includes('fea362') || hex.includes('c25e00') || hex.includes('fedec8')) {
      return { backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)' };
    }
    if (hex.includes('f87168') || hex.includes('c9372c') || hex.includes('ffd5d2')) {
      return { backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' };
    }
    if (hex.includes('9f8fef') || hex.includes('6e5dc6') || hex.includes('dfd8fd')) {
      return { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' };
    }
    return { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1.5px, transparent 1.5px)', backgroundSize: '6px 6px' };
  };

  return (
    <div 
      className="w-[304px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* View: Labels List */}
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="relative flex items-center justify-between pb-2 mb-2 border-b border-[#091e4224]">
            {onBack ? (
              <button 
                type="button" 
                onClick={onBack}
                className="p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
                title="Back"
              >
                <ChevronLeft size={16} />
              </button>
            ) : (
              <div className="w-5" />
            )}
            <h3 className="text-sm font-semibold text-[#44546f] tracking-tight">Labels</h3>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search labels..."
                className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 text-xs text-[#172b4d] outline-none transition-all placeholder:text-[#626f86]"
                autoFocus
              />
            </div>
          </div>

          {/* Subheading */}
          <div className="text-[11px] font-bold text-[#44546f] uppercase tracking-wider mb-2">
            Labels
          </div>

          {/* Label Items */}
          <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
            {filteredLabels.map((lbl, idx) => {
              const active = isLabelActive(lbl);
              const colorInfo = TRELLO_COLOR_GRID.find(c => c.hex.toLowerCase() === lbl.color.toLowerCase());
              const textColor = colorInfo?.text || '#ffffff';

              return (
                <div key={idx} className="flex items-center gap-2 group">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleLabel(lbl)}
                    className="cursor-pointer"
                    title={active ? "Uncheck label" : "Check label"}
                  >
                    <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${active ? 'bg-[#0c66e4] border-[#0c66e4] text-white' : 'border-[#8590a2] bg-white group-hover:border-[#0c66e4]'}`}>
                      {active && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>

                  {/* Label Color Bar */}
                  <div
                    onClick={() => onToggleLabel(lbl)}
                    style={{ backgroundColor: lbl.color, ...getColorblindStyle(lbl.color) }}
                    className="flex-1 h-8 rounded-sm px-3 flex items-center cursor-pointer shadow-2xs hover:opacity-90 active:scale-[0.99] transition-all min-w-0"
                  >
                    <span 
                      style={{ color: textColor }} 
                      className="font-medium text-xs truncate drop-shadow-2xs"
                    >
                      {lbl.name}
                    </span>
                  </div>

                  {/* Edit Pencil Icon */}
                  <button
                    type="button"
                    onClick={(e) => openEditView(lbl, e)}
                    className="p-1.5 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
                    title="Edit label"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Create a new label button */}
          <button
            type="button"
            onClick={openCreateView}
            className="w-full mt-3 py-1.5 px-3 bg-[#091e420f] hover:bg-[#091e4214] text-[#172b4d] font-medium rounded-md text-xs transition-colors cursor-pointer text-center"
          >
            Create a new label
          </button>

          {/* Divider */}
          <div className="border-t border-[#091e4224] my-2" />

          {/* Colorblind friendly mode toggle */}
          <button
            type="button"
            onClick={() => setColorblindMode(!colorblindMode)}
            className="w-full py-1.5 px-3 bg-[#091e420f] hover:bg-[#091e4214] text-[#172b4d] font-medium rounded-md text-xs transition-colors cursor-pointer text-center"
          >
            {colorblindMode ? 'Disable colorblind friendly mode' : 'Enable colorblind friendly mode'}
          </button>
        </>
      )}

      {/* View: Create / Edit Label */}
      {(view === 'create' || view === 'edit') && (
        <>
          {/* Header */}
          <div className="relative flex items-center justify-between pb-2 mb-2 border-b border-[#091e4224]">
            <button 
              type="button" 
              onClick={() => setView('list')}
              className="p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-sm font-semibold text-[#44546f] tracking-tight">
              {view === 'create' ? 'Create label' : 'Edit label'}
            </h3>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Preview Bar */}
          <div className="py-2 flex items-center justify-center">
            <div 
              style={{ backgroundColor: selectedColor || '#e2e8f0', ...getColorblindStyle(selectedColor || '#e2e8f0') }}
              className="w-full h-8 rounded-sm px-3 flex items-center justify-start shadow-xs transition-colors"
            >
              <span 
                style={{ 
                  color: (TRELLO_COLOR_GRID.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.text || '#ffffff') 
                }} 
                className="font-medium text-xs truncate"
              >
                {labelTitle || ''}
              </span>
            </div>
          </div>

          {/* Title Input */}
          <div className="mt-1 mb-3">
            <label className="block text-[11px] font-bold text-[#44546f] mb-1">Title</label>
            <input 
              type="text"
              value={labelTitle}
              onChange={e => setLabelTitle(e.target.value)}
              placeholder=""
              className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 text-xs text-[#172b4d] outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Select a Color */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-[#44546f]">Select a color</label>
            </div>

            {/* 5x6 Grid */}
            <div className="grid grid-cols-5 gap-1.5 relative">
              {TRELLO_COLOR_GRID.map((c, i) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <div key={i} className="relative group">
                    <button
                      type="button"
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setSelectedColor(c.hex)}
                      onMouseEnter={() => setHoveredColorName(c.name)}
                      onMouseLeave={() => setHoveredColorName(null)}
                      className="w-full h-7 rounded-[4px] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-2xs"
                      title={c.name}
                    >
                      {isSelected && (
                        <Check 
                          size={14} 
                          style={{ color: c.text }}
                          strokeWidth={2.5}
                        />
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Hover Tooltip Overlay */}
              {hoveredColorName && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#172b4d] text-white text-[10px] py-0.5 px-2 rounded pointer-events-none whitespace-nowrap shadow-md z-30 font-medium">
                  {hoveredColorName}
                </div>
              )}
            </div>
          </div>

          {/* Remove color button */}
          <button
            type="button"
            onClick={() => setSelectedColor('')}
            className="w-full mt-2 py-1.5 px-3 bg-[#091e420f] hover:bg-[#091e4214] text-[#172b4d] font-medium rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X size={13} />
            <span>Remove color</span>
          </button>

          {/* Divider */}
          <div className="border-t border-[#091e4224] my-3" />

          {/* Actions: Save / Create & Delete */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSaveCreateOrEdit}
              className="py-1.5 px-4 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-medium rounded-md text-xs transition-colors cursor-pointer shadow-xs"
            >
              {view === 'create' ? 'Create' : 'Save'}
            </button>

            {view === 'edit' && onDeleteLabel && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-1.5 px-3 bg-[#c9372c] hover:bg-[#ae2e24] text-white font-medium rounded-md text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                title="Delete label"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
