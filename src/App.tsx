/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Minimap } from './components/Minimap';
import { ContestDrawer } from './components/ContestDrawer';
import { CollaboratorsBar } from './components/CollaboratorsBar';
import { TemplateModal } from './components/TemplateModal';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PresentationMode } from './components/PresentationMode';

import type {
  ToolMode,
  WhiteboardElement,
  Point,
  Collaborator,
  ReactionParticle,
  ContestEntry,
} from './types/whiteboard';
import {
  calculateBoundingBox,
  generateEntryId,
  calculateRubricProgress,
  getTemplateElements,
  DEFAULT_CRITERIA,
  type JudgingCriteria,
} from './utils/whiteboardLogic';
import {
  testConnection,
} from './firebase/config';
import {
  subscribeToElements,
  saveWhiteboardElement,
  deleteWhiteboardElement,
  updateCollaboratorCursor,
  subscribeToCursors,
  saveContestSubmission,
} from './services/whiteboardService';

export default function App() {
  // Read room from URL or default
  const [boardId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('board') || 'wb-main-demo';
  });

  const [boardTitle, setBoardTitle] = useState('Website Redesign & Client Pitch');
  const [currentTool, setCurrentTool] = useState<ToolMode>('select');
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pan, setPan] = useState<Point>({ x: 100, y: 80 });
  const [zoom, setZoom] = useState<number>(0.9);
  const [snapGrid, setSnapGrid] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>('#fef08a'); // yellow default

  // History Stack for Undo/Redo
  const [undoStack, setUndoStack] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);

  // Current user identity
  const [currentUser] = useState<{ id: string; name: string; color: string }>(() => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16);
    const names = ['Jordan (Lead)', 'Alex (UX)', 'Taylor (Dev)', 'Sam (Designer)'];
    const name = names[Math.floor(Math.random() * names.length)];
    return {
      id: `user-${Date.now().toString(36)}`,
      name,
      color: `#${randomHex.padStart(6, '0')}`,
    };
  });

  // Active collaborators and presence
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const [isSimulatedTeamActive, setIsSimulatedTeamActive] = useState<boolean>(true);
  const [reactions, setReactions] = useState<ReactionParticle[]>([]);

  // Modals and Drawers
  const [isContestDrawerOpen, setIsContestDrawerOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Judging Criteria & Contest Entry
  const [criteria, setCriteria] = useState<JudgingCriteria>(() => {
    const saved = localStorage.getItem('wb_criteria');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return DEFAULT_CRITERIA;
  });

  const [contestEntry, setContestEntry] = useState<ContestEntry>(() => {
    const saved = localStorage.getItem('wb_contest_entry');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return {
      entryId: generateEntryId('website-growth-2026'),
      applicantName: 'Apex Web Studio & Consulting',
      applicantEmail: 'jordan@apexwebstudio.com',
      approachTitle: 'High-Conversion Small Business Redesign with 1.2s Fast Core Vitals',
      approachSummary:
        'Small businesses struggle with outdated 2018-era layouts and low customer trust. Our approach transforms obsolete sites into lightning-fast, conversion-focused online experiences. We implement clear value props, sticky mobile CTAs, verified Google review badges, and accessible typography scale that turn casual visitors into paying clients.',
      progress: 71,
      status: 'submitted',
      submissionTime: new Date().toISOString(),
      whiteboardId: boardId,
    };
  });

  // Window dimensions for minimap & centerings
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Startup Firebase Connection test
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        console.log('Firebase Firestore connection verified.');
      }
    });
  }, []);

  // 2. Initialize Seed Elements if empty
  useEffect(() => {
    const initialElements = getTemplateElements('website-redesign-pitch', boardId);
    setElements(initialElements);

    // Save initial template elements to Firebase in background
    for (const el of initialElements) {
      saveWhiteboardElement(boardId, el).catch(() => {});
    }
  }, [boardId]);

  // 3. Real-time Firebase Firestore Sync for Elements
  useEffect(() => {
    const unsubscribe = subscribeToElements(
      boardId,
      (remoteElements) => {
        if (remoteElements && remoteElements.length > 0) {
          setElements(remoteElements);
        }
      },
      (err) => {
        console.warn('Real-time sync offline notice:', err.message);
      }
    );

    return () => unsubscribe();
  }, [boardId]);

  // 4. Real-time Cursors Sync
  useEffect(() => {
    const unsubscribe = subscribeToCursors(boardId, currentUser.id, (remoteCursors) => {
      setCollaborators((prev) => {
        // Merge real-time remote cursors with simulated ones if active
        const simulated = Object.fromEntries(
          Object.entries(prev).filter(([_, c]) => c.isSimulated)
        );
        return { ...simulated, ...remoteCursors };
      });
    });

    return () => unsubscribe();
  }, [boardId, currentUser.id]);

  // 5. Simulated Real-Time Collaborators (Alex, Maya, Liam)
  useEffect(() => {
    if (!isSimulatedTeamActive) {
      setCollaborators((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([_, c]) => !c.isSimulated))
      );
      return;
    }

    const simCollaborators: Record<string, Collaborator> = {
      'sim-alex': {
        id: 'sim-alex',
        name: 'Alex Rivera',
        color: '#8b5cf6',
        role: 'UX Architect',
        avatar: 'A',
        x: 420,
        y: 280,
        lastActive: Date.now(),
        isSimulated: true,
      },
      'sim-maya': {
        id: 'sim-maya',
        name: 'Maya Chen',
        color: '#10b981',
        role: 'Frontend Lead',
        avatar: 'M',
        x: 980,
        y: 220,
        lastActive: Date.now(),
        isSimulated: true,
      },
      'sim-liam': {
        id: 'sim-liam',
        name: 'Liam Vance',
        color: '#f59e0b',
        role: 'Client Reviewer',
        avatar: 'L',
        x: 240,
        y: 420,
        lastActive: Date.now(),
        isSimulated: true,
      },
    };

    setCollaborators((prev) => ({ ...prev, ...simCollaborators }));

    let step = 0;
    const interval = setInterval(() => {
      step += 0.05;
      setCollaborators((prev) => {
        const next = { ...prev };
        if (next['sim-alex']) {
          next['sim-alex'] = {
            ...next['sim-alex'],
            x: 420 + Math.cos(step) * 120,
            y: 260 + Math.sin(step) * 80,
            lastActive: Date.now(),
          };
        }
        if (next['sim-maya']) {
          next['sim-maya'] = {
            ...next['sim-maya'],
            x: 980 + Math.sin(step * 1.3) * 140,
            y: 220 + Math.cos(step * 1.3) * 60,
            lastActive: Date.now(),
          };
        }
        if (next['sim-liam']) {
          next['sim-liam'] = {
            ...next['sim-liam'],
            x: 240 + Math.cos(step * 0.8) * 80,
            y: 420 + Math.sin(step * 0.8) * 50,
            lastActive: Date.now(),
          };
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulatedTeamActive]);

  // Clean reaction particles
  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.createdAt < 2500));
    }, 2500);
    return () => clearTimeout(timer);
  }, [reactions]);

  // Push current elements to Undo Stack before modification
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), elements]);
    setRedoStack([]);
  }, [elements]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [elements, ...prev]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(1));
    setElements(next);
  };

  // Element CRUD Handlers
  const handleCreateElement = (newElement: WhiteboardElement) => {
    pushUndo();
    const updated = [...elements, newElement];
    setElements(updated);
    saveWhiteboardElement(boardId, newElement).catch(() => {});
  };

  const handleUpdateElement = (id: string, patch: Partial<WhiteboardElement>) => {
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;
    const updated = [...elements];
    updated[index] = { ...updated[index], ...patch, updatedAt: new Date().toISOString() };
    setElements(updated);
    saveWhiteboardElement(boardId, updated[index]).catch(() => {});
  };

  const handleBatchUpdateSelected = (patch: Partial<WhiteboardElement>) => {
    if (selectedIds.length === 0) return;
    pushUndo();
    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        const patched = { ...el, ...patch, updatedAt: new Date().toISOString() };
        saveWhiteboardElement(boardId, patched).catch(() => {});
        return patched;
      }
      return el;
    });
    setElements(updated);
  };

  const handleDeleteElements = (ids: string[]) => {
    if (ids.length === 0) return;
    pushUndo();
    setElements((prev) => prev.filter((el) => !ids.includes(el.id)));
    setSelectedIds([]);
    for (const id of ids) {
      deleteWhiteboardElement(boardId, id).catch(() => {});
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    pushUndo();
    const newItems: WhiteboardElement[] = [];
    for (const id of selectedIds) {
      const el = elements.find((item) => item.id === id);
      if (el) {
        const copy: WhiteboardElement = {
          ...el,
          id: `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: el.x + 30,
          y: el.y + 30,
          zIndex: elements.length + 1,
          updatedAt: new Date().toISOString(),
        };
        newItems.push(copy);
        saveWhiteboardElement(boardId, copy).catch(() => {});
      }
    }
    setElements((prev) => [...prev, ...newItems]);
    setSelectedIds(newItems.map((n) => n.id));
  };

  const handleBringForward = () => {
    if (selectedIds.length === 0) return;
    pushUndo();
    setElements((prev) => {
      const maxZ = Math.max(...prev.map((e) => e.zIndex || 0), 1);
      return prev.map((el) => (selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el));
    });
  };

  const handleSendBackward = () => {
    if (selectedIds.length === 0) return;
    pushUndo();
    setElements((prev) => {
      const minZ = Math.min(...prev.map((e) => e.zIndex || 0), 1);
      return prev.map((el) => (selectedIds.includes(el.id) ? { ...el, zIndex: Math.max(minZ - 1, 0) } : el));
    });
  };

  // Cursor Move throttle to Firebase
  const lastCursorUpdateRef = useRef<number>(0);
  const handleCursorMove = useCallback(
    (worldPt: Point) => {
      const now = Date.now();
      if (now - lastCursorUpdateRef.current > 120) {
        lastCursorUpdateRef.current = now;
        updateCollaboratorCursor(boardId, {
          id: currentUser.id,
          name: currentUser.name,
          color: currentUser.color,
          x: worldPt.x,
          y: worldPt.y,
        });
      }
    },
    [boardId, currentUser]
  );

  // Send Reaction Emojis
  const handleSendReaction = (emoji: string) => {
    // Generate reaction near screen center
    const centerWorldX = (-pan.x + windowDimensions.width / 2) / zoom;
    const centerWorldY = (-pan.y + windowDimensions.height / 2) / zoom;
    const rx = centerWorldX + (Math.random() - 0.5) * 200;
    const ry = centerWorldY + (Math.random() - 0.5) * 150;

    const newReaction: ReactionParticle = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      x: rx,
      y: ry,
      createdAt: Date.now(),
    };
    setReactions((prev) => [...prev, newReaction]);
  };

  // Fit to content
  const handleFitToContent = () => {
    const box = calculateBoundingBox(elements);
    const padding = 100;
    const scaleX = (windowDimensions.width - padding * 2) / box.width;
    const scaleY = (windowDimensions.height - padding * 2) / box.height;
    const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);

    const newPanX = (windowDimensions.width - box.width * fitZoom) / 2 - box.minX * fitZoom;
    const newPanY = (windowDimensions.height - box.height * fitZoom) / 2 - box.minY * fitZoom;

    setZoom(fitZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Center on a specific frame (for Presentation Mode)
  const handleNavigateToFrame = useCallback(
    (frame: WhiteboardElement) => {
      const frameZoom = Math.min(
        (windowDimensions.width - 160) / (frame.width || 800),
        (windowDimensions.height - 180) / (frame.height || 500),
        1.1
      );
      const newPanX = (windowDimensions.width - (frame.width || 800) * frameZoom) / 2 - frame.x * frameZoom;
      const newPanY = (windowDimensions.height - (frame.height || 500) * frameZoom) / 2 - frame.y * frameZoom;

      setZoom(frameZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [windowDimensions]
  );

  // Load Template
  const handleSelectTemplate = (templateId: string) => {
    pushUndo();
    const newElements = getTemplateElements(templateId, boardId);
    setElements(newElements);
    for (const el of newElements) {
      saveWhiteboardElement(boardId, el).catch(() => {});
    }
    setTimeout(handleFitToContent, 100);
  };

  // Toggle Judging Rubric Criteria
  const handleToggleCriteria = (key: keyof JudgingCriteria) => {
    const updated = { ...criteria, [key]: !criteria[key] };
    setCriteria(updated);
    localStorage.setItem('wb_criteria', JSON.stringify(updated));
    const rubric = calculateRubricProgress(updated);
    setContestEntry((prev) => ({ ...prev, progress: rubric.percentage }));
  };

  // Submit contest proposal
  const handleSubmitEntry = async () => {
    const rubric = calculateRubricProgress(criteria);
    const updatedEntry: ContestEntry = {
      ...contestEntry,
      progress: rubric.percentage,
      status: 'submitted',
      submissionTime: new Date().toISOString(),
    };
    setContestEntry(updatedEntry);
    localStorage.setItem('wb_contest_entry', JSON.stringify(updatedEntry));
    await saveContestSubmission(updatedEntry);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;

      if (e.key === 'v' || e.key === 'V') setCurrentTool('select');
      if (e.key === 'h' || e.key === 'H') setCurrentTool('hand');
      if (e.key === 's' || e.key === 'S') setCurrentTool('sticky');
      if (e.key === 'r' || e.key === 'R') setCurrentTool('rect');
      if (e.key === 'o' || e.key === 'O') setCurrentTool('circle');
      if (e.key === 'd' || e.key === 'D') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleDuplicateSelected();
        } else {
          setCurrentTool('diamond');
        }
      }
      if (e.key === 't' || e.key === 'T') setCurrentTool('text');
      if (e.key === 'p' || e.key === 'P') setCurrentTool('drawing');
      if (e.key === 'a' || e.key === 'A') setCurrentTool('arrow');
      if (e.key === 'f' || e.key === 'F') setCurrentTool('frame');
      if (e.key === 'b' || e.key === 'B') setCurrentTool('badge');
      if (e.key === 'g' || e.key === 'G') setSnapGrid((prev) => !prev);
      if (e.key === '?') setIsShortcutsModalOpen(true);
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setIsPresentationMode(false);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, undoStack, redoStack]);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const frames = useMemo(() => elements.filter((el) => el.type === 'frame'), [elements]);
  const rubricProgress = calculateRubricProgress(criteria);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Collaborators and Navigation Bar */}
      {!isPresentationMode && (
        <CollaboratorsBar
          currentUser={currentUser}
          collaborators={collaborators}
          isSimulatedTeamActive={isSimulatedTeamActive}
          onToggleSimulatedTeam={() => setIsSimulatedTeamActive((prev) => !prev)}
          onShareRoom={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          onOpenContestDrawer={() => setIsContestDrawerOpen(true)}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onStartPresentation={() => setIsPresentationMode(true)}
          contestProgress={rubricProgress.percentage}
          boardTitle={boardTitle}
          onUpdateBoardTitle={setBoardTitle}
        />
      )}

      {/* Main Interactive Canvas */}
      <main className="flex-1 w-full h-full relative" aria-label="Whiteboard Canvas Surface">
        <Canvas
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          elements={elements}
          selectedIds={selectedIds}
          onSelectElements={setSelectedIds}
          onUpdateElement={handleUpdateElement}
          onCreateElement={handleCreateElement}
          onDeleteElements={handleDeleteElements}
          pan={pan}
          zoom={zoom}
          onPanChange={setPan}
          onZoomChange={setZoom}
          snapGrid={snapGrid}
          currentColor={currentColor}
          collaborators={collaborators}
          onCursorMove={handleCursorMove}
          reactions={reactions}
          boardId={boardId}
          isPresentationMode={isPresentationMode}
        />

        {/* Selected Element Floating Properties Toolbar */}
        {!isPresentationMode && selectedElements.length > 0 && (
          <PropertiesPanel
            selectedElements={selectedElements}
            onUpdateElement={handleBatchUpdateSelected}
            onDuplicate={handleDuplicateSelected}
            onDelete={() => handleDeleteElements(selectedIds)}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
          />
        )}

        {/* Bottom Floating Whiteboard Toolbar */}
        {!isPresentationMode && (
          <Toolbar
            currentTool={currentTool}
            onSelectTool={setCurrentTool}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            hasSelection={selectedIds.length > 0}
            onDeleteSelected={() => handleDeleteElements(selectedIds)}
            zoom={zoom}
            onZoomIn={() => setZoom((prev) => Math.min(prev * 1.15, 3.0))}
            onZoomOut={() => setZoom((prev) => Math.max(prev * 0.85, 0.2))}
            onZoomReset={() => setZoom(1.0)}
            onFitToContent={handleFitToContent}
            snapGrid={snapGrid}
            onToggleSnapGrid={() => setSnapGrid((prev) => !prev)}
            currentColor={currentColor}
            onChangeColor={setCurrentColor}
            onSendReaction={handleSendReaction}
          />
        )}

        {/* Canvas Minimap */}
        {!isPresentationMode && (
          <Minimap
            elements={elements}
            pan={pan}
            zoom={zoom}
            canvasWidth={windowDimensions.width}
            canvasHeight={windowDimensions.height}
            onNavigate={setPan}
          />
        )}

        {/* Presentation Pitch Controller */}
        {isPresentationMode && (
          <PresentationMode
            isOpen={isPresentationMode}
            onClose={() => setIsPresentationMode(false)}
            frames={frames}
            onNavigateToFrame={handleNavigateToFrame}
            boardTitle={boardTitle}
          />
        )}
      </main>

      {/* Contest & Client Pitch Drawer */}
      <ContestDrawer
        isOpen={isContestDrawerOpen}
        onClose={() => setIsContestDrawerOpen(false)}
        entry={contestEntry}
        onUpdateEntry={(patch) => setContestEntry((prev) => ({ ...prev, ...patch }))}
        onSubmitEntry={handleSubmitEntry}
        criteria={criteria}
        onToggleCriteria={handleToggleCriteria}
      />

      {/* Templates Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export & Share Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={elements}
        boardTitle={boardTitle}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
