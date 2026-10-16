import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Check, Lock, Globe, Key, RefreshCw, Copy, CheckCircle2, 
  Pipette, Palette, Trello
} from 'lucide-react';
import { api } from '../api';
import { getAllTemplates, DEFAULT_TEMPLATES } from '../utils/templates';
export { DEFAULT_TEMPLATES as TEMPLATES };

export const GRADIENTS = [
  { id: 'gradient-purple', name: 'Purple Sunset', class: 'bg-gradient-to-r from-[#9f3e82] to-[#5a2760]' },
  { id: 'gradient-orange', name: 'Sunrise Orange', class: 'bg-gradient-to-r from-[#d95c26] to-[#e67e22]' },
  { id: 'gradient-blue', name: 'Ocean Blue', class: 'bg-gradient-to-r from-[#0052cc] to-[#0065ff]' },
  { id: 'gradient-green', name: 'Emerald Forest', class: 'bg-gradient-to-r from-[#059669] to-[#10b981]' },
  { id: 'gradient-violet', name: 'Galaxy Violet', class: 'bg-gradient-to-r from-[#6b21a8] to-[#9333ea]' },
  { id: 'gradient-dark', name: 'Midnight Slate', class: 'bg-gradient-to-r from-[#1e293b] to-[#334155]' },
  { id: 'gradient-crimson', name: 'Crimson Flame', class: 'bg-gradient-to-r from-[#b91c1c] to-[#ef4444]' },
  { id: 'gradient-teal', name: 'Teal Lagoon', class: 'bg-gradient-to-r from-[#0f766e] to-[#14b8a6]' },
];

export const SOLID_COLORS = [
  { id: 'color-blue', name: 'Royal Blue', color: '#0052cc' },
  { id: 'color-navy', name: 'Deep Navy', color: '#0c2340' },
  { id: 'color-emerald', name: 'Emerald Green', color: '#059669' },
  { id: 'color-teal', name: 'Teal Green', color: '#00875a' },
  { id: 'color-orange', name: 'Warm Orange', color: '#d95c26' },
  { id: 'color-purple', name: 'Royal Purple', color: '#6554c0' },
  { id: 'color-rose', name: 'Berry Rose', color: '#be185d' },
  { id: 'color-crimson', name: 'Crimson Red', color: '#dc2626' },
  { id: 'color-slate', name: 'Dark Slate', color: '#334155' },
  { id: 'color-charcoal', name: 'Charcoal Black', color: '#1f2937' },
];

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId?: string | null;
  initialName?: string;
  onCreated?: (board: any) => void;
}

