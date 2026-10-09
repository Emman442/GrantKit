import React, { useEffect, useMemo, useState } from "react";
import { PageId } from "../nav/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Card } from "../ui/Card";
import { Banner } from "../ui/Banner";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { useWallet } from "@/lib/genlayer/wallet";
import { useToast } from "../../context/ToastContext";
import {
  useGrantConfig,
  useGrantTreasury,
  useProposals,
  useFundPool,
  useWithdrawPool,
  useSetCriteria,
  useSetPaused,
  useCancelExhaustedGrant,
  useGrantKitContract,
} from "@/lib/hooks/useGrantKit";
import {
  formatGen,
  fromSmallestUnit,
  toSmallestUnit,
  truncateAddress,
} from "../../utils/format";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  FileCode,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { switchAccount } from "@/lib/genlayer/client";

interface AdminPageProps {
  onNavigate: (page: PageId) => void;
}

type AdminSection =
  | "treasury"
  | "criteria"
  | "parameters"
  | "pause"
  | "stalled"
  | "ownership";

const TIER_OPTIONS = [
  { value: 2, label: "2 — PARTIAL" },
  { value: 3, label: "3 — PASS" },
  { value: 4, label: "4 — EXCELLENT" },
];

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { address } = useWallet();
  const isOwner = address === import.meta.env.VITE_ADMIN_ADDRESS;
  const { success: toastSuccess, error: toastError } = useToast();
  const contract = useGrantKitContract();

  const { data: config } = useGrantConfig();
  const { data: treasury } = useGrantTreasury();
  const { data: proposals = [] } = useProposals(1, 50);

  const { fundPoolAsync, isFunding } = useFundPool();
  const { withdrawPoolAsync, isPending: isWithdrawing } = useWithdrawPool();
  const { setCriteriaAsync, isPending: isSavingCriteria } = useSetCriteria();
  const { setPausedAsync, isPending: isTogglingPause } = useSetPaused();
  const { cancelExhaustedGrantAsync } = useCancelExhaustedGrant();

  const [activeSection, setActiveSection] = useState<AdminSection>("treasury");
  const [fundAmount, setFundAmount] = useState("10000");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [criteriaText, setCriteriaText] = useState("");
  const [passTier, setPassTier] = useState(3);
  const [milestoneTier, setMilestoneTier] = useState(3);
  const [maxAwardHuman, setMaxAwardHuman] = useState("50000");
  const [depositHuman, setDepositHuman] = useState("0");
  const [maxMilestones, setMaxMilestones] = useState(6);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [inactivityDays, setInactivityDays] = useState(30);
  const [savingParams, setSavingParams] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [proposingOwner, setProposingOwner] = useState(false);
  const [cancellingPid, setCancellingPid] = useState<number | null>(null);

  useEffect(() => {
    if (!config) return;
    setCriteriaText(config.criteria);
    setPassTier(config.pass_tier);
    setMilestoneTier(config.milestone_tier);
    setMaxAwardHuman(fromSmallestUnit(String(config.max_award)));
    setDepositHuman(fromSmallestUnit(String(config.submission_deposit)));
    setMaxMilestones(config.max_milestones);
    setMaxAttempts(config.max_attempts);
    setInactivityDays(config.inactivity_days);
  }, [config]);

  const stalledProposals = useMemo(
    () =>
      proposals.filter(
        (p) =>
          p.status === "approved" &&
          Number(p.attempts ?? 0) >= Number(p.attempt_cap ?? config?.max_attempts ?? 0)
      ),
    [proposals, config]
  );

  if (!isOwner) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
            Admin Console
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Access restricted strictly to the GrantKit contract owner.
          </p>
        </div>
        <Banner
          variant="danger"
          title="Unauthorized Access"
          action={
            !isOwner && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => switchAccount()}
              >
                Switch to Owner Wallet
              </Button>
            )
          }
        >
          Your connected wallet (
          <span className="font-mono text-[var(--text-app)]">
            {truncateAddress(address || "", 8, 6)}
          </span>
          ) does not match the contract owner (
          <span className="font-mono text-[var(--text-app)]">
            {truncateAddress(config?.owner || "", 8, 6)}
          </span>
          ).
        </Banner>
      </div>
    );
  }

  const poolRaw = String(treasury?.pool ?? 0);
  const escrowRaw = String(treasury?.escrowed ?? 0);

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = toSmallestUnit(fundAmount);
    if (BigInt(raw) <= 0n) {
      toastError("Fund amount must be positive");
      return;
    }
    try {
      await fundPoolAsync({ amount: BigInt(raw) });
    } catch {
      /* toast lives in the hook */
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = toSmallestUnit(withdrawAmount);
    if (BigInt(raw) <= 0n) {
      toastError("Withdrawal amount must be positive");
      return;
    }
    if (BigInt(raw) > BigInt(poolRaw)) {
      toastError("Cannot withdraw more than the unescrowed pool");
      return;
    }
    try {
      await withdrawPoolAsync(raw);
      setWithdrawAmount("");
    } catch {
      /* hook toast */
    }
  };

  const handleSaveCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = criteriaText.trim();
    if (text.length < 20 || text.length > 4000) {
      toastError("Criteria text must be between 20 and 4,000 characters");
      return;
    }
    try {
      await setCriteriaAsync(text);
    } catch {
      /* hook toast */
    }
  };

  const handleSaveParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !address) return;
    setSavingParams(true);
    try {
      await contract.setParameters({
        passTier,
        milestoneTier,
        maxAward: toSmallestUnit(maxAwardHuman),
        submissionDeposit: toSmallestUnit(depositHuman),
        maxMilestones,
        maxAttempts,
        inactivityDays,
      });
      toastSuccess("Protocol parameters saved.");
    } catch (err: any) {
      toastError(err.message || "Failed to save parameters");
    } finally {
      setSavingParams(false);
    }
  };

  const handleTogglePause = async () => {
    if (!config) return;
    try {
      await setPausedAsync(!config.paused);
      setPauseModalOpen(false);
    } catch {
      /* hook toast */
    }
  };

  const handleProposeOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !address) return;
    if (!newOwnerAddress.startsWith("0x") || newOwnerAddress.length !== 42) {
      toastError("Invalid address format");
      return;
    }
    setProposingOwner(true);
    try {
      await contract.proposeOwner(newOwnerAddress.trim());
      toastSuccess(`Proposed ${truncateAddress(newOwnerAddress, 6, 6)} as new owner`);
      setNewOwnerAddress("");
    } catch (err: any) {
      toastError(err.message || "Failed to propose owner");
    } finally {
      setProposingOwner(false);
    }
  };

  const handleCancelStalled = async (pid: number) => {
    setCancellingPid(pid);
    try {
      await cancelExhaustedGrantAsync(pid);
    } catch {
      /* hook toast */
    } finally {
      setCancellingPid(null);
    }
  };

  const sections: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: "treasury", label: "Treasury & Liquidity", icon: <DollarSign size={14} strokeWidth={1.5} /> },
    { id: "criteria", label: "Evaluation Criteria", icon: <FileCode size={14} strokeWidth={1.5} /> },
    { id: "parameters", label: "Protocol Parameters", icon: <Sliders size={14} strokeWidth={1.5} /> },
    { id: "pause", label: "Circuit Breaker (Pause)", icon: <Pause size={14} strokeWidth={1.5} /> },
    { id: "stalled", label: `Stalled Grants (${stalledProposals.length})`, icon: <RotateCcw size={14} strokeWidth={1.5} /> },
    { id: "ownership", label: "Ownership Governance", icon: <UserCheck size={14} strokeWidth={1.5} /> },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-[#C9932B] font-medium">[Owner Control]</span>
          {config?.paused && (
            <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-raised)] border border-[#D2554D] text-[#D2554D] font-medium">
              Contract Paused
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
          Admin Console
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Contract management, parameter governance, criteria updates, and treasury settlement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-3 space-y-1">
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? "bg-[#3B6CFF] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)]"
                }`}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-9 space-y-6">
          {activeSection === "treasury" && (
            <div className="space-y-6">
              <Card variant="surface" className="space-y-5">
                <div className="pb-3 border-b border-[var(--border-app)]">
                  <h2 className="text-sm font-semibold text-[var(--text-app)]">Treasury Balance</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Unescrowed funds can be withdrawn. Escrowed funds stay locked for active grants.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
                    <span className="text-[11px] text-[var(--text-muted)]">Available Pool</span>
                    <span
                      title={formatGen(poolRaw).raw}
                      className="font-mono text-xl font-semibold tabular-nums text-[var(--text-app)] block mt-1"
                    >
                      {formatGen(poolRaw).display}
                    </span>
                  </div>
                  <div className="p-4 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
                    <span className="text-[11px] text-[var(--text-muted)]">Milestone Escrowed</span>
                    <span
                      title={formatGen(escrowRaw).raw}
                      className="font-mono text-xl font-semibold tabular-nums text-[var(--text-app)] block mt-1"
                    >
                      {formatGen(escrowRaw).display}
                    </span>
                  </div>
                </div>
              </Card>

              <Card variant="surface" className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-app)]">
                  Deposit Liquidity to Treasury Pool
                </h3>
                <form onSubmit={handleFund} className="space-y-3">
                  <Input
                    label="Deposit Amount (GEN)"
                    type="number"
                    min="1"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    required
                  />
                  <Button type="submit" size="md" variant="primary" isLoading={isFunding}>
                    <ArrowDownCircle size={14} strokeWidth={1.5} />
                    <span>Deposit Funds to Pool</span>
                  </Button>
                </form>
              </Card>

              <Card variant="surface" className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-app)]">
                  Withdraw Unescrowed Liquidity
                </h3>
                <form onSubmit={handleWithdraw} className="space-y-3">
                  <Input
                    label="Withdrawal Amount (GEN)"
                    type="number"
                    min="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    helperText={`Maximum withdrawable: ${fromSmallestUnit(poolRaw)} GEN.`}
                    required
                  />
                  <Button
                    type="submit"
                    size="md"
                    variant="secondary"
                    isLoading={isWithdrawing}
                    disabled={!withdrawAmount || BigInt(toSmallestUnit(withdrawAmount || "0")) > BigInt(poolRaw)}
                  >
                    <ArrowUpCircle size={14} strokeWidth={1.5} />
                    <span>Withdraw from Pool</span>
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {activeSection === "criteria" && (
            <Card variant="surface" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-app)]">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-app)]">
                    Public Evaluation Criteria
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Trusted rubric sent to the on-chain evaluator. Untrusted applicant data cannot override it.
                  </p>
                </div>
                <div className="font-mono text-xs px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-raised)] border border-[var(--border-app)] text-[var(--text-muted)]">
                  Directive #{config?.criteria_version ?? 1}
                </div>
              </div>
              <form onSubmit={handleSaveCriteria} className="space-y-4">
                <Textarea
                  label="Criteria Rubric (20 to 4,000 characters)"
                  value={criteriaText}
                  maxLength={4000}
                  rows={14}
                  onChange={(e) => setCriteriaText(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={isSavingCriteria}
                  disabled={criteriaText.trim().length < 20 || criteriaText.trim().length > 4000}
                >
                  Save and Publish New Criteria Version
                </Button>
              </form>
            </Card>
          )}

          {activeSection === "parameters" && (
            <Card variant="surface" className="space-y-5">
              <div className="pb-3 border-b border-[var(--border-app)]">
                <h2 className="text-sm font-semibold text-[var(--text-app)]">Protocol Parameters</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Tiers are 2 (PARTIAL), 3 (PASS), or 4 (EXCELLENT). There is no 1–100 score or tolerance field on this contract.
                </p>
              </div>
              <form onSubmit={handleSaveParameters} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Proposal pass tier (2–4)"
                    type="number"
                    min="2"
                    max="4"
                    value={passTier}
                    onChange={(e) => setPassTier(Number(e.target.value))}
                    helperText="Minimum rating to approve a new proposal."
                    required
                  />
                  <Input
                    label="Milestone pass tier (2–4)"
                    type="number"
                    min="2"
                    max="4"
                    value={milestoneTier}
                    onChange={(e) => setMilestoneTier(Number(e.target.value))}
                    helperText="Minimum rating to pay a milestone tranche."
                    required
                  />
                  <Input
                    label="Max Award Cap (GEN)"
                    type="number"
                    min="1"
                    value={maxAwardHuman}
                    onChange={(e) => setMaxAwardHuman(e.target.value)}
                    required
                  />
                  <Input
                    label="Submission Deposit (GEN)"
                    type="number"
                    min="0"
                    value={depositHuman}
                    onChange={(e) => setDepositHuman(e.target.value)}
                    required
                  />
                  <Input
                    label="Max Milestones (1–12)"
                    type="number"
                    min="1"
                    max="12"
                    value={maxMilestones}
                    onChange={(e) => setMaxMilestones(Number(e.target.value))}
                    required
                  />
                  <Input
                    label="Milestone Attempt Cap (1–10)"
                    type="number"
                    min="1"
                    max="10"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    required
                  />
                  <Input
                    label="Inactivity Timeout (7–365 days)"
                    type="number"
                    min="7"
                    max="365"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(Number(e.target.value))}
                    helperText="After this many days with no passed milestone, anyone can reclaim escrow to the pool."
                    required
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Allowed tiers: {TIER_OPTIONS.map((t) => t.label).join(" · ")}
                </p>
                <Button type="submit" size="md" variant="primary" isLoading={savingParams}>
                  Save Protocol Parameters
                </Button>
              </form>
            </Card>
          )}

          {activeSection === "pause" && (
            <Card variant="surface" className="space-y-4">
              <div className="p-4 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-app)]">
                    Current Contract State:{" "}
                    <span className={config?.paused ? "text-[#D2554D]" : "text-[var(--color-success)]"}>
                      {config?.paused ? "PAUSED" : "ACTIVE"}
                    </span>
                  </div>
                </div>
                <Button
                  size="md"
                  variant={config?.paused ? "primary" : "danger"}
                  onClick={() => setPauseModalOpen(true)}
                >
                  {config?.paused ? <Play size={14} strokeWidth={1.5} /> : <Pause size={14} strokeWidth={1.5} />}
                  <span>{config?.paused ? "Resume Platform" : "Pause Platform"}</span>
                </Button>
              </div>
            </Card>
          )}

          {activeSection === "stalled" && (
            <Card variant="surface" className="space-y-4">
              <div className="pb-3 border-b border-[var(--border-app)]">
                <h2 className="text-sm font-semibold text-[var(--text-app)]">
                  Stalled Grants ({stalledProposals.length})
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Approved grants that used every milestone attempt. Owner may cancel and return leftover escrow.
                </p>
              </div>
              {stalledProposals.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No stalled grants. All active grants still have attempts left.
                </div>
              ) : (
                <div className="space-y-3">
                  {stalledProposals.map((sp) => {
                    const unreleased = (BigInt(sp.amount ?? "0") - BigInt(sp.released ?? "0")).toString();
                    return (
                      <div
                        key={sp.id}
                        className="p-4 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--text-faint)]">
                              Proposal #{sp.id}
                            </span>
                            <Badge status={sp.status} />
                            <span className="text-[11px] font-mono text-[#D2554D]">
                              {sp.attempts}/{sp.attempt_cap} attempts used
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[var(--text-app)]">{sp.title}</h4>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">
                            Applicant: {truncateAddress(sp.applicant || "", 6, 6)} · Locked escrow:{" "}
                            {formatGen(unreleased).display}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={cancellingPid === sp.id}
                          onClick={() => handleCancelStalled(sp.id)}
                        >
                          Cancel Exhausted Grant
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {activeSection === "ownership" && (
            <Card variant="surface" className="space-y-5">
              <div className="space-y-3">
                <div className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
                  <span className="text-[11px] text-[var(--text-muted)] block">Current Owner</span>
                  <span className="font-mono text-xs font-semibold text-[var(--text-app)] block mt-0.5">
                    {config?.owner}
                  </span>
                </div>
                <div className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
                  <span className="text-[11px] text-[var(--text-muted)] block">Pending Proposed Owner</span>
                  <span className="font-mono text-xs text-[var(--text-app)] block mt-0.5">
                    {config?.pending_owner || "None proposed"}
                  </span>
                </div>
              </div>
              <form onSubmit={handleProposeOwner} className="space-y-3 pt-2">
                <Input
                  label="Propose New Owner Address"
                  placeholder="0x..."
                  value={newOwnerAddress}
                  onChange={(e) => setNewOwnerAddress(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={proposingOwner}
                  disabled={!newOwnerAddress.startsWith("0x") || newOwnerAddress.length !== 42}
                >
                  Propose New Owner
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={pauseModalOpen}
        onClose={() => setPauseModalOpen(false)}
        title={config?.paused ? "Resume Platform Submissions?" : "Pause All Platform Submissions?"}
        description="Circuit breaker confirmation"
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setPauseModalOpen(false)} disabled={isTogglingPause}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={config?.paused ? "primary" : "danger"}
              isLoading={isTogglingPause}
              onClick={handleTogglePause}
            >
              {config?.paused ? "Confirm Resume" : "Confirm Emergency Pause"}
            </Button>
          </>
        }
      >
        <p className="text-xs text-[var(--text-app)] leading-relaxed">
          {config?.paused
            ? "Resuming allows new proposals and milestone submissions."
            : "Pause blocks new proposals and milestone submissions. Owner withdraw and reclaim still work."}
        </p>
      </Modal>
    </div>
  );
};