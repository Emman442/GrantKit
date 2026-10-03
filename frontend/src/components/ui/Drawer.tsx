import React, { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import type { GrantLogEntry, GrantProposal } from "../../../lib/contracts/types";
import { Badge } from "./Badge";
import { formatDate, formatGen, truncateAddress } from "../../utils/format";

interface DrawerProps {
  proposal: GrantProposal | null;
  isOpen: boolean;
  onClose: () => void;
}

function tranche(amount: number, total: number, index: number): number {
  if (total < 1) return 0;
  const base = Math.floor(amount / total);
  if (index === total - 1) return amount - base * (total - 1);
  return base;
}

function logLabel(log: GrantLogEntry): string {
  if (log.type === "milestone") return `Milestone #${(log.index ?? 0) + 1} audit`;
  if (log.type === "closed") return "Grant closed";
  return "Proposal evaluation";
}

export const Drawer: React.FC<DrawerProps> = ({ proposal, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !proposal || !proposal.found) return null;

  const amount = proposal.amount ?? 0;
  const released = proposal.released ?? 0;
  const milestones = proposal.milestones ?? [];
  const links = proposal.links ?? [];
  const logs = proposal.log ?? [];
  const next = proposal.next_milestone ?? 0;
  const status = proposal.status ?? "";

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
        <div className="flex items-start justify-between p-5 border-b border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--text-faint)]">
                Proposal #{proposal.id}
              </span>
              <Badge status={status} />
              <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                {proposal.tier ?? "—"} · {proposal.score ?? 0}
              </span>
            </div>
            <h2 id="drawer-proposal-title" className="text-base font-semibold leading-snug">
              {proposal.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1">
              <span>Applicant:</span>
              <span className="font-mono text-[var(--text-app)]">
                {truncateAddress(proposal.applicant ?? "", 8, 6)}
              </span>
              <span>·</span>
              <span>{formatDate(Number(proposal.created_at) ?? "")}</span>
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

        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Requested</div>
              <div className="font-mono text-xs font-semibold tabular-nums mt-0.5">
                {formatGen(amount).display}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Released</div>
              <div className="font-mono text-xs font-semibold tabular-nums text-[var(--color-success)] mt-0.5">
                {formatGen(released).display}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">Remaining escrow</div>
              <div className="font-mono text-xs font-semibold tabular-nums mt-0.5">
                {formatGen(Math.max(amount - released, 0)).display}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Verdict</h3>
            <div className="p-3.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] leading-relaxed">
              {proposal.feedback || "No feedback recorded."}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Pitch</h3>
            <div className="p-3.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] leading-relaxed whitespace-pre-wrap">
              {proposal.pitch}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Links</h3>
            <div className="space-y-1.5">
              {links.map((link) => (
                <a
                  key={link}
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

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
              Milestones ({milestones.length})
            </h3>
            <div className="space-y-2">
              {milestones.map((milestone, idx) => {
                const paid = idx < next && status !== "rejected";
                const current = status === "approved" && idx === next;
                return (
                  <div
                    key={`${idx}-${milestone}`}
                    className={`p-3 rounded-[6px] border ${
                      current ? "border-[#3B6CFF]" : "border-[var(--border-app)]"
                    } bg-[var(--bg-surface-raised)]`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--text-faint)]">
                          Milestone {idx + 1}
                        </span>
                        {paid && <span className="text-[10px] text-[var(--color-success)]">Released</span>}
                        {current && <span className="text-[10px] text-[#3B6CFF]">Current</span>}
                        {!paid && !current && status === "approved" && (
                          <span className="text-[10px] text-[var(--text-faint)]">Escrowed</span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {formatGen(tranche(amount, milestones.length, idx)).display}
                      </span>
                    </div>
                    <p className="leading-relaxed">{milestone}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
              Evaluation log ({logs.length})
            </h3>
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <div
                  key={`${log.type}-${log.at}-${idx}`}
                  className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] text-[var(--text-faint)] uppercase">
                      {logLabel(log)}
                    </span>
                    <span className={`text-[11px] font-medium ${log.passed ? "text-[var(--color-success)]" : "text-[#D2554D]"}`}>
                      {log.tier ?? (log.passed ? "Passed" : "Failed")}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    {log.feedback || log.reason || "No note recorded."}
                  </p>
                  <div className="text-[10px] text-[var(--text-faint)] mt-1.5">
                    {formatDate(log.at ?? "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-app)] bg-[var(--bg-surface-raised)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-mono">
            {proposal.attempts ?? 0} / {proposal.attempt_cap ?? 0} attempts
          </span>
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