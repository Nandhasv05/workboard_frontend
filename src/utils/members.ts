export interface PortalUser {
  id: string;
  name: string;
  username?: string;
  email?: string | null;
  role?: string;
  department?: string | null;
  emp_code?: string | null;
}

export const filterMembers = <T extends PortalUser>(users: T[], query: string): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter(u =>
    [u.name, u.username, u.email, u.emp_code, u.department, u.role].some(v => v != null && String(v).toLowerCase().includes(q))
  );
};

export const memberSubtitle = (u: PortalUser) =>
  [u.username && u.username !== u.name ? `@${u.username}` : null, u.emp_code, u.department, u.email].filter(Boolean).join(' • ');

export const assigneeIdList = (ids?: string | null) => (ids || '').split(',').map(id => id.trim()).filter(Boolean);
