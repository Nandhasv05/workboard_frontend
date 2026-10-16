export interface BoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  badge: string;
  color?: string;
  columns?: string[];
  isCustom?: boolean;
}

export const DEFAULT_TEMPLATES: BoardTemplate[] = [
  {
    id: 'hr',
    name: 'HR & Recruitment Board',
    category: 'Human Resources',
    description: 'Track candidate pipeline from job posting, screening, interviews to hiring and onboarding.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    badge: 'HR / Recruitment',
    color: '#2563eb',
    columns: ['Job Openings', 'Applications Received', 'Screening & Shortlist', 'Interview Rounds', 'Offer Extended', 'Hired & Onboarded']
  },
  {
    id: 'sprint',
    name: 'Software Sprint Delivery',
    category: 'Engineering',
    description: 'Manage agile development, bug fixes, pull request reviews, and sprint releases.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    badge: 'Agile Sprint',
    color: '#7c3aed',
    columns: ['Sprint Backlog', 'Ready for Dev', 'In Progress', 'Code Review', 'QA & Testing', 'Done']
  },
  {
    id: 'marketing',
    name: 'Marketing & Content Pipeline',
    category: 'Marketing',
    description: 'Plan campaigns, content drafting, creative review, and multi-channel publication.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    badge: 'Marketing',
    color: '#db2777',
    columns: ['Campaign Ideas', 'Content & Copy', 'Design & Visuals', 'Review & Approval', 'Scheduled', 'Published']
  },
  {
    id: 'project',
    name: 'Project Operations & Roadmap',
    category: 'Operations',
    description: 'Executive roadmap tracking, milestone delivery, risk mitigation, and team task allocation.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    badge: 'Operations',
    color: '#059669',
    columns: ['Planning', 'In Progress', 'Pending Review', 'Blocked', 'Completed']
  }
];

const STORAGE_KEY = 'custom_board_templates';

export const getCustomTemplates = (): BoardTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getAllTemplates = (): BoardTemplate[] => {
  const custom = getCustomTemplates();
  return [...custom, ...DEFAULT_TEMPLATES];
};

export const saveCustomTemplate = (data: Omit<BoardTemplate, 'id' | 'isCustom'>): BoardTemplate => {
  const custom = getCustomTemplates();
  const id = `custom-${Date.now()}`;
  const newTemplate: BoardTemplate = {
    ...data,
    id,
    isCustom: true
  };
  const updated = [newTemplate, ...custom];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('templates_updated'));
  return newTemplate;
};

export const deleteCustomTemplate = (id: string): void => {
  const custom = getCustomTemplates();
  const updated = custom.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('templates_updated'));
};
