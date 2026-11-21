/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';
import type { WhiteboardElement } from '../types/whiteboard';
import { COLOR_SWATCHES } from './Toolbar';

interface PropertiesPanelProps {
  selectedElements: WhiteboardElement[];
  onUpdateElement: (updated: Partial<WhiteboardElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
}) => {
  if (selectedElements.length === 0) return null;

  const first = selectedElements[0];
  const isMulti = selectedElements.length > 1;

  return (
    <div
      aria-label="Element Properties Panel"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 text-slate-800 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 pr-2 border-r border-slate-200">
        {isMulti ? `${selectedElements.length} items` : first.type}
      </span>

      {/* Fill Color */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        <Palette className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch.name}
            type="button"
            onClick={() => {
              onUpdateElement({
                fill: swatch.value,
                stroke: swatch.stroke,
                textColor: swatch.text,
              });
            }}
            className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
              first.fill === swatch.value ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: swatch.value, borderColor: swatch.stroke }}
            title={`Fill ${swatch.name}`}
            aria-label={`Fill ${swatch.name}`}
          />
        ))}
      </div>

      {/* Font Size controls (if text / sticky / shape with text) */}
      {first.type !== 'drawing' && (
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          <Type className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[12, 14, 18, 24].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onUpdateElement({ fontSize: size })}
              className={`px-1.5 py-0.5 text-xs rounded font-medium cursor-pointer ${
                first.fontSize === size
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title={`Font size ${size}px`}
              aria-label={`Font size ${size}px`}
            >
              {size === 12 ? 'S' : size === 14 ? 'M' : size === 18 ? 'L' : 'XL'}
            </button>
          ))}
        </div>
      )}

      {/* Stroke width */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        <span className="text-xs text-slate-400">Border:</span>
        {[1, 2, 4].map((width) => (
          <button
            key={width}
            type="button"
            onClick={() => onUpdateElement({ strokeWidth: width })}
            className={`px-2 py-0.5 text-xs rounded cursor-pointer ${
              (first.strokeWidth || 1) === width
                ? 'bg-blue-100 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={`Border width ${width}px`}
            aria-label={`Border width ${width}px`}
          >
            {width}px
          </button>
        ))}
      </div>

      {/* Arrange depth */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={onBringForward}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          title="Bring Forward"
          aria-label="Bring Forward"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onSendBackward}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          title="Send Backward"
          aria-label="Send Backward"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Duplicate & Delete */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          title="Duplicate (Ctrl+D)"
          aria-label="Duplicate element"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
          title="Delete (Del)"
          aria-label="Delete element"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
