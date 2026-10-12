import React from 'react';
import { X, Plus, Copy, LayoutTemplate, Layers } from 'lucide-react';

interface CardTemplatesPopoverProps {
  templates: { id: string; title: string; description?: string; labels?: any }[];
  columnId: string;
  onSelectTemplate: (template: any) => void;
  onCreateTemplate: (columnId: string) => void;
  onEditTemplates?: () => void;
  onClose: () => void;
}

export const CardTemplatesPopover: React.FC<CardTemplatesPopoverProps> = ({
  templates,
  columnId,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplates,
  onClose
}) => {
  return (
    <div 
      className="w-[286px] bg-[#f7f8f9] text-[#172b4d] rounded-2xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 text-left"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#091e4214]">
        <div className="w-7" />
        <h3 className="font-bold text-[13px] text-[#172b4d] tracking-tight text-center flex-1">Card templates</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="w-7 h-7 rounded-lg border border-[#85b8ff] bg-[#ebf3ff] hover:bg-[#d8e8ff] text-[#0055cc] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Close"
        >
          <X size={15} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Templates List */}
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-2.5">
        {templates.length > 0 ? (
          templates.map(tmpl => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="p-3 bg-white border border-[#091e4224] hover:border-[#0c66e4] hover:shadow-xs rounded-xl transition-all cursor-pointer flex flex-col gap-2 group"
            >
              <div className="font-medium text-sm text-[#172b4d] group-hover:text-[#0c66e4] truncate">
                {tmpl.title}
              </div>
              <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md bg-[#e9f2ff] text-[#0055cc] text-[11px] font-semibold">
                <Layers size={12} />
                <span>Template</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-[#626f86] italic bg-white rounded-xl border border-dashed border-[#091e4224]">
            No card templates yet on this board.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#091e4214]">
        <button
          type="button"
          onClick={() => {
            onCreateTemplate(columnId);
            onClose();
          }}
          className="w-full py-2 px-2.5 text-left text-[#172b4d] hover:bg-[#091e420f] rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-2"
        >
          <Plus size={15} className="text-[#44546f]" />
          <span>Create a new template</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onEditTemplates?.();
            onClose();
          }}
          className="w-full py-2 px-3 bg-[#ebecf0] hover:bg-[#dfe1e6] text-[#172b4d] font-semibold rounded-lg text-xs transition-colors cursor-pointer text-center"
        >
          Edit templates
        </button>
      </div>
    </div>
  );
};
