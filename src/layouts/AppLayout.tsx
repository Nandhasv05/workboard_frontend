// AUTHOR : NANDHAKUMAR
// DATE : 2026-10-07
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useSearchParams } from 'react-router-dom';
import {
  Trello, Clock, Star, Users, Search, Plus,
  Bell, ChevronDown, Sparkles, X, CheckCheck, Trash2
} from 'lucide-react';
import { api } from '../api';
import CreateBoardModal, { TEMPLATES } from '../components/CreateBoardModal';
import CreateTemplateModal from '../components/CreateTemplateModal';
import { filterMembers, memberSubtitle, type PortalUser } from '../utils/members';
import { getAllTemplates, deleteCustomTemplate, type BoardTemplate } from '../utils/templates';

export default function AppLayout() {
  const [searchParams] = useSearchParams();
  const isFullscreen = searchParams.get('view') === 'fullscreen';
  const [showBoardsDropdown, setShowBoardsDropdown] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Global Create Board Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTemplateId, setCreateModalTemplateId] = useState<string | null>(null);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<BoardTemplate[]>(() => getAllTemplates());

  useEffect(() => {
    const handleTemplatesUpdated = () => {
      setTemplatesList(getAllTemplates());
    };
    window.addEventListener('templates_updated', handleTemplatesUpdated);
    return () => window.removeEventListener('templates_updated', handleTemplatesUpdated);
  }, []);

  // Boards and User State
  const [boards, setBoards] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('starred_board_ids') || '[]');
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return { name: 'admin', role: 'admin' };
    }
  });
  const [members, setMembers] = useState<PortalUser[]>([]);

  // Dropdown Refs for Click Outside
  const boardRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'Welcome to WorkBoard', time: 'Just now', type: 'system', read: false },
    { id: '2', title: 'HR & Recruitment Board template is ready to use', time: '5m ago', type: 'board', read: false },
    { id: '3', title: 'Private boards now support dynamic access passcodes', time: '1h ago', type: 'security', read: false }
  ]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [boardsRes, meRes, usersRes, tasksRes, notifsRes] = await Promise.allSettled([
        api.get('/boards'),
        api.get('/auth/me'),
        api.get('/auth/users'),
        api.get('/tasks'),
        api.get('/notifications')
      ]);
      if (boardsRes.status === 'fulfilled') setBoards(boardsRes.value.data.boards || []);
      if (meRes.status === 'fulfilled' && meRes.value.data.user) setCurrentUser(meRes.value.data.user);
      if (usersRes.status === 'fulfilled' && usersRes.value.data.users) setMembers(usersRes.value.data.users);
      if (tasksRes.status === 'fulfilled') setAllTasks(tasksRes.value.data.tasks || []);
      
      if (notifsRes.status === 'fulfilled' && notifsRes.value.data.notifications) {
        const list = notifsRes.value.data.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: Boolean(n.read_at)
        }));
        if (list.length > 0) {
          setNotifications(list);
          setHasUnreadNotifications(notifsRes.value.data.unreadCount > 0);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeAllDropdowns = () => {
    setShowBoardsDropdown(false);
    setShowRecentDropdown(false);
    setShowMembersDropdown(false);
    setShowTemplatesDropdown(false);
    setShowNotificationsPopover(false);
    setShowUserDropdown(false);
    setShowSearchDropdown(false);
  };

  // Close dropdowns on outside click or touch, and on Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as Node;
      if (showBoardsDropdown && boardRef.current && !boardRef.current.contains(target)) {
        setShowBoardsDropdown(false);
      }
      if (showRecentDropdown && recentRef.current && !recentRef.current.contains(target)) {
        setShowRecentDropdown(false);
      }
      if (showMembersDropdown && membersRef.current && !membersRef.current.contains(target)) {
        setShowMembersDropdown(false);
      }
      if (showTemplatesDropdown && templatesRef.current && !templatesRef.current.contains(target)) {
        setShowTemplatesDropdown(false);
      }
      if (showNotificationsPopover && notifsRef.current && !notifsRef.current.contains(target)) {
        setShowNotificationsPopover(false);
      }
      if (showUserDropdown && userRef.current && !userRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (showSearchDropdown && searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    showBoardsDropdown,
    showRecentDropdown,
    showMembersDropdown,
    showTemplatesDropdown,
    showNotificationsPopover,
    showUserDropdown,
    showSearchDropdown,
  ]);

  const toggleStar = (boardId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const next = starredIds.includes(boardId)
      ? starredIds.filter(id => id !== boardId)
      : [...starredIds, boardId];
    setStarredIds(next);
    localStorage.setItem('starred_board_ids', JSON.stringify(next));
  };

  const filteredMembers = filterMembers(members, memberSearch);

  // Search Results
  const matchingBoards = boards.filter(b => 
    searchQuery && b.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const matchingTasks = allTasks.filter(t => 
    searchQuery && t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTemplateModal = (templateId: string) => {
    closeAllDropdowns();
    setCreateModalTemplateId(templateId);
    setIsCreateModalOpen(true);
  };

  const openNewBoardModal = () => {
    closeAllDropdowns();
    setCreateModalTemplateId(null);
    setIsCreateModalOpen(true);
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setHasUnreadNotifications(false);
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  if (isFullscreen) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#f4f5f7] overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7] text-[#172b4d] font-sans antialiased">
      
      {/* HEADER (Light Theme with exact user requested left-to-right items) */}
      <header className="h-14 bg-white border-b border-gray-200 px-2 sm:px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        
        {/* Left Side: evolv Project logo, board, recent, starred, member, templates */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          
          {/* 1. WorkBoard Logo & Brand */}
          <Link to="/boards" className="flex items-center gap-2 px-1.5 sm:px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors mr-0.5 sm:mr-2">
            <img 
              src="/evolv-logo.png" 
              alt="WorkBoard" 
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
            <span className="font-bold text-base text-gray-900 tracking-tight hidden sm:inline">
              WorkBoard
            </span>
          </Link>

          {/* 2. Board dropdown */}
          <div ref={boardRef} className="relative">
            <button 
              onClick={() => {
                const next = !showBoardsDropdown;
                closeAllDropdowns();
                setShowBoardsDropdown(next);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Trello size={15} className="text-blue-600" />
              <span className="hidden sm:inline">Board</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {showBoardsDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Boards ({boards.length})</span>
                  <button onClick={openNewBoardModal} className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10px] font-bold cursor-pointer">
                    <Plus size={11} /> New
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {boards.map(b => (
                    <Link
                      key={b.id}
                      to={`/boards/${b.id}`}
                      onClick={() => setShowBoardsDropdown(false)}
                      className="px-3 py-2 flex items-center justify-between hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-medium transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-5 h-4 rounded bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0"></div>
                        <span className="truncate">{b.name}</span>
                      </div>
                      <button 
                        onClick={(e) => toggleStar(b.id, e)} 
                        className={`p-1 hover:scale-110 transition-transform ${starredIds.includes(b.id) ? 'text-amber-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                      >
                        <Star size={12} fill={starredIds.includes(b.id) ? 'currentColor' : 'none'} />
                      </button>
                    </Link>
                  ))}
                  {boards.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">No boards created yet.</div>
                  )}
                </div>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Link
                    to="/boards"
                    onClick={() => setShowBoardsDropdown(false)}
                    className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    View all boards &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. Recent dropdown */}
          <div ref={recentRef} className="relative">
            <button 
              onClick={() => {
                const next = !showRecentDropdown;
                closeAllDropdowns();
                setShowRecentDropdown(next);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Clock size={15} className="text-amber-500" />
              <span className="hidden sm:inline">Recent</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {showRecentDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Recently Viewed</div>
                {boards.slice(0, 5).map(b => (
                  <Link
                    key={b.id}
                    to={`/boards/${b.id}`}
                    onClick={() => setShowRecentDropdown(false)}
                    className="px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-medium transition-colors"
                  >
                    <div className="w-5 h-4 rounded bg-gradient-to-r from-blue-500 to-teal-500 shrink-0"></div>
                    <span className="truncate">{b.name}</span>
                  </Link>
                ))}
                {boards.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">No recent boards yet.</div>
                )}
              </div>
            )}
          </div>

          {/* 4. Members dropdown */}
          <div ref={membersRef} className="relative">
            <button
              onClick={() => {
                const next = !showMembersDropdown;
                closeAllDropdowns();
                setShowMembersDropdown(next);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Users size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Members</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {showMembersDropdown && (
              <div className="absolute left-0 mt-1.5 w-80 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 pb-2 border-b border-gray-100">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Portal Users ({filteredMembers.length}{memberSearch ? ` of ${members.length}` : ''})
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search name, username, emp code, department..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg text-xs text-gray-800 outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <div key={m.id} className="px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                        {(m.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-800 truncate flex items-center gap-1.5">
                          <span className="truncate">{m.name}</span>
                          {m.id === currentUser?.id && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-semibold shrink-0">You</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{memberSubtitle(m)}</div>
                      </div>
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-gray-400">No members found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. Templates dropdown */}
          <div ref={templatesRef} className="relative">
            <button 
              onClick={() => {
                const next = !showTemplatesDropdown;
                closeAllDropdowns();
                setShowTemplatesDropdown(next);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Sparkles size={15} className="text-purple-600" />
              <span className="hidden md:inline">Templates</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {showTemplatesDropdown && (
              <div className="absolute left-0 mt-1.5 w-84 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
                  <span>Available Templates</span>
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    <Plus size={12} /> Create Template
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {templatesList.map(t => (
                    <div
                      key={t.id}
                      onClick={() => openTemplateModal(t.id)}
                      className="w-full text-left p-3 hover:bg-purple-50/60 transition-colors flex items-start gap-3 cursor-pointer group relative"
                    >
                      <div 
                        className="w-12 h-10 rounded-lg shrink-0 border border-black/10 shadow-2xs relative overflow-hidden"
                        style={{
                          backgroundImage: `url("${t.image}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-gray-900 group-hover:text-purple-700 truncate">{t.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${t.isCustom ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                      {t.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomTemplate(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 rounded-md transition-all self-center shrink-0 cursor-pointer"
                          title="Delete custom template"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50/80 rounded-b-xl">
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-purple-200/80 shadow-2xs cursor-pointer"
                  >
                    <Plus size={14} className="text-purple-600" />
                    <span>Create Custom Template</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Search, Create button, Notification bell, Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* 7. Search option & Dropdown */}
          <div ref={searchContainerRef} className="relative hidden sm:block w-48 md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search boards, tasks..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(Boolean(e.target.value));
              }}
              onFocus={() => {
                if (searchQuery) setShowSearchDropdown(true);
              }}
              className="w-full pl-8 pr-7 py-1.5 bg-gray-100 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
              >
                <X size={12} />
              </button>
            )}

            {/* Search Dropdown Results */}
            {showSearchDropdown && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 max-h-80 overflow-y-auto">
                {/* Matching Boards */}
                {matchingBoards.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Boards ({matchingBoards.length})</div>
                    {matchingBoards.map(b => (
                      <Link
                        key={b.id}
                        to={`/boards/${b.id}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 text-xs font-semibold text-gray-800 hover:text-blue-600"
                      >
                        <Trello size={13} className="text-blue-600 shrink-0" />
                        <span className="truncate">{b.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Matching Tasks */}
                {matchingTasks.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-100">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tasks ({matchingTasks.length})</div>
                    {matchingTasks.slice(0, 6).map(t => (
                      <Link
                        key={t.id}
                        to={`/boards/${t.board_id}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 flex items-center justify-between hover:bg-blue-50 text-xs text-gray-700 hover:text-blue-600"
                      >
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.2 rounded text-gray-500 uppercase">{t.priority || 'task'}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {matchingBoards.length === 0 && matchingTasks.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-gray-400">
                    No boards or tasks found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 8. Create button */}
          <div className="relative">
            <button
              onClick={openNewBoardModal}
              className="bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold px-2 sm:px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>

          {/* 9. Notification icon & Popover */}
          <div ref={notifsRef} className="relative">
            <button 
              onClick={() => {
                const next = !showNotificationsPopover;
                closeAllDropdowns();
                setShowNotificationsPopover(next);
              }}
              className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" 
              title="Notifications"
            >
              <Bell size={17} />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotificationsPopover && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Bell size={14} className="text-blue-600" /> Notifications
                  </span>
                  {hasUnreadNotifications && (
                    <button 
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={12} /> Mark read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-3 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</div>
                        {n.message && <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>}
                        <div className="text-[10px] text-gray-400 mt-1">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 px-3 border-t border-gray-100 text-center">
                  <Link 
                    to="/boards" 
                    onClick={() => setShowNotificationsPopover(false)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    View workspace activity &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 10. Avatar icon & portal user popup */}
          <div ref={userRef} className="relative">
            <div 
              onClick={() => {
                const next = !showUserDropdown;
                closeAllDropdowns();
                setShowUserDropdown(next);
              }}
              className="w-8 h-8 rounded-full bg-[#0052cc] hover:bg-[#0747a6] text-white font-extrabold flex items-center justify-center text-xs shadow-sm ring-2 ring-blue-100 cursor-pointer transition-transform hover:scale-105 uppercase select-none" 
              title={`${currentUser?.name || 'admin'} (${currentUser?.role || 'Admin'})`}
            >
              {(currentUser?.name || 'A').charAt(0)}
            </div>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#0052cc] text-white font-bold flex items-center justify-center text-sm uppercase">
                    {(currentUser?.name || 'A').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name || 'admin'}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {currentUser?.role || 'Admin'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 mt-1">
                  <a 
                    href="/EVOL/"
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <span>Back to EVOL Portal</span>
                    <span className="text-gray-400">&rarr;</span>
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-[#f4f5f7]">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-3.5 px-6 text-center text-xs text-gray-500 shrink-0">
        <p>© 2026 evolvclothing. All rights reserved.</p>
      </footer>

      {/* GLOBAL CREATE BOARD MODAL */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialTemplateId={createModalTemplateId}
        onCreated={() => {
          fetchData();
        }}
      />

      {/* CREATE TEMPLATE MODAL */}
      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        onCreated={(newTpl) => {
          openTemplateModal(newTpl.id);
        }}
      />

    </div>
  );
}
