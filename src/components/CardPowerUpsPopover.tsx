import React from 'react';
import { X, Plug, Check, Sparkles, Sliders, Clock, ThumbsUp, Layers } from 'lucide-react';

interface CardPowerUpsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableCustomFields?: () => void;
  hasCustomFields?: boolean;
}

export const CardPowerUpsPopover: React.FC<CardPowerUpsPopoverProps> = ({
  isOpen,
  onClose,
  onEnableCustomFields,
  hasCustomFields = false
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute bottom-full mb-3 left-1/4 -translate-x-1/2 z-50 w-[290px] bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-4 flex flex-col gap-3 animate-in zoom-in-95 duration-150 text-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Plug size={16} className="text-purple-600" />
          <h4 className="font-bold text-sm text-gray-800">Card Power-Ups</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {/* Custom Fields */}
        <div className="p-2.5 rounded-xl border border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-blue-600" />
            <div>
              <span className="text-xs font-bold text-gray-800 block">Custom Fields</span>
              <span className="text-[10px] text-gray-500">Structured data attributes</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onEnableCustomFields}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              hasCustomFields ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {hasCustomFields ? 'Enabled' : 'Enable'}
          </button>
        </div>

        {/* Voting Power-Up */}
        <div className="p-2.5 rounded-xl border border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} className="text-amber-500" />
            <div>
              <span className="text-xs font-bold text-gray-800 block">Card Voting</span>
              <span className="text-[10px] text-gray-500">Collect member votes</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
        </div>

        {/* Card Repeater */}
        <div className="p-2.5 rounded-xl border border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            <div>
              <span className="text-xs font-bold text-gray-800 block">Card Repeater</span>
              <span className="text-[10px] text-gray-500">Recurring schedule</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Ready</span>
        </div>
      </div>
    </div>
  );
};
