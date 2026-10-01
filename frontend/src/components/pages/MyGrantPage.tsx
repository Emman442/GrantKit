import React, { useMemo, useState } from "react";
import { PageId } from "../nav/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Banner } from "../ui/Banner";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import {useWallet} from "@/lib/genlayer/wallet";
import {
  useGrantConfig,
  useLatestProposalId,
  useProposal,
  useSubmitMilestone,
  useAbandonGrant,
} from "@/lib/hooks/useGrantKit";
import { formatGen, validateHttpsUrl } from "../../utils/format";
import { Send } from "lucide-react";

interface MyGrantPageProps {
  onNavigate: (page: PageId) => void;
}

function trancheAmount(amount: number, n: number, i: number): number {
  if (n <= 0) return 0;
  const base = Math.floor(amount / n);
  if (i === n - 1) return amount - base * (n - 1);
  return base;
}

export const MyGrantPage: React.FC<MyGrantPageProps> = ({ onNavigate }) => {
  const { address, isConnected, connectWallet } = useWallet();
  const { data: config, isLoading: configLoading } = useGrantConfig();
  const { data: latestId = 0, isLoading: idLoading } = useLatestProposalId(
    address ?? null
  );
  const {
    data: proposal,
    isLoading: proposalLoading,
    refetch,
  } = useProposal(latestId || null);

  const { submitMilestoneAsync, isSubmitting } = useSubmitMilestone();
  const { abandonGrantAsync, isPending: abandoning } = useAbandonGrant();

  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);

  const loading = configLoading || idLoading || (!!latestId && proposalLoading);

  const handleEvidenceChange = (val: string) => {
    setEvidenceUrl(val);
    if (!val.trim()) {
      setEvidenceError(null);
      return;
    }
    const res = validateHttpsUrl(val);
    setEvidenceError(res.valid ? null : res.error || "Invalid URL");
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal?.found) return;
    const urlCheck = validateHttpsUrl(evidenceUrl);
    if (!urlCheck.valid) {
      setEvidenceError(urlCheck.error || "Invalid URL");
      return;
    }
    try {
      await submitMilestoneAsync({
        pid: proposal.id,
        evidenceUrl: evidenceUrl.trim(),
        notes: notes.trim(),
      });
      setEvidenceUrl("");
      setNotes("");
      refetch();
    } catch {
      /* hook toasts */
    }
  };

  const handleAbandonGrant = async () => {
    if (!proposal?.found) return;
    try {
      await abandonGrantAsync(proposal.id);
      setAbandonModalOpen(false);
      refetch();
    } catch {
    }
  };

  const amount = Number(proposal?.amount ?? 0);
  const released = Number(proposal?.released ?? 0);
  const remaining = Math.max(0, amount - released);
  const percentReleased = amount > 0 ? Math.floor((released * 100) / amount) : 0;
  const milestones = proposal?.milestones ?? [];
  const nextMilestone = Number(proposal?.next_milestone ?? 0);
  const attemptCap = Number(proposal?.attempt_cap ?? config?.max_attempts ?? 3);
  const attemptsUsed = Number(proposal?.attempts ?? 0);
  const attemptsExhausted = attemptsUsed >= attemptCap;
  const status = String(proposal?.status ?? "");
  const isApproved = status === "approved";
  const logs = proposal?.log ?? [];

  if (!isConnected) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
            My Grant
          </h1>
        </div>
        <Banner
          variant="warning"
          title="Wallet Not Connected"
          action={
            <Button size="sm" variant="primary" onClick={() => connectWallet()}>
              Connect Wallet
            </Button>
          }
        >
          Connect the wallet that submitted your proposal.
        </Banner>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!proposal?.found) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
            My Grant
          </h1>
        </div>
        <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-app)]">
            No grant proposals found for this address
          </h3>
          <Button size="md" variant="primary" onClick={() => onNavigate("apply")}>
            Apply for a Grant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[var(--text-faint)]">
              Proposal #{proposal.id}
            </span>
            <Badge status={proposal.status} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
            {proposal.title}
          </h1>
        </div>
        {isApproved && (
          <Button
            size="sm"
            variant="secondary"
            className="text-[#D2554D] hover:border-[#D2554D]"
            onClick={() => setAbandonModalOpen(true)}
          >
            Abandon Grant
          </Button>
        )}
      </div>

      <Card variant="surface" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[var(--border-app)]">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] block">Total Grant Award</span>
            <span className="font-mono text-xl font-semibold tabular-nums block mt-0.5">
              {formatGen(String(amount)).display}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] block">Released to Date</span>
            <span className="font-mono text-xl font-semibold tabular-nums text-[var(--color-success)] block mt-0.5">
              {formatGen(String(released)).display}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] block">Remaining in Escrow</span>
            <span className="font-mono text-xl font-semibold tabular-nums block mt-0.5">
              {formatGen(String(remaining)).display}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>Escrow Tranche Disbursal</span>
            <span className="tabular-nums font-semibold text-[var(--text-app)]">
              {percentReleased}% Complete
            </span>
          </div>
          <div className="h-2 w-full bg-[var(--bg-surface-raised)] border border-[var(--border-app)] rounded-[4px] overflow-hidden">
            <div className="h-full bg-[#3B6CFF]" style={{ width: `${percentReleased}%` }} />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-app)]">Milestones Timeline</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Current milestone index is {nextMilestone} of {milestones.length}.
          </p>
        </div>

        <div className="space-y-3">
          {milestones.map((m, idx) => {
            const isReleased = idx < nextMilestone;
            const isCurrent = idx === nextMilestone && isApproved;
            const isLocked = !isReleased && !isCurrent;
            const tranche = trancheAmount(amount, milestones.length, idx);

            return (
              <div
                key={idx}
                className={`p-4 rounded-[8px] border ${
                  isCurrent ? "border-[#3B6CFF]" : "border-[var(--border-app)]"
                } bg-[var(--bg-surface)]`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--text-faint)]">
                      0{idx + 1}.
                    </span>
                    <span className="text-xs font-semibold">Milestone {idx + 1}</span>
                    {isReleased && (
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] border text-[var(--color-success)]">
                        Released
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] border border-[#3B6CFF] text-[#3B6CFF]">
                        Current Milestone
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-[4px] border text-[var(--text-faint)]">
                        Escrow Locked
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-semibold">
                    {formatGen(String(tranche)).display}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{m}</p>

                {isCurrent && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-app)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Submit Milestone Evidence
                      </h4>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">
                        Attempts used: {attemptsUsed} of {attemptCap}
                      </div>
                    </div>

                    {attemptsExhausted ? (
                      <Banner variant="danger" title="Evaluation Attempts Exhausted">
                        This grant has used every milestone attempt. The owner can cancel it, or you can abandon it to return leftover escrow.
                      </Banner>
                    ) : (
                      <form onSubmit={handleSubmitMilestone} className="space-y-4">
                        <Input
                          label="Evidence URL"
                          placeholder="https://github.com/org/repo/pull/42"
                          value={evidenceUrl}
                          onChange={(e) => handleEvidenceChange(e.target.value)}
                          error={evidenceError || undefined}
                          disabled={isSubmitting}
                          required
                        />
                        <Textarea
                          label="Notes (optional)"
                          maxLength={2000}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          disabled={isSubmitting}
                        />
                        <div className="flex items-center justify-end">
                          <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            isLoading={isSubmitting}
                            disabled={!evidenceUrl.trim() || !!evidenceError || isSubmitting}
                          >
                            <Send size={14} strokeWidth={1.5} />
                            <span>Submit for Tranche Unlock</span>
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-app)]">Audit & Evaluation Log</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{proposal.feedback}</p>
        </div>
        <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] divide-y divide-[var(--border-app)] overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-4 text-xs text-[var(--text-muted)]">No logs recorded yet.</div>
          ) : (
            logs.map((entry, idx) => (
              <div key={idx} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {entry.type === "milestone"
                        ? `Milestone #${Number(entry.index ?? 0) + 1} Review`
                        : "Proposal Evaluation"}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        entry.passed ? "text-[var(--color-success)]" : "text-[#D2554D]"
                      }`}
                    >
                      {entry.passed ? "Passed" : "Failed"} {entry.tier ?? ""}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-faint)]">
                    Score: {entry.score ?? 0}
                    {entry.at ? ` · ${entry.at}` : ""}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {entry.feedback || entry.reason || ""}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        isOpen={abandonModalOpen}
        onClose={() => setAbandonModalOpen(false)}
        title="Abandon Grant Proposal"
        description="This action is irreversible on-chain."
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setAbandonModalOpen(false)} disabled={abandoning}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" isLoading={abandoning} onClick={handleAbandonGrant}>
              Confirm Abandon Grant
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed">
          Unreleased escrow ({formatGen(String(remaining)).display}) returns to the pool.
        </p>
      </Modal>
    </div>
  );
};