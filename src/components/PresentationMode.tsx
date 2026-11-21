/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Monitor } from 'lucide-react';
import type { WhiteboardElement, Point } from '../types/whiteboard';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  frames: WhiteboardElement[];
  onNavigateToFrame: (frame: WhiteboardElement) => void;
  boardTitle: string;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  isOpen,
  onClose,
  frames,
  onNavigateToFrame,
  boardTitle,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const prevOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current && frames.length > 0) {
      setCurrentFrameIndex(0);
      onNavigateToFrame(frames[0]);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, frames, onNavigateToFrame]);

  if (!isOpen) return null;

  const currentFrame = frames[currentFrameIndex];

  const handleNext = () => {
    if (currentFrameIndex < frames.length - 1) {
      const nextIdx = currentFrameIndex + 1;
      setCurrentFrameIndex(nextIdx);
      onNavigateToFrame(frames[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (currentFrameIndex > 0) {
      const prevIdx = currentFrameIndex - 1;
      setCurrentFrameIndex(prevIdx);
      onNavigateToFrame(frames[prevIdx]);
    }
  };

  return (
    <div
      role="region"
      aria-label="Presentation Pitch Controls"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <Monitor className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
          {currentFrame ? currentFrame.text || 'Section Frame' : boardTitle}
        </span>
      </div>

      {frames.length > 0 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentFrameIndex === 0}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Previous Frame"
            aria-label="Previous Frame"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentFrameIndex + 1} / {frames.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentFrameIndex === frames.length - 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Next Frame"
            aria-label="Next Frame"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Freeform Presentation</span>
      )}

      <button
        type="button"
        onClick={onClose}
        className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="Exit Presentation Mode (Esc)"
        aria-label="Exit Presentation Mode"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
