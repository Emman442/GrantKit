import React, { useEffect } from 'react';
import { X, ExternalLink, GitCommit, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Proposal, EvaluationLogEntry } from '../../types/contract';
import { Badge } from './Badge';
import { formatDate, formatGen, truncateAddress } from '../../utils/format';

interface DrawerProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ proposal, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !proposal) return null;

  // Parse evaluation log entries
  const parsedLogs: EvaluationLogEntry[] = proposal.log.map((item) => {
    try {
      return JSON.parse(item);
    } catch {
      return {
        type: 'proposal_evaluation',
        score: 0,
        passed: false,
        reasoning: String(item),
        timestamp: Date.now(),
      };
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-proposal-title"
        className="w-full max-w-xl h-full bg-[var(--bg-surface)] border-l border-[var(--border-app)] text-[var(--text-app)] flex flex-col shadow-[0_0_40px_rgb(0,0,0,0.5)] overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--text-faint)]">
                Proposal #{proposal.id}
              </span>
              <Badge status={proposal.status} />
              <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                Score: {proposal.score} / 100
              </span>
            </div>
            <h2 id="drawer-proposal-title" className="text-base font-semibold text-[var(--text-app)] leading-snug">
              {proposal.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1">
              <span>Applicant:</span>
              <span className="font-mono text-[var(--text-app)]">
                {truncateAddress(proposal.applicant, 8, 6)}
              </span>
              <span>·</span>
              <span>{formatDate(proposal.submitted_at)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Close details"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Financial summary row */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Requested</div>
              <div className="font-mono text-xs font-semibold tabular-nums text-[var(--text-app)] mt-0.5">
                {formatGen(proposal.amount).display}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Released</div>
              <div className="font-mono text-xs font-semibold tabular-nums text-[var(--color-success)] mt-0.5">
                {formatGen(proposal.released).display}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Remaining Escrow</div>
              <div className="font-mono text-xs font-semibold tabular-nums text-[var(--text-app)] mt-0.5">
                {formatGen(BigInt(proposal.amount) - BigInt(proposal.released)).display}
              </div>
            </div>
          </div>

          {/* Committee Reasoning */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-app)] uppercase tracking-wider mb-2">
              On-Chain LLM Committee Reasoning
            </h3>
            <div className="p-3.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[var(--text-app)] leading-relaxed">
              {proposal.reasoning}
            </div>
          </div>

          {/* Project Pitch */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-app)] uppercase tracking-wider mb-2">
              Project Specification & Pitch
            </h3>
            <div className="p-3.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[var(--text-app)] leading-relaxed whitespace-pre-wrap">
              {proposal.pitch}
            </div>
          </div>

          {/* Verified Links */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-app)] uppercase tracking-wider mb-2">
              Verified Source Repositories & Specifications
            </h3>
            <div className="space-y-1.5">
              {proposal.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[#3B6CFF] hover:bg-[var(--border-app)] transition-colors"
                >
                  <span className="font-mono text-xs truncate max-w-sm">{link}</span>
                  <ExternalLink size={14} strokeWidth={1.5} className="shrink-0 text-[var(--text-muted)]" />
                </a>
              ))}
            </div>
          </div>

          {/* Milestones & Tranches */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-app)] uppercase tracking-wider mb-2">
              Milestone Breakdown ({proposal.milestones.length})
            </h3>
            <div className="space-y-2">
              {proposal.milestones.map((m, idx) => {
                const isPaid = idx < proposal.current_milestone;
                const isCurrent = idx === proposal.current_milestone && proposal.status === 1;
                const tranche = proposal.milestone_tranches[idx] || '0';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-[6px] border ${
                      isCurrent
                        ? 'border-[#3B6CFF] bg-[var(--bg-surface-raised)]'
                        : 'border-[var(--border-app)] bg-[var(--bg-surface-raised)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[var(--text-faint)]">
                          Milestone 0{idx + 1}
                        </span>
                        {isPaid && (
                          <span className="text-[10px] text-[var(--color-success)] font-medium">
                            Released
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-[#3B6CFF] font-medium">
                            Current Stage
                          </span>
                        )}
                        {!isPaid && !isCurrent && (
                          <span className="text-[10px] text-[var(--text-faint)] font-medium">
                            Escrowed
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-app)]">
                        {formatGen(tranche).display}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-app)] leading-relaxed">{m}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluation Log */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-app)] uppercase tracking-wider mb-2">
              Full Evaluation Audit Log ({parsedLogs.length})
            </h3>
            <div className="space-y-2">
              {parsedLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-[var(--text-faint)] uppercase">
                      {log.type === 'proposal_evaluation'
                        ? 'Initial Committee Scoring'
                        : `Milestone #${(log.milestone_index ?? 0) + 1} Audit`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-[var(--text-app)]">
                        Score: {log.score}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          log.passed ? 'text-[var(--color-success)]' : 'text-[#D2554D]'
                        }`}
                      >
                        {log.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {log.reasoning}
                  </p>
                  <div className="text-[10px] text-[var(--text-faint)] mt-1.5">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--border-app)] bg-[var(--bg-surface-raised)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-mono">GenVM Verified Consensus</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-app)] hover:bg-[var(--border-app)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
