/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Type,
  PenTool,
  ArrowUpRight,
  Frame,
  Award,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Zap,
} from 'lucide-react';
import type { ToolMode } from '../types/whiteboard';

interface ToolbarProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToContent: () => void;
  snapGrid: boolean;
  onToggleSnapGrid: () => void;
  currentColor: string;
  onChangeColor: (color: string) => void;
  onSendReaction: (emoji: string) => void;
}

export const COLOR_SWATCHES = [
  { name: 'Yellow', value: '#fef08a', stroke: '#eab308', text: '#713f12' },
  { name: 'Green', value: '#bbf7d0', stroke: '#22c55e', text: '#14532d' },
  { name: 'Blue', value: '#bae6fd', stroke: '#0284c7', text: '#0369a1' },
  { name: 'Purple', value: '#e9d5ff', stroke: '#a855f7', text: '#581c87' },
  { name: 'Pink', value: '#fbcfe8', stroke: '#ec4899', text: '#831843' },
  { name: 'Orange', value: '#fed7aa', stroke: '#f97316', text: '#7c2d12' },
  { name: 'White', value: '#ffffff', stroke: '#94a3b8', text: '#0f172a' },
  { name: 'Slate', value: '#f1f5f9', stroke: '#64748b', text: '#0f172a' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelection,
  onDeleteSelected,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToContent,
  snapGrid,
  onToggleSnapGrid,
  currentColor,
  onChangeColor,
  onSendReaction,
}) => {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select (V)', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'hand', label: 'Hand / Pan (H)', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'sticky', label: 'Sticky Note (S)', icon: <StickyNote className="w-4 h-4" />, shortcut: 'S' },
    { id: 'rect', label: 'Rectangle (R)', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
    { id: 'circle', label: 'Circle (O)', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
    { id: 'diamond', label: 'Decision Diamond (D)', icon: <Diamond className="w-4 h-4" />, shortcut: 'D' },
    { id: 'text', label: 'Text Block (T)', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
    { id: 'drawing', label: 'Pen / Freehand (P)', icon: <PenTool className="w-4 h-4" />, shortcut: 'P' },
    { id: 'arrow', label: 'Arrow Flow (A)', icon: <ArrowUpRight className="w-4 h-4" />, shortcut: 'A' },
    { id: 'frame', label: 'Website Frame (F)', icon: <Frame className="w-4 h-4" />, shortcut: 'F' },
    { id: 'badge', label: 'Status Badge (B)', icon: <Award className="w-4 h-4" />, shortcut: 'B' },
  ];

  const reactions = ['👍', '❤️', '🚀', '💡', '🔥', '🎉'];

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto max-w-[96vw]">
      {/* Reaction quick-bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full shadow-lg text-sm">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" /> React:
        </span>
        {reactions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction(emoji)}
            className="hover:scale-130 active:scale-95 transition-transform px-1 py-0.5 rounded cursor-pointer text-base"
            title={`Send ${emoji} reaction to canvas`}
            aria-label={`Reaction ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Main floating pill toolbar */}
      <nav
        aria-label="Whiteboard Canvas Tools"
        className="flex items-center gap-1 bg-slate-900/95 text-white backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-2xl border border-slate-700/80 max-w-full overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Tool buttons */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-700">
          {tools.map((t) => {
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTool(t.id)}
                className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={t.label}
                aria-label={t.label}
                aria-pressed={isActive}
              >
                {t.icon}
                <span className="sr-only">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Color Palette Presets */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-700">
          {COLOR_SWATCHES.slice(0, 5).map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onChangeColor(c.value)}
              className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                currentColor === c.value ? 'ring-2 ring-white scale-120' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.value, borderColor: c.stroke }}
              title={`Select ${c.name} color`}
              aria-label={`Select ${c.name} color`}
            />
          ))}
        </div>

        {/* Action controls (Undo / Redo / Delete) */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-700">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          {hasSelection && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/50 cursor-pointer"
              title="Delete Selected (Del)"
              aria-label="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grid & Zoom controls */}
        <div className="flex items-center gap-1 pl-1">
          <button
            type="button"
            onClick={onToggleSnapGrid}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              snapGrid ? 'text-blue-400 bg-blue-950/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={`Snap to Grid (${snapGrid ? 'ON' : 'OFF'})`}
            aria-label="Toggle Snap to Grid"
            aria-pressed={snapGrid}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onZoomOut}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer min-w-[42px] text-center"
            title="Reset Zoom to 100%"
            aria-label="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onFitToContent}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Fit to Content"
            aria-label="Fit to Content"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </div>
  );
};
