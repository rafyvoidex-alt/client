/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBoundingBox,
  snapToGrid,
  pointInElement,
  generateSmoothSvgPath,
  generateEntryId,
  calculateRubricProgress,
  getTemplateElements,
  type WhiteboardElement,
} from './whiteboardLogic';

test('snapToGrid correctly snaps values', () => {
  assert.equal(snapToGrid(24, 20), 20);
  assert.equal(snapToGrid(31, 20), 40);
  assert.equal(snapToGrid(10, 20), 20);
  assert.equal(snapToGrid(0, 20), 0);
  assert.equal(snapToGrid(55, 10), 60);
  assert.equal(snapToGrid(42, 0), 42); // 0 grid disables snapping
});

test('calculateBoundingBox handles empty and populated element sets', () => {
  const emptyBox = calculateBoundingBox([]);
  assert.equal(emptyBox.minX, 0);
  assert.equal(emptyBox.minY, 0);

  const elements: WhiteboardElement[] = [
    {
      id: '1',
      boardId: 'b1',
      type: 'rect',
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      zIndex: 1,
      updatedAt: '2026-11-20',
    },
    {
      id: '2',
      boardId: 'b1',
      type: 'circle',
      x: 50,
      y: 300,
      width: 150,
      height: 150,
      zIndex: 2,
      updatedAt: '2026-11-20',
    },
  ];

  const box = calculateBoundingBox(elements);
  assert.equal(box.minX, 50);
  assert.equal(box.minY, 150);
  assert.equal(box.maxX, 300);
  assert.equal(box.maxY, 450);
  assert.equal(box.width, 250);
  assert.equal(box.height, 300);
});

test('pointInElement accurately detects hits', () => {
  const element: WhiteboardElement = {
    id: 'el-1',
    boardId: 'b1',
    type: 'rect',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    zIndex: 1,
    updatedAt: '2026-11-20',
  };

  assert.equal(pointInElement({ x: 150, y: 150 }, element), true);
  assert.equal(pointInElement({ x: 100, y: 100 }, element), true);
  assert.equal(pointInElement({ x: 50, y: 50 }, element), false);
  assert.equal(pointInElement({ x: 350, y: 250 }, element), false);
});

test('generateSmoothSvgPath generates valid SVG paths', () => {
  assert.equal(generateSmoothSvgPath([]), '');
  const single = generateSmoothSvgPath([{ x: 10, y: 20 }]);
  assert.match(single, /^M 10 20/);

  const line = generateSmoothSvgPath([
    { x: 10, y: 20 },
    { x: 30, y: 40 },
  ]);
  assert.equal(line, 'M 10 20 L 30 40');

  const multi = generateSmoothSvgPath([
    { x: 0, y: 0 },
    { x: 50, y: 100 },
    { x: 100, y: 50 },
  ]);
  assert.match(multi, /M 0 0 Q/);
});

test('generateEntryId produces consistent and compliant ID format', () => {
  const id = generateEntryId();
  assert.match(id, /^WB-2026-[0-9A-F]{4}$/);

  const seeded1 = generateEntryId('user-42');
  const seeded2 = generateEntryId('user-42');
  assert.equal(seeded1, seeded2);
  assert.match(seeded1, /^WB-2026-[0-9A-F]{4}$/);
});

test('calculateRubricProgress calculates accurate percentage and totals', () => {
  const res = calculateRubricProgress({
    designQuality: true,
    userExperience: true,
    mobileResponsiveness: true,
    speedAndPerformance: true,
    clearCallsToAction: true,
    seoVisibility: true,
    conversionAbility: true,
  });
  assert.equal(res.completed, 7);
  assert.equal(res.total, 7);
  assert.equal(res.percentage, 100);

  const partial = calculateRubricProgress({
    designQuality: true,
    userExperience: false,
    mobileResponsiveness: false,
    speedAndPerformance: false,
    clearCallsToAction: false,
    seoVisibility: false,
    conversionAbility: false,
  });
  assert.equal(partial.completed, 1);
  assert.equal(partial.total, 7);
  assert.equal(partial.percentage, 14);
});

test('getTemplateElements returns wireframe and audit elements', () => {
  const pitchElements = getTemplateElements('website-redesign-pitch', 'board-123');
  assert.ok(pitchElements.length > 5);
  assert.ok(pitchElements.some(e => e.type === 'frame'));
  assert.ok(pitchElements.some(e => e.type === 'sticky'));
  assert.ok(pitchElements.some(e => e.type === 'diamond'));

  const auditElements = getTemplateElements('conversion-audit', 'board-123');
  assert.ok(auditElements.length > 3);

  const blankElements = getTemplateElements('blank', 'board-123');
  assert.equal(blankElements.length, 0);
});
