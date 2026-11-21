/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, FileCode, Image, Copy, Check, X, Share2 } from 'lucide-react';
import type { WhiteboardElement } from '../types/whiteboard';
import { calculateBoundingBox, generateSmoothSvgPath } from '../utils/whiteboardLogic';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: WhiteboardElement[];
  boardTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  boardTitle,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const box = calculateBoundingBox(elements);
  const padding = 40;
  const svgWidth = box.width + padding * 2;
  const svgHeight = box.height + padding * 2;
  const viewBox = `${box.minX - padding} ${box.minY - padding} ${svgWidth} ${svgHeight}`;

  // Generate SVG string
  const generateSvgString = (): string => {
    let innerSvg = '';
    for (const el of elements) {
      if (el.type === 'drawing' && el.points) {
        innerSvg += `<path d="${generateSmoothSvgPath(
          el.points
        )}" fill="none" stroke="${el.stroke || '#3b82f6'}" stroke-width="${el.strokeWidth || 3}" stroke-linecap="round" stroke-linejoin="round" />`;
      } else if (el.type === 'rect' || el.type === 'sticky' || el.type === 'frame') {
        const rx = el.type === 'frame' ? 12 : el.type === 'sticky' ? 8 : 6;
        innerSvg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || '#ffffff'}" stroke="${el.stroke || '#cbd5e1'}" stroke-width="${el.strokeWidth || 1}" rx="${rx}" />`;
        if (el.text) {
          innerSvg += `<text x="${el.x + 12}" y="${el.y + 24}" fill="${el.textColor || '#0f172a'}" font-family="sans-serif" font-size="${el.fontSize || 13}">${escapeHtml(el.text.slice(0, 100))}</text>`;
        }
      } else if (el.type === 'circle') {
        innerSvg += `<circle cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" r="${el.width / 2}" fill="${el.fill || '#ffffff'}" stroke="${el.stroke || '#94a3b8'}" stroke-width="${el.strokeWidth || 1}" />`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}" style="background-color: #f8fafc;">${innerSvg}</svg>`;
  };

  const escapeHtml = (text: string) => {
    return text.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    });
  };

  const handleDownloadSvg = () => {
    const svgContent = generateSvgString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${boardTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'whiteboard'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    const svgContent = generateSvgString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${boardTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'whiteboard'}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(elements, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 id="export-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Export & Share Whiteboard
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Image className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Download PNG Image</div>
                <div className="text-[11px] text-slate-500">High-resolution raster graphic snapshot</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Download SVG Vector</div>
                <div className="text-[11px] text-slate-500">Lossless vector file for Figma or Illustrator</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                <Copy className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Copy Board JSON Data</div>
                <div className="text-[11px] text-slate-500">Raw element coordinates and structure</div>
              </div>
            </div>
            {copiedJson ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
