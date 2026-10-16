import React, { useState } from 'react';
import { 
  X, Sparkles, Plus, Trash2, Check, Layout, 
  Image as ImageIcon, Layers, ArrowRight 
} from 'lucide-react';
import { saveCustomTemplate, type BoardTemplate } from '../utils/templates';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (template: BoardTemplate) => void;
}

const CURATED_IMAGES = [
  { label: 'Tech & Dev', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Executive Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Team Meeting', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Marketing & Analytics', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Creative Studio', url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Operations & Modern', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' }
];

const PRESET_CATEGORIES = [
  'General', 'Engineering', 'HR / Recruitment', 'Marketing', 
  'Operations', 'Design & UI', 'Finance', 'Sales', 'QA & Testing'
];

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreated
}: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(CURATED_IMAGES[0]?.url || '');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [columns, setColumns] = useState<string[]>(['Backlog', 'In Progress', 'In Review', 'Done']);
  const [newColName, setNewColName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const activeImage = customImageUrl.trim() || selectedImage;

  const handleAddColumn = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newColName.trim();
    if (!trimmed) return;
    if (columns.includes(trimmed)) {
      setError('Column already exists');
      return;
    }
    setColumns([...columns, trimmed]);
    setNewColName('');
    setError('');
  };

  const handleRemoveColumn = (colToRemove: string) => {
    if (columns.length <= 1) {
      setError('Template must have at least one column');
      return;
    }
    setColumns(columns.filter(c => c !== colToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    const created = saveCustomTemplate({
      name: name.trim(),
      category: category.trim() || 'General',
      badge: category.trim().toUpperCase(),
      description: description.trim() || 'Custom board template with pre-configured workflow columns.',
      image: activeImage,
      color: '#7c3aed',
      columns: columns.length > 0 ? columns : ['To Do', 'In Progress', 'Done']
    });

    onCreated?.(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white text-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Create Board Template</h3>
              <p className="text-[11px] text-white/80">Design reusable boards with custom workflow lists</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-700"><X size={13} /></button>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>Template Preview</span>
              <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Live Card</span>
            </label>
            <div 
              className="h-28 rounded-xl relative overflow-hidden border border-gray-200 shadow-sm flex flex-col justify-between p-3.5"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75)), url("${activeImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex items-start justify-between">
                <span className="bg-white/90 backdrop-blur-xs text-gray-900 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  {category || 'GENERAL'}
                </span>
                <span className="bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Custom
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm drop-shadow-sm truncate">
                  {name || 'Template Name'}
                </h4>
                <p className="text-white/80 text-[11px] line-clamp-1 mt-0.5">
                  {description || 'Workflow columns: ' + columns.join(' → ')}
                </p>
              </div>
            </div>
          </div>

          {/* Template Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              autoFocus
              required
              placeholder="e.g., Customer Support Tickets, QA Bug Tracking..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 focus:border-purple-600 focus:bg-white rounded-lg text-xs font-medium text-gray-900 outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Category / Badge</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${category === cat ? 'bg-purple-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of what this workflow template is used for..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-300 focus:border-purple-600 focus:bg-white rounded-lg text-xs font-medium text-gray-900 outline-none resize-none transition-colors"
            />
          </div>

          {/* Workflow Lists / Columns */}
          <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600" />
                Default Board Columns ({columns.length})
              </label>
              <span className="text-[10px] text-gray-400">Created automatically</span>
            </div>

            {/* Column chips */}
            <div className="flex flex-wrap gap-1.5">
              {columns.map(col => (
                <span 
                  key={col} 
                  className="bg-white border border-gray-300 shadow-2xs text-gray-800 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium group"
                >
                  <span>{col}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(col)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove column"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Column Input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Add another column (e.g. Blocked, In QA)..."
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColumn();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-white border border-gray-300 focus:border-purple-600 rounded-lg text-xs text-gray-800 outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddColumn()}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Theme Cover Image */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-purple-600" />
              Choose Cover Image
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CURATED_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.url);
                    setCustomImageUrl('');
                  }}
                  style={{
                    backgroundImage: `url("${img.url}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  className={`h-12 rounded-lg border-2 transition-all relative ${selectedImage === img.url && !customImageUrl ? 'border-purple-600 scale-102 ring-2 ring-purple-500/40' : 'border-transparent opacity-85 hover:opacity-100'}`}
                  title={img.label}
                >
                  {selectedImage === img.url && !customImageUrl && (
                    <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-0.5">
                      <Check size={9} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Save Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
