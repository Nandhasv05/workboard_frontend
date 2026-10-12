import React, { useState } from 'react';
import { 
  CreditCard, ChevronDown, ChevronLeft, ChevronRight, Check, Plus, X, 
  GripVertical, Trash2
} from 'lucide-react';

export interface CustomFieldsData {
  priority?: string;
  status?: string;
  risk?: string;
  effort?: string;
  [key: string]: string | undefined;
}

interface CustomFieldsSectionProps {
  data: CustomFieldsData;
  onChange: (newData: CustomFieldsData) => void;
  onRemoveAll?: () => void;
  readOnly?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  title: string;
  type: 'Checkbox' | 'Date' | 'Dropdown' | 'Number' | 'Text';
  options?: string[];
}

const PRIORITY_OPTIONS = [
  { label: 'Low', color: '#bbf7d0', textColor: '#166534', borderColor: '#86efac' },
  { label: 'Medium', color: '#fef08a', textColor: '#854d0e', borderColor: '#fde047' },
  { label: 'High', color: '#fed7aa', textColor: '#9a3412', borderColor: '#fdba74' },
  { label: 'Urgent', color: '#fecaca', textColor: '#991b1b', borderColor: '#fca5a5' },
];

const STATUS_OPTIONS = [
  { label: 'To Do', color: '#f1f5f9', textColor: '#475569', borderColor: '#cbd5e1' },
  { label: 'In Progress', color: '#fef08a', textColor: '#854d0e', borderColor: '#fde047' },
  { label: 'Review', color: '#e9d5ff', textColor: '#6b21a8', borderColor: '#d8b4fe' },
  { label: 'Done', color: '#dbeafe', textColor: '#1e40af', borderColor: '#bfdbfe' },
  { label: 'Blocked', color: '#fee2e2', textColor: '#991b1b', borderColor: '#fca5a5' },
];

const RISK_OPTIONS = [
  { label: 'Low', color: '#bbf7d0', textColor: '#166534', borderColor: '#86efac' },
  { label: 'Medium', color: '#fef08a', textColor: '#854d0e', borderColor: '#fde047' },
  { label: 'High', color: '#fecaca', textColor: '#991b1b', borderColor: '#fca5a5' },
];