export default function CreateBoardModal({
  isOpen,
  onClose,
  initialTemplateId,
  initialName = '',
  onCreated
}: CreateBoardModalProps) {
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState(initialName);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [accessCode, setAccessCode] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Background state
  const [bgType, setBgType] = useState<'image' | 'gradient' | 'color' | 'custom'>('gradient');
  const [selectedBgId, setSelectedBgId] = useState('gradient-purple');
  const [selectedImageUrl, setSelectedImageUrl] = useState(DEFAULT_TEMPLATES[0]?.image || '');
  const [customColor, setCustomColor] = useState('#0052cc');

  const generatePasscode = () => {
    return `EVOL-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const allTemplates = getAllTemplates();

  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId) {
        const t = allTemplates.find(x => x.id === initialTemplateId);
        if (t) {
          setTemplateId(t.id);
          setBoardName(t.name);
          setBgType('image');
          setSelectedImageUrl(t.image);
        }
      } else {
        setBoardName(initialName);
      }
      setAccessCode(generatePasscode());
    }
  }, [isOpen, initialTemplateId, initialName]);

  if (!isOpen) return null;

  const getActiveBackground = () => {
    if (bgType === 'image') {
      return { 
        className: '', 
        style: { 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.6)), url("${selectedImageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }, 
        raw: selectedImageUrl 
      };
    }
    if (bgType === 'custom') {
      return { className: '', style: { backgroundColor: customColor }, raw: customColor };
    }
    if (bgType === 'color') {
      const c = SOLID_COLORS.find(x => x.id === selectedBgId) || SOLID_COLORS[0];
      const colorVal = c?.color || '#0052cc';
      return { className: '', style: { backgroundColor: colorVal }, raw: colorVal };
    }
    const g = GRADIENTS.find(x => x.id === selectedBgId) || GRADIENTS[0];
    const gradClass = g?.class || 'bg-blue-600';
    return { className: gradClass, style: undefined, raw: gradClass };
  };

  const activeBg = getActiveBackground();

  const handleCopyCode = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    try {
      setIsSubmitting(true);
      const bg = getActiveBackground();

      const payload: any = {
        name: boardName.trim(),
        background: bg.raw,
        visibility,
      };

      if (visibility === 'private') {
        payload.accessCode = accessCode.trim() || generatePasscode();
      }

      if (templateId) {
        payload.template = templateId;
        const matched = allTemplates.find(t => t.id === templateId);
        if (matched?.columns && matched.columns.length > 0) {
          payload.columns = matched.columns;
        }
      }

      const { data } = await api.post('/boards', payload);

      if (visibility === 'private') {
        sessionStorage.setItem(`unlocked_board_${data.board.id}`, 'true');
      }

      onClose();
      onCreated?.(data.board);
      navigate(`/boards/${data.board.id}`);
    } catch (err) {
      console.error('Failed to create board', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white text-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 max-h-[94vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Trello size={18} className="text-blue-600" />
            <span>Create board</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-md cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Board Card Live Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Board Preview</label>
              <span className="text-[11px] text-gray-500">Live Appearance</span>
            </div>
            <div 
              style={activeBg.style}
              className={`h-28 rounded-xl ${activeBg.className} p-4 flex flex-col justify-between shadow-md transition-all duration-200 relative overflow-hidden`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-white text-base truncate drop-shadow-sm">
                  {boardName || 'Board title preview'}
                </div>
                {visibility === 'private' ? (
                  <span className="bg-black/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 backdrop-blur-xs">
                    <Lock size={10} /> Private ({accessCode || 'Code'})
                  </span>
                ) : (
                  <span className="bg-black/30 text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 shrink-0 backdrop-blur-xs">
                    <Globe size={10} /> Public (Open)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Background Selector */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Background Style</label>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setBgType('image')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${bgType === 'image' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                >
                  Photos
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('gradient')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${bgType === 'gradient' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                >
                  Gradients
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('color')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${bgType === 'color' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                >
                  Colors
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('custom')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${bgType === 'custom' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                >
                  <Pipette size={11} /> Custom
                </button>
              </div>
            </div>

            {/* Photos option */}
            {bgType === 'image' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedImageUrl(t.image);
                      setTemplateId(t.id);
                    }}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url("${t.image}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    className={`h-14 rounded-lg flex flex-col justify-end p-1.5 border-2 transition-all relative ${selectedImageUrl === t.image ? 'border-blue-600 scale-102 ring-2 ring-blue-500/40 shadow-md' : 'border-transparent opacity-85 hover:opacity-100'}`}
                    title={t.name}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow truncate">{t.badge}</span>
                    {selectedImageUrl === t.image && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Gradients option */}
            {bgType === 'gradient' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {GRADIENTS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedBgId(g.id)}
                    className={`h-9 rounded-lg ${g.class} flex items-center justify-center border-2 transition-all ${selectedBgId === g.id ? 'border-gray-900 scale-105 shadow-md ring-2 ring-blue-500/30' : 'border-transparent opacity-85 hover:opacity-100 hover:scale-102'}`}
                    title={g.name}
                  >
                    {selectedBgId === g.id && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            )}

            {/* Colors option */}
            {bgType === 'color' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {SOLID_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedBgId(c.id)}
                    style={{ backgroundColor: c.color }}
                    className={`h-9 rounded-lg flex items-center justify-center border-2 transition-all ${selectedBgId === c.id ? 'border-gray-900 scale-105 shadow-md ring-2 ring-blue-500/30' : 'border-transparent opacity-90 hover:opacity-100 hover:scale-102'}`}
                    title={c.name}
                  >
                    {selectedBgId === c.id && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Color option */}
            {bgType === 'custom' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer group shrink-0">
                    <input
                      type="color"
                      value={customColor}
                      onChange={e => setCustomColor(e.target.value)}
                      className="sr-only"
                    />
                    <div 
                      style={{ backgroundColor: customColor }}
                      className="w-12 h-12 rounded-xl border-2 border-white shadow-md ring-2 ring-gray-300 group-hover:scale-105 transition-transform flex items-center justify-center"
                      title="Click to choose custom color"
                    >
                      <Pipette size={18} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    </div>
                  </label>

                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-500">Pick or type custom HEX color:</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs font-bold">#</span>
                        <input
                          type="text"
                          maxLength={7}
                          value={customColor.replace('#', '')}
                          onChange={e => {
                            const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                            setCustomColor(val);
                          }}
                          placeholder="0052cc"
                          className="w-full bg-white border border-gray-300 focus:border-blue-600 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-gray-800 outline-none uppercase"
                        />
                      </div>
                      <label className="cursor-pointer bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                        <input
                          type="color"
                          value={customColor}
                          onChange={e => setCustomColor(e.target.value)}
                          className="sr-only"
                        />
                        <Palette size={13} className="text-blue-600" /> Picker
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Board Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Board title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              autoFocus
              required
              placeholder="e.g., HR Recruitment Pipeline, Sprint Planning..."
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              className="bg-white border border-gray-300 focus:border-blue-600 text-gray-900 rounded-lg px-3.5 py-2 text-sm outline-none transition-colors focus:ring-1 focus:ring-blue-600"
            />
            <span className="text-[11px] text-gray-500">👋 Board title is required.</span>
          </div>

          {/* Access Control & Visibility */}
          <div className="flex flex-col gap-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <label className="text-xs font-semibold text-gray-700">Access Control & Visibility</label>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${visibility === 'public' ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600' : 'bg-white/60 border-gray-200 hover:bg-white'}`}
              >
                <Globe size={18} className={visibility === 'public' ? 'text-blue-600 shrink-0 mt-0.5' : 'text-gray-400 shrink-0 mt-0.5'} />
                <div>
                  <div className="text-xs font-bold text-gray-900">Public</div>
                  <div className="text-[11px] text-gray-500 leading-tight mt-0.5">Open always — workspace members can access directly.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisibility('private');
                  if (!accessCode) setAccessCode(generatePasscode());
                }}
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${visibility === 'private' ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500' : 'bg-white/60 border-gray-200 hover:bg-white'}`}
              >
                <Lock size={18} className={visibility === 'private' ? 'text-amber-500 shrink-0 mt-0.5' : 'text-gray-400 shrink-0 mt-0.5'} />
                <div>
                  <div className="text-xs font-bold text-gray-900">Private</div>
                  <div className="text-[11px] text-gray-500 leading-tight mt-0.5">Protected with a dynamic passcode or password.</div>
                </div>
              </button>
            </div>

            {/* Dynamic Passcode for Private Board */}
            {visibility === 'private' && (
              <div className="mt-1 bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <Key size={13} className="text-amber-700" /> Dynamic Access Code:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAccessCode(generatePasscode())}
                    className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw size={11} /> Generate New
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="e.g., EVOL-8342"
                    className="flex-1 bg-white border border-amber-300 rounded px-2.5 py-1.5 font-mono font-bold text-sm text-gray-900 outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                
                <span className="text-[11px] text-amber-800 leading-tight">
                  🔒 Users must provide this passcode to open and unlock this board.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!boardName.trim() || isSubmitting}
              className="bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
