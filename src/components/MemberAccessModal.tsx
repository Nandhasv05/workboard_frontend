import { useState } from 'react';
import { Check, Edit3, Eye, Search, Shield, X } from 'lucide-react';
import { filterMembers, memberSubtitle, type PortalUser } from '../utils/members';
import { LoadingSpinner } from './LoadingSpinner';

export type AccessRole = 'edit' | 'view' | 'none';

interface MemberAccessModalProps {
  title: string;
  subjectName: string;
  hint: string;
  users: PortalUser[];
  accessMap: Record<string, AccessRole>;
  canManage: boolean;
  inherited?: boolean;
  onChange: (userId: string, role: AccessRole) => void;
  onSetAll: (role: AccessRole) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  saved: boolean;
}

export default function MemberAccessModal({
  title, subjectName, hint, users, accessMap, canManage, inherited,
  onChange, onSetAll, onSave, onClose, saving, saved,
}: MemberAccessModalProps) {
  const [search, setSearch] = useState('');
  const granted = Object.values(accessMap).filter(role => role !== 'none').length;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <p className="text-xs text-gray-500 truncate">
                {hint} <span className="font-semibold text-gray-700">"{subjectName}"</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {inherited && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No separate rules yet. The list below matches the parent access. Saving stores rules for this item; Clear all removes them.
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, department, username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-600 bg-gray-50/50 focus:bg-white"
              />
            </div>
            {canManage && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-500 font-medium">Set all:</span>
                {(['edit', 'view', 'none'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onSetAll(role)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer capitalize"
                  >
                    {role === 'none' ? 'Clear' : role}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {filterMembers(users, search).map(user => {
              const current = accessMap[String(user.id)] || 'none';
              return (
                <div key={user.id} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs uppercase shrink-0 text-white ${current === 'edit' ? 'bg-emerald-600' : current === 'view' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                      {(user.name || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{memberSubtitle(user)}</div>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0 self-end sm:self-auto">
                      {([
                        ['edit', Edit3, 'Can change'],
                        ['view', Eye, 'Can only view'],
                        ['none', null, 'No access'],
                      ] as const).map(([role, Icon, label]) => (
                        <button
                          key={role}
                          type="button"
                          title={label}
                          onClick={() => onChange(String(user.id), role)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${current === role ? (role === 'edit' ? 'bg-emerald-600 text-white' : role === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white') : 'text-gray-600 hover:bg-white/70'}`}
                        >
                          {Icon && <Icon size={11} />}
                          <span className="capitalize">{role}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-gray-100 text-gray-600">{current}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">{granted} members granted access</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer">Cancel</button>
            {canManage && (
              <button type="button" disabled={saving} onClick={onSave} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                {saving ? <LoadingSpinner size="xs" /> : saved ? <Check size={14} /> : null}
                <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save permissions'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
