import React, { useState } from 'react';
import { 
  X, Zap, ChevronRight, Plus, Trash2, CheckCircle2, 
  ArrowRight, Clock, CheckSquare, MessageSquare, Sliders, 
  Info, Tag, User, Layers, ArrowUpDown, Filter,
  Edit2, Copy, Lightbulb, Clipboard, History, Calendar,
  Briefcase, Hash, AlertTriangle, GitBranch, Archive,
  Settings, Bot, Rocket, Wand2, Bell, RefreshCw, Link2, Eye,
  HelpCircle, BellOff, Hammer, Heart, ThumbsUp, ThumbsDown,
  Award, Trophy, Crown, Pin, Sparkles, Ban, Scissors, UserPlus, UserMinus
} from 'lucide-react';

export interface AutomationRule {
  id: string;
  title: string;
  trigger: {
    type: string;
    desc: string;
    params?: any;
  };
  actions: {
    type: string;
    desc: string;
    params?: any;
  }[];
  enabled: boolean;
  runCount?: number;
}

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; name: string }[];
  onRuleExecuted?: (msg: string) => void;
}

type TabKey = 
  | 'rules' 
  | 'scheduled' 
  | 'due_date' 
  | 'card_buttons' 
  | 'board_buttons' 
  | 'view_apps' 
  | 'suggestions' 
  | 'activity';

type TriggerCategory = 
  | 'card_move' 
  | 'card_changes' 
  | 'dates' 
  | 'checklists' 
  | 'card_content' 
  | 'fields';

type ActionCategory = 
  | 'add_card'
  | 'move_cards'
  | 'lists'
  | 'sort'
  | 'other'
  | 'jira'
  | 'slack';

const AVAILABLE_CARD_ICONS = [
  { name: 'Settings', icon: Settings },
  { name: 'Bot', icon: Bot },
  { name: 'Rocket', icon: Rocket },
  { name: 'Wand2', icon: Wand2 },
  { name: 'Bell', icon: Bell },
  { name: 'Zap', icon: Zap },
  { name: 'ArrowUpDown', icon: ArrowUpDown },
  { name: 'RefreshCw', icon: RefreshCw },
  { name: 'Copy', icon: Copy },
  { name: 'Edit2', icon: Edit2 },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Tag', icon: Tag },
  { name: 'Link2', icon: Link2 },
  { name: 'Eye', icon: Eye },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'AlertTriangle', icon: AlertTriangle },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'BellOff', icon: BellOff },
  { name: 'Hammer', icon: Hammer },
  { name: 'Heart', icon: Heart },
  { name: 'ThumbsUp', icon: ThumbsUp },
  { name: 'ThumbsDown', icon: ThumbsDown },
  { name: 'Award', icon: Award },
  { name: 'Trophy', icon: Trophy },
  { name: 'Crown', icon: Crown },
  { name: 'Archive', icon: Archive },
  { name: 'Trash2', icon: Trash2 },
  { name: 'Pin', icon: Pin },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Ban', icon: Ban },
  { name: 'Scissors', icon: Scissors },
  { name: 'User', icon: User },
  { name: 'UserPlus', icon: UserPlus },
  { name: 'UserMinus', icon: UserMinus },
  { name: 'Layers', icon: Layers }
];

