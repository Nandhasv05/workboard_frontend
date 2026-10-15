import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Layout, Users, X, Check, 
  Sparkles, Trello, Pipette, Palette, Lock, Globe,
  Key, RefreshCw, Copy, CheckCircle2, Search, ArrowRight, Briefcase, LayoutGrid, List
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { filterMembers, memberSubtitle, type PortalUser } from '../utils/members';

export default function Boards() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [boardView, setBoardView] = useState<'grid' | 'list'>(() => localStorage.getItem('boards_view') === 'list' ? 'list' : 'grid');

  const changeBoardView = (view: 'grid' | 'list') => {
    setBoardView(view);
    localStorage.setItem('boards_view', view);
  };
  
  // Create Board Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [accessCode, setAccessCode] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Background Customization State
  const [bgType, setBgType] = useState<'gradient' | 'color' | 'image' | 'custom'>('gradient');
  const [selectedBgId, setSelectedBgId] = useState('gradient-purple');
  const [selectedImageUrl, setSelectedImageUrl] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80');
  const [customColor, setCustomColor] = useState('#0052cc');

  // Members Modal State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const generatePasscode = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `EVOL-${num}`;
  };

  const templates = [
    {
      id: 'hr',
      name: 'HR & Recruitment Board',
      category: 'Human Resources',
      description: 'Candidate pipeline, interview rounds, offer management, and employee onboarding.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      badge: 'HR / Recruitment',
      color: '#2563eb'
    },
    {
      id: 'sprint',
      name: 'Software Sprint Delivery',
      category: 'Engineering',
      description: 'Manage agile development, code reviews, QA testing, and sprint releases.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      badge: 'Agile Sprint',
      color: '#7c3aed'
    },
    {
      id: 'marketing',
      name: 'Marketing & Content Pipeline',
      category: 'Marketing',
      description: 'Plan campaigns, draft content copy, visual reviews, and multi-channel launches.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      badge: 'Marketing & PR',
      color: '#db2777'
    },
    {
      id: 'project',
      name: 'Project Operations & Roadmap',
      category: 'Operations',
      description: 'Executive deliverables, milestone tracking, resource planning, and risk audits.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      badge: 'Operations',
      color: '#059669'
    }
  ];

  const gradients = [
    { id: 'gradient-purple', name: 'Purple Sunset', class: 'bg-gradient-to-r from-[#9f3e82] to-[#5a2760]' },
    { id: 'gradient-orange', name: 'Sunrise Orange', class: 'bg-gradient-to-r from-[#d95c26] to-[#e67e22]' },
    { id: 'gradient-blue', name: 'Ocean Blue', class: 'bg-gradient-to-r from-[#0052cc] to-[#0065ff]' },
    { id: 'gradient-green', name: 'Emerald Forest', class: 'bg-gradient-to-r from-[#059669] to-[#10b981]' },
    { id: 'gradient-violet', name: 'Galaxy Violet', class: 'bg-gradient-to-r from-[#6b21a8] to-[#9333ea]' },
    { id: 'gradient-dark', name: 'Midnight Slate', class: 'bg-gradient-to-r from-[#1e293b] to-[#334155]' },
    { id: 'gradient-crimson', name: 'Crimson Flame', class: 'bg-gradient-to-r from-[#b91c1c] to-[#ef4444]' },
    { id: 'gradient-teal', name: 'Teal Lagoon', class: 'bg-gradient-to-r from-[#0f766e] to-[#14b8a6]' },
  ];

  const solidColors = [
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

  useEffect(() => {
    loadData();
    loadPortalUsers();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [boardsRes, projectsRes] = await Promise.all([
        api.get('/boards'),
        api.get('/projects')
      ]);
      setBoards(boardsRes.data.boards || []);
      setProjects(projectsRes.data.projects || []);
    } catch (err) {
      console.error('Failed to load boards/projects', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPortalUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setPortalUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load portal users', err);
    }
  };

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
      const c = solidColors.find(x => x.id === selectedBgId) || solidColors[0];
      const colorVal = c?.color || '#0052cc';
      return { className: '', style: { backgroundColor: colorVal }, raw: colorVal };
    }
    const g = gradients.find(x => x.id === selectedBgId) || gradients[0];
    const gradClass = g?.class || 'bg-blue-600';
    return { className: gradClass, style: undefined, raw: gradClass };
  };

  const getBoardBg = (board: any, idx: number) => {
    const bg = board.background;
    if (bg) {
      if (bg.startsWith('http') || bg.startsWith('/')) {
        return { 
          style: { 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.6)), url("${bg}")`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }, 
          className: '' 
        };
      }
      if (bg.startsWith('#') || bg.startsWith('rgb')) {
        return { style: { backgroundColor: bg }, className: '' };
      }
      if (bg.startsWith('bg-')) {
        return { style: undefined, className: bg };
      }
    }
    const fallback = gradients[idx % gradients.length]?.class || 'bg-blue-600';
    return { style: undefined, className: fallback };
  };

  const openCreateModalWithTemplate = (template: typeof templates[0]) => {
    setSelectedTemplateId(template.id);
    setNewBoardName(template.name);
    setBgType('image');
    setSelectedImageUrl(template.image);
    setVisibility('public');
    setIsModalOpen(true);
  };

  const openNewBlankModal = () => {
    setSelectedTemplateId(null);
    setNewBoardName('');
    setBgType('gradient');
    setVisibility('public');
    setAccessCode(generatePasscode());
    setIsModalOpen(true);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      setIsSubmitting(true);
      const bg = getActiveBackground();
      const defaultProjectId = projects[0]?.id;
      
      const payload: any = {
        name: newBoardName.trim(),
        projectId: defaultProjectId,
        background: bg.raw,
        visibility: visibility,
      };

      if (visibility === 'private') {
        payload.accessCode = accessCode.trim() || generatePasscode();
      }

      if (selectedTemplateId) {
        payload.template = selectedTemplateId;
      }

      const { data } = await api.post('/boards', payload);
      
      // If private, automatically mark unlocked for creator in current session
      if (visibility === 'private') {
        sessionStorage.setItem(`unlocked_board_${data.board.id}`, 'true');
      }

      setIsModalOpen(false);
      setNewBoardName('');
      navigate(`/boards/${data.board.id}`);
    } catch (err) {
      console.error('Create board error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeBg = getActiveBackground();

  const filteredMembers = filterMembers(portalUsers, memberSearch);

  if (loading) {
    return (
      <div className="flex-1 bg-[#f4f5f7] flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner 
          size="xl" 
          label="Loading workspace boards..." 
          sublabel="Syncing your projects, templates, and teams" 
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] text-[#172b4d] p-3 sm:p-6 lg:p-10 select-none">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-9">

        {/* Top Hero Banner */}
        {!bannerDismissed && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="flex-1 max-w-xl z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                <Sparkles size={15} /> GET STARTED WITH WORKBOARD
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                Organize anything together
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-2 leading-relaxed">
                Create public or private boards with automated passcodes, customizable themes, and pre-built enterprise templates like HR and Sprint delivery!
              </p>
              
              <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                <button 
                  onClick={openNewBlankModal}
                  className="bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Plus size={16} /> Create a Board
                </button>
                <button 
                  onClick={() => setBannerDismissed(true)}
                  className="text-gray-500 hover:text-gray-800 text-xs underline underline-offset-4"
                >
                  Got it! Dismiss this.
                </button>
              </div>
            </div>

            {/* Illustration decoration */}
            <div className="mt-6 md:mt-0 w-full max-w-[260px] md:w-64 h-36 bg-gradient-to-tr from-[#9f3e82] via-[#652865] to-[#0052cc] rounded-xl p-3 shadow-lg flex flex-col justify-between border border-white/20 rotate-1 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 h-14 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="w-6 h-1.5 bg-white/70 rounded"></div>
                  <div className="w-full h-3 bg-white/50 rounded"></div>
                </div>
                <div className="bg-white/20 h-14 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="w-8 h-1.5 bg-white/70 rounded"></div>
                  <div className="w-full h-3 bg-white/50 rounded"></div>
                </div>
                <div className="bg-white/20 h-14 rounded-lg p-1.5 flex flex-col justify-between">
                  <div className="w-5 h-1.5 bg-white/70 rounded"></div>
                  <div className="w-full h-3 bg-white/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEATURED TEMPLATES SECTION (HR, Sprint, Marketing, Operations) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-gray-800">
              <Briefcase size={18} className="text-blue-600" />
              <span>Available Templates (Ready to Use)</span>
            </div>
            <span className="text-xs text-gray-500">Pick a template to instantly generate cards & lists</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => openCreateModalWithTemplate(tpl)}
                className="h-36 rounded-xl relative overflow-hidden group cursor-pointer border border-gray-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between p-4"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75)), url("${tpl.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="bg-white/90 backdrop-blur-xs text-gray-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {tpl.badge}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white text-white group-hover:text-gray-900 flex items-center justify-center transition-colors">
                    <ArrowRight size={12} />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm group-hover:underline drop-shadow-sm line-clamp-1">
                    {tpl.name}
                  </h4>
                  <p className="text-white/80 text-[11px] line-clamp-2 mt-0.5">
                    {tpl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* YOUR WORKSPACES & BOARDS */}
        <section className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {}}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 shadow-2xs transition-colors"
              >
                <Layout size={14} className="text-blue-600" /> Boards ({boards.length})
              </button>
              <button 
                onClick={() => setIsMembersModalOpen(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 shadow-2xs transition-colors cursor-pointer"
              >
                <Users size={14} className="text-emerald-600" /> Members ({portalUsers.length})
              </button>
            </div>

            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 self-start sm:self-auto">
              {([['grid', LayoutGrid, 'Grid'], ['list', List, 'List']] as const).map(([view, Icon, label]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => changeBoardView(view)}
                  title={`${label} view`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${boardView === view ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {boardView === 'list' ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-xs">
              {boards.map((board, idx) => {
                const bg = getBoardBg(board, idx);
                const isPrivate = board.visibility === 'private';
                const updated = board.updated_at ? new Date(board.updated_at) : null;

                return (
                  <Link
                    key={board.id}
                    to={`/boards/${board.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span style={bg.style} className={`w-12 h-8 rounded-md shrink-0 shadow-2xs ${bg.className}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-sm text-gray-900 truncate group-hover:text-blue-700">{board.name}</span>
                      {board.project_name && <span className="block text-xs text-gray-500 truncate">{board.project_name}</span>}
                    </span>
                    {isPrivate ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Lock size={10} /> Private
                      </span>
                    ) : (
                      <span className="bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 shrink-0">
                        <Globe size={10} /> Public
                      </span>
                    )}
                    {updated && !isNaN(updated.getTime()) && (
                      <span className="hidden sm:block text-xs text-gray-500 w-32 text-right shrink-0">
                        Updated {updated.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={openNewBlankModal}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Plus size={16} /> Create new board
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Real boards */}
            {boards.map((board, idx) => {
              const bg = getBoardBg(board, idx);
              const isPrivate = board.visibility === 'private';

              return (
                <Link
                  key={board.id}
                  to={`/boards/${board.id}`}
                  style={bg.style}
                  className={`h-28 rounded-xl ${bg.className} p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:brightness-105 transition-all group relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-base drop-shadow-sm group-hover:translate-x-0.5 transition-transform line-clamp-2">
                      {board.name}
                    </span>
                    {isPrivate ? (
                      <span className="bg-black/50 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 backdrop-blur-xs">
                        <Lock size={10} /> Private
                      </span>
                    ) : (
                      <span className="bg-black/30 text-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 shrink-0 backdrop-blur-xs">
                        <Globe size={10} /> Public
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-white/85">
                    <span className="truncate">{board.project_name}</span>
                    <Layout size={14} />
                  </div>
                </Link>
              );
            })}

            {/* "+ Create new board" Card */}
            <div 
              onClick={openNewBlankModal}
              className="h-28 rounded-xl bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 p-4 flex items-center justify-center cursor-pointer transition-all group shadow-xs"
            >
              <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 flex items-center gap-2">
                <Plus size={18} /> Create new board
              </span>
            </div>

          </div>
          )}
        </section>

      </div>

      {/* CREATE NEW BOARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white text-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Trello size={18} className="text-blue-600" />
                <span>Create board</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-md">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
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
                      {newBoardName || 'Board title preview'}
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

              {/* Background Color, Template Image & Custom Picker Selection */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Background Style</label>
                  {/* Segmented controls */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setBgType('image')}
                      className={`px-2 py-1 rounded-md transition-colors ${bgType === 'image' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                    >
                      Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType('gradient')}
                      className={`px-2 py-1 rounded-md transition-colors ${bgType === 'gradient' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                    >
                      Gradients
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType('color')}
                      className={`px-2 py-1 rounded-md transition-colors ${bgType === 'color' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                    >
                      Colors
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgType('custom')}
                      className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${bgType === 'custom' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-gray-900'}`}
                    >
                      <Pipette size={11} /> Custom
                    </button>
                  </div>
                </div>

                {/* Option 0: Images / Photos (HR, Tech, Marketing, Office) */}
                {bgType === 'image' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(t.image);
                          setSelectedTemplateId(t.id);
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

                {/* Option 1: Gradients View */}
                {bgType === 'gradient' && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {gradients.map(g => (
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

                {/* Option 2: Solid Colors View */}
                {bgType === 'color' && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {solidColors.map(c => (
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

                {/* Option 3: Custom Color with Interactive Color Picker */}
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
                            <Palette size={13} className="text-blue-600" /> Color Picker
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200/70">
                      <span className="text-[10px] font-medium text-gray-400 mr-1">Presets:</span>
                      {['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#334155'].map(hex => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCustomColor(hex)}
                          style={{ backgroundColor: hex }}
                          className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${customColor.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-blue-600 scale-105 border-white' : 'border-black/10'}`}
                          title={hex}
                        />
                      ))}
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
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="bg-white border border-gray-300 focus:border-blue-600 text-gray-900 rounded-lg px-3.5 py-2 text-sm outline-none transition-colors focus:ring-1 focus:ring-blue-600"
                />
                <span className="text-[11px] text-gray-500">👋 Board title is required.</span>
              </div>

              {/* Access Control: Public vs Private with Dynamic Password/Code */}
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

                {/* Dynamic Passcode Generator for Private Board */}
                {visibility === 'private' && (
                  <div className="mt-1 bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 flex flex-col gap-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <Key size={13} className="text-amber-700" /> Dynamic Access Code:
                      </span>
                      <button
                        type="button"
                        onClick={() => setAccessCode(generatePasscode())}
                        className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 hover:underline"
                        title="Generate a new dynamic code"
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
                        className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newBoardName.trim() || isSubmitting}
                  className="bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Creating...' : 'Create Board'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WORKSPACE MEMBERS MODAL */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsMembersModalOpen(false)}>
          <div 
            className="bg-white text-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">evolv Portal Workspace Members</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {portalUsers.length} Active Users
                </span>
              </div>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-md">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, username, emp code, department, email, or role..." 
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {filteredMembers.map((user, idx) => (
                  <div key={user.id || idx} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs uppercase">
                        {(user.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900">{user.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{memberSubtitle(user)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                        {user.role || 'Member'}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-400">No members found matching your search.</div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsMembersModalOpen(false)}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
