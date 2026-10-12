import React from 'react';
import { 
  X, Tag, Clock, CheckSquare, User, Paperclip, MapPin, Sliders 
} from 'lucide-react';

interface AddToCardPopoverProps {
  onSelectLabels: () => void;
  onSelectDates: () => void;
  onSelectChecklist: () => void;
  onSelectMembers: () => void;
  onSelectAttachment: () => void;
  onSelectLocation?: () => void;
  onSelectCustomFields?: () => void;
  onSelectTemplate?: () => void;
  isTemplate?: boolean;
  onClose: () => void;
}

export const AddToCardPopover: React.FC<AddToCardPopoverProps> = ({
  onSelectLabels,
  onSelectDates,
  onSelectChecklist,
  onSelectMembers,
  onSelectAttachment,
  onSelectLocation,
  onSelectCustomFields,
  onSelectTemplate,
  isTemplate = false,
  onClose
}) => {
  const items = [
    {
      id: 'labels',
      title: 'Labels',
      subtitle: 'Organize, categorize, and prioritize',
      icon: <Tag size={15} />,
      onClick: onSelectLabels
    },
    {
      id: 'dates',
      title: 'Dates',
      subtitle: 'Start dates, due dates, and reminders',
      icon: <Clock size={15} />,
      onClick: onSelectDates
    },
    {
      id: 'checklist',
      title: 'Checklist',
      subtitle: 'Add subtasks',
      icon: <CheckSquare size={15} />,
      onClick: onSelectChecklist
    },
    {
      id: 'members',
      title: 'Members',
      subtitle: 'Assign members',
      icon: <User size={15} />,
      onClick: onSelectMembers
    },
    {
      id: 'attachment',
      title: 'Attachment',
      subtitle: 'Add links, pages, work items, and more',
      icon: <Paperclip size={15} />,
      onClick: onSelectAttachment
    },
    {
      id: 'location',
      title: 'Location',
      subtitle: 'View this card on a map',
      icon: <MapPin size={15} />,
      onClick: onSelectLocation
    },
    {
      id: 'custom-fields',
      title: 'Custom Fields',
      subtitle: 'Create your own fields',
      icon: <Sliders size={15} />,
      onClick: onSelectCustomFields
    },
    ...(onSelectTemplate ? [{
      id: 'template',
      title: isTemplate ? 'Remove Template' : 'Make Template',
      subtitle: isTemplate ? 'This card is currently a template' : 'Turn this card into a reusable template',
      icon: <Sliders size={15} className="rotate-90" />,
      onClick: onSelectTemplate
    }] : [])
  ];

  return (
    <div 
      className="w-[286px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="relative flex items-center justify-center pb-2 mb-1.5 border-b border-[#091e4224]">
        <h3 className="text-xs font-semibold text-[#44546f] tracking-wide">Add to card</h3>
        <button 
          type="button" 
          onClick={onClose}
          className="absolute right-0 p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded-md transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-0.5">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="group w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-[#091e420f] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-[#091e420f] flex items-center justify-center text-[#44546f] group-hover:text-[#0c66e4] group-hover:bg-[#0c66e4]/10 shrink-0 transition-colors">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#172b4d] leading-tight group-hover:text-[#0c66e4] transition-colors">
                {item.title}
              </span>
              <span className="text-[11px] text-[#44546f] leading-tight line-clamp-1">
                {item.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
