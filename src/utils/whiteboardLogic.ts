/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export type ElementType =
  | 'sticky'
  | 'rect'
  | 'circle'
  | 'diamond'
  | 'text'
  | 'drawing'
  | 'arrow'
  | 'frame'
  | 'badge';

export interface WhiteboardElement {
  id: string;
  boardId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  points?: Point[];
  zIndex: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box that encompasses all provided elements.
 */
export function calculateBoundingBox(elements: WhiteboardElement[]): BoundingBox {
  if (!elements || elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.type === 'drawing' && el.points && el.points.length > 0) {
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    } else {
      const right = el.x + (el.width || 0);
      const bottom = el.y + (el.height || 0);
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 100),
    height: Math.max(maxY - minY, 100),
  };
}

/**
 * Snaps a coordinate value to a specified grid step.
 */
export function snapToGrid(value: number, gridSize = 20): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Tests if a 2D point is inside an element's bounding box.
 */
export function pointInElement(point: Point, el: WhiteboardElement, padding = 4): boolean {
  if (el.type === 'drawing' && el.points && el.points.length > 0) {
    // Check distance to any point segment
    for (let i = 0; i < el.points.length; i++) {
      const p = el.points[i];
      const dist = Math.hypot(p.x - point.x, p.y - point.y);
      if (dist <= (el.strokeWidth || 4) + padding + 4) {
        return true;
      }
    }
    return false;
  }

  const minX = Math.min(el.x, el.x + (el.width || 0)) - padding;
  const maxX = Math.max(el.x, el.x + (el.width || 0)) + padding;
  const minY = Math.min(el.y, el.y + (el.height || 0)) - padding;
  const maxY = Math.max(el.y, el.y + (el.height || 0)) + padding;

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Converts a sequence of drawing points into a smooth SVG path string using quadratic beziers.
 */
export function generateSmoothSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

/**
 * Generates an entry ID conforming to format WB-2026-XXXX.
 */
export function generateEntryId(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
    return `WB-2026-${hex}`;
  }
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
  return `WB-2026-${randomPart.padStart(4, '0').slice(0, 4)}`;
}

export interface JudgingCriteria {
  designQuality: boolean;
  userExperience: boolean;
  mobileResponsiveness: boolean;
  speedAndPerformance: boolean;
  clearCallsToAction: boolean;
  seoVisibility: boolean;
  conversionAbility: boolean;
}

export const DEFAULT_CRITERIA: JudgingCriteria = {
  designQuality: true,
  userExperience: true,
  mobileResponsiveness: true,
  speedAndPerformance: false,
  clearCallsToAction: true,
  seoVisibility: false,
  conversionAbility: false,
};

/**
 * Calculates criteria progress percentage and fulfilled count.
 */
