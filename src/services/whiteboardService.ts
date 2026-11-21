/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type { WhiteboardElement, Collaborator, ContestEntry } from '../types/whiteboard';

/**
 * Subscribes to real-time updates for elements in a specific whiteboard.
 */
export function subscribeToElements(
  boardId: string,
  onUpdate: (elements: WhiteboardElement[]) => void,
  onError?: (err: Error) => void
): () => void {
  const elementsPath = `whiteboards/${boardId}/elements`;
  const colRef = collection(db, 'whiteboards', boardId, 'elements');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: WhiteboardElement[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          ...(data as WhiteboardElement),
          id: d.id,
          boardId,
        });
      });
      // Sort by zIndex or creation
      items.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      onUpdate(items);
    },
    (error) => {
      console.warn('Real-time elements snapshot notice:', error.message);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, elementsPath);
      } catch (err) {
        // Logged and formatted
      }
    }
  );
}

/**
 * Saves or updates a whiteboard element.
 */
export async function saveWhiteboardElement(
  boardId: string,
  element: WhiteboardElement
): Promise<void> {
  const path = `whiteboards/${boardId}/elements/${element.id}`;
  try {
    const docRef = doc(db, 'whiteboards', boardId, 'elements', element.id);
    await setDoc(
      docRef,
      {
        ...element,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a whiteboard element.
 */
export async function deleteWhiteboardElement(
  boardId: string,
  elementId: string
): Promise<void> {
  const path = `whiteboards/${boardId}/elements/${elementId}`;
  try {
    const docRef = doc(db, 'whiteboards', boardId, 'elements', elementId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Updates collaborator live cursor position in Firestore.
 */
export async function updateCollaboratorCursor(
  boardId: string,
  collaborator: Partial<Collaborator> & { id: string; name: string; x: number; y: number }
): Promise<void> {
  const path = `whiteboards/${boardId}/cursors/${collaborator.id}`;
  try {
    const docRef = doc(db, 'whiteboards', boardId, 'cursors', collaborator.id);
    await setDoc(
      docRef,
      {
        userId: collaborator.id,
        boardId,
        userName: collaborator.name,
        userColor: collaborator.color || '#3b82f6',
        x: collaborator.x,
        y: collaborator.y,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-blocking cursor updates
    console.debug('Cursor sync notice:', error);
  }
}

/**
 * Subscribes to live cursor positions of all active users in a board.
 */
export function subscribeToCursors(
  boardId: string,
  currentUserId: string,
  onUpdate: (cursors: Record<string, Collaborator>) => void
): () => void {
  const path = `whiteboards/${boardId}/cursors`;
  const colRef = collection(db, 'whiteboards', boardId, 'cursors');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const activeCursors: Record<string, Collaborator> = {};
      const now = Date.now();
      snapshot.forEach((d) => {
        if (d.id === currentUserId) return; // skip self
        const data = d.data();
        const lastSeenMs = data.lastSeen ? new Date(data.lastSeen).getTime() : now;
        // Keep active if updated within the last 60 seconds
        if (now - lastSeenMs < 60000) {
          activeCursors[d.id] = {
            id: d.id,
            name: data.userName || 'Collaborator',
            color: data.userColor || '#8b5cf6',
            role: 'Editor',
            avatar: (data.userName || 'C')[0].toUpperCase(),
            x: data.x || 0,
            y: data.y || 0,
            lastActive: lastSeenMs,
          };
        }
      });
      onUpdate(activeCursors);
    },
    (error) => {
      console.warn('Cursor snapshot notice:', error.message);
    }
  );
}

/**
 * Saves contest submission and client pitch approach in Firestore.
 */
export async function saveContestSubmission(submission: ContestEntry): Promise<void> {
  const path = `submissions/${submission.entryId}`;
  try {
    const docRef = doc(db, 'submissions', submission.entryId);
    await setDoc(docRef, {
      ...submission,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieves a submission by its entry ID.
 */
export async function getContestSubmission(entryId: string): Promise<ContestEntry | null> {
  const path = `submissions/${entryId}`;
  try {
    const docRef = doc(db, 'submissions', entryId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as ContestEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
