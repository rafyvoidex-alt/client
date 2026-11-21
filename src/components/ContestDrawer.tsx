/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Send,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import type { ContestEntry } from '../types/whiteboard';
import {
  calculateRubricProgress,
  type JudgingCriteria,
} from '../utils/whiteboardLogic';

interface ContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ContestEntry;
  onUpdateEntry: (updated: Partial<ContestEntry>) => void;
  onSubmitEntry: () => Promise<void>;
  criteria: JudgingCriteria;
  onToggleCriteria: (key: keyof JudgingCriteria) => void;
}

export const ContestDrawer: React.FC<ContestDrawerProps> = ({
  isOpen,
  onClose,
  entry,
  onUpdateEntry,
  onSubmitEntry,
  criteria,
  onToggleCriteria,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const rubric = calculateRubricProgress(criteria);

  const criteriaLabels: { key: keyof JudgingCriteria; label: string; description: string }[] = [
    {
      key: 'designQuality',
      label: 'Website design quality & professionalism',
      description: 'Modern aesthetic, crisp typography scale, consistent branding, and visual hierarchy.',
    },
    {
      key: 'userExperience',
      label: 'User experience & ease of navigation',
      description: 'Intuitive menus, zero-confusion layout, and frictionless browsing paths.',
    },
    {
      key: 'mobileResponsiveness',
      label: 'Mobile responsiveness & accessibility',
      description: 'Flawless layout reflow on phones, tappable buttons, and high contrast.',
    },
    {
      key: 'speedAndPerformance',
      label: 'Website speed & performance',
      description: 'Sub-1.5s load times, optimized image assets, and Core Web Vitals compliance.',
    },
    {
      key: 'clearCallsToAction',
      label: 'Clear content & effective calls to action',
      description: 'Single prominent primary goal per viewport with persuasive action-oriented copy.',
    },
    {
      key: 'seoVisibility',
      label: 'SEO & search engine visibility',
      description: 'Semantic HTML tags, Schema.org business markup, and local search targeting.',
    },
    {
      key: 'conversionAbility',
      label: 'Ability to attract & convert potential customers',
      description: 'Strategic social proof, client trust badges, click-to-call, and low-friction lead forms.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitEntry();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      aria-label="Contest & Client Pitch Dashboard"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Open for Entry
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Reward Unverified
            </span>
          </div>
          <h2 className="text-lg font-bold leading-tight">
            Professional Website Design & Development for Growing Businesses
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Transform outdated, ineffective websites into high-converting online experiences.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close contest dashboard"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Reward & Deadline Callout */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Reward
              </div>
              <div className="text-sm font-bold text-slate-900">$10 USD Cash Prize</div>
              <div className="text-[11px] text-slate-500">+ Paid website development contract</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Deadline
              </div>
              <div className="text-sm font-bold text-slate-900">Nov 30, 2026</div>
              <div className="text-[11px] text-slate-500">23:59 UTC</div>
            </div>
          </div>
        </div>

        {/* Dashboard Status Card (Requested: Saved entry ID, submission time, recorded progress) */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-blue-600" />
              Your Entry Dashboard
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                entry.status === 'submitted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {entry.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Saved Entry ID
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {entry.entryId}
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Submission Time
              </span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {entry.submissionTime ? new Date(entry.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In progress'}
              </span>
            </div>
          </div>

          {/* Recorded Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700">Recorded Progress</span>
              <span className="text-blue-600 font-mono font-bold">{rubric.percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${rubric.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {rubric.completed} of {rubric.total} judging criteria met on this whiteboard workspace.
            </p>
          </div>
        </div>

        {/* The Problem & Rules Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            The Client Problem & Rules
          </h3>
          <div className="text-xs text-slate-700 space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p>
              <strong>The Problem:</strong> Many small businesses struggle with outdated,
              unprofessional, or poorly designed websites that fail to attract customers, build
              trust, and convert visitors into paying clients.
            </p>
            <p>
              <strong>The Rules:</strong> I help businesses turn outdated or ineffective websites into
              professional, user-friendly online experiences that build trust and attract more
              customers.
            </p>
          </div>
        </div>

        {/* 7 Judging Criteria Interactive Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              7-Point Judging Rubric
            </h3>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {rubric.completed}/{rubric.total}
            </span>
          </div>

          <div className="space-y-2">
            {criteriaLabels.map(({ key, label, description }) => {
              const checked = criteria[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleCriteria(key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    checked
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5">
                    {checked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold leading-snug">{label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Approach Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Submit Your Redesign Approach
            </h3>
            <p className="text-[11px] text-slate-500">
              This release accepts approaches. Contacts stay private until both actively agree.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name / Studio
            </label>
            <input
              type="text"
              required
              value={entry.applicantName}
              onChange={(e) => onUpdateEntry({ applicantName: e.target.value })}
              placeholder="e.g. Apex Creative Web Studio"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              required
              value={entry.applicantEmail}
              onChange={(e) => onUpdateEntry({ applicantEmail: e.target.value })}
              placeholder="e.g. designer@agency.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approach / Proposal Title
            </label>
            <input
              type="text"
              required
              value={entry.approachTitle}
              onChange={(e) => onUpdateEntry({ approachTitle: e.target.value })}
              placeholder="e.g. High-Conversion Small Business Redesign with 1.2s Fast Core Vitals"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Executive Approach Summary & Strategy
            </label>
            <textarea
              required
              rows={4}
              value={entry.approachSummary}
              onChange={(e) => onUpdateEntry({ approachSummary: e.target.value })}
              placeholder="Describe your design architecture, conversion funnel, mobile optimization, and how your approach helps small businesses build trust and attract clients..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          {showSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Proposal approach submitted! Entry ID <strong>{entry.entryId}</strong> recorded to
                Firebase and saved to your dashboard.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>Saving to Firebase...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Save & Submit Redesign Approach</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 text-center">
        Platform help is optional · Confirm delivery, rewards, confidentiality, and IP before work
      </div>
    </aside>
  );
};