const FIELD_TYPES: CustomFieldDefinition['type'][] = [
  'Checkbox',
  'Date',
  'Dropdown',
  'Number',
  'Text'
];

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  data,
  onChange,
  onRemoveAll,
  readOnly = false
}) => {
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);

  // Edit popover states: null | 'list' | 'new' | 'edit'
  const [editPopoverView, setEditPopoverView] = useState<'list' | 'new' | 'edit' | null>(null);
  const [selectedFieldForEdit, setSelectedFieldForEdit] = useState<CustomFieldDefinition | null>(null);

  // New/Edit field form state
  const [fieldTitle, setFieldTitle] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldDefinition['type']>('Text');
  const [fieldDropdownOptions, setFieldDropdownOptions] = useState('');

  // Values
  const currentPriority = data.priority || 'High';
  const currentStatus = data.status || 'Done';
  const currentRisk = data.risk || 'Medium';
  const currentEffort = data.effort || '';

  const priorityStyle = PRIORITY_OPTIONS.find(o => o.label.toLowerCase() === currentPriority.toLowerCase()) || PRIORITY_OPTIONS[2]!;
  const statusStyle = STATUS_OPTIONS.find(o => o.label.toLowerCase() === currentStatus.toLowerCase()) || STATUS_OPTIONS[3]!;
  const riskStyle = RISK_OPTIONS.find(o => o.label.toLowerCase() === currentRisk.toLowerCase()) || RISK_OPTIONS[1]!;

  const handleUpdateField = (key: string, value: string) => {
    onChange({
      ...data,
      [key]: value
    });
  };

  // Extra user-defined custom fields
  const extraFields = Object.keys(data).filter(
    k => !['priority', 'status', 'risk', 'effort', 'location', 'cover_image_url', '_definitions'].includes(k)
  );

  // Active fields list currently on this card
  const allFieldList: CustomFieldDefinition[] = [];
  if (data.priority !== undefined) {
    allFieldList.push({ id: 'priority', title: 'Priority', type: 'Dropdown', options: ['Low', 'Medium', 'High', 'Urgent'] });
  }
  if (data.status !== undefined) {
    allFieldList.push({ id: 'status', title: 'Status', type: 'Dropdown', options: ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'] });
  }
  if (data.risk !== undefined) {
    allFieldList.push({ id: 'risk', title: 'Risk', type: 'Dropdown', options: ['Low', 'Medium', 'High'] });
  }
  if (data.effort !== undefined) {
    allFieldList.push({ id: 'effort', title: 'Effort', type: 'Number' });
  }
  extraFields.forEach(k => {
    allFieldList.push({ id: k, title: k, type: 'Text' });
  });

  const handleOpenNewField = () => {
    setFieldTitle('');
    setFieldType('Text');
    setFieldDropdownOptions('');
    setSelectedFieldForEdit(null);
    setEditPopoverView('new');
  };

  const handleOpenEditField = (f: CustomFieldDefinition) => {
    setSelectedFieldForEdit(f);
    setFieldTitle(f.title);
    setFieldType(f.type);
    setFieldDropdownOptions(f.options ? f.options.join(', ') : '');
    setEditPopoverView('edit');
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldTitle.trim()) return;

    const trimmedTitle = fieldTitle.trim();
    if (selectedFieldForEdit) {
      if (selectedFieldForEdit.id !== trimmedTitle) {
        const nextData = { ...data };
        const val = nextData[selectedFieldForEdit.id];
        delete nextData[selectedFieldForEdit.id];
        nextData[trimmedTitle] = val || '';
        onChange(nextData);
      }
    } else {
      onChange({
        ...data,
        [trimmedTitle]: ''
      });
    }

    setEditPopoverView('list');
  };

  const handleDeleteField = (fieldId: string) => {
    const nextData = { ...data };
    delete nextData[fieldId];

    // Check if any fields remain
    const remainingKeys = Object.keys(nextData).filter(
      k => !['location', 'cover_image_url', '_definitions'].includes(k)
    );
    if (remainingKeys.length === 0) {
      onRemoveAll?.();
      return;
    }

    onChange(nextData);
    setEditPopoverView('list');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Edit and Delete options */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <span className="text-gray-500"><CreditCard size={16} /></span>
          <span>Custom Fields</span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setEditPopoverView(editPopoverView ? null : 'list')}
              className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs px-3 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete Custom Fields from this card?')) {
                  onRemoveAll?.();
                }
              }}
              className="border border-red-200 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
              title="Delete Custom Fields section"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            {/* Custom Fields Popover (Screenshots 1 & 2) */}
            {editPopoverView && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setEditPopoverView(null)} 
                />
                <div className="absolute right-0 top-full mt-2 w-[286px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50">
                  
                  {/* VIEW 1: Field List (Screenshot 1) with individual Delete buttons */}
                  {editPopoverView === 'list' && (
                    <div>
                      {/* Header */}
                      <div className="relative flex items-center justify-between pb-2 mb-2 border-b border-[#091e4214]">
                        <button 
                          type="button"
                          onClick={() => setEditPopoverView(null)}
                          className="p-1 text-[#44546f] hover:text-[#172b4d] rounded cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <h4 className="font-semibold text-xs text-[#44546f]">Custom Fields</h4>
                        <button 
                          type="button"
                          onClick={() => setEditPopoverView(null)}
                          className="p-1 text-[#44546f] hover:text-[#172b4d] rounded cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Explanation note */}
                      <p className="text-[11px] text-[#44546f] leading-relaxed mb-3">
                        Select “New field” to build a completely customizable field. Fields will be added to every card on the board.
                      </p>

                      {/* Fields List */}
                      <div className="flex flex-col gap-1.5 mb-3">
                        {allFieldList.map(f => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between px-2.5 py-2 bg-[#091e420f] hover:bg-[#091e4214] rounded-lg transition-colors cursor-pointer group"
                          >
                            <div 
                              onClick={() => handleOpenEditField(f)}
                              className="flex items-center gap-2 min-w-0 flex-1"
                            >
                              <GripVertical size={13} className="text-[#626f86] shrink-0" />
                              <span className="text-[#44546f] text-xs font-mono font-bold shrink-0">
                                {f.type === 'Number' ? '#' : '◧'}
                              </span>
                              <span className="font-medium text-xs text-[#172b4d] truncate">
                                {f.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteField(f.id);
                                }}
                                className="p-1 text-[#626f86] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title={`Delete ${f.title}`}
                              >
                                <Trash2 size={13} />
                              </button>
                              <ChevronRight 
                                size={14} 
                                className="text-[#626f86] group-hover:translate-x-0.5 transition-transform" 
                                onClick={() => handleOpenEditField(f)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* + New field Button */}
                      <button
                        type="button"
                        onClick={handleOpenNewField}
                        className="w-full py-2 px-3 border border-[#091e4224] hover:bg-[#091e420f] rounded-lg text-xs font-semibold text-[#172b4d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer mb-2"
                      >
                        <Plus size={14} />
                        <span>New field</span>
                      </button>

                      {/* Delete All Option */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete all custom fields from this card?')) {
                            onRemoveAll?.();
                            setEditPopoverView(null);
                          }
                        }}
                        className="w-full py-1 text-center text-[11px] text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Remove Custom Fields from this card
                      </button>
                    </div>
                  )}

                  {/* VIEW 2: New Field / Edit Field (Screenshot 2) */}
                  {(editPopoverView === 'new' || editPopoverView === 'edit') && (
                    <form onSubmit={handleSaveField} className="flex flex-col gap-3">
                      {/* Header */}
                      <div className="relative flex items-center justify-between pb-2 border-b border-[#091e4214]">
                        <button 
                          type="button"
                          onClick={() => setEditPopoverView('list')}
                          className="p-1 text-[#44546f] hover:text-[#172b4d] rounded cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <h4 className="font-semibold text-xs text-[#44546f]">
                          {editPopoverView === 'new' ? 'New field' : selectedFieldForEdit?.title}
                        </h4>
                        <button 
                          type="button"
                          onClick={() => setEditPopoverView(null)}
                          className="p-1 text-[#44546f] hover:text-[#172b4d] rounded cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Title input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#172b4d]">Title</label>
                        <input 
                          autoFocus
                          type="text"
                          required
                          placeholder="Add a title..."
                          value={fieldTitle}
                          onChange={e => setFieldTitle(e.target.value)}
                          className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4] rounded-lg px-3 py-1.5 text-xs text-[#172b4d] placeholder:text-[#626f86] outline-none"
                        />
                      </div>

                      {/* Type Select */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#172b4d]">Type</label>
                        <div className="relative">
                          <select
                            value={fieldType}
                            onChange={e => setFieldType(e.target.value as CustomFieldDefinition['type'])}
                            className="w-full bg-white border border-[#0c66e4] rounded-lg px-3 py-1.5 text-xs text-[#172b4d] font-medium outline-none appearance-none cursor-pointer pr-8"
                          >
                            {FIELD_TYPES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-[#44546f] pointer-events-none" />
                        </div>
                      </div>

                      {/* Dropdown Options if Type === Dropdown */}
                      {fieldType === 'Dropdown' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-[#172b4d]">Options (comma separated)</label>
                          <input 
                            type="text"
                            placeholder="Low, Medium, High"
                            value={fieldDropdownOptions}
                            onChange={e => setFieldDropdownOptions(e.target.value)}
                            className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] rounded-lg px-3 py-1.5 text-xs text-[#172b4d] outline-none"
                          />
                        </div>
                      )}

                      {/* Save & Delete Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#091e4214]">
                        <button
                          type="submit"
                          className="flex-1 bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          Save
                        </button>
                        {selectedFieldForEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteField(selectedFieldForEdit.id)}
                            className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-red-200 flex items-center gap-1"
                            title="Delete this field"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Grid of Custom Fields (only active fields displayed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Priority */}
        {data.priority !== undefined && (
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center justify-between text-xs font-semibold text-[#44546f]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">◧</span>
                <span>Priority</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDeleteField('priority')}
                  className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title="Delete Priority field"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={readOnly}
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              style={{ 
                backgroundColor: priorityStyle.color, 
                color: priorityStyle.textColor, 
                borderColor: priorityStyle.borderColor 
              }}
              className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer hover:opacity-95"
            >
              <div className="flex items-center gap-2">
                <span className="tracking-tighter font-mono font-extrabold text-sm opacity-70">|||</span>
                <span>{priorityStyle.label}</span>
              </div>
              <ChevronDown size={14} className="opacity-75" />
            </button>

            {showPriorityDropdown && !readOnly && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPriorityDropdown(false)} />
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        handleUpdateField('priority', opt.label);
                        setShowPriorityDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                    >
                      <span 
                        style={{ backgroundColor: opt.color, color: opt.textColor }} 
                        className="px-2 py-0.5 rounded font-bold text-xs"
                      >
                        {opt.label}
                      </span>
                      {currentPriority.toLowerCase() === opt.label.toLowerCase() && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. Status */}
        {data.status !== undefined && (
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center justify-between text-xs font-semibold text-[#44546f]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">◧</span>
                <span>Status</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDeleteField('status')}
                  className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title="Delete Status field"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={readOnly}
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ 
                backgroundColor: statusStyle.color, 
                color: statusStyle.textColor, 
                borderColor: statusStyle.borderColor 
              }}
              className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer hover:opacity-95"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm opacity-70">≡</span>
                <span>{statusStyle.label}</span>
              </div>
              <ChevronDown size={14} className="opacity-75" />
            </button>

            {showStatusDropdown && !readOnly && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        handleUpdateField('status', opt.label);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                    >
                      <span 
                        style={{ backgroundColor: opt.color, color: opt.textColor }} 
                        className="px-2 py-0.5 rounded font-bold text-xs"
                      >
                        {opt.label}
                      </span>
                      {currentStatus.toLowerCase() === opt.label.toLowerCase() && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. Risk */}
        {data.risk !== undefined && (
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center justify-between text-xs font-semibold text-[#44546f]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">◧</span>
                <span>Risk</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDeleteField('risk')}
                  className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title="Delete Risk field"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={readOnly}
              onClick={() => setShowRiskDropdown(!showRiskDropdown)}
              style={{ 
                backgroundColor: riskStyle.color, 
                color: riskStyle.textColor, 
                borderColor: riskStyle.borderColor 
              }}
              className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer hover:opacity-95"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs opacity-75">▲</span>
                <span>{riskStyle.label}</span>
              </div>
              <ChevronDown size={14} className="opacity-75" />
            </button>

            {showRiskDropdown && !readOnly && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowRiskDropdown(false)} />
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                  {RISK_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        handleUpdateField('risk', opt.label);
                        setShowRiskDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                    >
                      <span 
                        style={{ backgroundColor: opt.color, color: opt.textColor }} 
                        className="px-2 py-0.5 rounded font-bold text-xs"
                      >
                        {opt.label}
                      </span>
                      {currentRisk.toLowerCase() === opt.label.toLowerCase() && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Effort */}
        {data.effort !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#44546f]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">#</span>
                <span>Effort</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDeleteField('effort')}
                  className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title="Delete Effort field"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <input
              type="text"
              disabled={readOnly}
              value={currentEffort}
              onChange={e => handleUpdateField('effort', e.target.value)}
              placeholder="Add Effort..."
              className="w-full bg-white border border-gray-300 focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4] rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-2xs"
            />
          </div>
        )}

        {/* Extra User Fields if any */}
        {extraFields.map(key => (
          <div key={key} className="flex flex-col gap-1 group">
            <div className="flex items-center justify-between text-xs font-semibold text-[#44546f]">
              <span className="truncate">{key}</span>
              {!readOnly && (
                <button 
                  type="button"
                  onClick={() => handleDeleteField(key)}
                  className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                  title={`Delete ${key} field`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={readOnly}
              value={data[key] || ''}
              onChange={e => handleUpdateField(key, e.target.value)}
              placeholder={`Set ${key}...`}
              className="w-full bg-white border border-gray-300 focus:border-[#0c66e4] rounded-lg px-3 py-1.5 text-xs text-gray-900 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
