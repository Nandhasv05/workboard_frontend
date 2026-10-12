import React, { useState } from 'react';
import { ChevronLeft, X, Search, MapPin, ExternalLink, Check } from 'lucide-react';

interface LocationPopoverProps {
  currentLocation?: string | null;
  onSaveLocation: (location: string | null) => void;
  onBack?: () => void;
  onClose: () => void;
}

const COMMON_SUGGESTIONS = [
  'New York, NY, USA',
  'San Francisco, CA, USA',
  'London, United Kingdom',
  'Tokyo, Japan',
  'Paris, France',
  'Berlin, Germany',
  'Sydney, Australia',
  'Singapore',
  'Headquarters Office',
  'Remote / Work from Home'
];

export const LocationPopover: React.FC<LocationPopoverProps> = ({
  currentLocation,
  onSaveLocation,
  onBack,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState(currentLocation || '');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(currentLocation || null);

  const filteredSuggestions = searchQuery.trim()
    ? COMMON_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : COMMON_SUGGESTIONS.slice(0, 5);

  const handleSelect = (loc: string) => {
    setSelectedLocation(loc);
    onSaveLocation(loc);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleSelect(searchQuery.trim());
      }
    }
  };

  const handleRemove = () => {
    setSelectedLocation(null);
    onSaveLocation(null);
    onClose();
  };

  return (
    <div 
      className="w-[286px] bg-white text-[#172b4d] rounded-xl shadow-2xl border border-[#091e4224] p-3 select-none font-sans text-xs animate-in fade-in zoom-in-95 duration-100 z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
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
        
        <h3 className="text-xs font-semibold text-[#44546f] tracking-tight">Add location</h3>

        <button 
          type="button" 
          onClick={onClose}
          className="p-1 text-[#44546f] hover:text-[#172b4d] hover:bg-[#091e420f] rounded transition-colors cursor-pointer"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search Google Maps Input */}
      <div className="mb-2">
        <div className="relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Google Maps"
            autoFocus
            className="w-full bg-white border border-[#091e4224] focus:border-[#0c66e4] focus:ring-2 focus:ring-[#0c66e4]/20 rounded-md px-2.5 py-1.5 text-xs text-[#172b4d] outline-none transition-all placeholder:text-[#626f86]"
          />
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto my-1">
        {searchQuery.trim() && (
          <button
            type="button"
            onClick={() => handleSelect(searchQuery.trim())}
            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 text-blue-700 font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <MapPin size={13} className="text-blue-600 shrink-0" />
            <span className="truncate">Use "{searchQuery.trim()}"</span>
          </button>
        )}

        {filteredSuggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(s)}
            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[#091e420f] text-[#172b4d] text-xs flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin size={13} className="text-[#626f86] group-hover:text-[#0c66e4] shrink-0" />
              <span className="truncate">{s}</span>
            </div>
            {selectedLocation === s && (
              <Check size={13} className="text-[#0c66e4] shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      {selectedLocation && (
        <div className="border-t border-[#091e4224] pt-2 mt-2">
          <button
            type="button"
            onClick={handleRemove}
            className="w-full py-1 px-2 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium text-center"
          >
            Remove location
          </button>
        </div>
      )}
    </div>
  );
};
