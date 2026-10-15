import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, CheckSquare, Tag, Calendar, Paperclip, 
  MessageSquare, User, MoreHorizontal, Plus, Trash2, 
  Clock, ChevronDown, ExternalLink, AtSign, Download,
  CheckCircle2, AlertCircle, FileText, RotateCcw, Bell,
  Sparkles, MapPin, Image as ImageIcon, Layers,
  ArrowRight, Copy, Settings, Minus, ArrowUpDown, Layout
} from 'lucide-react';
import { api } from '../api';
import { DatePickerPopover } from './DatePickerPopover';
import { AddToCardPopover } from './AddToCardPopover';
import { LabelsPopover } from './LabelsPopover';
import { ChecklistPopover } from './ChecklistPopover';
import { LocationPopover } from './LocationPopover';
import { DescriptionEditor } from './DescriptionEditor';
import { CustomFieldsSection, CustomFieldsData } from './CustomFieldsSection';
import { LoadingSpinner } from './LoadingSpinner';
import { CardAutomationPopover } from './CardAutomationPopover';
import { CardPowerUpsPopover } from './CardPowerUpsPopover';
import { Plug, Zap } from 'lucide-react';
import { runCardButton, triggerBoardRulesForEvent } from '../utils/automationEngine';
import { filterMembers, memberSubtitle, type PortalUser } from '../utils/members';

const COVER_KEYS = ['cover_image_url', 'cover_bg_color'];

interface TaskModalProps {
  taskId: string | null;
  columns: { id: string; name: string; color?: string }[];
  onClose: () => void;
  onTaskUpdated?: () => void;
  onOpenAutomationDirectory?: () => void;
  readOnly?: boolean;
}

