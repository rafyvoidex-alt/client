/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout, CheckSquare, Sparkles, X, Plus } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const templates = [
    {
      id: 'website-redesign-pitch',
      title: 'Small Business Website Redesign & Pitch',
      badge: 'Contest Recommended',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description:
        'Complete hero section wireframe, customer value proposition hierarchy, client problem vs. modern solution sticky notes, and 7-point business growth rubric.',
      features: [
        'Hero section wireframe with primary & secondary CTAs',
        'Problem analysis & proposed redesign roadmap',
        'Decision gates & customer trust validation badges',
        'Aligned with $10 USD contest judging rubric',
      ],
      icon: <Layout className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'conversion-audit',
      title: 'Client Conversion & UX Audit Matrix',
      badge: 'Agency Tool',
      badgeColor: 'bg-purple-100 text-purple-800',
      description:
        'Structured 4-column audit board: Critical Conversion Blockers (Red), Quick Wins < 48h (Yellow), Modern Upgrades (Green), and SEO & Speed Checklist.',
      features: [
        'Categorized sticky notes with severity color coding',
        'Mobile usability and friction points tracking',
        'Fast wins to demonstrate immediate ROI to clients',
      ],
      icon: <CheckSquare className="w-5 h-5 text-purple-600" />,
    },
    {
      id: 'blank',
      title: 'Blank Infinite Canvas',
      badge: 'Custom',
      badgeColor: 'bg-slate-100 text-slate-700',
      description:
        'Start with a pristine blank infinite canvas to design custom wireframes, user flows, and diagrams from scratch.',
      features: ['Empty canvas ready for freehand drawing, shapes, and sticky notes'],
      icon: <Plus className="w-5 h-5 text-slate-600" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="template-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Choose Whiteboard Template
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a specialized website redesign or diagramming layout for your board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close template dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template List */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                onSelectTemplate(t.id);
                onClose();
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                    {t.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {t.title}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mt-0.5 ${t.badgeColor}`}>
                      {t.badge}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Load Template
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {t.features.map((f, i) => (
                  <div key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
