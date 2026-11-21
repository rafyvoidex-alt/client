/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Share2,
  Play,
  Check,
  Radio,
  Trophy,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { Collaborator } from '../types/whiteboard';

interface CollaboratorsBarProps {
  currentUser: { id: string; name: string; color: string };
  collaborators: Record<string, Collaborator>;
  isSimulatedTeamActive: boolean;
  onToggleSimulatedTeam: () => void;
  onShareRoom: () => void;
  onOpenContestDrawer: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onStartPresentation: () => void;
  contestProgress: number;
  boardTitle: string;
  onUpdateBoardTitle: (title: string) => void;
}

export const CollaboratorsBar: React.FC<CollaboratorsBarProps> = ({
  currentUser,
  collaborators,
  isSimulatedTeamActive,
  onToggleSimulatedTeam,
  onShareRoom,
  onOpenContestDrawer,
  onOpenTemplates,
  onOpenShortcuts,
  onStartPresentation,
  contestProgress,
  boardTitle,
  onUpdateBoardTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleShareClick = () => {
    onShareRoom();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = Object.keys(collaborators).length + 1;

  return (
    <header
      aria-label="Whiteboard Navigation and Collaborators Header"
      className="fixed top-2 sm:top-4 inset-x-2 sm:inset-x-4 z-40 flex items-center justify-between pointer-events-none"
    >
      {/* Left: Branding & Board Title */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-lg border border-slate-200/90 pointer-events-auto max-w-[180px] sm:max-w-none">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20 shrink-0">
            W
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={boardTitle}
                  onChange={(e) => onUpdateBoardTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="font-bold text-slate-800 text-xs sm:text-sm border-b border-blue-500 outline-none px-1"
                />
              ) : (
                <span
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-slate-800 text-xs sm:text-sm hover:text-blue-600 cursor-pointer flex items-center gap-1 truncate"
                  title="Click to edit board title"
                >
                  {boardTitle}
                </span>
              )}
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0 hidden xs:inline">
                Real-Time
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Firebase</span>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenTemplates}
                className="text-blue-600 hover:underline cursor-pointer font-medium"
              >
                Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Collaborators, Team Simulation, Contest Hub, Presentation, Share */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* Contest & Redesign Hub Button */}
        <button
          type="button"
          onClick={onOpenContestDrawer}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
          title="Open Small Business Redesign Contest & Client Dashboard"
          aria-label="Contest Dashboard"
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Design Contest Hub</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
            {contestProgress}%
          </span>
        </button>

        {/* Live Team Simulation Toggle */}
        <button
          type="button"
          onClick={onToggleSimulatedTeam}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            isSimulatedTeamActive
              ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
              : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Toggle Simulated Real-Time Collaborators (Alex, Maya, Liam)"
          aria-label="Toggle Simulated Real-Time Collaborators"
          aria-pressed={isSimulatedTeamActive}
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              isSimulatedTeamActive ? 'text-purple-600 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="hidden md:inline">
            {isSimulatedTeamActive ? 'Live Team: Active' : 'Simulate Team'}
          </span>
        </button>

        {/* Collaborators Avatar Stack */}
        <div className="flex items-center bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center -space-x-1.5 overflow-hidden mr-2">
            {/* Current User Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm"
              style={{ backgroundColor: currentUser.color }}
              title={`You (${currentUser.name})`}
            >
              {currentUser.name[0]}
            </div>

            {/* Other Collaborators */}
            {Object.values(collaborators)
              .slice(0, 3)
              .map((c) => (
                <div
                  key={c.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: c.color }}
                  title={`${c.name} (${c.role || 'Editor'})`}
                >
                  {c.avatar || c.name[0]}
                </div>
              ))}
          </div>

          <span className="text-xs font-bold text-slate-700 font-mono">
            {activeCount} online
          </span>
        </div>

        {/* Presentation Mode Button */}
        <button
          type="button"
          onClick={onStartPresentation}
          className="flex items-center gap-1.5 bg-white/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors cursor-pointer"
          title="Start Presentation Mode"
          aria-label="Start Presentation Mode"
        >
          <Play className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Present</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
          title="Copy Whiteboard Link"
          aria-label="Share Whiteboard"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Shortcuts / Help */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-2 bg-white/90 hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-sm transition-colors cursor-pointer"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