export default function TaskModal({ 
  taskId, 
  columns, 
  onClose, 
  onTaskUpdated,
  onOpenAutomationDirectory,
  readOnly = false 
}: TaskModalProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Title & Description Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [descText, setDescText] = useState('');
  

  // Delete Card State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comments State
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showActivityDetails, setShowActivityDetails] = useState(true);

  // Checklist State
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [newItemText, setNewItemText] = useState<{ [checklistId: string]: string }>({});
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null);

  // Quick Action Dropdowns
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showAddToCard, setShowAddToCard] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Custom Fields & Location State
  const [hasCustomFields, setHasCustomFields] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldsData>({});
  const [location, setLocation] = useState<string | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);
  const [showCoverPopover, setShowCoverPopover] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Checklist Item Assign & Due Date
  const [checklistItemAssignee, setChecklistItemAssignee] = useState<{ [checklistId: string]: any }>({});
  const [checklistItemAssigneeMenu, setChecklistItemAssigneeMenu] = useState<string | null>(null);
  const [checklistItemDueDate, setChecklistItemDueDate] = useState<{ [checklistId: string]: string }>({});

  // Attachment Menu
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState<string | null>(null);

  // Bottom Pill Bar & Automations / Power-Ups State
  const [activeBottomTab, setActiveBottomTab] = useState<'powerups' | 'automations' | 'comments'>('comments');
  const [showAutomationPopover, setShowAutomationPopover] = useState(false);
  const [showPowerUpsPopover, setShowPowerUpsPopover] = useState(false);
  const [automationToast, setAutomationToast] = useState<string | null>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const [automationButtons, setAutomationButtons] = useState<any[]>(() => {
    try {
      const savedCardButtons = localStorage.getItem('orbit_card_buttons');
      if (savedCardButtons) {
        const parsed = JSON.parse(savedCardButtons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b: any) => b.enabled);
        }
      }
      const saved = localStorage.getItem('orbit_card_automations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'cb-1',
        title: 'Assign to me',
        icon: 'User',
        enabled: true,
        closeCard: false,
        actions: [
          'join the card',
          'add the "In progress" label',
          'add an empty "To do" checklist to the card'
        ]
      },
      {
        id: 'cb-2',
        title: 'Completed',
        icon: 'CheckCircle2',
        enabled: true,
        closeCard: false,
        actions: [
          'move the card to the "Done" list',
          "remove the card's due date"
        ]
      },
      {
        id: 'cb-3',
        title: 'Send to review',
        icon: 'MessageSquare',
        enabled: true,
        closeCard: false,
        actions: [
          'add a member',
          'add the "For review" label',
          'post a comment that says "Ready for review!"'
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      const savedCardButtons = localStorage.getItem('orbit_card_buttons');
      if (savedCardButtons) {
        const parsed = JSON.parse(savedCardButtons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAutomationButtons(parsed.filter((b: any) => b.enabled));
        }
      }
    } catch {}
  }, [taskId]);

  const saveAutomationButtons = (newButtons: any[]) => {
    setAutomationButtons(newButtons);
    try {
      localStorage.setItem('orbit_card_automations', JSON.stringify(newButtons));
    } catch {}
  };

  const handleExecuteAutomation = async (btn: any) => {
    if (!task) return;
    try {
      // If button has multi-action list (Trello Automation modal)
      if (btn.actions && Array.isArray(btn.actions) && btn.actions.length > 0) {
        const res = await runCardButton(
          {
            id: btn.id,
            title: btn.title,
            icon: btn.icon,
            enabled: true,
            closeCard: Boolean(btn.closeCard),
            actions: btn.actions
          },
          task,
          columns
        );

        if (res.executed && res.executed.length > 0) {
          setAutomationToast(`✓ ${res.executed.join('; ')}`);
        } else {
          setAutomationToast(`✓ Executed "${btn.title}"`);
        }

        await loadTask();
        onTaskUpdated?.();

        if (res.closeCard) {
          setTimeout(() => onClose(), 800);
        }
        setTimeout(() => setAutomationToast(null), 3500);
        return;
      }
      if (btn.actionType === 'move') {
        const targetCol = columns.find(c => 
          c.id === btn.params.targetColumnId || 
          c.name.toLowerCase() === (btn.params.targetColumnName || 'done').toLowerCase()
        ) || columns[columns.length - 1];

        if (targetCol) {
          await api.put(`/tasks/${taskId}`, { columnId: targetCol.id });
          setTask((prev: any) => ({ ...prev, column_id: targetCol.id, columnId: targetCol.id }));
          setAutomationToast(`✓ Moved card to ${targetCol.name}`);
          onTaskUpdated?.();
        }
      } else if (btn.actionType === 'copy') {
        const targetCol = columns.find(c => 
          c.id === btn.params.targetColumnId || 
          c.name.toLowerCase() === (btn.params.targetColumnName || 'done').toLowerCase()
        ) || columns[0];

        if (targetCol) {
          await api.post(`/tasks`, {
            boardId: task.board_id,
            columnId: targetCol.id,
            projectId: task.project_id,
            title: `Copy of ${task.title}`,
            description: task.description || '',
            priority: task.priority || 'medium'
          });
          setAutomationToast(`✓ Copied card to ${targetCol.name}`);
          onTaskUpdated?.();
        }
      } else if (btn.actionType === 'join') {
        const storedUser = localStorage.getItem('currentUser');
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (user?.id) {
          await handleToggleMember(user.id, user.name || 'Member');
          setAutomationToast('✓ Joined card');
        } else {
          setAutomationToast('✓ Joined card as member');
        }
      } else if (btn.actionType === 'mark') {
        const isDone = btn.params.markStatus !== 'incomplete';
        await api.put(`/tasks/${taskId}`, { completed: isDone });
        setTask((prev: any) => ({ ...prev, completed: isDone }));
        setAutomationToast(isDone ? '✓ Marked as complete' : '✓ Marked as incomplete');
        onTaskUpdated?.();
      } else if (btn.actionType === 'label') {
        const lblName = btn.params.labelName || 'Green';
        const lblColor = btn.params.labelColor || '#22c55e';
        await handleToggleLabel({ name: lblName, color: lblColor });
        setAutomationToast(`✓ Added ${lblName} label`);
      } else if (btn.actionType === 'date') {
        const days = btn.params.dateAmount || 3;
        const targetDate = new Date();
        const multiplier = btn.params.dateUnit === 'weeks' ? 7 : 1;
        targetDate.setDate(targetDate.getDate() + (days * multiplier));
        const dateStr = targetDate.toISOString().slice(0, 10);
        await handleSaveDates({ startDate: null, dueDate: dateStr, dueTime: null, recurring: null, reminder: null });
        setAutomationToast(`✓ Set due date to ${dateStr}`);
      } else if (btn.actionType === 'remove') {
        if (btn.params.removeTarget === 'all labels') {
          await api.put(`/tasks/${taskId}`, { labels: [] });
          setTask((prev: any) => ({ ...prev, labels: [] }));
          setAutomationToast('✓ Removed all labels');
        } else if (btn.params.removeTarget === 'due date') {
          await handleRemoveDates();
          setAutomationToast('✓ Removed due date');
        }
        onTaskUpdated?.();
      } else {
        setAutomationToast(`✓ Executed "${btn.title}"`);
      }
      setTimeout(() => setAutomationToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to run automation:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error executing automation';
      setAutomationToast(errMsg);
      setTimeout(() => setAutomationToast(null), 3500);
    }
  };

  const getAttachmentUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    // Prevent double-prefixing
    if (url.startsWith('/Workboard/TodoList/uploads/')) {
      return url;
    }
    if (url.startsWith('/TodoList/uploads/')) {
      return url;
    }

    const clean = url.startsWith('/') ? url : `/${url}`;

    // On local dev servers (port 5173 or 3000), Vite proxy handles /uploads directly
    if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')) {
      return clean;
    }

    // In all production environments (including EVOL portal /EVOL/workboard_launch.php, /Workboard/TodoList, etc.)
    if (clean.startsWith('/uploads/')) {
      return `/Workboard/TodoList${clean}`;
    }
    return `/Workboard/TodoList${clean}`;
  };

  // Attachments & Image Upload / Paste
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const PRESET_COVERS = [
    {
      name: 'City Night (Kuala Lumpur)',
      url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
      bgColor: '#0052cc'
    },
    {
      name: 'Ocean Coast',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bgColor: '#0284c7'
    },
    {
      name: 'Forest Nature',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      bgColor: '#15803d'
    },
    {
      name: 'Modern Dark',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bgColor: '#18181b'
    }
  ];

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);
      
      if (Math.abs(diffSec) < 60) return 'just now';
      if (diffSec < 0 && Math.abs(diffSec) < 3600) return `in ${Math.round(Math.abs(diffSec) / 60)} minutes`;
      if (diffSec > 0 && diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
      }
      if (diffSec > 0 && diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }
      if (diffSec > 0 && diffSec < 172800) return 'yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [checklistAssigneeSearch, setChecklistAssigneeSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberFilterText, setMemberFilterText] = useState('');
  const [memberFeedback, setMemberFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    loadTask();
    loadPortalUsers();
  }, [taskId]);

  const loadPortalUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setPortalUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load portal users', err);
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
      return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
    } catch {
      return 'recently';
    }
  };

  const loadTask = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.task);
      setTitleText(data.task.title || '');

      let rawDesc = data.task.description || '';
      const tmplActive = Boolean(data.task.is_template || rawDesc.includes('<!--is_template:true-->'));
      setIsTemplate(tmplActive);
      rawDesc = rawDesc.replace(/<!--is_template:true-->/g, '').trim();

      let parsedFields: CustomFieldsData = {};
      let parsedLoc: string | null = null;
      let fieldsActive = false;

      const cfMatch = rawDesc.match(/<!--custom_fields:([\s\S]*?)-->/);
      if (cfMatch && cfMatch[1]) {
        try {
          const parsed = JSON.parse(cfMatch[1]);
          if (parsed && typeof parsed === 'object') {
            parsedFields = parsed;
            fieldsActive = Object.keys(parsed).some(k => !COVER_KEYS.includes(k) && k !== '_definitions');
          }
        } catch {}
        rawDesc = rawDesc.replace(/<!--custom_fields:[\s\S]*?-->/g, '').trim();
      }

      const locMatch = rawDesc.match(/(?:📍 Location:\s*|<!--location:)([^<\n]+)(?:-->)?/);
      if (locMatch && locMatch[1]) {
        parsedLoc = locMatch[1].trim();
        rawDesc = rawDesc.replace(/(?:📍 Location:\s*|<!--location:)[^<\n]+(?:-->)?/g, '').trim();
      }

      setHasCustomFields(fieldsActive);
      setCustomFields(parsedFields);
      setLocation(parsedLoc);
      setDescText(rawDesc);
    } catch (err) {
      console.error('Failed to load task details', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTaskWithFields = async (
    newDesc: string, 
    fields: CustomFieldsData, 
    loc: string | null, 
    customFieldsActive?: boolean,
    templateActive?: boolean
  ) => {
    let cleanDesc = newDesc
      .replace(/<!--is_template:true-->/g, '')
      .replace(/<!--custom_fields:[\s\S]*?-->/g, '')
      .replace(/<!--location:[\s\S]*?-->/g, '')
      .trim();

    let combined = cleanDesc;

    const tmplState = templateActive !== undefined ? templateActive : isTemplate;
    if (tmplState) {
      combined = `<!--is_template:true-->\n\n${combined}`.trim();
    }

    const fieldsState = customFieldsActive !== undefined ? customFieldsActive : hasCustomFields;
    const savedFields = fieldsState
      ? fields
      : Object.fromEntries(Object.entries(fields).filter(([k, v]) => COVER_KEYS.includes(k) && v));
    if (Object.keys(savedFields).length > 0) {
      combined = `${combined}\n\n<!--custom_fields:${JSON.stringify(savedFields)}-->`;
    }

    if (loc) {
      combined = `${combined}\n<!--location:${loc}-->`;
    }

    const newPriority = fields.priority ? fields.priority.toLowerCase() : (task?.priority || 'medium');
    try {
      await api.put(`/tasks/${taskId}`, {
        description: combined,
        priority: newPriority
      });
      setDescText(cleanDesc);
      setCustomFields(fields);
      setLocation(loc);
      if (customFieldsActive !== undefined) setHasCustomFields(customFieldsActive);
      if (templateActive !== undefined) setIsTemplate(templateActive);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to save task fields', err);
    }
  };

  const handleCustomFieldsChange = async (newFields: CustomFieldsData) => {
    setCustomFields(newFields);
    await saveTaskWithFields(descText, newFields, location, true);
  };

  const handleRemoveCustomFields = async () => {
    setHasCustomFields(false);
    setCustomFields({});
    await saveTaskWithFields(descText, {}, location, false);
  };

  const handleSaveLocation = async (newLoc: string | null) => {
    setLocation(newLoc);
    await saveTaskWithFields(descText, customFields, newLoc);
    setShowLocationPicker(false);
  };

  const handleSaveDescription = async (newDesc: string) => {
    setDescText(newDesc);
    await saveTaskWithFields(newDesc, customFields, location);
  };

  const handleToggleCover = async (attachmentUrl: string) => {
    const isCover = (customFields.cover_image_url || task?.cover_image_url) === attachmentUrl;
    const newCover = isCover ? '' : attachmentUrl;
    const nextFields = { ...customFields, cover_image_url: newCover };
    setCustomFields(nextFields);
    await saveTaskWithFields(descText, nextFields, location);
  };

  const handleGenerateChecklistItems = async (checklistId: string) => {
    const cardTitle = task?.title || 'Task';
    const suggestions = [
      `Review requirements for ${cardTitle}`,
      'Verify functional behavior and edge cases',
      'Test user experience and responsive design',
      'Final QA check and sign-off'
    ];
    for (const itemTitle of suggestions) {
      try {
        await api.post(`/tasks/${taskId}/checklists/${checklistId}/items`, { title: itemTitle });
      } catch {}
    }
    await loadTask();
    onTaskUpdated?.();
  };

  const handleToggleTemplate = async () => {
    if (readOnly || !task) return;
    const nextTmpl = !isTemplate;
    setIsTemplate(nextTmpl);
    await saveTaskWithFields(descText, customFields, location, undefined, nextTmpl);
  };

  const handleCreateCardFromTemplate = async () => {
    if (!task) return;
    try {
      const { data } = await api.post('/tasks', {
        title: `${task.title} (Copy)`,
        boardId: task.board_id, 
        projectId: task.project_id,
        description: descText,
        priority: task.priority || 'medium',
        labels: task.labels ? (typeof task.labels === 'string' ? task.labels : task.labels.map((l: any) => l.name || l).join(',')) : ''
      });
      if (data?.task?.id) {
        setAutomationToast(`✓ Created card from template!`);
        setTimeout(() => setAutomationToast(null), 3000);
        onTaskUpdated?.();
      }
    } catch (err) {
      console.error('Failed to create card from template', err);
    }
  };

  const handleSelectCover = async (coverUrl: string, bgColor?: string) => {
    const nextFields = { ...customFields, cover_image_url: coverUrl, cover_bg_color: bgColor };
    setCustomFields(nextFields);
    await saveTaskWithFields(descText, nextFields, location);
    setShowCoverPopover(false);
  };

  const handleRemoveCover = async () => {
    const nextFields = { ...customFields, cover_image_url: '', cover_bg_color: '' };
    setCustomFields(nextFields);
    await saveTaskWithFields(descText, nextFields, location);
    setShowCoverPopover(false);
  };

  if (!taskId) return null;

  // Global Paste Handler for Images
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (readOnly) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await uploadFile(file);
          break;
        }
      }
    }
  };

  const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const uploadFile = async (file: File): Promise<any | null> => {
    if (readOnly) return null;
    setIsUploadingAttachment(true);
    setUploadError(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const { data } = await api.post(`/tasks/${taskId}/attachments`, {
        fileName: file.name || `Pasted_Image_${Date.now()}.png`,
        fileType: file.type || 'image/png',
        dataUrl
      });
      setTask((prev: any) => ({
        ...prev,
        attachments: [data.attachment, ...(prev.attachments || [])]
      }));
      onTaskUpdated?.();
      return data.attachment;
    } catch (err: any) {
      console.error('Failed to upload file', err);
      setUploadError(err?.response?.status === 413 ? 'File is too large to upload.' : 'Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      uploadFile(files[0]);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (readOnly) return;
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      setTask((prev: any) => ({
        ...prev,
        attachments: (prev.attachments || []).filter((a: any) => a.id !== attachmentId)
      }));
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to delete attachment', err);
    }
  };

  // Delete card handler
  const handleDeleteTask = async () => {
    if (readOnly) return;
    try {
      setIsDeleting(true);
      await api.delete(`/tasks/${taskId}`);
      setShowDeleteConfirm(false);
      onTaskUpdated?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete card', err);
      alert('Failed to delete card. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle member assignment
  const handleToggleMember = async (userId: string, userName?: string) => {
    if (readOnly || !task) return;
    const currentAssigneeIds = (task.assignees || []).map((a: any) => a.id);
    const isAdding = !currentAssigneeIds.includes(userId);
    let nextIds: string[];
    if (isAdding) {
      nextIds = [...currentAssigneeIds, userId];
    } else {
      nextIds = currentAssigneeIds.filter((id: string) => id !== userId);
    }
    try {
      await api.put(`/tasks/${taskId}`, { assigneeIds: nextIds });
      await loadTask();
      onTaskUpdated?.();
      if (isAdding) {
        setMemberFeedback(`Assigned to ${userName || 'member'} & notification sent!`);
        setTimeout(() => setMemberFeedback(null), 3500);
        triggerBoardRulesForEvent(
          'MEMBER_ADDED',
          { card: task },
          columns
        ).then(reports => {
          if (reports && reports.length > 0) {
            loadTask();
            onTaskUpdated?.();
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to toggle assignee', err);
    }
  };

  // Save Card Title
  const handleSaveTitle = async () => {
    if (readOnly || !titleText.trim() || titleText === task.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await api.put(`/tasks/${taskId}`, { title: titleText });
      setTask({ ...task, title: titleText });
      setIsEditingTitle(false);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  // Labels Handlers
  const handleToggleLabel = async (lbl: { name: string; color?: string; bg?: string }) => {
    if (readOnly || !task) return;
    const currentLabels: any[] = task.labels || [];
    const targetColor = lbl.color || lbl.bg || '#579dff';
    const exists = currentLabels.some((l: any) => {
      if (lbl.name && l.name) {
        return l.name.toLowerCase() === lbl.name.toLowerCase();
      }
      return (l.color || '').toLowerCase() === targetColor.toLowerCase();
    });

    let nextLabels: any[];
    if (exists) {
      nextLabels = currentLabels.filter((l: any) => {
        if (lbl.name && l.name) {
          return l.name.toLowerCase() !== lbl.name.toLowerCase();
        }
        return (l.color || '').toLowerCase() !== targetColor.toLowerCase();
      });
    } else {
      nextLabels = [...currentLabels, { name: lbl.name, color: targetColor }];
    }

    try {
      await api.put(`/tasks/${taskId}`, { labels: nextLabels });
      setTask({ ...task, labels: nextLabels });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to update labels', err);
    }
  };

  const handleCreateLabel = async (newLbl: { name: string; color: string }) => {
    if (readOnly || !task) return;
    const currentLabels: any[] = task.labels || [];
    const nextLabels = [...currentLabels, { name: newLbl.name, color: newLbl.color }];
    try {
      await api.put(`/tasks/${taskId}`, { labels: nextLabels });
      setTask({ ...task, labels: nextLabels });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to create label', err);
    }
  };

  const handleUpdateLabel = async (oldLbl: { name: string; color: string }, newLbl: { name: string; color: string }) => {
    if (readOnly || !task) return;
    const currentLabels: any[] = task.labels || [];
    const nextLabels = currentLabels.map((l: any) => {
      if ((oldLbl.name && l.name === oldLbl.name) || (l.color || '').toLowerCase() === (oldLbl.color || '').toLowerCase()) {
        return { name: newLbl.name, color: newLbl.color };
      }
      return l;
    });
    try {
      await api.put(`/tasks/${taskId}`, { labels: nextLabels });
      setTask({ ...task, labels: nextLabels });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to update label', err);
    }
  };

  const handleDeleteLabel = async (lbl: { name: string; color: string }) => {
    if (readOnly || !task) return;
    const currentLabels: any[] = task.labels || [];
    const nextLabels = currentLabels.filter((l: any) => {
      if (lbl.name && l.name) {
        return l.name.toLowerCase() !== lbl.name.toLowerCase();
      }
      return (l.color || '').toLowerCase() !== (lbl.color || '').toLowerCase();
    });
    try {
      await api.put(`/tasks/${taskId}`, { labels: nextLabels });
      setTask({ ...task, labels: nextLabels });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to delete label', err);
    }
  };

  const handleMoveColumn = async (newColId: string) => {
    if (readOnly) return;
    try {
      await api.patch(`/tasks/${taskId}/move`, { columnId: newColId, position: 0 });
      const targetCol = columns.find(c => c.id === newColId);
      setTask({ ...task, column_id: newColId, column_name: targetCol?.name });
      setShowColumnDropdown(false);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newComment.trim()) return;
    try {
      setIsSubmittingComment(true);
      const { data } = await api.post(`/tasks/${taskId}/comments`, { body: newComment });
      setTask({
        ...task,
        comments: [data.comment, ...(task.comments || [])]
      });
      setNewComment('');
      await loadTask();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Checklist Actions
  const handleAddChecklist = async (titleOrEvent: React.FormEvent | string, copyFromItems?: string[]) => {
    if (typeof titleOrEvent !== 'string') {
      titleOrEvent.preventDefault();
    }
    const finalTitle = typeof titleOrEvent === 'string' ? titleOrEvent : checklistTitle;
    if (readOnly || !finalTitle || !finalTitle.trim()) return;

    try {
      const { data } = await api.post(`/tasks/${taskId}/checklists`, { title: finalTitle.trim() });
      const newChecklist = data.checklist;

      if (copyFromItems && copyFromItems.length > 0) {
        for (const itemTitle of copyFromItems) {
          if (itemTitle && itemTitle.trim()) {
            await api.post(`/tasks/${taskId}/checklists/${newChecklist.id}/items`, { title: itemTitle.trim() });
          }
        }
      }

      setIsAddingChecklist(false);
      setShowChecklistPopover(false);
      setChecklistTitle('Checklist');
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (readOnly) return;
    try {
      await api.delete(`/tasks/${taskId}/checklists/${checklistId}`);
      setTask({
        ...task,
        checklists: (task.checklists || []).filter((c: any) => c.id !== checklistId)
      });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    if (readOnly) return;
    const rawText = newItemText[checklistId];
    if (!rawText || !rawText.trim()) return;

    let fullTitle = rawText.trim();
    const assignedUser = checklistItemAssignee[checklistId];
    const dueDate = checklistItemDueDate[checklistId];

    if (assignedUser) {
      fullTitle += ` @${assignedUser.username || assignedUser.name}`;
    }
    if (dueDate) {
      fullTitle += ` ⏰ ${dueDate}`;
    }

    try {
      const { data } = await api.post(`/tasks/${taskId}/checklists/${checklistId}/items`, { title: fullTitle });
      setTask({
        ...task,
        checklists: (task.checklists || []).map((c: any) => {
          if (c.id === checklistId) {
            return { ...c, items: [...(c.items || []), data.item] };
          }
          return c;
        })
      });
      setNewItemText({ ...newItemText, [checklistId]: '' });
      setChecklistItemAssignee({ ...checklistItemAssignee, [checklistId]: null });
      setChecklistItemDueDate({ ...checklistItemDueDate, [checklistId]: '' });
      setAddingItemFor(null);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, currentCompleted: boolean) => {
    if (readOnly) return;
    const nextCompleted = !currentCompleted;
    try {
      await api.patch(`/tasks/${taskId}/checklists/items/${itemId}`, { completed: nextCompleted });
      setTask({
        ...task,
        checklists: (task.checklists || []).map((c: any) => {
          if (c.id === checklistId) {
            return {
              ...c,
              items: (c.items || []).map((i: any) => i.id === itemId ? { ...i, completed: nextCompleted } : i)
            };
          }
          return c;
        })
      });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklistItem = async (checklistId: string, itemId: string) => {
    if (readOnly) return;
    try {
      await api.delete(`/tasks/${taskId}/checklists/items/${itemId}`);
      setTask({
        ...task,
        checklists: (task.checklists || []).map((c: any) => {
          if (c.id === checklistId) {
            return { ...c, items: (c.items || []).filter((i: any) => i.id !== itemId) };
          }
          return c;
        })
      });
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDates = async (dates: {
    startDate: string | null;
    dueDate: string | null;
    dueTime: string | null;
    recurring: string | null;
    reminder: string | null;
  }) => {
    if (readOnly) return;
    try {
      await api.put(`/tasks/${taskId}`, {
        startDate: dates.startDate,
        dueDate: dates.dueDate,
        dueTime: dates.dueTime,
        recurring: dates.recurring,
        dueReminder: dates.reminder,
      });
      setShowDatePicker(false);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to save dates:', err);
    }
  };

  const handleRemoveDates = async () => {
    if (readOnly) return;
    try {
      await api.put(`/tasks/${taskId}`, {
        startDate: null,
        dueDate: null,
        dueTime: null,
        recurring: null,
        dueReminder: null,
      });
      setShowDatePicker(false);
      await loadTask();
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to remove dates:', err);
    }
  };

  // Formatter for description / comments with @mentions, URLs, and emails
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const tokenRegex = /(@[A-Za-z0-9_.\-]+|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(?:https?:\/\/[^\s]+))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('@')) {
        return (
          <span 
            key={i} 
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200 mx-0.5"
          >
            <AtSign size={11} className="text-blue-600" />
            <span>{part.slice(1)}</span>
          </span>
        );
      }
      if (part.includes('@') && !part.startsWith('http')) {
        return (
          <a key={i} href={`mailto:${part}`} className="text-blue-600 font-medium hover:underline underline-offset-2">
            {part}
          </a>
        );
      }
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline underline-offset-2 inline-flex items-center gap-1">
            {part} <ExternalLink size={12} />
          </a>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const currentCol = columns.find(c => c.id === task?.column_id) || { name: task?.column_name || 'In List', color: '#0052cc' };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
      onClick={onClose}
      onPaste={handlePaste}
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        onClick={e => e.stopPropagation()}
        className="hidden" 
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.zip"
      />

      <div 
        className="bg-white text-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto sm:my-6 transition-all animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="py-24 px-8 text-center flex flex-col items-center justify-center">
            <LoadingSpinner 
              size="lg" 
              label="Loading card details..." 
              sublabel="Fetching task content, checklists and activity" 
            />
          </div>
        ) : (
          <>
            {/* Top Cover Banner (Full Size Cover Banner) */}
            {(customFields.cover_image_url || task.cover_image_url || customFields.cover_bg_color) ? (
              <div 
                className="relative w-full h-44 sm:h-52 overflow-hidden shrink-0 select-none bg-gray-900"
                style={{ backgroundColor: customFields.cover_bg_color || '#0052cc' }}
              >
                {(customFields.cover_image_url || task.cover_image_url) && (
                  <img 
                    src={getAttachmentUrl(customFields.cover_image_url || task.cover_image_url)} 
                    alt="Card cover" 
                    className="w-full h-full object-cover object-center transition-all"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (!el.dataset.fallbackTried) {
                        el.dataset.fallbackTried = '1';
                        if (el.src.includes('/Workboard/TodoList/uploads/')) {
                          el.src = el.src.replace('/Workboard/TodoList/uploads/', '/uploads/');
                        } else if (el.src.includes('/uploads/')) {
                          el.src = el.src.replace('/uploads/', '/Workboard/TodoList/uploads/');
                        }
                      }
                    }}
                  />
                )}
                
                {/* Top-left List Pill over cover */}
                <div className="absolute top-3 left-4 z-20">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shadow-sm backdrop-blur-xs"
                      style={{
                        backgroundColor: '#fef08a',
                        color: '#713f12'
                      }}
                    >
                      <span>{currentCol.name}</span>
                      <ChevronDown size={13} className="text-[#854d0e]" />
                    </button>

                    {showColumnDropdown && (
                      <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Move to List</div>
                        {columns.map(col => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => handleMoveColumn(col.id)}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${col.id === task.column_id ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color || '#0052cc' }}></span>
                              {col.name}
                            </span>
                            {col.id === task.column_id && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top-right Action Icons over cover: [ImageIcon] [...] [X] */}
                <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setShowCoverPopover(!showCoverPopover)}
                    className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-colors cursor-pointer shadow-sm"
                    title="Change card cover"
                  >
                    <ImageIcon size={15} />
                  </button>

                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-colors cursor-pointer shadow-sm"
                      title="More actions"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); handleToggleTemplate(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Layers size={14} className="text-blue-600" />
                          <span>{isTemplate ? 'Turn off Template' : 'Make this card a template'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); handleCreateCardFromTemplate(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy size={14} className="text-gray-600" />
                          <span>Create card from template</span>
                        </button>
                        <div className="my-1 border-t border-gray-100"></div>
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete card</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={onClose} 
                    className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-colors cursor-pointer shadow-sm" 
                    title="Close card"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* Clean Top Header when NO Cover (Matching Screenshot 2) */
              <div className="px-6 py-3.5 flex items-center justify-between border-b border-gray-100 bg-white shrink-0 select-none">
                {/* Left Column Pill */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    style={{
                      backgroundColor: currentCol.name.toLowerCase().includes('doing') || currentCol.name.toLowerCase().includes('in progress')
                        ? '#dcfce7' 
                        : currentCol.name.toLowerCase().includes('to-do') || currentCol.name.toLowerCase().includes('to do')
                        ? '#fef08a'
                        : '#f3f4f6',
                      color: currentCol.name.toLowerCase().includes('doing') || currentCol.name.toLowerCase().includes('in progress')
                        ? '#166534'
                        : currentCol.name.toLowerCase().includes('to-do') || currentCol.name.toLowerCase().includes('to do')
                        ? '#713f12'
                        : '#1f2937'
                    }}
                  >
                    <span>{currentCol.name}</span>
                    <ChevronDown size={13} className="opacity-80" />
                  </button>

                  {showColumnDropdown && (
                    <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Move to List</div>
                      {columns.map(col => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleMoveColumn(col.id)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${col.id === task.column_id ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color || '#0052cc' }}></span>
                            {col.name}
                          </span>
                          {col.id === task.column_id && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Icons: [ImageIcon] [...] [X] (Matching Screenshot 2) */}
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setShowCoverPopover(!showCoverPopover)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Change card cover"
                  >
                    <ImageIcon size={16} />
                  </button>

                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="More actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); handleToggleTemplate(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Layers size={14} className="text-blue-600" />
                          <span>{isTemplate ? 'Turn off Template' : 'Make this card a template'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); handleCreateCardFromTemplate(); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy size={14} className="text-gray-600" />
                          <span>Create card from template</span>
                        </button>
                        <div className="my-1 border-t border-gray-100"></div>
                        <button
                          type="button"
                          onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete card</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={onClose} 
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer" 
                    title="Close card"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Cover Popover */}
            {showCoverPopover && (
              <div className="absolute right-12 top-14 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
                  <span className="text-xs font-bold text-gray-800">Card Cover</span>
                  <button onClick={() => setShowCoverPopover(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={14} />
                  </button>
                </div>
                
                {/* Upload Custom Cover */}
                <div className="mb-3">
                  <label className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-gray-200 shadow-2xs">
                    <Paperclip size={13} className="text-gray-600" />
                    <span>Upload cover image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        const attachment = await uploadFile(file);
                        if (attachment?.url) {
                          await handleSelectCover(attachment.url, '#18181b');
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preset Photos</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PRESET_COVERS.map((cov, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSelectCover(cov.url, cov.bgColor)}
                      className="h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 cursor-pointer relative group shadow-2xs"
                      title={cov.name}
                    >
                      <img src={cov.url} alt={cov.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded truncate max-w-[90%]">
                        {cov.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preset Colors</div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {['#0052cc', '#16a34a', '#ea580c', '#dc2626', '#7c3aed', '#ec4899', '#0891b2', '#4b5563'].map((clr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCover('', clr)}
                      style={{ backgroundColor: clr }}
                      className="h-7 rounded-md cursor-pointer hover:opacity-85 transition-opacity"
                    />
                  ))}
                </div>

                {(customFields.cover_image_url || task.cover_image_url) && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="w-full py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 cursor-pointer"
                  >
                    Remove Cover
                  </button>
                )}
              </div>
            )}

            {/* Template Card Banner (Matching Screenshot 3) */}
            {isTemplate && (
              <div className="bg-[#f4f8fd] border-b border-[#d0e4ff] px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 select-none">
                <div className="flex items-center gap-3">
                  {/* Trello template card icon matching screenshot 3 */}
                  <div className="w-9 h-6 rounded-md border-2 border-dashed border-[#0055cc] bg-white shadow-2xs flex flex-col justify-between p-1 shrink-0">
                    <div className="w-full h-1 bg-[#0055cc]/50 rounded-xs"></div>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-1 bg-[#0055cc]/30 rounded-xs"></div>
                      <div className="w-3.5 h-1 bg-[#0055cc]/30 rounded-xs"></div>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 text-sm tracking-tight">This is a Template card.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCreateCardFromTemplate}
                  className="bg-[#0055cc] hover:bg-[#0047b3] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Layers size={14} />
                  <span>Create card from template</span>
                </button>
              </div>
            )}

            {/* Modal Body: Two Columns */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 overflow-y-auto flex-1">
              
              {/* Left Column (Main Card Details) */}
              <div className="md:col-span-7 flex flex-col gap-6">
                
                {/* Title Section matching Screenshot 2 & 3 */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-700">
                    {isTemplate ? (
                      <Layout size={20} className="text-gray-800" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-1 cursor-pointer hover:border-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    {!readOnly && isEditingTitle ? (
                      <div className="flex flex-col gap-2 p-2 bg-blue-50/30 rounded-xl border-2 border-blue-500 shadow-xs">
                        <textarea
                          autoFocus
                          value={titleText}
                          onChange={e => setTitleText(e.target.value)}
                          onBlur={handleSaveTitle}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveTitle();
                            } else if (e.key === 'Escape') {
                              setTitleText(task.title);
                              setIsEditingTitle(false);
                            }
                          }}
                          className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 font-bold text-xl focus:outline-none focus:border-blue-600 resize-none shadow-xs"
                          rows={1}
                          placeholder="Card title..."
                        />
                      </div>
                    ) : (
                      <h2 
                        onClick={() => { if (!readOnly) setIsEditingTitle(true); }}
                        className={`text-xl font-bold text-gray-900 tracking-tight leading-snug ${!readOnly ? 'cursor-pointer hover:bg-gray-100/70 p-1 -m-1 rounded-md transition-colors' : ''}`}
                        title={!readOnly ? "Click to edit card title" : undefined}
                      >
                        {task.title}
                      </h2>
                    )}
                  </div>
                </div>

                {/* Quick Action Pills Row (Hidden in Read-Only Mode) */}
                {!readOnly && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add to Card Button with Anchor Popover */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowAddToCard(!showAddToCard);
                          setShowDatePicker(false);
                          setShowLabelPicker(false);
                          setShowChecklistPopover(false);
                          setShowMemberDropdown(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-xs ${showAddToCard ? 'bg-[#091e42] text-white' : 'bg-[#172b4d] hover:bg-[#091e42] text-white'}`}
                      >
                        <Plus size={14} className="text-white" /> Add
                      </button>

                      {showAddToCard && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowAddToCard(false)} 
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-50">
                            <AddToCardPopover
                              onSelectLabels={() => {
                                setShowAddToCard(false);
                                setShowLabelPicker(true);
                              }}
                              onSelectDates={() => {
                                setShowAddToCard(false);
                                setShowDatePicker(true);
                              }}
                              onSelectChecklist={() => {
                                setShowAddToCard(false);
                                setShowChecklistPopover(true);
                              }}
                              onSelectMembers={() => {
                                setShowAddToCard(false);
                                setShowMemberDropdown(true);
                              }}
                              onSelectAttachment={() => {
                                setShowAddToCard(false);
                                fileInputRef.current?.click();
                              }}
                              onSelectLocation={() => {
                                setShowAddToCard(false);
                                setShowLocationPicker(true);
                              }}
                              onSelectCustomFields={async () => {
                                setShowAddToCard(false);
                                setHasCustomFields(true);
                                const initial = Object.keys(customFields).length > 0 ? customFields : {
                                  priority: 'Medium',
                                  status: 'To Do',
                                  risk: 'Low',
                                  effort: ''
                                };
                                setCustomFields(initial);
                                await saveTaskWithFields(descText, initial, location, true);
                                setTimeout(() => {
                                  document.getElementById('custom-fields-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              onSelectTemplate={() => {
                                setShowAddToCard(false);
                                handleToggleTemplate();
                              }}
                              isTemplate={isTemplate}
                              onClose={() => setShowAddToCard(false)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Labels Button with Anchor Popover */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowLabelPicker(!showLabelPicker);
                          setShowDatePicker(false);
                          setShowAddToCard(false);
                          setShowChecklistPopover(false);
                          setShowMemberDropdown(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${showLabelPicker ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        <Tag size={14} className="text-gray-700" /> Labels
                      </button>

                      {showLabelPicker && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowLabelPicker(false)} 
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-50">
                            <LabelsPopover
                              cardLabels={task.labels || []}
                              onToggleLabel={handleToggleLabel}
                              onCreateLabel={handleCreateLabel}
                              onUpdateLabel={handleUpdateLabel}
                              onDeleteLabel={handleDeleteLabel}
                              onClose={() => setShowLabelPicker(false)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Dates Button with Anchor Popover */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowDatePicker(!showDatePicker);
                          setShowLabelPicker(false);
                          setShowAddToCard(false);
                          setShowChecklistPopover(false);
                          setShowMemberDropdown(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${showDatePicker ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        <Clock size={14} className="text-gray-700" /> Dates
                      </button>

                      {showDatePicker && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowDatePicker(false)} 
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-50">
                            <DatePickerPopover
                              initialStartDate={task.start_date}
                              initialDueDate={task.due_date}
                              initialDueTime={task.due_time}
                              initialRecurring={task.recurring}
                              initialReminder={task.due_reminder}
                              onSave={handleSaveDates}
                              onRemove={handleRemoveDates}
                              onClose={() => setShowDatePicker(false)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Checklist Button with Anchor Popover */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowChecklistPopover(!showChecklistPopover);
                          setShowDatePicker(false);
                          setShowLabelPicker(false);
                          setShowAddToCard(false);
                          setShowMemberDropdown(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${showChecklistPopover ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        <CheckSquare size={14} className="text-gray-700" /> Checklist
                      </button>

                      {showChecklistPopover && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowChecklistPopover(false)} 
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-50">
                            <ChecklistPopover
                              cardTitle={task.title}
                              existingChecklists={task.checklists || []}
                              onAddChecklist={(title, copyItems) => handleAddChecklist(title, copyItems)}
                              onClose={() => setShowChecklistPopover(false)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setShowMemberDropdown(!showMemberDropdown);
                        setShowDatePicker(false);
                        setShowLabelPicker(false);
                        setShowAddToCard(false);
                        setShowChecklistPopover(false);
                      }}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                    >
                      <User size={14} className="text-gray-700" /> Members
                    </button>

                    {/* Location Popover Button */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowLocationPicker(!showLocationPicker);
                          setShowDatePicker(false);
                          setShowLabelPicker(false);
                          setShowAddToCard(false);
                          setShowChecklistPopover(false);
                          setShowMemberDropdown(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${showLocationPicker || location ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        <MapPin size={14} className={location ? "text-emerald-600" : "text-gray-700"} /> 
                        <span>Location</span>
                      </button>

                      {showLocationPicker && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowLocationPicker(false)} 
                          />
                          <div className="absolute left-0 top-full mt-1.5 z-50">
                            <LocationPopover
                              currentLocation={location}
                              onSaveLocation={handleSaveLocation}
                              onClose={() => setShowLocationPicker(false)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Paperclip size={14} className="text-gray-700" /> 
                      <span>{isUploadingAttachment ? 'Uploading...' : 'Attachment'}</span>
                    </button>
                  </div>
                )}

                {/* Card Automation Action Buttons Row */}
                {automationButtons.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {automationButtons.map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleExecuteAutomation(btn)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-gray-700 border border-gray-200 transition-all cursor-pointer shadow-2xs group"
                        title={`Run card button: ${btn.title}`}
                      >
                        <span className="flex items-center">
                          {btn.icon === 'User' ? <User size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'CheckCircle2' ? <CheckCircle2 size={13} className="text-emerald-600" /> :
                           btn.icon === 'MessageSquare' ? <MessageSquare size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'Sparkles' ? <Sparkles size={13} className="text-amber-500" /> :
                           btn.icon === 'Zap' ? <Zap size={13} className="text-amber-500 fill-amber-500" /> :
                           btn.icon === 'Calendar' ? <Calendar size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'Settings' ? <Settings size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'move' ? <ArrowRight size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'copy' ? <Copy size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'label' ? <Tag size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'join' ? <User size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'date' ? <Clock size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'mark' ? <Settings size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'remove' ? <Minus size={13} className="text-[#0c66e4]" /> :
                           btn.icon === 'sort' ? <ArrowUpDown size={13} className="text-[#0c66e4]" /> :
                           <span className="text-sm">{btn.icon}</span>}
                        </span>
                        <span>{btn.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Labels Badge Row */}
                {task.labels && task.labels.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Labels</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.labels.map((lbl: any, idx: number) => {
                        const lName = typeof lbl === 'string' ? lbl : lbl.name;
                        const lColor = typeof lbl === 'object' && lbl.color ? lbl.color : '#0052cc';
                        return (
                          <div 
                            key={idx} 
                            style={{ backgroundColor: lColor }}
                            className="px-2.5 py-1 rounded-md text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>{lName}</span>
                            {!readOnly && (
                              <button 
                                type="button" 
                                onClick={() => handleToggleLabel({ name: lName, color: lColor })}
                                className="hover:opacity-75 p-0.5 rounded-full cursor-pointer"
                                title="Remove label"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dates Display Row (Start Date, Due Date, Recurring, Reminder) */}
                {(task.start_date || task.due_date) && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Dates</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.start_date && (
                        <div 
                          onClick={() => !readOnly && setShowDatePicker(true)}
                          className={`inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-lg text-xs text-gray-800 font-semibold transition-colors ${!readOnly ? 'cursor-pointer' : ''}`}
                          title="Start date (click to edit)"
                        >
                          <span className="text-[10px] uppercase font-bold text-gray-400">Start:</span>
                          <span>{new Date(task.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}

                      {task.due_date && (
                        <div 
                          onClick={() => !readOnly && setShowDatePicker(true)}
                          className={`inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-900 font-semibold transition-colors ${!readOnly ? 'cursor-pointer' : ''}`}
                          title="Due date (click to edit)"
                        >
                          <Clock size={14} className="text-blue-600" />
                          <span>
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {task.due_time ? ` at ${task.due_time}` : ''}
                          </span>
                        </div>
                      )}

                      {task.recurring && task.recurring !== 'Never' && (
                        <div 
                          onClick={() => !readOnly && setShowDatePicker(true)}
                          className={`inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg text-xs text-purple-700 font-semibold transition-colors ${!readOnly ? 'cursor-pointer' : ''}`}
                          title="Recurring schedule (click to edit)"
                        >
                          <RotateCcw size={13} className="text-purple-600" />
                          <span>{task.recurring}</span>
                        </div>
                      )}

                      {task.due_reminder && task.due_reminder !== 'None' && (
                        <div 
                          onClick={() => !readOnly && setShowDatePicker(true)}
                          className={`inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs text-amber-800 font-semibold transition-colors ${!readOnly ? 'cursor-pointer' : ''}`}
                          title="Reminder setting (click to edit)"
                        >
                          <Bell size={13} className="text-amber-600" />
                          <span>{task.due_reminder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Display Row */}
                {location && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Location</div>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-900 font-semibold transition-colors">
                      <MapPin size={14} className="text-emerald-600" />
                      <span>{location}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-700 hover:text-emerald-900 ml-1 inline-flex items-center gap-0.5"
                        title="Open in Google Maps"
                      >
                        <ExternalLink size={12} />
                      </a>
                      {!readOnly && (
                        <button 
                          type="button" 
                          onClick={() => handleSaveLocation(null)} 
                          className="hover:text-red-600 ml-1 cursor-pointer"
                          title="Remove location"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Members Section */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Members</div>
                    {memberFeedback && (
                      <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-in fade-in">
                        ✓ {memberFeedback}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {(task.assignees || []).map((a: any) => (
                      <div 
                        key={a.id} 
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs hover:bg-blue-100 transition-colors"
                        title={`${a.name} (${a.email || ''})`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] uppercase">
                          {(a.name || 'U').charAt(0)}
                        </div>
                        <span>{a.name}</span>
                        {!readOnly && (
                          <button 
                            type="button" 
                            onClick={() => handleToggleMember(a.id, a.name)}
                            className="hover:text-red-600 p-0.5 rounded-full cursor-pointer"
                            title="Remove member from card"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {!readOnly && (
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                          className="h-7 px-3 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus size={14} /> Assign Member
                        </button>

                        {showMemberDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setShowMemberDropdown(false)} 
                            />
                            <div className="absolute left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95">
                              <div className="px-3 pb-2 border-b border-gray-100">
                                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assign Portal Member</div>
                                <input 
                                  type="text" 
                                  placeholder="Search name, username, emp code, department..." 
                                  value={memberFilterText}
                                  onChange={e => setMemberFilterText(e.target.value)}
                                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="max-h-56 overflow-y-auto pt-1">
                                {filterMembers(portalUsers, memberFilterText)
                                  .map(u => {
                                    const isAssigned = (task.assignees || []).some((a: any) => a.id === u.id);
                                    return (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleToggleMember(u.id, u.name)}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${isAssigned ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-gray-700'}`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] uppercase shrink-0">
                                            {(u.name || 'U').charAt(0)}
                                          </div>
                                          <div className="truncate">
                                            <div className="truncate font-medium">{u.name}</div>
                                            <div className="text-[10px] text-gray-400 truncate">{memberSubtitle(u)}</div>
                                          </div>
                                        </div>
                                        {isAssigned ? (
                                          <Check size={16} className="text-blue-600 shrink-0" />
                                        ) : (
                                          <span className="text-[10px] text-gray-400 shrink-0">+ Assign</span>
                                        )}
                                      </button>
                                    );
                                  })}
                              </div>
                              <div className="p-2 border-t border-gray-100 text-[10px] text-gray-400 bg-gray-50/50 text-center">
                                Assigning a member sends notification to their inbox.
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Section with Rich Formatting Toolbar & Unsaved Changes Warning */}
                <div className="flex flex-col gap-2">
                  <DescriptionEditor
                    initialValue={descText}
                    portalUsers={portalUsers}
                    onSave={handleSaveDescription}
                    onCancel={() => {}}
                    readOnly={readOnly}
                  />
                </div>

                {/* Custom Fields Section (only shown if added to this card!) */}
                {hasCustomFields && (
                  <div id="custom-fields-section">
                    <CustomFieldsSection
                      data={customFields}
                      onChange={handleCustomFieldsChange}
                      onRemoveAll={handleRemoveCustomFields}
                      readOnly={readOnly}
                    />
                  </div>
                )}

                {/* Attachments Section */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                      <Paperclip size={16} className="text-gray-600" />
                      <span>Attachments</span>
                    </div>
                    {!readOnly && (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded-md shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {uploadError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200 flex items-center gap-1">
                      <AlertCircle size={13} /> {uploadError}
                    </div>
                  )}

                  {isUploadingAttachment && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 font-medium p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl">
                      <LoadingSpinner size="xs" />
                      <span>Uploading attachment...</span>
                    </div>
                  )}

                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Files</div>
                      <div className="flex flex-col gap-2">
                        {task.attachments.map((att: any) => {
                          const isImg = att.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || '');
                          const isCover = (customFields.cover_image_url || task.cover_image_url) === att.url;
                          const timeAgo = att.created_at ? formatTimeAgo(att.created_at) : 'recently';

                          return (
                            <div 
                              key={att.id} 
                              className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs group hover:border-gray-300 transition-colors"
                            >
                              {isImg ? (
                                <a 
                                  href={getAttachmentUrl(att.url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer"
                                >
                                  <img 
                                    src={getAttachmentUrl(att.url)} 
                                    alt={att.file_name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                    onError={(e) => {
                                      const el = e.currentTarget;
                                      if (!el.dataset.fallbackTried) {
                                        el.dataset.fallbackTried = '1';
                                        if (el.src.includes('/Workboard/TodoList/uploads/')) {
                                          el.src = el.src.replace('/Workboard/TodoList/uploads/', '/uploads/');
                                        } else if (el.src.includes('/uploads/')) {
                                          el.src = el.src.replace('/uploads/', '/Workboard/TodoList/uploads/');
                                        }
                                      }
                                    }}
                                  />
                                </a>
                              ) : (
                                <div className="shrink-0 w-16 h-12 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                  <FileText size={22} />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <a 
                                  href={getAttachmentUrl(att.url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs font-bold text-gray-800 truncate block hover:text-blue-600 cursor-pointer"
                                >
                                  {att.file_name}
                                </a>
                                <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>Added {timeAgo}</span>
                                  <span>•</span>
                                  {isImg && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCover(att.url)}
                                      className={`inline-flex items-center gap-1 text-[11px] font-medium hover:underline cursor-pointer ${isCover ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
                                    >
                                      <ImageIcon size={12} />
                                      <span>{isCover ? 'Cover' : 'Make cover'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 relative">
                                <a 
                                  href={getAttachmentUrl(att.url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100" 
                                  title="Open in new tab"
                                >
                                  <ExternalLink size={15} />
                                </a>

                                <div className="relative">
                                  <button 
                                    type="button" 
                                    onClick={() => setAttachmentMenuOpen(attachmentMenuOpen === att.id ? null : att.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                                    title="Attachment options"
                                  >
                                    <MoreHorizontal size={15} />
                                  </button>

                                  {attachmentMenuOpen === att.id && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setAttachmentMenuOpen(null)} />
                                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                                        {isImg && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleToggleCover(att.url);
                                              setAttachmentMenuOpen(null);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                                          >
                                            <ImageIcon size={13} />
                                            <span>{isCover ? 'Remove cover' : 'Make cover'}</span>
                                          </button>
                                        )}
                                        <a
                                          href={getAttachmentUrl(att.url)}
                                          download={att.file_name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => setAttachmentMenuOpen(null)}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                                        >
                                          <Download size={13} />
                                          <span>Download</span>
                                        </a>
                                        {!readOnly && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeleteAttachment(att.id);
                                              setAttachmentMenuOpen(null);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer border-t border-gray-100"
                                          >
                                            <Trash2 size={13} />
                                            <span>Delete</span>
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Checklists Section */}
                {task.checklists && task.checklists.length > 0 && (
                  <div className="flex flex-col gap-6">
                    {task.checklists.map((checklist: any) => {
                      const total = checklist.items?.length || 0;
                      const completedCount = checklist.items?.filter((i: any) => Boolean(i.completed)).length || 0;
                      const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                      return (
                        <div key={checklist.id} className="flex flex-col gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                          {/* Checklist Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                              <CheckSquare size={16} className="text-gray-700" />
                              <span>{checklist.title}</span>
                              <span className="text-xs text-gray-400 font-normal">({completedCount}/{total})</span>
                            </div>
                            {!readOnly && (
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => handleGenerateChecklistItems(checklist.id)}
                                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Sparkles size={13} className="text-purple-600" />
                                  <span>Generate checklist</span>
                                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">New</span>
                                </button>

                                <button 
                                  type="button"
                                  onClick={() => handleDeleteChecklist(checklist.id)}
                                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-2xs"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-gray-500 w-8">{percent}%</span>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="flex flex-col gap-2 mt-1">
                            {checklist.items?.map((item: any) => {
                              const isItemDone = Boolean(item.completed);
                              return (
                                <div key={item.id} className="flex items-center justify-between group px-2 py-1.5 hover:bg-white rounded-lg transition-colors">
                                  <label className={`flex items-center gap-3 flex-1 ${!readOnly ? 'cursor-pointer' : ''}`}>
                                    <input 
                                      type="checkbox" 
                                      disabled={readOnly}
                                      checked={isItemDone} 
                                      onChange={() => handleToggleChecklistItem(checklist.id, item.id, isItemDone)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className={`text-sm ${isItemDone ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                                      {renderFormattedText(item.title)}
                                    </span>
                                  </label>
                                  {!readOnly && (
                                    <button 
                                      type="button" 
                                      onClick={() => handleDeleteChecklistItem(checklist.id, item.id)}
                                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                      title="Delete item"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Item Form (Screenshot 4) */}
                          {!readOnly && (
                            addingItemFor === checklist.id ? (
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="relative">
                                  <textarea
                                    autoFocus
                                    rows={2}
                                    placeholder="Add an item"
                                    value={newItemText[checklist.id] || ''}
                                    onChange={e => setNewItemText({ ...newItemText, [checklist.id]: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddChecklistItem(checklist.id);
                                      }
                                    }}
                                    className="w-full bg-white border-2 border-[#0c66e4] rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none resize-none shadow-xs"
                                  />
                                </div>

                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      type="button" 
                                      onClick={() => handleAddChecklistItem(checklist.id)} 
                                      className="bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold px-4 py-1.5 rounded-md text-xs cursor-pointer shadow-xs transition-colors"
                                    >
                                      Add
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setAddingItemFor(null);
                                        setChecklistItemAssignee({ ...checklistItemAssignee, [checklist.id]: null });
                                        setChecklistItemDueDate({ ...checklistItemDueDate, [checklist.id]: '' });
                                      }} 
                                      className="hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Assign Member Button */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => setChecklistItemAssigneeMenu(checklistItemAssigneeMenu === checklist.id ? null : checklist.id)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                                          checklistItemAssignee[checklist.id]
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                                        }`}
                                      >
                                        <User size={13} />
                                        <span>{checklistItemAssignee[checklist.id] ? checklistItemAssignee[checklist.id].name : 'Assign'}</span>
                                      </button>

                                      {checklistItemAssigneeMenu === checklist.id && (
                                        <>
                                          <div className="fixed inset-0 z-30" onClick={() => setChecklistItemAssigneeMenu(null)} />
                                          <div className="absolute right-0 bottom-full mb-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-40 text-xs">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                              Assign checklist item
                                            </div>
                                            <div className="p-2 border-b border-gray-100">
                                              <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search members..."
                                                value={checklistAssigneeSearch}
                                                onChange={e => setChecklistAssigneeSearch(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-blue-500"
                                              />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto">
                                              {filterMembers(portalUsers, checklistAssigneeSearch).map(u => (
                                                <button
                                                  key={u.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setChecklistItemAssignee({ ...checklistItemAssignee, [checklist.id]: u });
                                                    setChecklistItemAssigneeMenu(null);
                                                  }}
                                                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-700 flex items-center justify-between cursor-pointer"
                                                >
                                                  <span>{u.name}</span>
                                                  {checklistItemAssignee[checklist.id]?.id === u.id && <Check size={13} className="text-blue-600" />}
                                                </button>
                                              ))}
                                            </div>
                                            {checklistItemAssignee[checklist.id] && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setChecklistItemAssignee({ ...checklistItemAssignee, [checklist.id]: null });
                                                  setChecklistItemAssigneeMenu(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 border-t border-gray-100 cursor-pointer"
                                              >
                                                Clear assignment
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Due Date Button */}
                                    <div className="relative">
                                      <input
                                        type="date"
                                        id={`due-date-${checklist.id}`}
                                        className="sr-only"
                                        onChange={e => setChecklistItemDueDate({ ...checklistItemDueDate, [checklist.id]: e.target.value })}
                                      />
                                      <label
                                        htmlFor={`due-date-${checklist.id}`}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                                          checklistItemDueDate[checklist.id]
                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                                        }`}
                                      >
                                        <Clock size={13} />
                                        <span>{checklistItemDueDate[checklist.id] || 'Due date'}</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => setAddingItemFor(checklist.id)}
                                className="self-start mt-1 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                              >
                                Add an item
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Checklist Modal Prompt */}
                {!readOnly && isAddingChecklist && (
                  <form onSubmit={handleAddChecklist} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2 animate-in fade-in">
                    <div className="text-xs font-bold text-gray-700">Add New Checklist</div>
                    <input 
                      type="text" 
                      autoFocus
                      value={checklistTitle} 
                      onChange={e => setChecklistTitle(e.target.value)}
                      placeholder="Checklist title (e.g., QA Steps, To Do)"
                      className="bg-white border border-gray-300 text-gray-900 text-xs px-3 py-2 rounded-md outline-none focus:border-blue-600"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-[#0052cc] text-white font-semibold px-3 py-1.5 rounded-md text-xs hover:bg-[#0065ff] cursor-pointer">Add Checklist</button>
                      <button type="button" onClick={() => setIsAddingChecklist(false)} className="text-gray-500 hover:text-gray-800 text-xs px-2 cursor-pointer">Cancel</button>
                    </div>
                  </form>
                )}

              </div>

              {/* Right Column: Comments & Comprehensive Activity Stream */}
              <div ref={commentsSectionRef} className="md:col-span-5 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-gray-200 md:pl-8 pt-6 md:pt-0">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                    <MessageSquare size={16} className="text-gray-500" />
                    <span>Comments and activity</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowActivityDetails(!showActivityDetails)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-transparent shadow-2xs"
                  >
                    {showActivityDetails ? 'Hide details' : 'Show details'}
                  </button>
                </div>

                {/* Write a Comment Box (Hidden in Read-Only Mode) */}
                {!readOnly && (
                  <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                    <div className="relative">
                      <textarea 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 resize-none transition-colors shadow-2xs"
                      />
                    </div>
                    {newComment.trim() && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button" 
                          onClick={() => setNewComment('')}
                          className="text-gray-500 hover:text-gray-800 px-3 py-1.5 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubmittingComment}
                          className="bg-[#0052cc] text-white font-semibold px-4 py-1.5 rounded-md text-xs hover:bg-[#0065ff] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingComment ? 'Saving...' : 'Save Comment'}
                        </button>
                      </div>
                    )}
                  </form>
                )}

                {/* Activity & Comment Timeline */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                  
                  {/* Real Comments */}
                  {task.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00875a] text-white font-bold flex items-center justify-center text-xs shrink-0 select-none shadow-2xs">
                        {(comment.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-gray-900">{comment.user_name || 'Team Member'}</span>
                          <a 
                            href="#" 
                            onClick={e => e.preventDefault()} 
                            className="text-[#0052cc] hover:underline text-[11px] font-medium cursor-pointer"
                          >
                            {formatRelativeTime(comment.created_at)}
                          </a>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed shadow-2xs">
                          {renderFormattedText(comment.body)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Real Activities Stream from Database */}
                  {showActivityDetails && (task.activities || []).map((act: any, actIdx: number) => (
                    <div key={act.id || actIdx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00875a] text-white font-bold flex items-center justify-center text-xs shrink-0 select-none shadow-2xs">
                        {(act.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-xs flex-1">
                        <div>
                          <span className="font-bold text-gray-900">{act.user_name || 'Member'}</span>{' '}
                          <span className="text-gray-700">{act.action}</span>
                        </div>
                        <a 
                          href="#" 
                          onClick={e => e.preventDefault()} 
                          className="text-[#0052cc] hover:underline text-[11px] mt-0.5 inline-block font-medium cursor-pointer"
                        >
                          {formatRelativeTime(act.created_at)}
                        </a>
                      </div>
                    </div>
                  ))}

                  {(!task.comments || task.comments.length === 0) && (!showActivityDetails || !task.activities || task.activities.length === 0) && (
                    <div className="p-4 text-center text-xs text-gray-400 italic">
                      {showActivityDetails ? 'No activity recorded on this card yet.' : 'No comments yet. Activity details are hidden.'}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </>
        )}
      </div>

      {/* Floating Pill Dock Bar: [Power-ups | Automations | Comments] (Matching Screenshot 2 & 3) */}
      <div 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-60 pointer-events-auto select-none" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-1 bg-white border border-gray-200/90 shadow-xl rounded-2xl p-1">
          {/* Power-ups Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActiveBottomTab('powerups');
                setShowPowerUpsPopover(!showPowerUpsPopover);
                setShowAutomationPopover(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === 'powerups' && showPowerUpsPopover
                  ? 'text-blue-600 bg-blue-50/80'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Plug size={15} />
              <span>Power-ups</span>
            </button>

            <CardPowerUpsPopover
              isOpen={showPowerUpsPopover}
              onClose={() => setShowPowerUpsPopover(false)}
              hasCustomFields={hasCustomFields}
              onEnableCustomFields={() => {
                setHasCustomFields(true);
                setShowPowerUpsPopover(false);
              }}
            />
          </div>

          {/* Automations Button with Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActiveBottomTab('automations');
                setShowAutomationPopover(!showAutomationPopover);
                setShowPowerUpsPopover(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === 'automations'
                  ? 'text-blue-600 bg-blue-50/80 relative after:content-[""] after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-0.5 after:bg-blue-600 after:rounded-full'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Zap size={15} />
              <span>Automations</span>
            </button>

            <CardAutomationPopover
              isOpen={showAutomationPopover}
              onClose={() => setShowAutomationPopover(false)}
              columns={columns}
              boardName={task?.board_name || 'test'}
              automationButtons={automationButtons}
              onOpenAutomationDirectory={onOpenAutomationDirectory}
              onAddButton={(btn) => {
                saveAutomationButtons([...automationButtons, btn]);
                setAutomationToast(`✓ Added button "${btn.title}"`);
                setTimeout(() => setAutomationToast(null), 2500);
              }}
              onDeleteButton={(id) => {
                saveAutomationButtons(automationButtons.filter(b => b.id !== id));
              }}
              onExecuteButton={handleExecuteAutomation}
            />
          </div>

          <div className="h-4 w-px bg-gray-200 mx-0.5"></div>

          {/* Comments Button */}
          <button
            type="button"
            onClick={() => {
              setActiveBottomTab('comments');
              setShowAutomationPopover(false);
              setShowPowerUpsPopover(false);
              commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeBottomTab === 'comments'
                ? 'text-blue-600 bg-blue-50/80 relative after:content-[""] after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-0.5 after:bg-blue-600 after:rounded-full'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={15} />
            <span>Comments</span>
          </button>
        </div>

        {/* Automation Toast Feedback */}
        {automationToast && (
          <div className="absolute right-0 top-[-40px] bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md animate-in fade-in duration-200 whitespace-nowrap">
            {automationToast}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && task && (
        <div 
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3.5">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Delete this card?</h3>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">"{task.title}"</strong>? All checklists, attachments, comments, and assignments will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