export const AutomationModal: React.FC<AutomationModalProps> = ({
  isOpen,
  onClose,
  columns,
  onRuleExecuted
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Default predefined rules matching user specifications & Screenshot 3
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_board_rules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'rule-complete',
        title: 'when the card is marked as complete in a card, move the card to the top of the list',
        trigger: {
          type: 'card_marked_complete',
          desc: 'when the card is marked as complete in a card'
        },
        actions: [
          { type: 'move_card_top', desc: 'move the card to the top of the list' }
        ],
        enabled: true,
        runCount: 8
      },
      {
        id: 'rule-todo-steps',
        title: 'When a card is created in list "To Do" by me, add the "Steps" checklist',
        trigger: {
          type: 'card_added_list',
          desc: 'when a card is created in list "To Do" by me'
        },
        actions: [
          { type: 'add_checklist', desc: 'add the "Steps" checklist to the card' }
        ],
        enabled: true,
        runCount: 4
      },
      {
        id: 'rule-done-cleanup',
        title: 'When a card is moved to list "Done" by anyone, mark the due date as complete and remove all members from the card',
        trigger: {
          type: 'card_moved_list',
          desc: 'when a card is moved to list "Done" by anyone'
        },
        actions: [
          { type: 'mark_due_complete', desc: 'mark the due date as complete' },
          { type: 'remove_all_members', desc: 'remove all members from the card' }
        ],
        enabled: true,
        runCount: 15
      },
      {
        id: 'rule-member-5days',
        title: 'When I am added to a card, set the due date in 5 working days and post a comment saying "I got this!"',
        trigger: {
          type: 'member_added',
          desc: 'when I am added to a card'
        },
        actions: [
          { type: 'set_due_days', desc: 'set the due date in 5 working days' },
          { type: 'post_comment', desc: 'post a comment saying "I got this!"' }
        ],
        enabled: true,
        runCount: 6
      }
    ];
  });

  const saveRules = (newRules: AutomationRule[]) => {
    setRules(newRules);
    try {
      localStorage.setItem('orbit_board_rules', JSON.stringify(newRules));
    } catch {}
  };

  // Rule Builder State (Screenshots 1 & 2)
  const [triggerCat, setTriggerCat] = useState<TriggerCategory>('card_move');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedTriggerDesc, setSelectedTriggerDesc] = useState<string | null>(null);
  const [selectedActionsList, setSelectedActionsList] = useState<string[]>([]);

  // Config parameters in Trigger view
  const [trigListName, setTrigListName] = useState(columns[0]?.name || 'To Do');
  const [trigActor, setTrigActor] = useState<'me' | 'anyone'>('me');
  // Scheduled automation state (Screenshots 4 & 5)
  const [schedTrigger, setSchedTrigger] = useState<string | null>(null);
  const [schedActionCat, setSchedActionCat] = useState<ActionCategory>('add_card');
  const [schedCardTitle, setSchedCardTitle] = useState('New task');
  const [schedTargetList, setSchedTargetList] = useState(columns[0]?.name || 'To Do');
  const [schedWeeks, setSchedWeeks] = useState(2);

  // Due Date Automation State (Matching Screenshots 1, 2, 3, 4)
  const [isCreatingDueDate, setIsCreatingDueDate] = useState(false);
  const [dueDateStep, setDueDateStep] = useState<'initial' | 'picking_trigger' | 'action_selection'>('initial');
  const [selectedDueDateTrigger, setSelectedDueDateTrigger] = useState<string | null>(null);
  const [selectedDueDateActions, setSelectedDueDateActions] = useState<string[]>([]);
  const [dueDateActionCat, setDueDateActionCat] = useState<
    'move' | 'add_remove' | 'dates' | 'checklists' | 'members' | 'content' | 'fields' | 'sort' | 'cascade' | 'jira' | 'bitbucket' | 'slack'
  >('move');
  const [dueDateTriggerDays, setDueDateTriggerDays] = useState(2);
  const [dueDateDayOfWeek, setDueDateDayOfWeek] = useState('monday');
  const [dueDateTargetList, setDueDateTargetList] = useState(columns[0]?.name || 'To Do');
  const [dueDateMovePosition, setDueDateMovePosition] = useState('the top of list');
  const [dueDateLabelColor, setDueDateLabelColor] = useState('red');
  const [dueDateComment, setDueDateComment] = useState('@board This card was due 3 days ago');
  const [dueDateAdvanced, setDueDateAdvanced] = useState(false);
  const [dueDateTimingDirection, setDueDateTimingDirection] = useState<'before' | 'after'>('before');
  const [dueDateArchiveOption, setDueDateArchiveOption] = useState('archive');
  const [dueDateRules, setDueDateRules] = useState<{ id: string; title: string; enabled: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_due_date_rules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'dd-1',
        title: 'The moment a card is due, move the card to the top of list "To Do" and join the card',
        enabled: true
      },
      {
        id: 'dd-2',
        title: '2 hours before a card is due, add the red label to the card',
        enabled: true
      },
      {
        id: 'dd-3',
        title: '3 days after a card is due, post comment "@board This card was due 3 days ago"',
        enabled: true
      }
    ];
  });

  const saveDueDateRules = (newRules: { id: string; title: string; enabled: boolean }[]) => {
    setDueDateRules(newRules);
    try {
      localStorage.setItem('orbit_due_date_rules', JSON.stringify(newRules));
    } catch {}
  };

  // Card Buttons State (Matching Screenshots 1, 2, 3)
  const [isCreatingCardButton, setIsCreatingCardButton] = useState(false);
  const [showCardButtonActionPicker, setShowCardButtonActionPicker] = useState(false);
  const [cardButtonTitle, setCardButtonTitle] = useState('Button Name');
  const [cardButtonIcon, setCardButtonIcon] = useState('Settings');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [cardButtonEnabledDefault, setCardButtonEnabledDefault] = useState(true);
  const [cardButtonCloseCard, setCardButtonCloseCard] = useState(false);
  const [cardButtonActions, setCardButtonActions] = useState<string[]>([]);
  const [cardButtonActionCat, setCardButtonActionCat] = useState<
    'move' | 'add_remove' | 'dates' | 'checklists' | 'members' | 'content' | 'fields' | 'sort' | 'cascade' | 'jira' | 'bitbucket' | 'slack'
  >('move');
  const [cardButtonMovePos, setCardButtonMovePos] = useState('the top of list');
  const [cardButtonTargetList, setCardButtonTargetList] = useState(columns[0]?.name || 'To Do');
  const [cardButtonArchiveOption, setCardButtonArchiveOption] = useState('archive');
  const [cardButtonLabelColor, setCardButtonLabelColor] = useState('In progress');
  const [cardButtonComment, setCardButtonComment] = useState('Ready for review!');
  const [cardButtonChecklistName, setCardButtonChecklistName] = useState('To do');

  const [cardButtons, setCardButtons] = useState<{
    id: string;
    title: string;
    icon: string;
    enabled: boolean;
    closeCard?: boolean;
    actions: string[];
  }[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_card_buttons');
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

  const saveCardButtons = (newButtons: typeof cardButtons) => {
    setCardButtons(newButtons);
    try {
      localStorage.setItem('orbit_card_buttons', JSON.stringify(newButtons));
      const activeForCards = newButtons.filter(b => b.enabled).map(b => ({
        id: b.id,
        icon: b.icon,
        title: b.title,
        actionType: (b.actions[0]?.includes('move') ? 'move' : b.actions[0]?.includes('join') ? 'join' : 'custom'),
        actions: b.actions,
        params: {}
      }));
      localStorage.setItem('orbit_card_automations', JSON.stringify(activeForCards));
    } catch {}
  };

  const renderCardButtonIcon = (iconName: string, size = 18, className = '') => {
    const item = AVAILABLE_CARD_ICONS.find(i => i.name === iconName);
    const IconComp = item?.icon || Settings;
    return <IconComp size={size} className={className} />;
  };

  // Board Buttons State (Matching Screenshots 1, 2, 3)
  const [isCreatingBoardButton, setIsCreatingBoardButton] = useState(false);
  const [showBoardButtonActionPicker, setShowBoardButtonActionPicker] = useState(false);
  const [boardButtonTitle, setBoardButtonTitle] = useState('Button Name');
  const [boardButtonIcon, setBoardButtonIcon] = useState('Settings');
  const [isBoardIconPickerOpen, setIsBoardIconPickerOpen] = useState(false);
  const [boardButtonEnabledDefault, setBoardButtonEnabledDefault] = useState(true);
  const [boardButtonActions, setBoardButtonActions] = useState<string[]>([]);
  const [boardButtonActionCat, setBoardButtonActionCat] = useState<
    'add_card' | 'move_cards' | 'lists' | 'sort' | 'other' | 'jira' | 'slack'
  >('add_card');
  const [boardButtonCardTitle, setBoardButtonCardTitle] = useState('');
  const [boardButtonTargetList, setBoardButtonTargetList] = useState(columns[0]?.name || 'To Do');
  const [boardButtonSourceList, setBoardButtonSourceList] = useState(columns[0]?.name || 'This Week');
  const [boardButtonDestList, setBoardButtonDestList] = useState(columns[1]?.name || columns[0]?.name || 'Done');
  const [boardButtonCardOption, setBoardButtonCardOption] = useState<'new' | 'unique'>('new');
  const [boardButtonSortField, setBoardButtonSortField] = useState('custom field "Priority"');
  const [boardButtonSortDirection, setBoardButtonSortDirection] = useState('descending');
  const [boardButtonRandomCount, setBoardButtonRandomCount] = useState(2);

  const [boardButtons, setBoardButtons] = useState<{
    id: string;
    title: string;
    icon: string;
    enabled: boolean;
    actions: string[];
  }[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_board_buttons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'bb-1',
        title: 'Monday setup',
        icon: 'Calendar',
        enabled: true,
        actions: [
          'Archive all cards in list "This Week"',
          'move all cards in list "Last Week" to "This Week"'
        ]
      },
      {
        id: 'bb-2',
        title: 'Prioritize',
        icon: 'ArrowUpDown',
        enabled: true,
        actions: [
          'Sort the cards in list "Doing" by custom field "Priority" descending'
        ]
      },
      {
        id: 'bb-3',
        title: 'Shuffle pick',
        icon: 'Sparkles',
        enabled: true,
        actions: [
          'Move 2 random cards from list "Backlog" to list "Doing"'
        ]
      }
    ];
  });

  const saveBoardButtons = (newButtons: typeof boardButtons) => {
    setBoardButtons(newButtons);
    try {
      localStorage.setItem('orbit_board_buttons', JSON.stringify(newButtons));
    } catch {}
  };

  // Activity Logs State (Matching Screenshot 1)
  const [activityFilterWarnings, setActivityFilterWarnings] = useState(false);
  const [activityLogs] = useState<{
    id: string;
    timestamp: string;
    message: string;
    ruleText: string;
    level: 'info' | 'warning' | 'error';
  }[]>(() => {
    try {
      const saved = localStorage.getItem('orbit_automation_activity_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log-1',
        timestamp: '12 October 2026 at 14:39',
        message: 'The automation has been created. The automation is:',
        ruleText: 'when the card is marked as complete in a card, move the card to the top of the list',
        level: 'info'
      }
    ];
  });

  if (!isOpen) return null;

  // Handle trigger selection in Rule Builder
  const handlePickTrigger = (desc: string) => {
    setSelectedTriggerDesc(desc);
    setWizardStep(2);
    if (selectedActionsList.length === 0) {
      setSelectedActionsList(['move the card to the top of the list']);
    }
  };

  const handleAddAnotherAction = () => {
    const defaultActions = [
      'move the card to the top of the list',
      'add the "Steps" checklist to the card',
      'mark the due date as complete',
      'remove all members from the card',
      'post a comment saying "I got this!"'
    ];
    const nextAct = defaultActions[selectedActionsList.length % defaultActions.length] || 'move the card to the top of the list';
    setSelectedActionsList([...selectedActionsList, nextAct]);
  };

  const handleRemoveAction = (index: number) => {
    setSelectedActionsList(selectedActionsList.filter((_, i) => i !== index));
  };

  const handleSaveRule = () => {
    if (!selectedTriggerDesc || selectedActionsList.length === 0) return;

    const fullTitle = `${selectedTriggerDesc}, ${selectedActionsList.join(' and ')}`;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      title: fullTitle,
      trigger: {
        type: 'custom_trigger',
        desc: selectedTriggerDesc
      },
      actions: selectedActionsList.map(a => ({
        type: 'custom_action',
        desc: a
      })),
      enabled: true,
      runCount: 0
    };

    saveRules([newRule, ...rules]);
    setIsCreatingRule(false);
    setWizardStep(1);
    setSelectedTriggerDesc(null);
    setSelectedActionsList([]);
    onRuleExecuted?.(`Rule created: ${fullTitle}`);
  };

  const handleToggleRule = (id: string) => {
    const next = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveRules(next);
  };

  const handleDeleteRule = (id: string) => {
    const next = rules.filter(r => r.id !== id);
    saveRules(next);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-[1100px] max-w-[98vw] h-[680px] max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================= MODAL TOP HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5 text-gray-900 font-bold text-base">
            <Zap size={20} className="text-[#0c66e4]" fill="#0c66e4" />
            <span>Automation</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= MODAL BODY: SIDEBAR + MAIN AREA ================= */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* LEFT SIDEBAR (Responsive on mobile: horizontal scroll strip) */}
          <aside className="w-full md:w-56 bg-[#f7f8f9] border-b md:border-b-0 md:border-r border-gray-200 p-2 sm:p-3 flex md:flex-col justify-between shrink-0 select-none overflow-x-auto no-scrollbar">
            <div className="flex md:flex-col items-center md:items-stretch gap-3 md:gap-4 md:space-y-4 shrink-0">
              
              {/* Category 1: Automations */}
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2 block mb-1">
                  Automations
                </span>
                <div className="flex md:flex-col gap-1 md:space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('rules'); setIsCreatingRule(false); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'rules' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Rules</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('scheduled'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'scheduled' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Scheduled</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('due_date'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'due_date' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Due date</span>
                  </button>
                </div>
              </div>

              {/* Category 2: Custom buttons */}
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2 block mb-1">
                  Buttons
                </span>
                <div className="flex md:flex-col gap-1 md:space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('card_buttons'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'card_buttons' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Card buttons</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('board_buttons'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'board_buttons' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Board buttons</span>
                  </button>
                </div>
              </div>

              {/* Category 4: More */}
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider px-2 block mb-1">
                  More
                </span>
                <div className="flex md:flex-col gap-1 md:space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('suggestions'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'suggestions' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Suggestions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('activity'); }}
                    className={`whitespace-nowrap flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      activeTab === 'activity' ? 'bg-[#e9f2ff] text-[#0c66e4]' : 'text-gray-700 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>Activity</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Sidebar Bottom Links */}
            <div className="hidden md:block space-y-1 pt-3 border-t border-gray-200/80 text-[11px] text-gray-500">
              <span className="px-2 py-0.5 block hover:text-gray-800 cursor-pointer">Reports</span>
              <span className="px-2 py-0.5 block hover:text-gray-800 cursor-pointer">Send feedback</span>
              <span className="px-2 py-0.5 block hover:text-gray-800 cursor-pointer">Help</span>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
            
            {/* ================= TAB: RULES (Matching Screenshot 3) ================= */}
            {activeTab === 'rules' && !isCreatingRule && (
              <div className="space-y-6 max-w-4xl">
                
                {/* Header (Screenshot 3: Rules on left, Action Buttons on right) */}
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-xl font-bold text-gray-900">Rules</h2>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingRule(true);
                        setWizardStep(1);
                        setSelectedTriggerDesc(null);
                        setSelectedActionsList([]);
                      }}
                      className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      Create automation
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Filter size={13} /> Filter
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Tag size={13} /> Libraries
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <User size={13} /> Admin
                    </button>
                  </div>
                </div>

                {/* Rules List Container (Matching Screenshot 3) */}
                <div className="space-y-4">
                  {rules.map(rule => (
                    <div 
                      key={rule.id}
                      className="border border-gray-300 rounded-xl p-3.5 bg-white shadow-2xs hover:border-gray-400 transition-colors"
                    >
                      {/* Top Action Icons Row (Screenshot 3) */}
                      <div className="flex items-center justify-between pb-2.5 text-gray-500">
                        <div className="flex items-center gap-3">
                          <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="Label"><Tag size={15} /></button>
                          <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="Edit"><Edit2 size={15} /></button>
                          <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="Copy"><Copy size={15} /></button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteRule(rule.id)} 
                            className="hover:text-red-600 p-0.5 cursor-pointer" 
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="Tip"><Lightbulb size={15} /></button>
                          <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="Copy to board"><Clipboard size={15} /></button>
                        </div>

                        <button type="button" className="hover:text-gray-900 p-0.5 cursor-pointer" title="History">
                          <History size={15} />
                        </button>
                      </div>

                      {/* Rule Description Box (Screenshot 3) */}
                      <div className="bg-[#f4f5f7] border border-gray-200/90 rounded-lg p-3 text-xs font-mono text-gray-800 leading-relaxed break-words">
                        {rule.title}
                      </div>

                      {/* Bottom Toggle Bar (Screenshot 3) */}
                      <div className="pt-2.5 flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer gap-2 select-none">
                          <input 
                            type="checkbox" 
                            checked={rule.enabled} 
                            onChange={() => handleToggleRule(rule.id)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#22a06b]" />
                          <span className="text-xs font-semibold text-gray-700">Enable on this board</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ================= CREATE A RULE WIZARD (Matching Screenshots 1 & 2) ================= */}
            {isCreatingRule && (
              <div className="space-y-5 max-w-4xl">
                
                {/* Header (Matching Screenshot 1 & 2) */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Create a Rule</h2>
                    <Info size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={handleSaveRule}
                      disabled={!selectedTriggerDesc || selectedActionsList.length === 0}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selectedTriggerDesc && selectedActionsList.length > 0
                          ? 'bg-[#0c66e4] text-white hover:bg-[#0055cc] cursor-pointer shadow-xs'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCreatingRule(false)}
                      className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Stepper with Checkmarks (Matching Screenshot 2) */}
                <div className="flex items-center justify-center gap-6 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500">
                  <button 
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-2 cursor-pointer text-gray-900"
                  >
                    {selectedTriggerDesc ? (
                      <span className="w-5 h-5 rounded-full bg-[#4bce97] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold">
                        1
                      </span>
                    )}
                    <span>Select trigger</span>
                  </button>

                  <ChevronRight size={14} className="text-gray-400" />

                  <button 
                    type="button"
                    onClick={() => { if (selectedTriggerDesc) setWizardStep(2); }}
                    className="flex items-center gap-2 cursor-pointer text-gray-900"
                  >
                    {selectedActionsList.length > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-[#4bce97] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-bold">
                        2
                      </span>
                    )}
                    <span className={wizardStep === 2 ? 'text-gray-900 underline font-bold' : 'text-gray-600'}>Select action</span>
                  </button>

                  <ChevronRight size={14} className="text-gray-400" />

                  <button 
                    type="button"
                    onClick={() => { if (selectedTriggerDesc && selectedActionsList.length > 0) setWizardStep(3); }}
                    className="flex items-center gap-2 text-gray-500"
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[11px] font-bold">
                      3
                    </span>
                    <span>Review and save</span>
                  </button>
                </div>

                {/* ================= STEP 1: SELECT TRIGGER (Screenshot 1) ================= */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Select Trigger</span>
                      
                      {/* Advanced Switch */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isAdvanced}
                          onChange={e => setIsAdvanced(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gray-800" />
                        <span>Advanced</span>
                      </label>
                    </div>

                    {/* Trigger Category Tabs (Matching Screenshot 1) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setTriggerCat('card_move')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'card_move' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ArrowRight size={14} /> Card Move
                      </button>

                      <button
                        type="button"
                        onClick={() => setTriggerCat('card_changes')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'card_changes' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>+ −</span> Card Changes
                      </button>

                      <button
                        type="button"
                        onClick={() => setTriggerCat('dates')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'dates' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Clock size={14} /> Dates
                      </button>

                      <button
                        type="button"
                        onClick={() => setTriggerCat('checklists')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'checklists' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <CheckSquare size={14} /> Checklists
                      </button>

                      <button
                        type="button"
                        onClick={() => setTriggerCat('card_content')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'card_content' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <MessageSquare size={14} /> Card Content
                      </button>

                      <button
                        type="button"
                        onClick={() => setTriggerCat('fields')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          triggerCat === 'fields' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Sliders size={14} /> Fields
                      </button>
                    </div>

                    {/* Trigger Rules List under Card Move (Matching Screenshot 1) */}
                    <div className="space-y-3 pt-2">
                      
                      {/* Trigger 1: When card added to board */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-800 leading-relaxed flex flex-wrap items-center gap-1.5">
                            <span>when a card is</span>
                            <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">added to ⌄</span>
                            <span>the board</span>
                            <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">by me ⌄</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            "Added" means created, copied, moved into the board or emailed into the board.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickTrigger('when a card is added to the board by me')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                          title="Select trigger"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Trigger 2: When card added to list */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-800 leading-relaxed flex flex-wrap items-center gap-1.5">
                            <span>when a card is</span>
                            <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">added to ⌄</span>
                            <span>list</span>
                            <input
                              type="text"
                              value={trigListName}
                              onChange={e => setTrigListName(e.target.value)}
                              placeholder="List name"
                              className="border border-gray-300 rounded px-2 py-0.5 font-semibold text-xs bg-white text-gray-900 w-28"
                            />
                            <span>by</span>
                            <select
                              value={trigActor}
                              onChange={e => setTrigActor(e.target.value as any)}
                              className="border border-gray-300 rounded px-2 py-0.5 font-semibold text-xs bg-white text-gray-900"
                            >
                              <option value="me">me ⌄</option>
                              <option value="anyone">anyone ⌄</option>
                            </select>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            "Added" means created, copied, emailed or moved into the list.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickTrigger(`when a card is created in list "${trigListName}" by ${trigActor}`)}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                          title="Select trigger"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Trigger 3: When card is archived */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-800 leading-relaxed flex items-center gap-1.5">
                          <span>when a card is</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">archived ⌄</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">by me ⌄</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickTrigger('when a card is archived by me')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                          title="Select trigger"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Trigger 4: When list is created */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-800 leading-relaxed flex items-center gap-1.5">
                          <span>when a list is</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">created ⌄</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">by me ⌄</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickTrigger('when a list is created by me')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                          title="Select trigger"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Trigger 5: When a vote is added (Screenshot 2 example) */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-800 leading-relaxed">
                          <span>when a vote is added to a card</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickTrigger('when a vote is added to a card')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                          title="Select trigger"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* ================= STEP 2: CONFIGURE TRIGGER & ACTIONS (Screenshot 2) ================= */}
                {wizardStep >= 2 && (
                  <div className="space-y-5 pt-1">
                    
                    {/* Trigger Box (Matching Screenshot 2) */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-800 block">Trigger</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800">
                          {selectedTriggerDesc || 'when a vote is added to a card'}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTriggerDesc(null);
                            setWizardStep(1);
                          }}
                          className="p-2 border border-gray-200 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove trigger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Action Box (Matching Screenshot 2) */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-800 block">Action</span>

                      {selectedActionsList.map((act, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800">
                            {act}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(aIdx)}
                            className="p-2 border border-gray-200 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove action"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {/* + Add another action button (Matching Screenshot 2) */}
                      <button
                        type="button"
                        onClick={handleAddAnotherAction}
                        className="py-1.5 px-3 bg-[#e9f2ff] hover:bg-blue-100 text-[#0c66e4] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add another action
                      </button>
                    </div>

                    {/* Save or Continue */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsCreatingRule(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveRule}
                        className="px-6 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        Save Rule
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ================= TAB: SCHEDULED (Matching Screenshots 4 & 5) ================= */}
            {activeTab === 'scheduled' && (
              <div className="space-y-5 max-w-4xl">
                
                {/* Header (Screenshots 4 & 5) */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Create a scheduled automation</h2>
                    <Info size={16} className="text-gray-400" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (schedTrigger) {
                          alert(`Scheduled automation "${schedTrigger}" saved successfully!`);
                          setSchedTrigger(null);
                        }
                      }}
                      disabled={!schedTrigger}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        schedTrigger 
                          ? 'bg-[#0c66e4] text-white hover:bg-[#0055cc] cursor-pointer shadow-xs' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSchedTrigger(null); }}
                      className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* State A: No trigger selected yet (Screenshot 4) */}
                {!schedTrigger && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-800 block">Trigger</span>
                      <p className="text-xs text-gray-500">
                        Your automation doesn't have a trigger yet. Select a trigger for the automation below.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-bold text-gray-800 block">Select a Schedule</span>

                      {/* 1. every day */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <span>every</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">day ⌄</span>
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger('every day')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* 2. every select days */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <span>every</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">select days ⌄</span>
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger('every select days')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* 3. every 2 weeks on select days */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <span>every</span>
                          <input 
                            type="number" 
                            min="1" 
                            value={schedWeeks}
                            onChange={e => setSchedWeeks(parseInt(e.target.value) || 1)}
                            className="w-10 border border-gray-300 rounded px-1.5 py-0.5 text-center text-xs font-semibold"
                          />
                          <span>weeks on</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">select days ⌄</span>
                          <Clock size={14} className="text-gray-400" />
                          <Calendar size={14} className="text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger(`every ${schedWeeks} weeks on select days`)}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* 4. every first monday of the month */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <span>every</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">first ⌄</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">monday of the month ⌄</span>
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger('every first monday of the month')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* 5. every month on the 1st */}
                      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <span>every</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">month ⌄</span>
                          <span>on the</span>
                          <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">1st ⌄</span>
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger('every month on the 1st')}
                          className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* State B: Trigger Selected -> Select Action (Screenshot 5) */}
                {schedTrigger && (
                  <div className="space-y-4">
                    
                    {/* Trigger card (Screenshot 5) */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-800 block">Trigger</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 font-medium">
                          {schedTrigger}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSchedTrigger(null)}
                          className="p-2 border border-gray-200 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Actions heading (Screenshot 5) */}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-800 block">Actions</span>
                      <p className="text-xs text-gray-500">
                        Your automation doesn't perform any actions yet. Add some actions from below.
                      </p>
                    </div>

                    {/* Select an Action Section (Screenshot 5) */}
                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-bold text-gray-800 block">Select an Action</span>

                      {/* Action Category Tabs (Screenshot 5) */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => setSchedActionCat('add_card')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'add_card' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Plus size={14} /> Add Card
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('move_cards')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'move_cards' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <ArrowRight size={14} /> Move Cards
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('lists')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'lists' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Layers size={14} /> Lists
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('sort')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'sort' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <ArrowUpDown size={14} /> Sort
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('other')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'other' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Copy size={14} /> Other
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('jira')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'jira' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Briefcase size={14} /> Jira
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedActionCat('slack')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            schedActionCat === 'slack' ? 'bg-[#e9f2ff] text-[#0c66e4] border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Hash size={14} /> Slack
                        </button>
                      </div>

                      {/* Add Card action templates (Screenshot 5) */}
                      <div className="space-y-3 pt-2">
                        
                        {/* 1. Create a new card */}
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-800">
                              <span>create a</span>
                              <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded">new ⌄</span>
                              <span>card with title</span>
                              <input 
                                type="text"
                                value={schedCardTitle}
                                onChange={e => setSchedCardTitle(e.target.value)}
                                placeholder="Card title"
                                className="border border-gray-300 rounded px-2.5 py-1 text-xs font-medium w-40"
                              />
                              <Edit2 size={13} className="text-gray-400" />
                              <span>in list</span>
                              <select 
                                value={schedTargetList}
                                onChange={e => setSchedTargetList(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs font-semibold bg-white"
                              >
                                {columns.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                alert(`Action added: create new card "${schedCardTitle}" in list "${schedTargetList}"`);
                              }}
                              className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            By default, this action creates a new card. If you select the unique option, the card will be created only if one with the same title doesn't exist in the list (otherwise, the automation will stop and no further actions will be executed).
                          </p>
                        </div>

                        {/* 2. Find card and copy */}
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-gray-800">
                            <span>find card</span>
                            <input 
                              type="text"
                              placeholder="Card title"
                              className="border border-gray-300 rounded px-2.5 py-1 text-xs font-medium w-36"
                            />
                            <span>and copy it in list</span>
                            <input 
                              type="text"
                              placeholder="List name"
                              className="border border-gray-300 rounded px-2.5 py-1 text-xs font-medium w-32"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              alert('Action added: find card and copy to list');
                            }}
                            className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ================= TAB: DUE DATE (MATCHING USER SCREENSHOTS) ================= */}
            {activeTab === 'due_date' && (
              <div className="space-y-6 max-w-4xl">
                {!isCreatingDueDate ? (
                  /* --- LANDING VIEW (SCREENSHOT 1) --- */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Due date</h2>
                        <p className="text-sm text-gray-600 mt-1">Make things happen automatically based on a card's due date.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingDueDate(true);
                          setDueDateStep('initial');
                          setSelectedDueDateTrigger(null);
                          setSelectedDueDateActions([]);
                        }}
                        className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create automation
                      </button>
                    </div>

                    {/* Examples block */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-800">Examples</h3>
                      <div className="space-y-2.5 text-sm text-gray-700">
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            The moment a <strong className="font-semibold text-gray-900">card is due</strong>, move the card to the top of list <strong className="font-semibold text-gray-900">"To Do"</strong> and join the card.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">2 hours before</strong> a card is due, add the red label to the card.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">3 days after</strong> a card is due, post comment <strong className="font-semibold text-gray-900">"@board This card was due 3 days ago"</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingDueDate(true);
                          setDueDateStep('initial');
                          setSelectedDueDateTrigger(null);
                          setSelectedDueDateActions([]);
                        }}
                        className="mt-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create automation
                      </button>
                    </div>

                    {/* Active Due Date Automations */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <h3 className="text-sm font-bold text-gray-800">Active automations ({dueDateRules.length})</h3>
                      <div className="space-y-3">
                        {dueDateRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 transition hover:border-gray-300"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                                <Clock size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{rule.title}</p>
                                <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  Due Date Rule
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <span>Enable on this board</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = dueDateRules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r);
                                    saveDueDateRules(updated);
                                    onRuleExecuted?.(`${rule.enabled ? 'Disabled' : 'Enabled'} due date automation: ${rule.title}`);
                                  }}
                                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                                    rule.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                      rule.enabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = dueDateRules.filter(r => r.id !== rule.id);
                                  saveDueDateRules(updated);
                                  onRuleExecuted?.(`Removed due date automation`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete rule"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- CREATION WIZARD (SCREENSHOTS 2, 3, 4) --- */
                  <div className="space-y-6">
                    {/* Top Bar with Title, Save, Cancel */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">Create a due date automation</h2>
                        <Info size={16} className="text-gray-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!selectedDueDateTrigger || selectedDueDateActions.length === 0}
                          onClick={() => {
                            if (!selectedDueDateTrigger || selectedDueDateActions.length === 0) return;
                            const newRule = {
                              id: `dd-${Date.now()}`,
                              title: `${selectedDueDateTrigger}, ${selectedDueDateActions.join(' and ')}`,
                              enabled: true
                            };
                            saveDueDateRules([newRule, ...dueDateRules]);
                            onRuleExecuted?.(`Created due date automation: ${newRule.title}`);
                            setIsCreatingDueDate(false);
                            setDueDateStep('initial');
                            setSelectedDueDateTrigger(null);
                            setSelectedDueDateActions([]);
                          }}
                          className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                            selectedDueDateTrigger && selectedDueDateActions.length > 0
                              ? 'bg-[#0c66e4] hover:bg-[#0055cc] text-white cursor-pointer shadow-xs'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDueDate(false);
                            setDueDateStep('initial');
                            setSelectedDueDateTrigger(null);
                            setSelectedDueDateActions([]);
                          }}
                          className="px-4 py-1.5 rounded text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Step 1: Initial (Screenshot 2) */}
                    {dueDateStep === 'initial' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-800">Trigger</h3>
                        <p className="text-xs text-gray-600 text-center py-2">
                          Your automation doesn't have a trigger yet. Select a trigger for the automation below.
                        </p>
                        <div className="flex justify-center pt-2">
                          <button
                            type="button"
                            onClick={() => setDueDateStep('picking_trigger')}
                            className="w-full py-2.5 bg-[#ebecf0] hover:bg-[#dfe1e6] text-gray-800 font-semibold rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            + Add Trigger
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Picking Trigger (Screenshot 3) */}
                    {dueDateStep === 'picking_trigger' && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">Trigger</h3>
                          <p className="text-xs text-gray-600 text-center py-2">
                            Your automation doesn't have a trigger yet. Select a trigger for the automation below.
                          </p>
                        </div>

                        {/* Blue Retroactive Warning Box */}
                        <div className="border border-blue-300 bg-[#e9f2ff] rounded-lg p-4 space-y-1.5">
                          <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                            <span>Due date triggers are not retroactive.</span>
                          </div>
                          <p className="text-xs text-gray-700 pl-5">
                            For example, if you enter an automation that says <em className="text-blue-700 font-medium">2 days before a card is due</em>, ..., this will not trigger for cards that are already due in 2 days or less.
                          </p>
                          <p className="text-xs text-gray-700 pl-5">
                            It will trigger the moment a card becomes due in 2 days through the passage of time, starting from the moment the automation is entered.
                          </p>
                        </div>

                        {/* Header + Advanced switch */}
                        <div className="flex items-center justify-between pt-2">
                          <h4 className="text-sm font-bold text-gray-900">Select a Due Date Trigger</h4>
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                            <button
                              type="button"
                              onClick={() => setDueDateAdvanced(!dueDateAdvanced)}
                              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                                dueDateAdvanced ? 'bg-[#0c66e4]' : 'bg-gray-300'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                  dueDateAdvanced ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span>Advanced</span>
                          </label>
                        </div>

                        {/* Trigger Options */}
                        <div className="space-y-2.5">
                          {/* Trigger 1 */}
                          <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-800">
                              <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium">
                                the moment
                              </span>
                              <span>a card</span>
                              <button type="button" className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer" title="Filter card">
                                <Filter size={15} />
                              </button>
                              <span>is due</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDueDateTrigger('the moment a card is due');
                                setDueDateStep('action_selection');
                                if (selectedDueDateActions.length === 0) {
                                  setSelectedDueDateActions([`move the card to the top of list "${columns[0]?.name || 'To Do'}"`]);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              title="Add trigger"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          {/* Trigger 2 */}
                          <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={dueDateTriggerDays}
                                onChange={(e) => setDueDateTriggerDays(parseInt(e.target.value) || 1)}
                                className="w-16 bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium text-center focus:outline-blue-500"
                              />
                              <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium">
                                days
                              </span>
                              <select
                                value={dueDateTimingDirection}
                                onChange={(e) => setDueDateTimingDirection(e.target.value as any)}
                                className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                              >
                                <option value="before">before</option>
                                <option value="after">after</option>
                              </select>
                              <span>a card</span>
                              <button type="button" className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer" title="Filter card">
                                <Filter size={15} />
                              </button>
                              <span>is due</span>
                              <Clock size={15} className="text-gray-500" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDueDateTrigger(`${dueDateTriggerDays} days ${dueDateTimingDirection} a card is due`);
                                setDueDateStep('action_selection');
                                if (selectedDueDateActions.length === 0) {
                                  setSelectedDueDateActions([`add the red label to the card`]);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              title="Add trigger"
                            >
                              <Plus size={18} />
                            </button>
                          </div>

                          {/* Trigger 3 */}
                          <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                              <span>on the</span>
                              <select
                                value={dueDateDayOfWeek}
                                onChange={(e) => setDueDateDayOfWeek(e.target.value)}
                                className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 capitalize"
                              >
                                <option value="monday">monday</option>
                                <option value="tuesday">tuesday</option>
                                <option value="wednesday">wednesday</option>
                                <option value="thursday">thursday</option>
                                <option value="friday">friday</option>
                                <option value="saturday">saturday</option>
                                <option value="sunday">sunday</option>
                              </select>
                              <span>before a card</span>
                              <button type="button" className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer" title="Filter card">
                                <Filter size={15} />
                              </button>
                              <span>is due</span>
                              <Clock size={15} className="text-gray-500" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDueDateTrigger(`on the ${dueDateDayOfWeek} before a card is due`);
                                setDueDateStep('action_selection');
                                if (selectedDueDateActions.length === 0) {
                                  setSelectedDueDateActions([`move the card to the top of list "${columns[0]?.name || 'To Do'}"`]);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              title="Add trigger"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Action Selection (Screenshot 4) */}
                    {dueDateStep === 'action_selection' && (
                      <div className="space-y-6">
                        {/* Trigger Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2">Trigger</h3>
                          <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-gray-800">{selectedDueDateTrigger}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDueDateTrigger(null);
                                setDueDateStep('picking_trigger');
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove trigger"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2">Actions</h3>
                          {selectedDueDateActions.length === 0 ? (
                            <p className="text-xs text-gray-600 text-center py-3">
                              Your automation doesn't perform any actions yet. Add some actions from below.
                            </p>
                          ) : (
                            <div className="space-y-2 mb-4">
                              {selectedDueDateActions.map((action, idx) => (
                                <div
                                  key={idx}
                                  className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                    <span className="text-sm font-medium text-gray-800">{action}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDueDateActions(selectedDueDateActions.filter((_, i) => i !== idx))}
                                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Remove action"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Select an Action */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-sm font-bold text-gray-900">Select an Action</h4>

                          {/* Category Tabs (Row 1 & Row 2 matching Screenshot 4) */}
                          <div className="space-y-2">
                            {/* Row 1 */}
                            <div className="flex items-center gap-1 flex-wrap border-b border-gray-200 pb-2">
                              {[
                                { id: 'move', label: 'Move', icon: ArrowRight },
                                { id: 'add_remove', label: 'Add/Remove', icon: Tag },
                                { id: 'dates', label: 'Dates', icon: Clock },
                                { id: 'checklists', label: 'Checklists', icon: CheckSquare },
                                { id: 'members', label: 'Members', icon: User },
                                { id: 'content', label: 'Content', icon: MessageSquare },
                                { id: 'fields', label: 'Fields', icon: Sliders },
                                { id: 'sort', label: 'Sort', icon: ArrowUpDown },
                                { id: 'cascade', label: 'Cascade', icon: Archive },
                              ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = dueDateActionCat === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setDueDateActionCat(tab.id as any)}
                                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                      isActive
                                        ? 'bg-blue-50 text-[#0c66e4] border-b-2 border-[#0c66e4]'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                  >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Row 2 */}
                            <div className="flex items-center gap-1.5 pb-2">
                              {[
                                { id: 'jira', label: 'Jira', icon: Briefcase },
                                { id: 'bitbucket', label: 'Bitbucket', icon: GitBranch },
                                { id: 'slack', label: 'Slack', icon: Hash },
                              ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = dueDateActionCat === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setDueDateActionCat(tab.id as any)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                      isActive
                                        ? 'bg-blue-50 text-[#0c66e4] border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                  >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action Cards under category */}
                          <div className="space-y-2.5 pt-2">
                            {dueDateActionCat === 'move' && (
                              <>
                                {/* Action 1: move the card to [ the top of list ] [ List name ] [ layers ] */}
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                    <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium">
                                      move
                                    </span>
                                    <span>the card to</span>
                                    <select
                                      value={dueDateMovePosition}
                                      onChange={(e) => setDueDateMovePosition(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                    >
                                      <option value="the top of list">the top of list</option>
                                      <option value="the bottom of list">the bottom of list</option>
                                    </select>
                                    <select
                                      value={dueDateTargetList}
                                      onChange={(e) => setDueDateTargetList(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                    >
                                      {columns.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                      ))}
                                    </select>
                                    <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Board layout">
                                      <Layers size={14} />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const actionStr = `move the card to ${dueDateMovePosition} "${dueDateTargetList}"`;
                                      setSelectedDueDateActions(prev => [...prev, actionStr]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                    title="Add action"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                {/* Action 2: move the card to [ the top of the list ] */}
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-sm text-gray-800">
                                    <span>move the card to</span>
                                    <select
                                      value={dueDateMovePosition}
                                      onChange={(e) => setDueDateMovePosition(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                    >
                                      <option value="the top of list">the top of the list</option>
                                      <option value="the bottom of list">the bottom of the list</option>
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const actionStr = `move the card to ${dueDateMovePosition}`;
                                      setSelectedDueDateActions(prev => [...prev, actionStr]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                    title="Add action"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                {/* Action 3: [ archive ] the card */}
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-sm text-gray-800">
                                    <select
                                      value={dueDateArchiveOption}
                                      onChange={(e) => setDueDateArchiveOption(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                    >
                                      <option value="archive">archive</option>
                                      <option value="send back to board">send back to board</option>
                                    </select>
                                    <span>the card</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const actionStr = `${dueDateArchiveOption} the card`;
                                      setSelectedDueDateActions(prev => [...prev, actionStr]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                    title="Add action"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                              </>
                            )}

                            {dueDateActionCat === 'add_remove' && (
                              <>
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-sm text-gray-800">
                                    <span>add the</span>
                                    <select
                                      value={dueDateLabelColor}
                                      onChange={(e) => setDueDateLabelColor(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 capitalize"
                                    >
                                      <option value="red">red</option>
                                      <option value="green">green</option>
                                      <option value="yellow">yellow</option>
                                      <option value="orange">orange</option>
                                      <option value="blue">blue</option>
                                      <option value="purple">purple</option>
                                    </select>
                                    <span>label to the card</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `add the ${dueDateLabelColor} label to the card`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-sm text-gray-800">
                                    <span>remove the</span>
                                    <select
                                      value={dueDateLabelColor}
                                      onChange={(e) => setDueDateLabelColor(e.target.value)}
                                      className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 capitalize"
                                    >
                                      <option value="red">red</option>
                                      <option value="green">green</option>
                                      <option value="yellow">yellow</option>
                                      <option value="orange">orange</option>
                                      <option value="blue">blue</option>
                                      <option value="purple">purple</option>
                                    </select>
                                    <span>label from the card</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `remove the ${dueDateLabelColor} label from the card`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                              </>
                            )}

                            {dueDateActionCat === 'dates' && (
                              <>
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-800">mark the due date as complete</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `mark the due date as complete`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-800">remove the due date</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `remove the due date`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                              </>
                            )}

                            {dueDateActionCat === 'members' && (
                              <>
                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-800">join the card</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `join the card`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                  <span className="text-sm text-gray-800">remove all members from the card</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDueDateActions(prev => [...prev, `remove all members from the card`]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                              </>
                            )}

                            {dueDateActionCat === 'content' && (
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800 flex-1">
                                  <span>post comment</span>
                                  <input
                                    type="text"
                                    value={dueDateComment}
                                    onChange={(e) => setDueDateComment(e.target.value)}
                                    className="flex-1 bg-white border border-gray-300 px-3 py-1 rounded text-xs focus:outline-blue-500 font-medium"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDueDateActions(prev => [...prev, `post comment "${dueDateComment}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            )}

                            {dueDateActionCat === 'checklists' && (
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>add the</span>
                                  <input
                                    type="text"
                                    defaultValue="Steps"
                                    id="ddChecklistNameInput"
                                    className="bg-white border border-gray-300 px-3 py-1 rounded text-xs focus:outline-blue-500 font-medium"
                                  />
                                  <span>checklist to the card</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('ddChecklistNameInput') as HTMLInputElement | null;
                                    const name = input?.value || 'Steps';
                                    setSelectedDueDateActions(prev => [...prev, `add the "${name}" checklist to the card`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            )}

                            {['fields', 'sort', 'cascade', 'jira', 'bitbucket', 'slack'].includes(dueDateActionCat) && (
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-4 text-center space-y-2">
                                <p className="text-xs text-gray-600 capitalize">Configure {dueDateActionCat} integrations for Due Date automations</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDueDateActions(prev => [...prev, `trigger ${dueDateActionCat} action`]);
                                  }}
                                  className="text-xs bg-[#0c66e4] text-white font-semibold px-3 py-1.5 rounded cursor-pointer hover:bg-[#0055cc]"
                                >
                                  + Add {dueDateActionCat} action
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: CARD BUTTONS (MATCHING USER SCREENSHOTS) ================= */}
            {activeTab === 'card_buttons' && (
              <div className="space-y-6 max-w-4xl">
                {!isCreatingCardButton ? (
                  /* --- LANDING VIEW (SCREENSHOT 1) --- */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Card buttons</h2>
                        <p className="text-sm text-gray-600 mt-1">Add quick actions to your cards with a button.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCardButton(true);
                          setCardButtonTitle('Button Name');
                          setCardButtonIcon('Settings');
                          setIsIconPickerOpen(false);
                          setCardButtonEnabledDefault(true);
                          setCardButtonCloseCard(false);
                          setCardButtonActions([]);
                          setShowCardButtonActionPicker(false);
                        }}
                        className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create button
                      </button>
                    </div>

                    {/* Examples block */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-800">Examples</h3>
                      <div className="space-y-2.5 text-sm text-gray-700">
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Assign to me:</strong> join the card, add the "In progress" label, and add an empty "To do" checklist to the card.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Completed:</strong> Move the card to the "Done" list and remove the card's due date.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Send to review:</strong> Add a member, add the "For review" label, and post a comment that says "Ready for review!"
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCardButton(true);
                          setCardButtonTitle('Button Name');
                          setCardButtonIcon('Settings');
                          setIsIconPickerOpen(false);
                          setCardButtonEnabledDefault(true);
                          setCardButtonCloseCard(false);
                          setCardButtonActions([]);
                          setShowCardButtonActionPicker(false);
                        }}
                        className="mt-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create button
                      </button>
                    </div>

                    {/* Active Card Buttons List */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <h3 className="text-sm font-bold text-gray-800">Active card buttons ({cardButtons.length})</h3>
                      <div className="space-y-3">
                        {cardButtons.map((btn) => (
                          <div
                            key={btn.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 transition hover:border-gray-300"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                                {renderCardButtonIcon(btn.icon, 18)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900">{btn.title}</p>
                                  {btn.closeCard && (
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                      Closes card
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {btn.actions.join(' • ')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <span>Enable on this board</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = cardButtons.map(b => b.id === btn.id ? { ...b, enabled: !b.enabled } : b);
                                    saveCardButtons(updated);
                                    onRuleExecuted?.(`${btn.enabled ? 'Disabled' : 'Enabled'} card button: ${btn.title}`);
                                  }}
                                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                                    btn.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                      btn.enabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  onRuleExecuted?.(`Executed card button: ${btn.title}`);
                                }}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                              >
                                Test Run
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = cardButtons.filter(b => b.id !== btn.id);
                                  saveCardButtons(updated);
                                  onRuleExecuted?.(`Deleted card button: ${btn.title}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- CREATION WIZARD (SCREENSHOTS 2 & 3) --- */
                  <div className="space-y-6">
                    {/* Top Bar with Title, Save, Cancel */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">Create a Card Button</h2>
                        <Info size={16} className="text-gray-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!cardButtonTitle.trim() || cardButtonActions.length === 0}
                          onClick={() => {
                            if (!cardButtonTitle.trim() || cardButtonActions.length === 0) return;
                            const newButton = {
                              id: `cb-${Date.now()}`,
                              title: cardButtonTitle.trim(),
                              icon: cardButtonIcon,
                              enabled: cardButtonEnabledDefault,
                              closeCard: cardButtonCloseCard,
                              actions: cardButtonActions
                            };
                            saveCardButtons([newButton, ...cardButtons]);
                            onRuleExecuted?.(`Created card button: ${newButton.title}`);
                            setIsCreatingCardButton(false);
                            setCardButtonTitle('Button Name');
                            setCardButtonActions([]);
                            setIsIconPickerOpen(false);
                          }}
                          className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                            cardButtonTitle.trim() && cardButtonActions.length > 0
                              ? 'bg-[#0c66e4] hover:bg-[#0055cc] text-white cursor-pointer shadow-xs'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCardButton(false);
                            setIsIconPickerOpen(false);
                          }}
                          className="px-4 py-1.5 rounded text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Top Configuration Form: Icon, Title, Options (Screenshot 2) */}
                    <div className="flex items-start gap-8 flex-wrap pt-1">
                      {/* Icon Picker */}
                      <div className="relative">
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Icon</label>
                        <button
                          type="button"
                          onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                          className="w-11 h-11 border-2 border-blue-400 bg-[#e9f2ff] hover:bg-blue-100 text-[#0c66e4] rounded-lg flex items-center justify-center cursor-pointer transition shadow-xs"
                          title="Select icon"
                        >
                          {renderCardButtonIcon(cardButtonIcon, 20)}
                        </button>

                        {/* Icon Picker Popover Grid (Screenshot 2) */}
                        {isIconPickerOpen && (
                          <div className="absolute top-14 left-0 z-50 bg-white border border-gray-200 shadow-2xl rounded-xl p-3 grid grid-cols-5 gap-2 w-72 max-h-80 overflow-y-auto">
                            {AVAILABLE_CARD_ICONS.map((item) => {
                              const IconComp = item.icon;
                              const isSelected = cardButtonIcon === item.name;
                              return (
                                <button
                                  key={item.name}
                                  type="button"
                                  onClick={() => {
                                    setCardButtonIcon(item.name);
                                    setIsIconPickerOpen(false);
                                  }}
                                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#e9f2ff] text-[#0c66e4] ring-2 ring-blue-500'
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                  title={item.name}
                                >
                                  <IconComp size={18} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Title input */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={cardButtonTitle}
                          onChange={(e) => setCardButtonTitle(e.target.value)}
                          placeholder="Button Name"
                          className="w-64 bg-[#fff8f8] border border-red-300 focus:border-blue-500 focus:bg-white rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none transition shadow-xs"
                        />
                      </div>

                      {/* Options checkboxes */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Options</label>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cardButtonEnabledDefault}
                            onChange={(e) => setCardButtonEnabledDefault(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Enabled by default</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cardButtonCloseCard}
                            onChange={(e) => setCardButtonCloseCard(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Close card when action is performed</span>
                        </label>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>

                      {cardButtonActions.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-2">
                          Your automation doesn't perform any actions yet. Add some actions from below.
                        </p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {cardButtonActions.map((action, idx) => (
                            <div
                              key={idx}
                              className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span className="text-sm font-medium text-gray-800">{action}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCardButtonActions(cardButtonActions.filter((_, i) => i !== idx))}
                                className="p-1.5 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove action"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!showCardButtonActionPicker && (
                        <div className="flex justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCardButtonActionPicker(true)}
                            className="w-full py-2.5 bg-[#ebecf0] hover:bg-[#dfe1e6] text-gray-800 font-semibold rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            + Add Action
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Picker (Screenshot 3) */}
                    {showCardButtonActionPicker && (
                      <div className="space-y-4 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900">Select an Action</h4>

                        {/* Category Tabs (Row 1 & Row 2 matching Screenshot 3) */}
                        <div className="space-y-2">
                          {/* Row 1 */}
                          <div className="flex items-center gap-1 flex-wrap border-b border-gray-200 pb-2">
                            {[
                              { id: 'move', label: 'Move', icon: ArrowRight },
                              { id: 'add_remove', label: 'Add/Remove', icon: Tag },
                              { id: 'dates', label: 'Dates', icon: Clock },
                              { id: 'checklists', label: 'Checklists', icon: CheckSquare },
                              { id: 'members', label: 'Members', icon: User },
                              { id: 'content', label: 'Content', icon: MessageSquare },
                              { id: 'fields', label: 'Fields', icon: Sliders },
                              { id: 'sort', label: 'Sort', icon: ArrowUpDown },
                              { id: 'cascade', label: 'Cascade', icon: Archive },
                            ].map(tab => {
                              const Icon = tab.icon;
                              const isActive = cardButtonActionCat === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setCardButtonActionCat(tab.id as any)}
                                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-blue-50 text-[#0c66e4] border-b-2 border-[#0c66e4]'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <Icon size={16} />
                                  <span>{tab.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Row 2 */}
                          <div className="flex items-center gap-1.5 pb-2">
                            {[
                              { id: 'jira', label: 'Jira', icon: Briefcase },
                              { id: 'bitbucket', label: 'Bitbucket', icon: GitBranch },
                              { id: 'slack', label: 'Slack', icon: Hash },
                            ].map(tab => {
                              const Icon = tab.icon;
                              const isActive = cardButtonActionCat === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setCardButtonActionCat(tab.id as any)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-blue-50 text-[#0c66e4] border border-blue-200'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <Icon size={14} />
                                  <span>{tab.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Cards under category */}
                        <div className="space-y-2.5 pt-2">
                          {cardButtonActionCat === 'move' && (
                            <>
                              {/* Action 1: move the card to [ the top of list ] [ List name ] [ layers ] */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                  <span className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium">
                                    move
                                  </span>
                                  <span>the card to</span>
                                  <select
                                    value={cardButtonMovePos}
                                    onChange={(e) => setCardButtonMovePos(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                  >
                                    <option value="the top of list">the top of list</option>
                                    <option value="the bottom of list">the bottom of list</option>
                                  </select>
                                  <select
                                    value={cardButtonTargetList}
                                    onChange={(e) => setCardButtonTargetList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                  <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Board layout">
                                    <Layers size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const actionStr = `move the card to ${cardButtonMovePos} "${cardButtonTargetList}"`;
                                    setCardButtonActions(prev => [...prev, actionStr]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  title="Add action"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {/* Action 2: move the card to [ the top of the list ] */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>move the card to</span>
                                  <select
                                    value={cardButtonMovePos}
                                    onChange={(e) => setCardButtonMovePos(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                  >
                                    <option value="the top of list">the top of the list</option>
                                    <option value="the bottom of list">the bottom of the list</option>
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const actionStr = `move the card to ${cardButtonMovePos}`;
                                    setCardButtonActions(prev => [...prev, actionStr]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  title="Add action"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {/* Action 3: [ archive ] the card */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <select
                                    value={cardButtonArchiveOption}
                                    onChange={(e) => setCardButtonArchiveOption(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                  >
                                    <option value="archive">archive</option>
                                    <option value="send back to board">send back to board</option>
                                  </select>
                                  <span>the card</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const actionStr = `${cardButtonArchiveOption} the card`;
                                    setCardButtonActions(prev => [...prev, actionStr]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  title="Add action"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {cardButtonActionCat === 'add_remove' && (
                            <>
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>add the</span>
                                  <input
                                    type="text"
                                    value={cardButtonLabelColor}
                                    onChange={(e) => setCardButtonLabelColor(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                  />
                                  <span>label to the card</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `add the "${cardButtonLabelColor}" label to the card`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>remove the</span>
                                  <input
                                    type="text"
                                    value={cardButtonLabelColor}
                                    onChange={(e) => setCardButtonLabelColor(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                  />
                                  <span>label from the card</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `remove the "${cardButtonLabelColor}" label from the card`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {cardButtonActionCat === 'dates' && (
                            <>
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-800">remove the card's due date</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `remove the card's due date`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-800">mark the due date as complete</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `mark the due date as complete`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {cardButtonActionCat === 'members' && (
                            <>
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-800">join the card</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `join the card`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-800">add a member to the card</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCardButtonActions(prev => [...prev, `add a member`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {cardButtonActionCat === 'content' && (
                            <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm text-gray-800 flex-1">
                                <span>post a comment that says</span>
                                <input
                                  type="text"
                                  value={cardButtonComment}
                                  onChange={(e) => setCardButtonComment(e.target.value)}
                                  className="flex-1 bg-white border border-gray-300 px-3 py-1 rounded text-xs focus:outline-blue-500 font-medium"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardButtonActions(prev => [...prev, `post a comment that says "${cardButtonComment}"`]);
                                }}
                                className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          )}

                          {cardButtonActionCat === 'checklists' && (
                            <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm text-gray-800">
                                <span>add an empty</span>
                                <input
                                  type="text"
                                  value={cardButtonChecklistName}
                                  onChange={(e) => setCardButtonChecklistName(e.target.value)}
                                  className="bg-white border border-gray-300 px-3 py-1 rounded text-xs focus:outline-blue-500 font-medium"
                                />
                                <span>checklist to the card</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardButtonActions(prev => [...prev, `add an empty "${cardButtonChecklistName}" checklist to the card`]);
                                }}
                                className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          )}

                          {['fields', 'sort', 'cascade', 'jira', 'bitbucket', 'slack'].includes(cardButtonActionCat) && (
                            <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-4 text-center space-y-2">
                              <p className="text-xs text-gray-600 capitalize">Configure {cardButtonActionCat} integrations for Card buttons</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardButtonActions(prev => [...prev, `trigger ${cardButtonActionCat} action`]);
                                }}
                                className="text-xs bg-[#0c66e4] text-white font-semibold px-3 py-1.5 rounded cursor-pointer hover:bg-[#0055cc]"
                              >
                                + Add {cardButtonActionCat} action
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: BOARD BUTTONS (MATCHING USER SCREENSHOTS) ================= */}
            {activeTab === 'board_buttons' && (
              <div className="space-y-6 max-w-4xl">
                {!isCreatingBoardButton ? (
                  /* --- LANDING VIEW (SCREENSHOT 1) --- */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Board buttons</h2>
                        <p className="text-sm text-gray-600 mt-1">Make multiple board actions happen with a single button.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingBoardButton(true);
                          setBoardButtonTitle('Button Name');
                          setBoardButtonIcon('Settings');
                          setIsBoardIconPickerOpen(false);
                          setBoardButtonEnabledDefault(true);
                          setBoardButtonActions([]);
                          setShowBoardButtonActionPicker(false);
                        }}
                        className="bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create button
                      </button>
                    </div>

                    {/* Examples block */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-800">Examples</h3>
                      <div className="space-y-2.5 text-sm text-gray-700">
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Monday setup:</strong> Archive all cards in list "This Week", and move all cards in list "Last Week" to "This Week".
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Prioritize:</strong> Sort the cards in list "Doing" by custom field "Priority" descending.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Zap size={15} className="text-gray-500 fill-gray-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-gray-900">Shuffle pick:</strong> Move 2 random cards from list "Backlog" to list "Doing".
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingBoardButton(true);
                          setBoardButtonTitle('Button Name');
                          setBoardButtonIcon('Settings');
                          setIsBoardIconPickerOpen(false);
                          setBoardButtonEnabledDefault(true);
                          setBoardButtonActions([]);
                          setShowBoardButtonActionPicker(false);
                        }}
                        className="mt-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        Create button
                      </button>
                    </div>

                    {/* Active Board Buttons List */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <h3 className="text-sm font-bold text-gray-800">Active board buttons ({boardButtons.length})</h3>
                      <div className="space-y-3">
                        {boardButtons.map((btn) => (
                          <div
                            key={btn.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 transition hover:border-gray-300"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                                {renderCardButtonIcon(btn.icon, 18)}
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900">{btn.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {btn.actions.join(' • ')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <span>Enable on this board</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = boardButtons.map(b => b.id === btn.id ? { ...b, enabled: !b.enabled } : b);
                                    saveBoardButtons(updated);
                                    onRuleExecuted?.(`${btn.enabled ? 'Disabled' : 'Enabled'} board button: ${btn.title}`);
                                  }}
                                  className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                                    btn.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                      btn.enabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </label>

                              <button
                                type="button"
                                onClick={() => {
                                  onRuleExecuted?.(`Executed board button: ${btn.title}`);
                                }}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                              >
                                Test Run
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = boardButtons.filter(b => b.id !== btn.id);
                                  saveBoardButtons(updated);
                                  onRuleExecuted?.(`Deleted board button: ${btn.title}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- CREATION WIZARD (SCREENSHOTS 2 & 3) --- */
                  <div className="space-y-6">
                    {/* Top Bar with Title, Save, Cancel */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">Create a Board Button</h2>
                        <Info size={16} className="text-gray-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!boardButtonTitle.trim() || boardButtonActions.length === 0}
                          onClick={() => {
                            if (!boardButtonTitle.trim() || boardButtonActions.length === 0) return;
                            const newButton = {
                              id: `bb-${Date.now()}`,
                              title: boardButtonTitle.trim(),
                              icon: boardButtonIcon,
                              enabled: boardButtonEnabledDefault,
                              actions: boardButtonActions
                            };
                            saveBoardButtons([newButton, ...boardButtons]);
                            onRuleExecuted?.(`Created board button: ${newButton.title}`);
                            setIsCreatingBoardButton(false);
                            setBoardButtonTitle('Button Name');
                            setBoardButtonActions([]);
                            setIsBoardIconPickerOpen(false);
                          }}
                          className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
                            boardButtonTitle.trim() && boardButtonActions.length > 0
                              ? 'bg-[#0c66e4] hover:bg-[#0055cc] text-white cursor-pointer shadow-xs'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingBoardButton(false);
                            setIsBoardIconPickerOpen(false);
                          }}
                          className="px-4 py-1.5 rounded text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Top Configuration Form: Icon, Title, Options (Screenshot 2) */}
                    <div className="flex items-start gap-8 flex-wrap pt-1">
                      {/* Icon Picker */}
                      <div className="relative">
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Icon</label>
                        <button
                          type="button"
                          onClick={() => setIsBoardIconPickerOpen(!isBoardIconPickerOpen)}
                          className="w-11 h-11 border-2 border-blue-400 bg-[#e9f2ff] hover:bg-blue-100 text-[#0c66e4] rounded-lg flex items-center justify-center cursor-pointer transition shadow-xs"
                          title="Select icon"
                        >
                          {renderCardButtonIcon(boardButtonIcon, 20)}
                        </button>

                        {/* Icon Picker Popover Grid */}
                        {isBoardIconPickerOpen && (
                          <div className="absolute top-14 left-0 z-50 bg-white border border-gray-200 shadow-2xl rounded-xl p-3 grid grid-cols-5 gap-2 w-72 max-h-80 overflow-y-auto">
                            {AVAILABLE_CARD_ICONS.map((item) => {
                              const IconComp = item.icon;
                              const isSelected = boardButtonIcon === item.name;
                              return (
                                <button
                                  key={item.name}
                                  type="button"
                                  onClick={() => {
                                    setBoardButtonIcon(item.name);
                                    setIsBoardIconPickerOpen(false);
                                  }}
                                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#e9f2ff] text-[#0c66e4] ring-2 ring-blue-500'
                                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                  title={item.name}
                                >
                                  <IconComp size={18} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Title input */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={boardButtonTitle}
                          onChange={(e) => setBoardButtonTitle(e.target.value)}
                          placeholder="Button Name"
                          className="w-64 bg-white border border-gray-300 focus:border-blue-500 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none transition shadow-xs"
                        />
                      </div>

                      {/* Options checkboxes */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Options</label>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={boardButtonEnabledDefault}
                            onChange={(e) => setBoardButtonEnabledDefault(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Enabled by default</span>
                        </label>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>

                      {boardButtonActions.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-2">
                          Your automation doesn't perform any actions yet. Add some actions from below.
                        </p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {boardButtonActions.map((action, idx) => (
                            <div
                              key={idx}
                              className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span className="text-sm font-medium text-gray-800">{action}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setBoardButtonActions(boardButtonActions.filter((_, i) => i !== idx))}
                                className="p-1.5 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="Remove action"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!showBoardButtonActionPicker && (
                        <div className="flex justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => setShowBoardButtonActionPicker(true)}
                            className="w-full py-2.5 bg-[#ebecf0] hover:bg-[#dfe1e6] text-gray-800 font-semibold rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            + Add Action
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Picker (Screenshot 3) */}
                    {showBoardButtonActionPicker && (
                      <div className="space-y-4 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900">Select an Action</h4>

                        {/* Category Tabs (Screenshot 3) */}
                        <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-200 pb-2">
                          {[
                            { id: 'add_card', label: 'Add Card', icon: Plus },
                            { id: 'move_cards', label: 'Move Cards', icon: ArrowRight },
                            { id: 'lists', label: 'Lists', icon: Layers },
                            { id: 'sort', label: 'Sort', icon: ArrowUpDown },
                            { id: 'other', label: 'Other', icon: Archive },
                            { id: 'jira', label: 'Jira', icon: Briefcase },
                            { id: 'slack', label: 'Slack', icon: Hash },
                          ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = boardButtonActionCat === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setBoardButtonActionCat(tab.id as any)}
                                className={`flex flex-col items-center gap-1 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-50 text-[#0c66e4] border-b-2 border-[#0c66e4]'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Action Templates under Category */}
                        <div className="space-y-3 pt-2">
                          {boardButtonActionCat === 'add_card' && (
                            <>
                              {/* Template 1: create a [new] card with title [Card title] in list [List name] (Screenshot 3) */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3.5 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                      <span>create a</span>
                                      <select
                                        value={boardButtonCardOption}
                                        onChange={(e) => setBoardButtonCardOption(e.target.value as any)}
                                        className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                      >
                                        <option value="new">new</option>
                                        <option value="unique">unique</option>
                                      </select>
                                      <span>card with title</span>
                                      <input
                                        type="text"
                                        value={boardButtonCardTitle}
                                        onChange={(e) => setBoardButtonCardTitle(e.target.value)}
                                        placeholder="Card title"
                                        className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[150px]"
                                      />
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Edit template">
                                        <Edit2 size={14} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                      <span>in list</span>
                                      <select
                                        value={boardButtonTargetList}
                                        onChange={(e) => setBoardButtonTargetList(e.target.value)}
                                        className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                      >
                                        {columns.map(c => (
                                          <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                      </select>
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Board layout">
                                        <Layers size={14} />
                                      </button>
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Labels">
                                        <Tag size={14} />
                                      </button>
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Checklist">
                                        <CheckSquare size={14} />
                                      </button>
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Members">
                                        <User size={14} />
                                      </button>
                                      <button type="button" className="p-1 text-gray-500 hover:text-gray-800" title="Due date">
                                        <Clock size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const titleStr = boardButtonCardTitle.trim() || 'New task';
                                      const actionStr = `create a ${boardButtonCardOption} card with title "${titleStr}" in list "${boardButtonTargetList}"`;
                                      setBoardButtonActions(prev => [...prev, actionStr]);
                                    }}
                                    className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                    title="Add action"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                                  By default, this action creates a new card. If you select the unique option, the card will be created only if one with the same title doesn't exist in the list (otherwise, the automation will stop and no further actions will be executed).
                                </p>
                              </div>

                              {/* Template 2: find card [Card title] and copy it in list [List name] (Screenshot 3) */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                  <span>find card</span>
                                  <input
                                    type="text"
                                    placeholder="Card title"
                                    id="bbFindCardTitleInput"
                                    className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[140px]"
                                  />
                                  <span>and copy it in list</span>
                                  <select
                                    value={boardButtonTargetList}
                                    onChange={(e) => setBoardButtonTargetList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('bbFindCardTitleInput') as HTMLInputElement | null;
                                    const titleStr = input?.value || 'Card title';
                                    const actionStr = `find card "${titleStr}" and copy it in list "${boardButtonTargetList}"`;
                                    setBoardButtonActions(prev => [...prev, actionStr]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                  title="Add action"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {boardButtonActionCat === 'move_cards' && (
                            <>
                              {/* Action 1: archive all cards in list */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>archive all cards in list</span>
                                  <select
                                    value={boardButtonSourceList}
                                    onChange={(e) => setBoardButtonSourceList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoardButtonActions(prev => [...prev, `Archive all cards in list "${boardButtonSourceList}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {/* Action 2: move all cards in list A to list B */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                  <span>move all cards in list</span>
                                  <select
                                    value={boardButtonSourceList}
                                    onChange={(e) => setBoardButtonSourceList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                  <span>to list</span>
                                  <select
                                    value={boardButtonDestList}
                                    onChange={(e) => setBoardButtonDestList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoardButtonActions(prev => [...prev, `move all cards in list "${boardButtonSourceList}" to "${boardButtonDestList}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              {/* Action 3: move X random cards from list A to list B */}
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                  <span>move</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={boardButtonRandomCount}
                                    onChange={(e) => setBoardButtonRandomCount(parseInt(e.target.value) || 1)}
                                    className="w-14 bg-white border border-gray-300 px-2 py-1 rounded text-xs font-medium text-center focus:outline-blue-500"
                                  />
                                  <span>random cards from list</span>
                                  <select
                                    value={boardButtonSourceList}
                                    onChange={(e) => setBoardButtonSourceList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                  <span>to list</span>
                                  <select
                                    value={boardButtonDestList}
                                    onChange={(e) => setBoardButtonDestList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoardButtonActions(prev => [...prev, `Move ${boardButtonRandomCount} random cards from list "${boardButtonSourceList}" to list "${boardButtonDestList}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {boardButtonActionCat === 'sort' && (
                            <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm text-gray-800 flex-wrap">
                                <span>sort the cards in list</span>
                                <select
                                  value={boardButtonTargetList}
                                  onChange={(e) => setBoardButtonTargetList(e.target.value)}
                                  className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                >
                                  {columns.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                                <span>by</span>
                                <select
                                  value={boardButtonSortField}
                                  onChange={(e) => setBoardButtonSortField(e.target.value)}
                                  className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                >
                                  <option value='custom field "Priority"'>custom field "Priority"</option>
                                  <option value='due date'>due date</option>
                                  <option value='card title'>card title</option>
                                </select>
                                <select
                                  value={boardButtonSortDirection}
                                  onChange={(e) => setBoardButtonSortDirection(e.target.value)}
                                  className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500"
                                >
                                  <option value="descending">descending</option>
                                  <option value="ascending">ascending</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setBoardButtonActions(prev => [...prev, `Sort the cards in list "${boardButtonTargetList}" by ${boardButtonSortField} ${boardButtonSortDirection}`]);
                                }}
                                className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          )}

                          {boardButtonActionCat === 'lists' && (
                            <>
                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>create a new list with title</span>
                                  <input
                                    type="text"
                                    placeholder="List name"
                                    id="bbNewListNameInput"
                                    className="bg-white border border-gray-300 px-3 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[140px]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('bbNewListNameInput') as HTMLInputElement | null;
                                    const name = input?.value || 'New List';
                                    setBoardButtonActions(prev => [...prev, `create a new list with title "${name}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>

                              <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-800">
                                  <span>archive list</span>
                                  <select
                                    value={boardButtonTargetList}
                                    onChange={(e) => setBoardButtonTargetList(e.target.value)}
                                    className="bg-white border border-gray-300 px-2.5 py-1 rounded text-xs font-medium focus:outline-blue-500 min-w-[120px]"
                                  >
                                    {columns.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoardButtonActions(prev => [...prev, `archive list "${boardButtonTargetList}"`]);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#0c66e4] hover:bg-[#0055cc] text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </>
                          )}

                          {['other', 'jira', 'slack'].includes(boardButtonActionCat) && (
                            <div className="bg-[#f4f5f7] border border-gray-200 rounded-lg p-4 text-center space-y-2">
                              <p className="text-xs text-gray-600 capitalize">Configure {boardButtonActionCat} integrations for Board buttons</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setBoardButtonActions(prev => [...prev, `trigger ${boardButtonActionCat} integration`]);
                                }}
                                className="text-xs bg-[#0c66e4] text-white font-semibold px-3 py-1.5 rounded cursor-pointer hover:bg-[#0055cc]"
                              >
                                + Add {boardButtonActionCat} action
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB: SUGGESTIONS (MATCHING USER SCREENSHOT) ================= */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4 max-w-4xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Automation suggestions</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Suggested automations are generated from your recent activity on this board.
                  </p>
                </div>

                {/* Info banner matching Screenshot 2 */}
                <div className="border border-blue-200 bg-[#e9f2ff] rounded-lg p-4 flex items-start gap-3 text-xs text-gray-800">
                  <Info size={18} className="text-[#0c66e4] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs mb-0.5">No suggestions are available.</h4>
                    <p className="text-gray-700 text-xs">
                      Check again for new suggestions after using the board for a while.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: ACTIVITY (MATCHING USER SCREENSHOT) ================= */}
            {activeTab === 'activity' && (
              <div className="space-y-5 max-w-4xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Activity</h2>
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                    This Workspace's quotas are shared between all Workspace members, for automations across all boards in the Workspace. Each run of an automation draws from the automation quota, and however many operations are needed for that automation's actions are drawn from the operation quota.
                  </p>
                  <a
                    href="#learn-more"
                    onClick={(e) => { e.preventDefault(); }}
                    className="text-xs text-[#0c66e4] hover:underline font-medium inline-block mt-1"
                  >
                    Learn more about Automation's features and quotas.
                  </a>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Automation logs</h3>
                  
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer mb-5">
                    <input
                      type="checkbox"
                      checked={activityFilterWarnings}
                      onChange={(e) => setActivityFilterWarnings(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Filter logs to only show warnings and errors</span>
                  </label>

                  {/* Logs list matching Screenshot 1 */}
                  {(!activityFilterWarnings ? activityLogs : activityLogs.filter(l => l.level !== 'info')).length === 0 ? (
                    <div className="text-xs text-gray-500 py-4 italic">No matching logs found.</div>
                  ) : (
                    <div className="space-y-4">
                      {activityLogs
                        .filter(l => !activityFilterWarnings || l.level !== 'info')
                        .map((log) => (
                          <div key={log.id} className="space-y-1.5">
                            <p className="text-xs font-semibold text-gray-700">{log.timestamp}</p>
                            <div className="flex items-start gap-2 text-xs text-gray-800">
                              <Info size={15} className="text-[#0c66e4] shrink-0 mt-0.5" />
                              <span>{log.message}</span>
                            </div>
                            <div className="ml-6 bg-[#f4f5f7] border border-gray-200 rounded-md p-2.5 font-mono text-xs text-gray-800">
                              {log.ruleText}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Banner matching Screenshot 1 */}
                  <div className="border border-blue-200 bg-[#e9f2ff] rounded-lg p-3.5 flex items-center gap-2.5 text-xs text-gray-800 font-medium mt-6">
                    <Info size={16} className="text-[#0c66e4] shrink-0" />
                    <span>There are no more logs.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'view_apps' && (
              <div className="space-y-4 max-w-4xl">
                <h2 className="text-xl font-bold text-gray-900">View apps</h2>
                <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center space-y-2 bg-[#fbfcfd]">
                  <p className="text-sm font-semibold text-gray-700">App automations</p>
                  <p className="text-xs text-gray-500">Integrate with Slack, Jira, Bitbucket, and more.</p>
                </div>
              </div>
            )}

          </main>
        </div>

      </div>
    </div>
  );
};
