/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type {
  ToolMode,
  WhiteboardElement,
  Point,
  Collaborator,
  ReactionParticle,
} from '../types/whiteboard';
import {
  snapToGrid,
  generateSmoothSvgPath,
  pointInElement,
} from '../utils/whiteboardLogic';

interface CanvasProps {
  currentTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  elements: WhiteboardElement[];
  selectedIds: string[];
  onSelectElements: (ids: string[]) => void;
  onUpdateElement: (id: string, patch: Partial<WhiteboardElement>) => void;
  onCreateElement: (element: WhiteboardElement) => void;
  onDeleteElements: (ids: string[]) => void;
  pan: Point;
  zoom: number;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
  snapGrid: boolean;
  currentColor: string;
  collaborators: Record<string, Collaborator>;
  onCursorMove: (pt: Point) => void;
  reactions: ReactionParticle[];
  boardId: string;
  isPresentationMode?: boolean;
}

type DragMode =
  | 'none'
  | 'pan'
  | 'marquee'
  | 'move'
  | 'resize'
  | 'draw'
  | 'createShape';

export const Canvas: React.FC<CanvasProps> = ({
  currentTool,
  onSelectTool,
  elements,
  selectedIds,
  onSelectElements,
  onUpdateElement,
  onCreateElement,
  onDeleteElements,
  pan,
  zoom,
  onPanChange,
  onZoomChange,
  snapGrid,
  currentColor,
  collaborators,
  onCursorMove,
  reactions,
  boardId,
  isPresentationMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [currentPointer, setCurrentPointer] = useState<Point>({ x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Initial positions snapshot for moving elements
  const initialPositionsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const active = document.activeElement;
        if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
          isSpacePressedRef.current = true;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;
      return {
        x: (clientX - pan.x) / zoom,
        y: (clientY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Wheel zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 3.0);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    } else {
      // Pan
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingId) {
      // Commit editing
      const el = elements.find((item) => item.id === editingId);
      if (el && el.text !== editingText) {
        onUpdateElement(editingId, { text: editingText });
      }
      setEditingId(null);
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCurrentPointer({ x: e.clientX, y: e.clientY });

    // Middle mouse button or Spacebar pan
    if (e.button === 1 || currentTool === 'hand' || isSpacePressedRef.current) {
      setDragMode('pan');
      return;
    }

    if (e.button !== 0) return; // Only primary button

    // If Freehand Drawing Tool
    if (currentTool === 'drawing') {
      setDragMode('draw');
      setDrawingPoints([worldPt]);
      return;
    }

    // Check if clicked on a resize handle
    const target = e.target as HTMLElement;
    const handleAttr = target.getAttribute('data-handle');
    if (handleAttr && selectedIds.length === 1) {
      setDragMode('resize');
      setResizeHandle(handleAttr);
      const selected = elements.find((el) => el.id === selectedIds[0]);
      if (selected) {
        initialPositionsRef.current = {
          [selected.id]: {
            x: selected.x,
            y: selected.y,
            width: selected.width || 100,
            height: selected.height || 100,
          },
        };
      }
      return;
    }

    // Check hit on existing elements (reversed for top-most z-index first)
    const reversedElements = [...elements].reverse();
    const hitElement = reversedElements.find((el) => pointInElement(worldPt, el));

    if (currentTool === 'select') {
      if (hitElement) {
        if (e.shiftKey) {
          if (selectedIds.includes(hitElement.id)) {
            onSelectElements(selectedIds.filter((id) => id !== hitElement.id));
          } else {
            onSelectElements([...selectedIds, hitElement.id]);
          }
        } else {
          if (!selectedIds.includes(hitElement.id)) {
            onSelectElements([hitElement.id]);
          }
        }

        // Prepare move
        setDragMode('move');
        const posMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
        const activeIds = selectedIds.includes(hitElement.id) ? selectedIds : [hitElement.id];
        for (const id of activeIds) {
          const el = elements.find((item) => item.id === id);
          if (el) {
            posMap[id] = { x: el.x, y: el.y, width: el.width || 100, height: el.height || 100 };
          }
        }
        initialPositionsRef.current = posMap;
      } else {
        // Clicked on empty canvas -> Marquee selection or deselect
        if (!e.shiftKey) {
          onSelectElements([]);
        }
        setDragMode('marquee');
      }
      return;
    }

    // Creation Tools
    if (['sticky', 'rect', 'circle', 'diamond', 'text', 'arrow', 'frame', 'badge'].includes(currentTool)) {
      setDragMode('createShape');
      return;
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    onCursorMove(worldPt);

    if (dragMode === 'none') return;

    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    if (dragMode === 'pan') {
      onPanChange({
        x: pan.x + (e.clientX - currentPointer.x),
        y: pan.y + (e.clientY - currentPointer.y),
      });
      setCurrentPointer({ x: e.clientX, y: e.clientY });
      return;
    }

    if (dragMode === 'draw') {
      setDrawingPoints((prev) => [...prev, worldPt]);
      return;
    }

    if (dragMode === 'move') {
      for (const id of selectedIds) {
        const init = initialPositionsRef.current[id];
        if (init) {
          let nextX = init.x + dx;
          let nextY = init.y + dy;
          if (snapGrid) {
            nextX = snapToGrid(nextX, 20);
            nextY = snapToGrid(nextY, 20);
          }
          onUpdateElement(id, { x: nextX, y: nextY });
        }
      }
      return;
    }

    if (dragMode === 'resize' && resizeHandle && selectedIds.length === 1) {
      const id = selectedIds[0];
      const init = initialPositionsRef.current[id];
      if (init) {
        let newX = init.x;
        let newY = init.y;
        let newW = init.width;
        let newH = init.height;

        if (resizeHandle.includes('e')) newW = Math.max(init.width + dx, 40);
        if (resizeHandle.includes('s')) newH = Math.max(init.height + dy, 40);
        if (resizeHandle.includes('w')) {
          const proposedW = init.width - dx;
          if (proposedW >= 40) {
            newX = init.x + dx;
            newW = proposedW;
          }
        }
        if (resizeHandle.includes('n')) {
          const proposedH = init.height - dy;
          if (proposedH >= 40) {
            newY = init.y + dy;
            newH = proposedH;
          }
        }

        if (snapGrid) {
          newX = snapToGrid(newX, 20);
          newY = snapToGrid(newY, 20);
          newW = snapToGrid(newW, 20);
          newH = snapToGrid(newH, 20);
        }

        onUpdateElement(id, { x: newX, y: newY, width: newW, height: newH });
      }
      return;
    }

    setCurrentPointer({ x: e.clientX, y: e.clientY });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const startWorldPt = screenToWorld(dragStart.x, dragStart.y);

    if (dragMode === 'draw') {
      if (drawingPoints.length > 1) {
        const newDrawing: WhiteboardElement = {
          id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          boardId,
          type: 'drawing',
          x: drawingPoints[0].x,
          y: drawingPoints[0].y,
          width: 100,
          height: 100,
          stroke: currentColor === '#ffffff' ? '#3b82f6' : currentColor,
          strokeWidth: 3,
          points: drawingPoints,
          zIndex: elements.length + 1,
          updatedAt: new Date().toISOString(),
        };
        onCreateElement(newDrawing);
      }
      setDrawingPoints([]);
      setDragMode('none');
      return;
    }

    if (dragMode === 'createShape') {
      let width = Math.abs(worldPt.x - startWorldPt.x);
      let height = Math.abs(worldPt.y - startWorldPt.y);
      let x = Math.min(startWorldPt.x, worldPt.x);
      let y = Math.min(startWorldPt.y, worldPt.y);

      // Default dimensions if just clicked without dragging
      if (width < 20 || height < 20) {
        if (currentTool === 'sticky') {
          width = 200;
          height = 160;
        } else if (currentTool === 'rect') {
          width = 220;
          height = 140;
        } else if (currentTool === 'circle') {
          width = 150;
          height = 150;
        } else if (currentTool === 'diamond') {
          width = 180;
          height = 120;
        } else if (currentTool === 'text') {
          width = 220;
          height = 60;
        } else if (currentTool === 'arrow') {
          width = 180;
          height = 40;
        } else if (currentTool === 'frame') {
          width = 640;
          height = 400;
        } else if (currentTool === 'badge') {
          width = 300;
          height = 44;
        }
        x = startWorldPt.x;
        y = startWorldPt.y;
      }

      if (snapGrid) {
        x = snapToGrid(x, 20);
        y = snapToGrid(y, 20);
      }

      const id = `${currentTool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let defaultText = '';
      let defaultFill = currentColor;
      let defaultStroke = '#3b82f6';
      let defaultTextColor = '#0f172a';

      if (currentTool === 'sticky') {
        defaultText = 'Double click to add note...';
        defaultTextColor = '#713f12';
        defaultStroke = '#eab308';
      } else if (currentTool === 'frame') {
        defaultText = 'Website Section Frame';
        defaultFill = '#f8fafc';
        defaultStroke = '#3b82f6';
        defaultTextColor = '#1e3a8a';
      } else if (currentTool === 'badge') {
        defaultText = '⭐ Conversion Priority: High';
        defaultFill = '#ecfdf5';
        defaultStroke = '#10b981';
        defaultTextColor = '#065f46';
      } else if (currentTool === 'text') {
        defaultText = 'Type header or copy here';
        defaultFill = 'transparent';
        defaultStroke = 'transparent';
      } else if (currentTool === 'diamond') {
        defaultText = 'Decision Point';
        defaultFill = '#fef3c7';
        defaultStroke = '#f59e0b';
        defaultTextColor = '#92400e';
      }

      const newElement: WhiteboardElement = {
        id,
        boardId,
        type: currentTool as any,
        x,
        y,
        width,
        height,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: 1.5,
        text: defaultText,
        textColor: defaultTextColor,
        fontSize: currentTool === 'frame' ? 16 : 14,
        zIndex: currentTool === 'frame' ? 1 : elements.length + 5,
        updatedAt: new Date().toISOString(),
      };

      onCreateElement(newElement);
      onSelectElements([id]);
      onSelectTool('select');
      setDragMode('none');
      return;
    }

    if (dragMode === 'marquee') {
      const minX = Math.min(startWorldPt.x, worldPt.x);
      const maxX = Math.max(startWorldPt.x, worldPt.x);
      const minY = Math.min(startWorldPt.y, worldPt.y);
      const maxY = Math.max(startWorldPt.y, worldPt.y);

      const enclosed = elements.filter((el) => {
        const elRight = el.x + (el.width || 0);
        const elBottom = el.y + (el.height || 0);
        return el.x >= minX && elRight <= maxX && el.y >= minY && elBottom <= maxY;
      });

      onSelectElements(enclosed.map((el) => el.id));
      setDragMode('none');
      return;
    }

    setDragMode('none');
  };

  // Double click to inline-edit text
  const handleDoubleClick = (e: React.MouseEvent, el: WhiteboardElement) => {
    e.stopPropagation();
    if (el.type === 'drawing') return;
    setEditingId(el.id);
    setEditingText(el.text || '');
  };

  // Keyboard actions (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) {
        if (e.key === 'Escape') {
          setEditingId(null);
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const active = document.activeElement;
        if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
        onDeleteElements(selectedIds);
        onSelectElements([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, selectedIds, onDeleteElements, onSelectElements]);

  // Compute Marquee Rect
  const marqueeRect = () => {
    if (dragMode !== 'marquee') return null;
    const startW = screenToWorld(dragStart.x, dragStart.y);
    const currW = screenToWorld(currentPointer.x, currentPointer.y);
    return {
      x: Math.min(startW.x, currW.x),
      y: Math.min(startW.y, currW.y),
      width: Math.abs(currW.x - startW.x),
      height: Math.abs(currW.y - startW.y),
    };
  };

  const marquee = marqueeRect();

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-50 cursor-${
        currentTool === 'hand' || dragMode === 'pan'
          ? 'grab'
          : currentTool === 'drawing'
          ? 'crosshair'
          : 'default'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Background Dot Grid */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-grid"
            width={24 * zoom}
            height={24 * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y})`}
          >
            <circle cx="2" cy="2" r={Math.max(1 * zoom, 0.75)} fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Main Scaled World Layer */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Render Elements */}
        {elements.map((el) => {
          const isSelected = selectedIds.includes(el.id);
          const isEditing = editingId === el.id;

          return (
            <div
              key={el.id}
              data-element-id={el.id}
              onDoubleClick={(e) => handleDoubleClick(e, el)}
              className={`absolute transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:ring-1 hover:ring-blue-300'
              }`}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: el.type === 'drawing' ? undefined : `${el.width}px`,
                height: el.type === 'drawing' ? undefined : `${el.height}px`,
                zIndex: el.zIndex || 1,
              }}
            >
              {/* STICKY NOTE */}
              {el.type === 'sticky' && (
                <div
                  className="w-full h-full p-4 rounded-lg shadow-md border flex flex-col justify-between overflow-hidden relative"
                  style={{
                    backgroundColor: el.fill || '#fef08a',
                    borderColor: el.stroke || '#eab308',
                    color: el.textColor || '#713f12',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400/60" />
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => {
                        onUpdateElement(el.id, { text: editingText });
                        setEditingId(null);
                      }}
                      className="w-full h-full bg-transparent resize-none outline-none border-none text-sm font-medium leading-relaxed"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    />
                  ) : (
                    <div
                      className="w-full h-full whitespace-pre-wrap break-words text-sm font-medium leading-relaxed overflow-y-auto"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    >
                      {el.text}
                    </div>
                  )}
                  <div className="text-[10px] opacity-40 font-mono self-end pt-1">
                    {el.updatedBy ? `by ${el.updatedBy}` : 'note'}
                  </div>
                </div>
              )}

              {/* RECTANGLE */}
              {el.type === 'rect' && (
                <div
                  className="w-full h-full rounded-xl border flex items-center justify-center p-3 text-center transition-colors"
                  style={{
                    backgroundColor: el.fill || '#ffffff',
                    borderColor: el.stroke || '#cbd5e1',
                    borderWidth: `${el.strokeWidth || 1}px`,
                    color: el.textColor || '#0f172a',
                  }}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => {
                        onUpdateElement(el.id, { text: editingText });
                        setEditingId(null);
                      }}
                      className="w-full h-full bg-transparent resize-none outline-none border-none text-center font-medium"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    />
                  ) : (
                    <span
                      className="whitespace-pre-wrap break-words font-medium"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    >
                      {el.text}
                    </span>
                  )}
                </div>
              )}

              {/* CIRCLE */}
              {el.type === 'circle' && (
                <div
                  className="w-full h-full rounded-full border flex items-center justify-center p-4 text-center"
                  style={{
                    backgroundColor: el.fill || '#ffffff',
                    borderColor: el.stroke || '#94a3b8',
                    borderWidth: `${el.strokeWidth || 1}px`,
                    color: el.textColor || '#0f172a',
                  }}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => {
                        onUpdateElement(el.id, { text: editingText });
                        setEditingId(null);
                      }}
                      className="w-4/5 h-3/5 bg-transparent resize-none outline-none border-none text-center font-medium"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    />
                  ) : (
                    <span
                      className="whitespace-pre-wrap break-words font-medium"
                      style={{ fontSize: `${el.fontSize || 14}px` }}
                    >
                      {el.text}
                    </span>
                  )}
                </div>
              )}

              {/* DECISION DIAMOND */}
              {el.type === 'diamond' && (
                <div className="w-full h-full relative flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full overflow-visible">
                    <polygon
                      points={`${el.width / 2},2 ${el.width - 2},${el.height / 2} ${el.width / 2},${
                        el.height - 2
                      } 2,${el.height / 2}`}
                      fill={el.fill || '#fef3c7'}
                      stroke={el.stroke || '#f59e0b'}
                      strokeWidth={el.strokeWidth || 1.5}
                    />
                  </svg>
                  <div
                    className="relative z-10 px-4 text-center font-medium"
                    style={{
                      color: el.textColor || '#92400e',
                      fontSize: `${el.fontSize || 13}px`,
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => {
                          onUpdateElement(el.id, { text: editingText });
                          setEditingId(null);
                        }}
                        className="w-full bg-transparent outline-none text-center font-medium"
                      />
                    ) : (
                      el.text
                    )}
                  </div>
                </div>
              )}

              {/* FRAME (Website Mockup Container) */}
              {el.type === 'frame' && (
                <div
                  className="w-full h-full rounded-2xl border-2 shadow-sm flex flex-col overflow-hidden"
                  style={{
                    backgroundColor: el.fill || '#f8fafc',
                    borderColor: el.stroke || '#3b82f6',
                  }}
                >
                  <div
                    className="px-4 py-2 border-b flex items-center justify-between font-semibold"
                    style={{
                      borderColor: el.stroke || '#3b82f6',
                      color: el.textColor || '#1e3a8a',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-xs uppercase tracking-wider font-mono opacity-80">
                        {el.text}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {Math.round(el.width)} × {Math.round(el.height)} px
                    </span>
                  </div>
                  <div className="flex-1 p-2" />
                </div>
              )}

              {/* TEXT BLOCK */}
              {el.type === 'text' && (
                <div
                  className="w-full h-full p-2 flex items-center"
                  style={{ color: el.textColor || '#0f172a' }}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => {
                        onUpdateElement(el.id, { text: editingText });
                        setEditingId(null);
                      }}
                      className="w-full h-full bg-transparent resize-none outline-none border-none font-medium leading-relaxed"
                      style={{ fontSize: `${el.fontSize || 16}px` }}
                    />
                  ) : (
                    <span
                      className="whitespace-pre-wrap break-words font-medium leading-relaxed"
                      style={{ fontSize: `${el.fontSize || 16}px` }}
                    >
                      {el.text}
                    </span>
                  )}
                </div>
              )}

              {/* ARROW CONNECTOR */}
              {el.type === 'arrow' && (
                <svg className="w-full h-full overflow-visible pointer-events-none">
                  <defs>
                    <marker
                      id={`arrowhead-${el.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill={el.stroke || '#3b82f6'} />
                    </marker>
                  </defs>
                  <line
                    x1="0"
                    y1={el.height / 2}
                    x2={el.width}
                    y2={el.height / 2}
                    stroke={el.stroke || '#3b82f6'}
                    strokeWidth={el.strokeWidth || 2}
                    markerEnd={`url(#arrowhead-${el.id})`}
                  />
                  {el.text && (
                    <text
                      x={el.width / 2}
                      y={el.height / 2 - 8}
                      textAnchor="middle"
                      fill={el.textColor || '#0f172a'}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {el.text}
                    </text>
                  )}
                </svg>
              )}

              {/* STATUS BADGE */}
              {el.type === 'badge' && (
                <div
                  className="w-full h-full px-4 rounded-full border shadow-sm flex items-center justify-between font-semibold"
                  style={{
                    backgroundColor: el.fill || '#ecfdf5',
                    borderColor: el.stroke || '#10b981',
                    color: el.textColor || '#065f46',
                    fontSize: `${el.fontSize || 13}px`,
                  }}
                >
                  <span>{el.text}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              {/* FREEHAND DRAWING */}
              {el.type === 'drawing' && el.points && (
                <svg className="overflow-visible pointer-events-none">
                  <path
                    d={generateSmoothSvgPath(
                      el.points.map((p) => ({ x: p.x - el.x, y: p.y - el.y }))
                    )}
                    fill="none"
                    stroke={el.stroke || '#3b82f6'}
                    strokeWidth={el.strokeWidth || 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* RESIZE HANDLES (if selected and not presentation mode) */}
              {isSelected && !isPresentationMode && el.type !== 'drawing' && (
                <>
                  <div
                    data-handle="nw"
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30"
                  />
                  <div
                    data-handle="ne"
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30"
                  />
                  <div
                    data-handle="se"
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30"
                  />
                  <div
                    data-handle="sw"
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30"
                  />
                  <div
                    data-handle="n"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize z-30"
                  />
                  <div
                    data-handle="s"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize z-30"
                  />
                  <div
                    data-handle="w"
                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize z-30"
                  />
                  <div
                    data-handle="e"
                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize z-30"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* In-progress freehand stroke */}
        {dragMode === 'draw' && drawingPoints.length > 0 && (
          <svg className="absolute inset-0 overflow-visible pointer-events-none">
            <path
              d={generateSmoothSvgPath(drawingPoints)}
              fill="none"
              stroke={currentColor === '#ffffff' ? '#3b82f6' : currentColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Marquee Selection Rectangle */}
        {marquee && (
          <div
            className="absolute border border-blue-500 bg-blue-500/15 pointer-events-none rounded"
            style={{
              left: `${marquee.x}px`,
              top: `${marquee.y}px`,
              width: `${marquee.width}px`,
              height: `${marquee.height}px`,
            }}
          />
        )}

        {/* Live Collaborator Cursors */}
        {Object.values(collaborators).map((c) => (
          <div
            key={c.id}
            className="absolute pointer-events-none transition-all duration-75 ease-out z-50 flex items-start gap-1"
            style={{
              left: `${c.x}px`,
              top: `${c.y}px`,
            }}
          >
            {/* Custom SVG cursor arrow */}
            <svg
              className="w-5 h-5 -rotate-45 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={c.color || '#8b5cf6'}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <polygon points="3 3, 21 9, 13 13, 9 21" />
            </svg>
            <div
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-md whitespace-nowrap flex items-center gap-1"
              style={{ backgroundColor: c.color || '#8b5cf6' }}
            >
              <span>{c.name}</span>
              {c.role && (
                <span className="opacity-80 text-[9px] font-mono">({c.role})</span>
              )}
            </div>
          </div>
        ))}

        {/* Reaction Emoji Bursts */}
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute pointer-events-none text-3xl animate-bounce z-50 drop-shadow-lg"
            style={{
              left: `${r.x}px`,
              top: `${r.y - 20}px`,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};
