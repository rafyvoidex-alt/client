/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import type { WhiteboardElement, Point } from '../types/whiteboard';
import { calculateBoundingBox } from '../utils/whiteboardLogic';

interface MinimapProps {
  elements: WhiteboardElement[];
  pan: Point;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (pan: Point) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  pan,
  zoom,
  canvasWidth,
  canvasHeight,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapWidth = 180;
  const mapHeight = 120;

  // Compute world bounding box with padding
  const box = calculateBoundingBox(elements);
  const worldMinX = Math.min(box.minX - 200, -pan.x / zoom);
  const worldMinY = Math.min(box.minY - 200, -pan.y / zoom);
  const worldMaxX = Math.max(box.maxX + 200, (-pan.x + canvasWidth) / zoom);
  const worldMaxY = Math.max(box.maxY + 200, (-pan.y + canvasHeight) / zoom);

  const worldWidth = Math.max(worldMaxX - worldMinX, 1000);
  const worldHeight = Math.max(worldMaxY - worldMinY, 800);

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Viewport rect in minimap coordinates
  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = canvasWidth / zoom;
  const vpWorldH = canvasHeight / zoom;

  const vpX = (vpWorldX - worldMinX) * scale;
  const vpY = (vpWorldY - worldMinY) * scale;
  const vpW = Math.max(vpWorldW * scale, 12);
  const vpH = Math.max(vpWorldH * scale, 8);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = worldMinX + clickX / scale;
    const targetWorldY = worldMinY + clickY / scale;

    const newPanX = -(targetWorldX * zoom - canvasWidth / 2);
    const newPanY = -(targetWorldY * zoom - canvasHeight / 2);

    onNavigate({ x: newPanX, y: newPanY });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleMinimapClick}
      className="fixed bottom-6 right-6 z-30 w-[180px] h-[120px] bg-white/90 backdrop-blur-md border border-slate-300 rounded-xl shadow-lg overflow-hidden cursor-crosshair select-none hidden sm:block"
      title="Click on minimap to jump viewport"
      role="region"
      aria-label="Canvas Minimap"
    >
      <svg className="w-full h-full">
        {/* Miniature element representations */}
        {elements.map((el) => {
          const mx = (el.x - worldMinX) * scale;
          const my = (el.y - worldMinY) * scale;
          const mw = Math.max((el.width || 20) * scale, 2);
          const mh = Math.max((el.height || 20) * scale, 2);

          let color = el.fill || '#94a3b8';
          if (el.type === 'drawing') color = el.stroke || '#3b82f6';
          if (el.type === 'frame') color = 'rgba(59, 130, 246, 0.15)';

          return (
            <rect
              key={el.id}
              x={mx}
              y={my}
              width={mw}
              height={mh}
              fill={color}
              stroke={el.stroke || '#64748b'}
              strokeWidth={0.5}
              rx={1}
            />
          );
        })}

        {/* Viewport frame */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#2563eb"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
      <div className="absolute top-1 left-2 text-[9px] font-mono text-slate-400 pointer-events-none">
        Minimap
      </div>
    </div>
  );
};
