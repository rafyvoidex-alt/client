/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Select tool' },
    { key: 'H', desc: 'Hand / Pan canvas' },
    { key: 'S', desc: 'Sticky Note tool' },
    { key: 'R', desc: 'Rectangle tool' },
    { key: 'O', desc: 'Circle tool' },
    { key: 'D', desc: 'Decision Diamond tool' },
    { key: 'T', desc: 'Text tool' },
    { key: 'P', desc: 'Pen / Freehand tool' },
    { key: 'A', desc: 'Arrow Flow tool' },
    { key: 'F', desc: 'Website Frame tool' },
    { key: 'B', desc: 'Status Badge tool' },
    { key: 'Space + Drag', desc: 'Quick Pan Canvas' },
    { key: 'Ctrl + Scroll', desc: 'Zoom in / out' },
    { key: 'Ctrl + Z', desc: 'Undo' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo' },
    { key: 'Ctrl + D', desc: 'Duplicate selected' },
    { key: 'Delete / Backspace', desc: 'Delete selected element' },
    { key: 'Double Click', desc: 'Inline edit text or note' },
    { key: '?', desc: 'Open shortcuts menu' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 id="shortcuts-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-600" />
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70"
            >
              <span className="text-xs text-slate-600">{s.desc}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 bg-white border border-slate-300 rounded shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
