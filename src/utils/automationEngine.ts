import { api } from '../api';

export interface AutomationLogEntry {
  id: string;
  timestamp: string;
  message: string;
  ruleText: string;
  level: 'info' | 'warning' | 'error';
}

export function logAutomationActivity(ruleText: string, message = 'The automation has been executed:') {
  try {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const timestamp = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const existing: AutomationLogEntry[] = JSON.parse(localStorage.getItem('orbit_automation_activity_logs') || '[]');
    const newEntry: AutomationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      message,
      ruleText,
      level: 'info'
    };
    
    const updated = [newEntry, ...existing.slice(0, 49)];
    localStorage.setItem('orbit_automation_activity_logs', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to write automation activity log:', err);
  }
}

/**
 * Execute an array of action text strings on a single card
 */
export async function executeCardActionString(
  actionStr: string,
  card: any,
  columns: { id: string; name: string }[]
): Promise<string | null> {
  const lower = actionStr.toLowerCase();

  // 1. Move card to top/bottom of list "X"
  if (lower.includes('move the card to') || lower.includes('move to')) {
    let targetCol = columns[0];
    for (const col of columns) {
      if (lower.includes(`"${col.name.toLowerCase()}"`) || lower.includes(`'${col.name.toLowerCase()}'`)) {
        targetCol = col;
        break;
      }
    }
    if (lower.includes('done') && !targetCol) {
      targetCol = columns.find(c => c.name.toLowerCase() === 'done') || columns[columns.length - 1];
    }
    if (targetCol) {
      await api.put(`/tasks/${card.id}`, { columnId: targetCol.id });
      return `Moved card to ${targetCol.name}`;
    }
  }

  // 2. Archive the card
  if (lower.includes('archive') && lower.includes('card')) {
    await api.put(`/tasks/${card.id}`, { completed: true });
    return `Archived card "${card.title}"`;
  }

  // 3. Mark due date complete
  if (lower.includes('mark the due date as complete') || lower.includes('mark due date as complete')) {
    await api.put(`/tasks/${card.id}`, { completed: true });
    return `Marked due date complete`;
  }

  // 4. Remove due date
  if (lower.includes('remove the due date') || lower.includes("remove the card's due date")) {
    await api.put(`/tasks/${card.id}`, { due_date: null });
    return `Removed due date`;
  }

  // 5. Set due date in N days
  const daysMatch = lower.match(/set (?:the )?due date in (\d+) (?:working )?days/);
  if (daysMatch && daysMatch[1]) {
    const days = parseInt(daysMatch[1], 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    await api.put(`/tasks/${card.id}`, { due_date: dueDate.toISOString() });
    return `Set due date to ${dueDate.toLocaleDateString()}`;
  }

  // 6. Add label
  const addLabelMatch = actionStr.match(/add (?:the )?["']?([^"']+)["']? label/i);
  if (addLabelMatch && addLabelMatch[1]) {
    const labelToAdd = addLabelMatch[1].trim();
    let existingLabels: string[] = [];
    if (Array.isArray(card.labels)) {
      existingLabels = card.labels.map((l: any) => typeof l === 'string' ? l : (l.name || ''));
    } else if (typeof card.labels === 'string' && card.labels) {
      existingLabels = card.labels.split(',').map((l: string) => l.trim());
    }
    if (!existingLabels.some(l => l.toLowerCase() === labelToAdd.toLowerCase())) {
      const newLabels = [...existingLabels, labelToAdd];
      await api.put(`/tasks/${card.id}`, { labels: newLabels });
      return `Added label "${labelToAdd}"`;
    }
    return `Label "${labelToAdd}" already added`;
  }

  // 7. Remove label
  const removeLabelMatch = actionStr.match(/remove (?:the )?["']?([^"']+)["']? label/i);
  if (removeLabelMatch && removeLabelMatch[1]) {
    const labelToRemove = removeLabelMatch[1].trim().toLowerCase();
    let existingLabels: string[] = [];
    if (Array.isArray(card.labels)) {
      existingLabels = card.labels.map((l: any) => typeof l === 'string' ? l : (l.name || ''));
    } else if (typeof card.labels === 'string' && card.labels) {
      existingLabels = card.labels.split(',').map((l: string) => l.trim());
    }
    const filtered = existingLabels.filter((l: string) => l.toLowerCase() !== labelToRemove);
    await api.put(`/tasks/${card.id}`, { labels: filtered });
    return `Removed label "${removeLabelMatch[1]}"`;
  }

  // 8. Join card / Add member
  if (
    lower.includes('join the card') || 
    lower.includes('join card') || 
    lower.includes('add a member') || 
    lower.includes('add member') || 
    lower.includes('assign to me')
  ) {
    const storedUser = localStorage.getItem('currentUser');
    const u = storedUser ? JSON.parse(storedUser) : null;
    const uid = u?.id || '1';
    await api.put(`/tasks/${card.id}`, { assigneeIds: [uid] });
    return `Assigned ${u?.name || 'member'} to card`;
  }

  // 9. Remove all members from the card
  if (lower.includes('remove all members')) {
    await api.put(`/tasks/${card.id}`, { assigneeIds: [] });
    return `Removed all members`;
  }

  // 10. Post comment
  const commentMatch = actionStr.match(/post (?:a )?comment (?:that says )?["']([^"']+)["']/i);
  if (commentMatch && commentMatch[1]) {
    const commentBody = commentMatch[1];
    await api.post(`/tasks/${card.id}/comments`, { body: commentBody });
    return `Posted comment "${commentBody}"`;
  }

  // 11. Add checklist
  const checklistMatch = actionStr.match(/add (?:the |an empty )?["']?([^"']+)["']? checklist/i);
  if (checklistMatch && checklistMatch[1]) {
    const checklistTitle = checklistMatch[1].trim();
    try {
      const { data } = await api.post(`/tasks/${card.id}/checklists`, { title: checklistTitle });
      if (data?.checklist?.id) {
        await api.post(`/tasks/${card.id}/checklists/${data.checklist.id}/items`, { title: 'First item' });
      }
    } catch {}
    return `Added checklist "${checklistTitle}"`;
  }

  return null;
}

/**
 * Run Board Rules when events occur (e.g. Card created, Card moved, Card marked complete)
 */
export async function triggerBoardRulesForEvent(
  eventType: 'CARD_CREATED' | 'CARD_MOVED' | 'CARD_MARKED_COMPLETE' | 'MEMBER_ADDED',
  payload: {
    card: any;
    fromColumn?: { id: string; name: string };
    toColumn?: { id: string; name: string };
  },
  columns: { id: string; name: string }[]
): Promise<string[]> {
  const executedReports: string[] = [];

  try {
    const rawRules = localStorage.getItem('orbit_board_rules');
    if (!rawRules) return executedReports;

    const rules = JSON.parse(rawRules);
    if (!Array.isArray(rules)) return executedReports;

    for (const rule of rules) {
      if (!rule.enabled) continue;
      const trigDesc = (rule.trigger?.desc || rule.title || '').toLowerCase();

      let shouldRun = false;

      if (eventType === 'CARD_CREATED') {
        if (trigDesc.includes('created') || trigDesc.includes('added to list')) {
          if (payload.toColumn && trigDesc.includes(payload.toColumn.name.toLowerCase())) {
            shouldRun = true;
          } else if (!trigDesc.includes('in list')) {
            shouldRun = true;
          }
        }
      } else if (eventType === 'CARD_MOVED') {
        if (trigDesc.includes('moved to list') || trigDesc.includes('moved')) {
          if (payload.toColumn && trigDesc.includes(payload.toColumn.name.toLowerCase())) {
            shouldRun = true;
          }
        }
      } else if (eventType === 'CARD_MARKED_COMPLETE') {
        if (trigDesc.includes('marked as complete') || trigDesc.includes('completed')) {
          shouldRun = true;
        }
      } else if (eventType === 'MEMBER_ADDED') {
        if (trigDesc.includes('added to a card') || trigDesc.includes('join')) {
          shouldRun = true;
        }
      }

      if (shouldRun) {
        const actionList: string[] = rule.actions?.map((a: any) => a.desc || a.type) || [];
        for (const act of actionList) {
          const res = await executeCardActionString(act, payload.card, columns);
          if (res) executedReports.push(res);
        }
        logAutomationActivity(rule.title || rule.trigger?.desc || 'Rule executed', 'Rule automation executed:');
      }
    }
  } catch (err) {
    console.error('Error running board rules:', err);
  }

  return executedReports;
}

/**
 * Execute a Card Button on a card
 */
export async function runCardButton(
  button: {
    id: string;
    title: string;
    icon: string;
    enabled: boolean;
    closeCard?: boolean;
    actions: string[];
  },
  card: any,
  columns: { id: string; name: string }[]
): Promise<{ success: boolean; executed: string[]; closeCard: boolean }> {
  const executed: string[] = [];

  for (const act of button.actions) {
    const res = await executeCardActionString(act, card, columns);
    if (res) executed.push(res);
  }

  logAutomationActivity(
    `${button.title}: ${button.actions.join(', ')}`,
    `Card button "${button.title}" executed on card "${card.title}":`
  );

  return {
    success: true,
    executed,
    closeCard: Boolean(button.closeCard)
  };
}

/**
 * Check Due Date Automations against tasks on the board
 */
export async function checkDueDateAutomations(
  tasks: any[],
  columns: { id: string; name: string }[]
): Promise<string[]> {
  const executed: string[] = [];

  try {
    const raw = localStorage.getItem('orbit_due_date_rules');
    if (!raw) return executed;
    const rules = JSON.parse(raw);
    if (!Array.isArray(rules)) return executed;

    const activeRules = rules.filter(r => r.enabled);
    if (activeRules.length === 0) return executed;

    const now = new Date().getTime();

    for (const rule of activeRules) {
      const ruleText = (rule.title || '').toLowerCase();

      // "The moment a card is due, move the card to the top of list "To Do" and join the card"
      if (ruleText.includes('the moment a card is due') || ruleText.includes('moment a card is due')) {
        for (const task of tasks) {
          if (!task.completed && task.due_date) {
            const dueTime = new Date(task.due_date).getTime();
            // If due now or past due within last 24h
            if (now >= dueTime && (now - dueTime) < 86400000) {
              const markerKey = `orbit_dd_triggered_${rule.id}_${task.id}`;
              if (!sessionStorage.getItem(markerKey)) {
                sessionStorage.setItem(markerKey, 'true');
                const actions = ruleText.split(',').slice(1).join(',').split(' and ');
                for (const act of actions) {
                  await executeCardActionString(act.trim(), task, columns);
                }
                executed.push(`Due date triggered for "${task.title}"`);
                logAutomationActivity(rule.title, `Due date automation triggered for "${task.title}":`);
              }
            }
          }
        }
      }

      // "2 hours before a card is due, add the red label to the card"
      if (ruleText.includes('hours before a card is due')) {
        for (const task of tasks) {
          if (!task.completed && task.due_date) {
            const dueTime = new Date(task.due_date).getTime();
            const diffHours = (dueTime - now) / 3600000;
            if (diffHours > 0 && diffHours <= 2) {
              const markerKey = `orbit_dd_triggered_2h_${rule.id}_${task.id}`;
              if (!sessionStorage.getItem(markerKey)) {
                sessionStorage.setItem(markerKey, 'true');
                await executeCardActionString('add the red label to the card', task, columns);
                executed.push(`Applied red label to "${task.title}" (due in < 2 hours)`);
                logAutomationActivity(rule.title, `Applied red label to "${task.title}" (due in < 2 hours):`);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error checking due date automations:', err);
  }

  return executed;
}
