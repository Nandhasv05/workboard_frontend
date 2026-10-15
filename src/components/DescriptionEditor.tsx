import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Plus, 
  AtSign, HelpCircle, ChevronDown, X, ExternalLink,
  Code, Quote, Minus, Table, Edit3, Eye, CheckSquare, AlignLeft
} from 'lucide-react';
import { filterMembers, memberSubtitle, type PortalUser } from '../utils/members';

interface DescriptionEditorProps {
  initialValue: string;
  portalUsers?: PortalUser[];
  onSave: (newDesc: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  initialValue,
  portalUsers = [],
  onSave,
  onCancel,
  readOnly = false
}) => {
  const cleanText = (val: string) => {
    return (val || '')
      .replace(/<!--is_template:true-->/g, '')
      .replace(/<!--custom_fields:[\s\S]*?-->/g, '')
      .replace(/<!--location:[\s\S]*?-->/g, '')
      .trim();
  };

  const initialClean = cleanText(initialValue);
  const [value, setValue] = useState(initialClean);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [showHeadingsMenu, setShowHeadingsMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showInsertMoreMenu, setShowInsertMoreMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // @Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = value !== initialClean;

  useEffect(() => {
    const cleaned = cleanText(initialValue);
    setValue(cleaned);
  }, [initialValue]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && activeTab === 'write') {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isEditing, activeTab]);

  // ==========================================
  // SMART FORMATTING HANDLERS
  // ==========================================

  // Apply Heading (1, 2, 3) or Normal text at line-level
  const applyHeading = (level: 1 | 2 | 3 | 0) => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Find the current line boundary
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const currentLine = val.substring(lineStart, lineEnd);
    // Strip existing heading hashes and list markers
    const cleanLine = currentLine
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/^-\s*\[[ xX]\]\s+/, '');

    let newLine = '';
    let cursorOffset = 0;

    if (level === 0) {
      // Normal text
      newLine = cleanLine || 'Normal text';
      cursorOffset = newLine.length;
    } else {
      const prefix = '#'.repeat(level) + ' ';
      const text = cleanLine.trim() || `Heading ${level}`;
      newLine = prefix + text;
      cursorOffset = newLine.length;
    }

    const nextVal = val.substring(0, lineStart) + newLine + val.substring(lineEnd);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      if (!cleanLine.trim()) {
        const prefixLen = level > 0 ? level + 1 : 0;
        el.setSelectionRange(lineStart + prefixLen, lineStart + newLine.length);
      } else {
        el.setSelectionRange(lineStart + cursorOffset, lineStart + cursorOffset);
      }
    }, 10);
  };

  // Apply Line / Multi-line List formatting
  const applyList = (type: 'bullet' | 'number' | 'checklist') => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const selectedText = val.substring(lineStart, lineEnd);
    const lines = selectedText.split('\n');

    const transformed = lines.map((line, idx) => {
      // Strip existing list markers and heading markers
      const stripped = line
        .replace(/^(\s*)(?:[-*+]|\d+\.|-\s*\[[\sxX]\])\s+/, '$1')
        .replace(/^#{1,6}\s+/, '');

      if (type === 'bullet') {
        if (!stripped.trim()) return '- Bullet item';
        return `- ${stripped.trim()}`;
      } else if (type === 'number') {
        if (!stripped.trim()) return `${idx + 1}. Numbered item`;
        return `${idx + 1}. ${stripped.trim()}`;
      } else {
        if (!stripped.trim()) return '- [ ] Checklist task';
        return `- [ ] ${stripped.trim()}`;
      }
    });

    const replacement = transformed.join('\n');
    const nextVal = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      if (lines.length === 1 && lines[0] !== undefined && !lines[0].trim()) {
        const prefixLen = type === 'checklist' ? 6 : (type === 'number' ? 3 : 2);
        el.setSelectionRange(lineStart + prefixLen, lineStart + replacement.length);
      } else {
        el.setSelectionRange(lineStart + replacement.length, lineStart + replacement.length);
      }
    }, 10);
  };

  // Apply Inline formatting: bold (**), italic (*), code (`), strikethrough (~~)
  const applyInline = (token: '**' | '*' | '`' | '~~', defaultText: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Case 1: Selection exists
    if (start !== end) {
      const selected = val.substring(start, end);
      const tokenLen = token.length;

      // Toggle off if already wrapped
      if (selected.startsWith(token) && selected.endsWith(token) && selected.length >= tokenLen * 2) {
        const unwrapped = selected.slice(tokenLen, -tokenLen);
        const nextVal = val.substring(0, start) + unwrapped + val.substring(end);
        setValue(nextVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start, start + unwrapped.length);
        }, 10);
        return;
      }

      // Wrap selection
      const wrapped = `${token}${selected}${token}`;
      const nextVal = val.substring(0, start) + wrapped + val.substring(end);
      setValue(nextVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tokenLen, start + tokenLen + selected.length);
      }, 10);
      return;
    }

    // Case 2: No selection - Check if cursor is adjacent to an existing word
    const before = val.substring(0, start);
    const after = val.substring(start);
    const wordBeforeMatch = before.match(/(\w+)$/);
    const wordAfterMatch = after.match(/^(\w+)/);

    if (wordBeforeMatch || wordAfterMatch) {
      const beforeLen = (wordBeforeMatch && wordBeforeMatch[1]) ? wordBeforeMatch[1].length : 0;
      const afterLen = (wordAfterMatch && wordAfterMatch[1]) ? wordAfterMatch[1].length : 0;
      const wordStart = start - beforeLen;
      const wordEnd = start + afterLen;
      const word = val.substring(wordStart, wordEnd);

      if (word && !/^[#\-*`~]+$/.test(word)) {
        const wrapped = `${token}${word}${token}`;
        const nextVal = val.substring(0, wordStart) + wrapped + val.substring(wordEnd);
        setValue(nextVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(wordStart + token.length, wordStart + token.length + word.length);
        }, 10);
        return;
      }
    }

    // Case 3: Insert placeholder with smart spacing
    const prevChar = start > 0 ? (val[start - 1] ?? '') : '';
    const needsLeadingSpace = start > 0 && !/\s/.test(prevChar) && !val.substring(0, start).endsWith(token);
    const leadingSpace = needsLeadingSpace ? ' ' : '';
    const insertion = `${leadingSpace}${token}${defaultText}${token}`;
    const nextVal = val.substring(0, start) + insertion + val.substring(end);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      const selStart = start + leadingSpace.length + token.length;
      const selEnd = selStart + defaultText.length;
      el.setSelectionRange(selStart, selEnd);
    }, 10);
  };

  // Apply Block formatting (Code block, Quote, Table, Divider)
  const applyBlock = (type: 'code' | 'quote' | 'table' | 'divider') => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const prevChar = start > 0 ? (val[start - 1] ?? '') : '';
    const prevPrevChar = start > 1 ? (val[start - 2] ?? '') : '';
    const needsLeadingNewline = start > 0 && prevChar !== '\n';
    const prefixNewlines = needsLeadingNewline ? (start > 1 && prevPrevChar !== '\n' ? '\n\n' : '\n') : '';

    let insertContent = '';
    let selectOffsetStart = 0;
    let selectOffsetEnd = 0;

    if (type === 'code') {
      insertContent = `${prefixNewlines}\`\`\`\nCode block\n\`\`\`\n`;
      selectOffsetStart = prefixNewlines.length + 4;
      selectOffsetEnd = selectOffsetStart + 10;
    } else if (type === 'quote') {
      insertContent = `${prefixNewlines}> Quote text\n`;
      selectOffsetStart = prefixNewlines.length + 2;
      selectOffsetEnd = selectOffsetStart + 10;
    } else if (type === 'table') {
      insertContent = `${prefixNewlines}| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n\n`;
      selectOffsetStart = insertContent.length;
      selectOffsetEnd = selectOffsetStart;
    } else if (type === 'divider') {
      insertContent = `${prefixNewlines}---\n\n`;
      selectOffsetStart = insertContent.length;
      selectOffsetEnd = selectOffsetStart;
    }

    const nextVal = val.substring(0, start) + insertContent + val.substring(end);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + selectOffsetStart, start + selectOffsetEnd);
    }, 10);
  };

  // Insert Link
  const handleInsertLink = () => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = val.substring(start, end) || 'link text';

    const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
    if (!url) return;

    const replacement = `[${selected}](${url})`;
    const nextVal = val.substring(0, start) + replacement + val.substring(end);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1 + selected.length);
    }, 10);
  };

  // Insert Image
  const handleInsertImage = () => {
    const el = textareaRef.current;
    if (!el) return;

    const val = value;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    const imgUrl = window.prompt('Enter image URL:');
    if (!imgUrl) return;

    const prevChar = start > 0 ? (val[start - 1] ?? '') : '';
    const needsNewline = start > 0 && prevChar !== '\n';
    const insertion = `${needsNewline ? '\n' : ''}![Image](${imgUrl})\n`;
    const nextVal = val.substring(0, start) + insertion + val.substring(end);
    setValue(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 10);
  };

  // Handle Enter key for smart list continuation & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyInline('**', 'bold text');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyInline('*', 'italic text');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      handleInsertLink();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const el = textareaRef.current;
      if (!el) return;

      const val = value;
      const start = el.selectionStart;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);

      // Checklist: - [ ] or - [x]
      const checklistMatch = currentLine.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (checklistMatch) {
        const indent = checklistMatch[1] ?? '';
        const content = checklistMatch[3] ?? '';
        if (!content.trim()) {
          // Empty checklist item: cancel list
          e.preventDefault();
          const nextVal = val.substring(0, lineStart) + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
          return;
        } else {
          // Continue checklist
          e.preventDefault();
          const insertion = `\n${indent}- [ ] `;
          const nextVal = val.substring(0, start) + insertion + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(start + insertion.length, start + insertion.length), 10);
          return;
        }
      }

      // Bullet list: - or *
      const bulletMatch = currentLine.match(/^(\s*)([-*])\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1] ?? '';
        const marker = bulletMatch[2] ?? '-';
        const content = bulletMatch[3] ?? '';
        if (!content.trim()) {
          e.preventDefault();
          const nextVal = val.substring(0, lineStart) + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
          return;
        } else {
          e.preventDefault();
          const insertion = `\n${indent}${marker} `;
          const nextVal = val.substring(0, start) + insertion + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(start + insertion.length, start + insertion.length), 10);
          return;
        }
      }

      // Numbered list: 1. or 2.
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberMatch) {
        const indent = numberMatch[1] ?? '';
        const numStr = numberMatch[2] ?? '1';
        const num = parseInt(numStr, 10);
        const content = numberMatch[3] ?? '';
        if (!content.trim()) {
          e.preventDefault();
          const nextVal = val.substring(0, lineStart) + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
          return;
        } else {
          e.preventDefault();
          const insertion = `\n${indent}${num + 1}. `;
          const nextVal = val.substring(0, start) + insertion + val.substring(start);
          setValue(nextVal);
          setTimeout(() => el.setSelectionRange(start + insertion.length, start + insertion.length), 10);
          return;
        }
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);

    // Detect @mention
    const cursorPos = e.target.selectionStart;
    const textBefore = newVal.slice(0, cursorPos);
    const lastAtIndex = textBefore.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(textBefore[lastAtIndex - 1] || ''))) {
      const query = textBefore.slice(lastAtIndex + 1);
      if (!query.includes(' ') && query.length <= 20) {
        setMentionQuery(query.toLowerCase());
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (user: PortalUser) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const lastAtIndex = textBefore.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const handle = user.username || user.name;
      const nextVal = `${textBefore.slice(0, lastAtIndex)}@${handle} ${textAfter}`;
      setValue(nextVal);
      setMentionQuery(null);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(lastAtIndex + handle.length + 2, lastAtIndex + handle.length + 2);
      }, 20);
    }
  };

  // Toggle interactive checklist item in rendered view or preview
  const handleToggleChecklist = (lineIndex: number, currentChecked: boolean) => {
    const lines = value.split('\n');
    const oldLine = lines[lineIndex];
    if (oldLine !== undefined) {
      const newLine = currentChecked 
        ? oldLine.replace(/^(\s*-\s*\[)[xX](\]\s*)/, '$1 $2')
        : oldLine.replace(/^(\s*-\s*\[)\s*(\]\s*)/, '$1x$2');
      lines[lineIndex] = newLine;
      const nextVal = lines.join('\n');
      setValue(nextVal);
      if (!isEditing) {
        onSave(nextVal);
      }
    }
  };

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
    setActiveTab('write');
  };

  const handleDiscard = () => {
    setValue(initialClean);
    setIsEditing(false);
    setActiveTab('write');
    onCancel?.();
  };

  // Extract embedded images
  const embeddedImages = React.useMemo(() => {
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches: { caption: string; url: string }[] = [];
    let m;
    while ((m = regex.exec(value)) !== null) {
      const url = m[2];
      if (url) {
        matches.push({ caption: m[1] || 'Image', url });
      }
    }
    return matches;
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <AlignLeft size={18} className="text-gray-700" />
          <span>Description</span>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && isEditing && (
            <span className="border border-[#f5cd47] bg-[#fef3c7] text-[#854d0e] font-semibold text-[11px] px-2 py-0.5 rounded-md animate-in fade-in">
              Unsaved changes
            </span>
          )}

          {!readOnly && !isEditing && value.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-2.5 py-1 text-xs font-semibold text-[#44546f] hover:text-[#0c66e4] hover:bg-blue-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Rendered View (when not editing) */}
      {!isEditing ? (
        value.trim().length === 0 ? (
          <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={`min-h-[64px] p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-100/80 border border-dashed border-gray-200 text-gray-400 text-sm transition-all flex items-center select-none ${
              !readOnly ? 'cursor-pointer hover:border-gray-300 group' : ''
            }`}
          >
            <span className="group-hover:text-gray-600 transition-colors">
              Add a more detailed description...
            </span>
          </div>
        ) : (
          <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={`p-4 rounded-xl bg-white border border-gray-200 shadow-2xs text-sm text-gray-800 transition-all ${
              !readOnly ? 'cursor-pointer hover:border-[#0c66e4]/40 hover:shadow-xs group' : ''
            }`}
          >
            <MarkdownRenderer content={value} onToggleChecklist={handleToggleChecklist} />
          </div>
        )
      ) : (
        /* Editing Box */
        <div className="border border-[#091e4224] focus-within:border-[#0c66e4] focus-within:ring-2 focus-within:ring-[#0c66e4]/20 rounded-xl overflow-hidden bg-white shadow-xs transition-all flex flex-col">
          {/* Formatting Toolbar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#091e4214] bg-[#f8f9fa] flex-wrap gap-1 text-[#44546f]">
            {/* Left toolbar groups */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Headings Tt dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHeadingsMenu(!showHeadingsMenu)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-[#091e420f] text-xs font-bold transition-colors cursor-pointer"
                  title="Text style"
                >
                  <span>Tt</span>
                  <ChevronDown size={12} />
                </button>

                {showHeadingsMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowHeadingsMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-40 text-xs">
                      <button
                        type="button"
                        onClick={() => { applyHeading(0); setShowHeadingsMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800"
                      >
                        Normal text
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyHeading(1); setShowHeadingsMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-900 font-bold text-sm"
                      >
                        Heading 1
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyHeading(2); setShowHeadingsMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-900 font-semibold"
                      >
                        Heading 2
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyHeading(3); setShowHeadingsMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 font-medium"
                      >
                        Heading 3
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bold */}
              <button
                type="button"
                onClick={() => applyInline('**', 'bold text')}
                className="p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                title="Bold (Ctrl+B)"
              >
                <Bold size={14} />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => applyInline('*', 'italic text')}
                className="p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                title="Italic (Ctrl+I)"
              >
                <Italic size={14} />
              </button>

              {/* Lists dropdown := */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowListMenu(!showListMenu)}
                  className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                  title="Lists"
                >
                  <List size={14} />
                  <ChevronDown size={11} />
                </button>

                {showListMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowListMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-40 text-xs">
                      <button
                        type="button"
                        onClick={() => { applyList('bullet'); setShowListMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <List size={13} /> Bullet list
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyList('number'); setShowListMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <ListOrdered size={13} /> Numbered list
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyList('checklist'); setShowListMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <CheckSquare size={13} /> Checklist
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Link */}
              <button
                type="button"
                onClick={handleInsertLink}
                className="p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                title="Insert Link (Ctrl+K)"
              >
                <LinkIcon size={14} />
              </button>

              {/* Image */}
              <button
                type="button"
                onClick={handleInsertImage}
                className="p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                title="Insert Image"
              >
                <ImageIcon size={14} />
              </button>

              {/* Insert More + dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowInsertMoreMenu(!showInsertMoreMenu)}
                  className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[#091e420f] transition-colors cursor-pointer"
                  title="Insert more"
                >
                  <Plus size={14} />
                  <ChevronDown size={11} />
                </button>

                {showInsertMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowInsertMoreMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-40 text-xs">
                      <button
                        type="button"
                        onClick={() => { applyBlock('code'); setShowInsertMoreMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <Code size={13} /> Code block
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyBlock('quote'); setShowInsertMoreMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <Quote size={13} /> Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyBlock('table'); setShowInsertMoreMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <Table size={13} /> Table
                      </button>
                      <button
                        type="button"
                        onClick={() => { applyBlock('divider'); setShowInsertMoreMenu(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-gray-800 flex items-center gap-2"
                      >
                        <Minus size={13} /> Divider
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right toolbar items */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const el = textareaRef.current;
                  if (el) {
                    const start = el.selectionStart;
                    const nextVal = value.substring(0, start) + '@' + value.substring(start);
                    setValue(nextVal);
                    setMentionQuery('');
                    setTimeout(() => {
                      el.focus();
                      el.setSelectionRange(start + 1, start + 1);
                    }, 10);
                  }
                }}
                className="p-1 rounded hover:bg-[#091e420f] transition-colors cursor-pointer text-[#44546f] hover:text-blue-600"
                title="Mention a member (@)"
              >
                <AtSign size={14} />
              </button>

              {/* Write / Preview Tab Switcher */}
              <div className="flex items-center bg-gray-200/70 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    activeTab === 'write'
                      ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#0c66e4] shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Markdown Preview"
                >
                  <Eye size={11} />
                  <span>Preview</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-1 rounded hover:bg-[#091e420f] transition-colors cursor-pointer text-[#44546f] hover:text-blue-600"
                title="Formatting Help"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative p-3 min-h-[140px]">
            {activeTab === 'write' ? (
              <>
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a more detailed description... (Type @ to mention, use toolbar for headings, lists, bold, etc.)"
                  className="w-full bg-transparent text-sm text-gray-900 outline-none resize-y min-h-[120px] font-sans leading-relaxed"
                  rows={6}
                />

                {/* Autocomplete for @Mention */}
                {mentionQuery !== null && (
                  <div className="absolute left-6 top-14 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center gap-1">
                      <AtSign size={11} /> Mention Member
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filterMembers(portalUsers, mentionQuery)
                        .slice(0, 8)
                        .map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectMention(u)}
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-blue-50 transition-colors cursor-pointer text-gray-800"
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] uppercase shrink-0">
                              {(u.name || 'U').charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold">{u.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{memberSubtitle(u)}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Live Preview Tab */
              <div className="min-h-[120px] py-1 text-sm text-gray-800">
                {value.trim().length === 0 ? (
                  <div className="text-gray-400 italic text-xs py-4 text-center">
                    Nothing to preview. Type something in Write mode!
                  </div>
                ) : (
                  <MarkdownRenderer content={value} onToggleChecklist={handleToggleChecklist} />
                )}
              </div>
            )}

            {/* Embedded Image Previews */}
            {embeddedImages.length > 0 && activeTab === 'write' && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
                {embeddedImages.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs max-w-xs">
                    <img src={img.url} alt={img.caption} className="max-h-36 w-auto object-cover rounded-lg" />
                    <div className="p-1.5 text-[11px] font-medium text-gray-600 truncate bg-white border-t border-gray-100">
                      {img.caption}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Row (when editing) */}
      {isEditing && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="py-1.5 px-4 bg-[#0c66e4] hover:bg-[#0055cc] text-white font-semibold rounded-md text-xs transition-colors cursor-pointer shadow-xs"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="py-1.5 px-3 hover:bg-[#091e420f] text-[#44546f] hover:text-[#172b4d] font-semibold rounded-md text-xs transition-colors cursor-pointer"
            >
              Discard changes
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="border border-gray-300 rounded-md px-2.5 py-1 text-xs text-[#44546f] hover:bg-gray-50 hover:text-[#172b4d] transition-colors cursor-pointer flex items-center gap-1 font-medium"
          >
            <span>Formatting help</span>
          </button>
        </div>
      )}

      {/* Formatting Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h4 className="font-bold text-gray-900 text-sm">Markdown Formatting Help</h4>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-xs text-gray-700">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono"># Heading 1</code>
                <span className="font-bold text-gray-900 text-sm">Heading 1</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">## Heading 2</code>
                <span className="font-semibold text-gray-800">Heading 2</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">**bold**</code>
                <span className="font-bold text-gray-900">bold</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">*italic*</code>
                <span className="italic text-gray-800">italic</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">- Bullet item</code>
                <span>• bullet list</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">1. Numbered item</code>
                <span>1. numbered list</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">- [ ] Checklist task</code>
                <span className="flex items-center gap-1"><CheckSquare size={12} className="text-blue-600" /> task checklist</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">[Link](url)</code>
                <span className="text-blue-600 underline">clickable link</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">@username</code>
                <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">team mention</span>
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ROBUST MARKDOWN RENDERER COMPONENT
// ==========================================

interface MarkdownRendererProps {
  content: string;
  onToggleChecklist?: (lineIndex: number, currentChecked: boolean) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onToggleChecklist
}) => {
  if (!content || !content.trim()) {
    return <span className="text-gray-400 italic">No description provided.</span>;
  }

  // Parse inline elements (bold, italic, code, links, images, mentions)
  const renderInline = (text: string, keyPrefix: string): React.ReactNode => {
    const tokenRegex = /(!?\[(?:[^\]]*)\]\((?:[^)]+)\)|\*\*(?:[^*]+)\*\*|\*(?:[^*]+)\*|`([^`]+)`|~~(?:[^~]+)~~|@[\w\.-]+)/g;
    const parts = text.split(tokenRegex).filter(Boolean);

    return parts.map((part, idx) => {
      const k = `${keyPrefix}-${idx}`;

      // Image: ![alt](url)
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch && imgMatch[2]) {
        return (
          <span key={k} className="block my-2">
            <img 
              src={imgMatch[2]} 
              alt={imgMatch[1] || 'Image'} 
              className="max-h-72 max-w-full rounded-lg border border-gray-200 shadow-xs object-cover" 
            />
            {imgMatch[1] && (
              <span className="block text-[11px] text-gray-500 mt-1 font-medium">{imgMatch[1]}</span>
            )}
          </span>
        );
      }

      // Link: [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        return (
          <a
            key={k}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#0c66e4] hover:text-[#0055cc] hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink size={10} className="inline opacity-70" />
          </a>
        );
      }

      // Bold: **text**
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch && boldMatch[1]) {
        return <strong key={k} className="font-bold text-gray-900">{boldMatch[1]}</strong>;
      }

      // Italic: *text*
      const italicMatch = part.match(/^\*([^*]+)\*$/);
      if (italicMatch && italicMatch[1]) {
        return <em key={k} className="italic text-gray-800">{italicMatch[1]}</em>;
      }

      // Code: `code`
      const codeMatch = part.match(/^`([^`]+)`$/);
      if (codeMatch && codeMatch[1]) {
        return (
          <code key={k} className="bg-gray-100 text-rose-700 px-1 py-0.5 rounded text-[12px] font-mono border border-gray-200/60">
            {codeMatch[1]}
          </code>
        );
      }

      // Strikethrough: ~~text~~
      const strikeMatch = part.match(/^~~([^~]+)~~$/);
      if (strikeMatch && strikeMatch[1]) {
        return <del key={k} className="line-through text-gray-400">{strikeMatch[1]}</del>;
      }

      // Mention: @username
      const mentionMatch = part.match(/^@([\w\.-]+)$/);
      if (mentionMatch && mentionMatch[1]) {
        return (
          <span key={k} className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 mx-0.5">
            @{mentionMatch[1]}
          </span>
        );
      }

      return <span key={k}>{part}</span>;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // 1. Code Block: ```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[i] ?? '');
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-[#1e293b] text-gray-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 shadow-xs">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // 2. Heading 1: # ...
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match && h1Match[1]) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-gray-900 mt-3 mb-1.5 pb-1 border-b border-gray-100">
          {renderInline(h1Match[1], `h1-${i}`)}
        </h1>
      );
      i++;
      continue;
    }

    // 3. Heading 2: ## ...
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match && h2Match[1]) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-gray-900 mt-2.5 mb-1">
          {renderInline(h2Match[1], `h2-${i}`)}
        </h2>
      );
      i++;
      continue;
    }

    // 4. Heading 3: ### ...
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match && h3Match[1]) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-gray-900 mt-2 mb-1">
          {renderInline(h3Match[1], `h3-${i}`)}
        </h3>
      );
      i++;
      continue;
    }

    // 5. Horizontal rule: --- or ***
    if (/^(---|---|\*\*\*|___)\s*$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-200" />);
      i++;
      continue;
    }

    // 6. Blockquote: > ...
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('>')) {
        quoteLines.push((lines[i] ?? '').replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-3 border-[#0c66e4] bg-blue-50/50 pl-3 py-1.5 my-2 rounded-r-md text-gray-700 italic text-sm">
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{renderInline(ql, `ql-${i}-${qIdx}`)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    // 7. Checklist: - [ ] or - [x]
    const checkMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch && checkMatch[2]) {
      const currentLineIdx = i;
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const taskText = checkMatch[3] ?? '';

      elements.push(
        <div 
          key={`check-${i}`} 
          className="flex items-start gap-2 py-0.5 text-sm group"
          onClick={(e) => {
            if (onToggleChecklist) {
              e.stopPropagation();
              onToggleChecklist(currentLineIdx, isChecked);
            }
          }}
        >
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="mt-1 h-3.5 w-3.5 rounded text-[#0c66e4] border-gray-300 focus:ring-0 cursor-pointer"
          />
          <span className={`leading-relaxed ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {renderInline(taskText, `check-text-${i}`)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // 8. Bullet list: - ... or * ...
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: { text: string; idx: number }[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '') && !/^\s*-\s*\[[ xX]\]/.test(lines[i] ?? '')) {
        const itemLine = lines[i] ?? '';
        listItems.push({ text: itemLine.replace(/^\s*[-*]\s+/, ''), idx: i });
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1.5 space-y-0.5 text-sm text-gray-800">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInline(item.text, `li-${item.idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 9. Numbered list: 1. ...
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: { text: string; idx: number }[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        const itemLine = lines[i] ?? '';
        listItems.push({ text: itemLine.replace(/^\s*\d+\.\s+/, ''), idx: i });
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1.5 space-y-0.5 text-sm text-gray-800">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInline(item.text, `oli-${item.idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 10. Table: | col | col |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|') && (lines[i] ?? '').trim().endsWith('|')) {
        tableLines.push(lines[i] ?? '');
        i++;
      }

      if (tableLines.length >= 2 && tableLines[0]) {
        const headerRow = tableLines[0];
        const headerCols = headerRow.split('|').slice(1, -1).map(c => c.trim());
        const bodyLines = tableLines.slice(2);

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-2">
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                  {headerCols.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-1.5 text-left border-r border-gray-200 last:border-r-0">
                      {renderInline(h, `th-${i}-${hIdx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyLines.map((row, rIdx) => {
                  const cols = row.split('|').slice(1, -1).map(c => c.trim());
                  return (
                    <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50/50">
                      {cols.map((col, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 text-gray-700 border-r border-gray-100 last:border-r-0">
                          {renderInline(col, `td-${i}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 11. Empty lines -> Spacer
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 12. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1 leading-relaxed text-sm text-gray-800">
        {renderInline(line, `p-${i}`)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5 leading-relaxed">{elements}</div>;
};