export function calculateRubricProgress(criteria: JudgingCriteria): { completed: number; total: number; percentage: number } {
  const keys = Object.keys(criteria) as (keyof JudgingCriteria)[];
  const total = keys.length;
  const completed = keys.filter(k => criteria[k]).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

/**
 * Pre-seeds website redesign and client pitch whiteboard templates.
 */
export function getTemplateElements(templateId: string, boardId: string): WhiteboardElement[] {
  const now = new Date().toISOString();

  if (templateId === 'website-redesign-pitch') {
    return [
      // Frame: Hero & Brand Pitch
      {
        id: 'frame-hero',
        boardId,
        type: 'frame',
        x: 60,
        y: 60,
        width: 780,
        height: 480,
        fill: '#f8fafc',
        stroke: '#3b82f6',
        strokeWidth: 2,
        text: 'Frame 1: Homepage Hero & Modern Value Prop Redesign',
        textColor: '#1e3a8a',
        fontSize: 16,
        zIndex: 1,
        updatedAt: now,
      },
      // Sticky: Current Problem
      {
        id: 'sticky-problem',
        boardId,
        type: 'sticky',
        x: 90,
        y: 110,
        width: 200,
        height: 160,
        fill: '#fef08a', // yellow
        stroke: '#eab308',
        strokeWidth: 1,
        text: '⚠️ Current Client Problem:\n• Outdated 2018 layout\n• Cluttered navigation\n• No mobile CTA visible above fold\n• High bounce rate (68%)',
        textColor: '#713f12',
        fontSize: 13,
        zIndex: 10,
        updatedAt: now,
      },
      // Sticky: Proposed Solution
      {
        id: 'sticky-solution',
        boardId,
        type: 'sticky',
        x: 310,
        y: 110,
        width: 220,
        height: 160,
        fill: '#bbf7d0', // green
        stroke: '#22c55e',
        strokeWidth: 1,
        text: '✨ Modern Redesign Strategy:\n• Hero headline focused on customer ROI\n• High-contrast primary CTA button\n• Client trust badges & rating proof\n• 1.2s Fast Core Web Vitals',
        textColor: '#14532d',
        fontSize: 13,
        zIndex: 11,
        updatedAt: now,
      },
      // Wireframe mockup elements inside hero
      {
        id: 'rect-navbar',
        boardId,
        type: 'rect',
        x: 90,
        y: 290,
        width: 720,
        height: 52,
        fill: '#ffffff',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        text: 'Logo   |   Services   Case Studies   Pricing   About        [ Book Free Consultation ]',
        textColor: '#334155',
        fontSize: 13,
        zIndex: 12,
        updatedAt: now,
      },
      {
        id: 'rect-hero-headline',
        boardId,
        type: 'rect',
        x: 90,
        y: 360,
        width: 440,
        height: 140,
        fill: '#ffffff',
        stroke: '#93c5fd',
        strokeWidth: 1.5,
        text: 'H1: Professional Websites That Turn Visitors Into Paying Clients\n\nSubtext: Modern, lightning-fast web design crafted for growing local businesses.\n\n[ Start Your Project -> ]   ( Watch 2-Min Demo )',
        textColor: '#0f172a',
        fontSize: 13,
        zIndex: 13,
        updatedAt: now,
      },
      {
        id: 'rect-hero-visual',
        boardId,
        type: 'rect',
        x: 550,
        y: 360,
        width: 260,
        height: 140,
        fill: '#e0f2fe',
        stroke: '#38bdf8',
        strokeWidth: 1,
        text: '🖼️ Interactive 3D Product/Service Showcase Mockup',
        textColor: '#0369a1',
        fontSize: 13,
        zIndex: 14,
        updatedAt: now,
      },
      // Frame 2: Conversion Audit & Roadmap
      {
        id: 'frame-audit',
        boardId,
        type: 'frame',
        x: 880,
        y: 60,
        width: 680,
        height: 480,
        fill: '#fafaf9',
        stroke: '#8b5cf6',
        strokeWidth: 2,
        text: 'Frame 2: 7-Point Business Growth & Conversion Rubric',
        textColor: '#5b21b6',
        fontSize: 16,
        zIndex: 2,
        updatedAt: now,
      },
      {
        id: 'sticky-rubric-1',
        boardId,
        type: 'sticky',
        x: 910,
        y: 110,
        width: 180,
        height: 150,
        fill: '#fed7aa', // orange
        stroke: '#f97316',
        strokeWidth: 1,
        text: '🎯 Clear Calls To Action:\nEvery screen has 1 primary goal. Sticky contact button on mobile screens.',
        textColor: '#7c2d12',
        fontSize: 13,
        zIndex: 15,
        updatedAt: now,
      },
      {
        id: 'sticky-rubric-2',
        boardId,
        type: 'sticky',
        x: 1110,
        y: 110,
        width: 180,
        height: 150,
        fill: '#bae6fd', // blue
        stroke: '#0284c7',
        strokeWidth: 1,
        text: '⚡ Speed & Performance:\nOptimized Next-gen images, zero layout shift, 95+ Google Lighthouse target.',
        textColor: '#075985',
        fontSize: 13,
        zIndex: 16,
        updatedAt: now,
      },
      {
        id: 'sticky-rubric-3',
        boardId,
        type: 'sticky',
        x: 1310,
        y: 110,
        width: 180,
        height: 150,
        fill: '#e9d5ff', // purple
        stroke: '#a855f7',
        strokeWidth: 1,
        text: '🔍 SEO & Visibility:\nSchema.org structured data, semantic HTML5, local business keywords.',
        textColor: '#581c87',
        fontSize: 13,
        zIndex: 17,
        updatedAt: now,
      },
      // Diamond: Decision Gate
      {
        id: 'diamond-decision',
        boardId,
        type: 'diamond',
        x: 1110,
        y: 300,
        width: 180,
        height: 120,
        fill: '#fef3c7',
        stroke: '#d97706',
        strokeWidth: 2,
        text: 'Client Trust & Conversion Gate',
        textColor: '#92400e',
        fontSize: 13,
        zIndex: 18,
        updatedAt: now,
      },
      // Badge: Contest Entry
      {
        id: 'badge-contest',
        boardId,
        type: 'badge',
        x: 910,
        y: 440,
        width: 620,
        height: 48,
        fill: '#ecfdf5',
        stroke: '#059669',
        strokeWidth: 1.5,
        text: '🏆 Entry Status: Active & Collaborative | Reward: $10 USD + Direct Contract Pitch',
        textColor: '#065f46',
        fontSize: 13,
        zIndex: 19,
        updatedAt: now,
      },
    ];
  }

  if (templateId === 'conversion-audit') {
    return [
      {
        id: 'frame-audit-board',
        boardId,
        type: 'frame',
        x: 60,
        y: 60,
        width: 1100,
        height: 520,
        fill: '#f8fafc',
        stroke: '#64748b',
        strokeWidth: 2,
        text: 'Client Website Conversion & UX Audit Board',
        textColor: '#1e293b',
        fontSize: 16,
        zIndex: 1,
        updatedAt: now,
      },
      {
        id: 'col-crit',
        boardId,
        type: 'sticky',
        x: 90,
        y: 120,
        width: 220,
        height: 180,
        fill: '#fecaca',
        stroke: '#ef4444',
        strokeWidth: 1,
        text: '🚨 Critical Conversion Blockers:\n1. Missing mobile phone click-to-call\n2. Pricing hidden behind 4 clicks\n3. Contact form has 12 fields (causes 75% dropoff)',
        textColor: '#991b1b',
        fontSize: 13,
        zIndex: 10,
        updatedAt: now,
      },
      {
        id: 'col-wins',
        boardId,
        type: 'sticky',
        x: 340,
        y: 120,
        width: 220,
        height: 180,
        fill: '#fef08a',
        stroke: '#eab308',
        strokeWidth: 1,
        text: '⚡ Quick Wins (< 48 Hours):\n1. Add floating WhatsApp / Call button\n2. Display Google 4.9★ Review badges\n3. Simplify lead form to Name + Phone',
        textColor: '#854d0e',
        fontSize: 13,
        zIndex: 11,
        updatedAt: now,
      },
      {
        id: 'col-modern',
        boardId,
        type: 'sticky',
        x: 590,
        y: 120,
        width: 220,
        height: 180,
        fill: '#bbf7d0',
        stroke: '#22c55e',
        strokeWidth: 1,
        text: '💎 Modern Website Redesign:\n1. Clean typography & generous whitespace\n2. Responsive interactive pricing cards\n3. Client video testimonials embed',
        textColor: '#166534',
        fontSize: 13,
        zIndex: 12,
        updatedAt: now,
      },
      {
        id: 'col-seo',
        boardId,
        type: 'sticky',
        x: 840,
        y: 120,
        width: 220,
        height: 180,
        fill: '#e9d5ff',
        stroke: '#a855f7',
        strokeWidth: 1,
        text: '📈 SEO & Growth Trajectory:\n1. Target high-intent local search queries\n2. Fast page load under 1.5 seconds\n3. Meta tags & OpenGraph social cards',
        textColor: '#6b21a8',
        fontSize: 13,
        zIndex: 13,
        updatedAt: now,
      },
    ];
  }

  // Blank template
  return [];
}
