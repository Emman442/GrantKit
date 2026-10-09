import React, { useEffect, useMemo, useState } from "react";
import { PageId } from "../nav/Navbar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Card } from "../ui/Card";
import { Banner } from "../ui/Banner";
import { Badge } from "../ui/Badge";
import { useWallet } from "@/lib/genlayer/wallet";
import { useToast } from "../../context/ToastContext";
import {
  useGrantConfig,
  useGrantTreasury,
  useProposals,
  useSubmitProposal,
  useLatestProposalId,
  useProposal,
} from "@/lib/hooks/useGrantKit";
import {
  computeTranches,
  formatGen,
  fromSmallestUnit,
  toSmallestUnit,
  validateHttpsUrl,
} from "../../utils/format";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface ApplyPageProps {
  onNavigate: (page: PageId) => void;
}

export const ApplyPage: React.FC<ApplyPageProps> = ({ onNavigate }) => {
  const { address, isConnected, connectWallet } = useWallet();
  const isOwner = address === import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase();
  const { error: toastError } = useToast();
  const { data: config } = useGrantConfig();
  const query = useGrantConfig();
  console.log(query.status, query.error, query.data);
  const { data: treasury } = useGrantTreasury();
  const { data: proposals = [] } = useProposals(1, 50);
  const { submitProposalAsync, isSubmitting } = useSubmitProposal();
  const { data: latestId = 0 } = useLatestProposalId(address ?? null);
  const { data: latestProposal, refetch: refetchLatest } = useProposal(
    latestId || null
  );

  const activeGrant = useMemo(
    () =>
      proposals.find(
        (p) =>
          (p.applicant || "").toLowerCase() === (address || "").toLowerCase() &&
          p.status === "approved"
      ) ?? null,
    [proposals, address]
  );

  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [links, setLinks] = useState<string[]>(["https://github.com/my-project/core"]);
  const [milestones, setMilestones] = useState<string[]>([
    "Deploy smart contract architecture and automated testing suite",
    "Build production frontend application and integration SDK",
  ]);
  const [amountHuman, setAmountHuman] = useState("20000");
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({});
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);



  const handleLinkChange = (index: number, val: string) => {
    const updated = [...links];
    updated[index] = val;
    setLinks(updated);
    if (val.trim()) {
      const res = validateHttpsUrl(val);
      setLinkErrors((prev) => {
        const next = { ...prev };
        if (res.valid) delete next[index];
        else next[index] = res.error || "Invalid link";
        return next;
      });
    } else {
      setLinkErrors((prev) => ({ ...prev, [index]: "URL is required" }));
    }
  };

  const addLink = () => {
    if (links.length >= 5) return;
    setLinks([...links, ""]);
  };

  const removeLink = (index: number) => {
    if (links.length <= 1) return;
    const updated = links.filter((_, i) => i !== index);
    setLinks(updated);
    const nextErrors: Record<number, string> = {};
    updated.forEach((l, i) => {
      const res = validateHttpsUrl(l);
      if (!res.valid) nextErrors[i] = res.error || "Invalid";
    });
    setLinkErrors(nextErrors);
  };

  const handleMilestoneChange = (index: number, val: string) => {
    const updated = [...milestones];
    updated[index] = val;
    setMilestones(updated);
  };

  const addMilestone = () => {
    const maxM = config?.max_milestones || 6;
    if (milestones.length >= maxM) return;
    setMilestones([...milestones, ""]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const moveMilestone = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;
    const updated = [...milestones];
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    setMilestones(updated);
  };

  const rawAmount = toSmallestUnit(amountHuman);
  const computedTranches = computeTranches(rawAmount, milestones.length);

  useEffect(() => {
    if (!config || !treasury) return;
    const amtBig = BigInt(rawAmount || "0");
    const maxBig = BigInt(config.max_award);
    const poolBig = BigInt(treasury.pool);
    if (amtBig <= 0n) setAmountError("Amount must be greater than zero");
    else if (amtBig < BigInt(milestones.length))
      setAmountError("Amount must be at least one unit per milestone");
    else if (amtBig > maxBig)
      setAmountError(`Exceeds max award of ${fromSmallestUnit(String(config.max_award))} GEN`);
    else if (amtBig > poolBig)
      setAmountError(`Exceeds pool (${fromSmallestUnit(String(treasury.pool))} GEN)`);
    else setAmountError(null);
  }, [rawAmount, config, treasury, milestones.length]);


  const connected = Boolean(isConnected && address);
  const ownerAddress = (import.meta.env.VITE_ADMIN_ADDRESS || "").toLowerCase();


  const isFormValid =
    title.trim().length > 0 &&
    title.length <= 100 &&
    pitch.trim().length > 0 &&
    pitch.length <= 4000 &&
    links.length >= 1 &&
    links.length <= 5 &&
    Object.keys(linkErrors).length === 0 &&
    links.every((l) => l.trim().length > 0) &&
    milestones.length >= 1 &&
    milestones.every((m) => m.trim().length > 0 && m.length <= 500) &&
    !amountError &&
    BigInt(rawAmount || "0") > 0n;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toastError("Please connect your wallet first");
      return;
    }
    if (!isFormValid || !config) return;

    setSubmitError(null);
    setShowResult(false);
    try {
      await submitProposalAsync({
        title: title.trim(),
        pitch: pitch.trim(),
        links: links.map((l) => l.trim()),
        milestones: milestones.map((m) => m.trim()),
        amount: amountHuman,
        deposit: BigInt(config.submission_deposit),
      });
      setShowResult(true);
      await refetchLatest();
    } catch (err: any) {
      setSubmitError(err?.message || "Execution reverted");
    }
  };

  const isContractPaused = Boolean(config?.paused);
  const formLocked =
    isContractPaused || isOwner || Boolean(activeGrant) || isSubmitting;

  const canSubmit = isFormValid && !formLocked && connected && Boolean(config);

  const resultProposal =
    showResult && latestProposal?.found ? latestProposal : null;
  const passed = resultProposal?.status === "approved" || resultProposal?.status === "completed";

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
          Apply for a Grant
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Submit a proposal. Validators fetch your links and rate it against the published criteria.
        </p>
      </div>

      {!isConnected && (
        <Banner
          variant="warning"
          title="Wallet Not Connected"
          action={
            <Button size="sm" variant="primary" onClick={() => connectWallet()}>
              Connect Wallet
            </Button>
          }
        >
          Connect a wallet before submitting.
        </Banner>
      )}

      {isContractPaused && (
        <Banner variant="danger" title="Submissions Paused">
          New proposals cannot be submitted while the contract is paused.
        </Banner>
      )}

      {isOwner && (
        <Banner variant="warning" title="Contract Owner Account">
          The owner cannot apply. Switch to an applicant wallet.
        </Banner>
      )}

      {activeGrant && (
        <Banner
          variant="info"
          title="Active Grant in Progress"
          action={
            <Button size="sm" variant="secondary" onClick={() => onNavigate("my-grant")}>
              View My Grant #{activeGrant.id}
            </Button>
          }
        >
          You already have an approved grant ({activeGrant.title}). Finish or abandon it before applying again.
        </Banner>
      )}

      {submitError && (
        <Banner variant="danger" title="Contract Execution Reverted">
          <p className="font-mono text-xs">{submitError}</p>
        </Banner>
      )}

      {resultProposal && (
        <Card
          variant="raised"
          className={`border-2 ${passed ? "border-[#2FA36B]" : "border-[#D2554D]"}`}
        >
          <div className="flex items-start justify-between pb-3 border-b border-[var(--border-app)] mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--text-faint)]">
                  Proposal #{resultProposal.id}
                </span>
                <Badge status={resultProposal.status} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-app)]">
                {resultProposal.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[var(--text-muted)] block">Rating</span>
              <span className="font-mono text-xl font-semibold tabular-nums text-[var(--text-app)]">
                {resultProposal.score}
                <span className="text-xs font-normal text-[var(--text-faint)]">
                  {" "}
                  {resultProposal.tier}
                </span>
              </span>
            </div>
          </div>
          <p className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-xs leading-relaxed">
            {resultProposal.feedback}
          </p>
          <div className="pt-3 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() => (passed ? onNavigate("my-grant") : setShowResult(false))}
            >
              {passed ? "Go to My Grant" : "Dismiss Result"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          <Input
            label="Proposal Title"
            placeholder="e.g. GenVM Execution Trace Inspector"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText={`${title.length} / 100`}
            disabled={formLocked}
            required
          />
          <Textarea
            label="Technical Architecture & Project Pitch"
            maxLength={4000}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={6}
            disabled={formLocked}
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-muted)]">
                Verified Links ({links.length}/5)
              </label>
              {links.length < 5 && (
                <Button type="button" size="sm" variant="secondary" onClick={addLink} disabled={formLocked}>
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Add Link</span>
                </Button>
              )}
            </div>
            {links.map((link, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="https://github.com/org/repo"
                    value={link}
                    onChange={(e) => handleLinkChange(idx, e.target.value)}
                    error={linkErrors[idx]}
                    disabled={formLocked}
                  />
                </div>
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    disabled={formLocked}
                    className="h-[36px] w-[36px] rounded-[6px] border border-[var(--border-app)] flex items-center justify-center"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-muted)]">
                Milestone Deliverables ({milestones.length}/{config?.max_milestones || 6})
              </label>
              {milestones.length < (config?.max_milestones || 6) && (
                <Button type="button" size="sm" variant="secondary" onClick={addMilestone} disabled={formLocked}>
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Add Milestone</span>
                </Button>
              )}
            </div>
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[8px] border border-[var(--border-app)] flex items-start gap-2.5"
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button type="button" disabled={idx === 0 || isSubmitting} onClick={() => moveMilestone(idx, "up")}>
                    <ArrowUp size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === milestones.length - 1 || isSubmitting}
                    onClick={() => moveMilestone(idx, "down")}
                  >
                    <ArrowDown size={13} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[var(--text-faint)]">
                      Milestone 0{idx + 1}
                    </span>
                    <span className="font-mono text-xs">
                      {computedTranches[idx] ? formatGen(computedTranches[idx]).display : "—"}
                    </span>
                  </div>
                  <Textarea
                    value={m}
                    maxLength={500}
                    rows={2}
                    onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                    disabled={formLocked}
                  />
                </div>
                {milestones.length > 1 && (
                  <button type="button" onClick={() => removeMilestone(idx)} disabled={formLocked}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Input
            label="Total Requested Grant Amount (GEN)"
            type="number"
            min="1"
            value={amountHuman}
            onChange={(e) => setAmountHuman(e.target.value)}
            error={amountError || undefined}
            helperText={
              config
                ? `Max award: ${fromSmallestUnit(String(config.max_award))} GEN. Pool: ${fromSmallestUnit(String(treasury?.pool ?? 0))} GEN.`
                : ""
            }
            disabled={formLocked}
            required
          />

          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!canSubmit}
          >
            {!connected
              ? "Connect wallet to submit"
              : isSubmitting
                ? "Submitting Proposal..."
                : "Submit Proposal for On-Chain Evaluation"}
          </Button>
        </form>

        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <Card variant="surface" className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider">Proposal Summary</h2>
            <div className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)]">
              <div className="text-[11px] text-[var(--text-muted)]">Submission Deposit</div>
              <div className="font-mono text-sm font-semibold mt-0.5">
                {config ? formatGen(String(config.submission_deposit)).display : "—"}
              </div>
              <div className="text-[10px] text-[var(--text-faint)] mt-1">
                Must match exactly. Refunded with the first tranche if approved; forfeited to the pool if rejected.
              </div>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {milestones.map((_, i) => (
                  <tr key={i}>
                    <td className="p-2 text-[var(--text-muted)]">
                      {i === 0 ? "Tranche 1 (Immediate)" : `Tranche ${i + 1}`}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {computedTranches[i] ? formatGen(computedTranches[i]).display : "0 GEN"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right font-mono text-[#3B6CFF]">
                    {formatGen(rawAmount).display}
                  </td>
                </tr>
              </tbody>
            </table>
            <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)] list-disc list-inside">
              <li>Validators fetch each HTTPS link.</li>
              <li>
                Rating must reach {config?.pass_tier_name || "PASS"} (tier {config?.pass_tier ?? 3}).
              </li>
              <li>First tranche pays out immediately if approved.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};