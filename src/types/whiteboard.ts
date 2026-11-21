/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ElementType, Point, WhiteboardElement } from '../utils/whiteboardLogic';

export type { ElementType, Point, WhiteboardElement };

export type ToolMode =
  | 'select'
  | 'hand'
  | 'sticky'
  | 'rect'
  | 'circle'
  | 'diamond'
  | 'text'
  | 'drawing'
  | 'arrow'
  | 'frame'
  | 'badge'
  | 'laser';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  role: string;
  avatar: string;
  x: number;
  y: number;
  lastActive: number;
  isSimulated?: boolean;
}

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface ContestEntry {
  entryId: string;
  applicantName: string;
  applicantEmail: string;
  approachTitle: string;
  approachSummary: string;
  progress: number;
  status: 'draft' | 'submitted' | 'reviewed';
  submissionTime?: string;
  whiteboardId: string;
  notes?: string;
}
