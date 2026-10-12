import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, ChevronDown } from 'lucide-react';

interface ChecklistOption {
  id: string;
  title: string;
  items?: { id?: string; title: string; completed?: boolean }[];
}

interface ChecklistPopoverProps {
  cardTitle?: string;
  existingChecklists?: ChecklistOption[];
  onAddChecklist: (title: string, copyFromItems?: string[]) => void;
  onClose: () => void;
}

export const ChecklistPopover: React.FC<ChecklistPopoverProps> = ({
  cardTitle = '',
  existingChecklists = [],
  onAddChecklist,
  onClose
}) => {
  const [title, setTitle] = useState('Checklist');
  const [copyFromId, setCopyFromId] = useState<string>('none');
  const [generatedItems, setGeneratedItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Select the default text on open
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleGenerateSmartChecklist = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const lower = cardTitle.toLowerCase();
      let suggestions: string[] = [];

      if (lower.includes('test') || lower.includes('qa')) {
        suggestions = [
          'Verify core functionality and happy path',
          'Test boundary values and edge cases',
          'Verify responsive UI on mobile & desktop',
          'Test error handling and network timeouts',
          'Validate backend database state',
          'Final sign-off and regression check'
        ];
      } else if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
        suggestions = [
          'Review wireframes and component specs',
          'Ensure typography and color contrast conform to standards',
          'Implement responsive layout states',
          'Check micro-animations and hover transitions',
          'Peer review with design team'
        ];
      } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('issue')) {
        suggestions = [
          'Reproduce issue in local environment',
          'Identify root cause in codebase',
          'Implement fix and write regression test',
          'Verify fix doesn’t cause side effects',
          'Deploy patch and monitor logs'
        ];
      } else if (lower.includes('deploy') || lower.includes('release')) {
        suggestions = [
          'Run full automated test suite',
          'Build production bundles and verify assets',
          'Run database migrations in staging',
          'Perform smoke test on staging environment',
          'Deploy to production and monitor health metrics'
        ];
      } else {
        suggestions = [
          'Outline scope and requirements',
          'Implement initial implementation',
          'Review edge cases and polish UX',
          'Conduct testing and verify output',
          'Mark completed and update team'
        ];
      }

      setGeneratedItems(suggestions);
      setIsGenerating(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let itemsToCopy: string[] | undefined = undefined;

    if (generatedItems.length > 0) {
      itemsToCopy = generatedItems;
    } else if (copyFromId !== 'none') {
      const source = existingChecklists.find(c => c.id === copyFromId);
      if (source && source.items) {
        itemsToCopy = source.items.map(i => i.title);
      }
    }

    onAddChecklist(title.trim(), itemsToCopy);
  };

  return (
    <div 
      className="w-[304px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative flex items-center justify-center pb-2 mb-3 border-b border-[#091e4224]">
        <h3 className="text-sm font-semibold text-[#44546f] tracking-tight">Add checklist</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="absolute right-0 p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Title Input */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Title</label>
          <input 
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 text-xs text-[#172b4d] outline-none font-medium transition-all"
          />
        </div>

        {/* Copy items from... */}
        <div>
          <label className="block text-[11px] font-bold text-[#44546f] mb-1">Copy items from...</label>
          <div className="relative">
            <select
              value={copyFromId}
              onChange={e => {
                setCopyFromId(e.target.value);
                setGeneratedItems([]);
              }}
              className="w-full appearance-none bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 text-xs text-[#172b4d] outline-none cursor-pointer pr-8 font-medium transition-all"
            >
              <option value="none">(none)</option>
              {existingChecklists.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#44546f] pointer-events-none" />
          </div>
        </div>

        {/* Generate checklist button with New badge */}
        <button
          type="button"
          onClick={handleGenerateSmartChecklist}
          disabled={isGenerating}
          className="w-full py-1.5 px-3 bg-white hover:bg-[#091e420f] border border-[#091e4224] text-[#172b4d] font-medium rounded-md text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 group"
        >
          <Sparkles size={14} className="text-[#854ecc] group-hover:rotate-12 transition-transform" />
          <span>{isGenerating ? 'Generating...' : 'Generate checklist'}</span>
          <span className="bg-[#f3e8ff] text-[#854ecc] font-bold text-[10px] px-1.5 py-0.2 rounded-sm border border-[#e9d5ff]">
            New
          </span>
        </button>

        {/* Preview of generated items if any */}
        {generatedItems.length > 0 && (
          <div className="bg-[#f8f9fa] border border-[#091e4214] rounded-lg p-2 flex flex-col gap-1 max-h-32 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#854ecc] flex items-center justify-between">
              <span>{generatedItems.length} Smart Subtasks Ready</span>
              <button 
                type="button" 
                onClick={() => setGeneratedItems([])} 
                className="text-gray-400 hover:text-gray-600 text-[10px]"
              >
                Clear
              </button>
            </div>
            {generatedItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#44546f]">
                <Check size={11} className="text-[#854ecc] shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add Button */}
        <button
          type="submit"
          className="w-full py-1.5 px-4 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold rounded-md text-xs transition-colors cursor-pointer shadow-xs mt-1"
        >
          Add
        </button>
      </form>
    </div>
  );
};
