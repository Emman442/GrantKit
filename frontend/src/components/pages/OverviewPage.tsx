import React, { useState } from "react";
import { PageId } from "../nav/Navbar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Banner } from "../ui/Banner";
import { Skeleton } from "../ui/Skeleton";
import {useWallet} from "@/lib/genlayer/wallet";
import { useToast } from "../../context/ToastContext";
import {
  useGrantConfig,
  useGrantTreasury,
  useGrantKitContract,
} from "@/lib/hooks/useGrantKit";
import { formatGen } from "../../utils/format";

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { address } = useWallet();
  const isPendingOwner = address === import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase();
  const { success, error } = useToast();
  const { data: config, isLoading: configLoading, refetch: refetchConfig } =
    useGrantConfig();
  const { data: treasury, isLoading: treasuryLoading } = useGrantTreasury();
  const contract = useGrantKitContract();

  const [acceptingOwner, setAcceptingOwner] = useState(false);
  const loading = configLoading || treasuryLoading;

  const handleAcceptOwnership = async () => {
    if (!address || !contract) return;
    setAcceptingOwner(true);
    try {
      await contract.acceptOwnership();
      success("Ownership transferred. You are now the contract owner.");
      refetchConfig();
    } catch (e: any) {
      error(e.message || "Failed to accept ownership");
    } finally {
      setAcceptingOwner(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {isPendingOwner && (
        <Banner
          variant="warning"
          title="Pending Ownership Proposal"
          action={
            <Button
              size="sm"
              variant="primary"
              isLoading={acceptingOwner}
              onClick={handleAcceptOwnership}
            >
              Accept Ownership
            </Button>
          }
        >
          Your connected wallet was proposed as the new GrantKit owner. Accept to
          finalize the transfer.
        </Banner>
      )}

      <section className="pt-6 sm:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-3xl sm:text-[36px] font-semibold text-[var(--text-app)] tracking-[-0.02em] leading-[1.15]">
            Decentralized grants powered by on-chain LLM consensus.
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed max-w-xl">
            GrantKit runs developer grants on GenLayer. Validators fetch public
            evidence and rate it against published criteria, then unlock escrowed
            milestone tranches.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="md" variant="primary" onClick={() => onNavigate("apply")}>
              Apply for a grant
            </Button>
            <Button size="md" variant="secondary" onClick={() => onNavigate("proposals")}>
              View proposals
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 select-none">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-app)] mb-4">
              <span className="font-mono text-[11px] text-[var(--text-faint)]">
                Proposal #1 · Live Evaluation
              </span>
              <Badge status="approved" label="Approved" />
            </div>
            <div className="space-y-3">
              <div className="font-semibold text-sm text-[var(--text-app)] leading-snug">
                GenVM WebAssembly Debugger & Execution Trace Inspector
              </div>
              <div className="p-3 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">Consensus Rating</div>
                  <div className="font-mono text-lg font-semibold tabular-nums text-[var(--text-app)]">
                    75{" "}
                    <span className="text-xs text-[var(--text-faint)] font-normal">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[var(--text-muted)]">First Tranche</div>
                  <div className="font-mono text-xs font-semibold tabular-nums text-[var(--color-success)]">
                    10,000 GEN Released
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
                  <span>Tranche 1 of 3</span>
                  <span>33.3% Disbursed</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-surface-raised)] rounded-[999px] overflow-hidden border border-[var(--border-app)]">
                  <div className="h-full bg-[#3B6CFF] w-1/3" />
                </div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[var(--text-faint)] flex items-center justify-between">
                <span>Pass tier: {config?.pass_tier_name ?? "PASS"}</span>
                <span>strict_eq consensus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-app)]">
            <div className="p-4 sm:p-5">
              <span className="text-xs text-[var(--text-muted)] font-medium block">
                Treasury Pool
              </span>
              {loading || !treasury ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <span
                  title={formatGen(String(treasury.pool)).raw}
                  className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-[var(--text-app)] block mt-1"
                >
                  {formatGen(String(treasury.pool)).display}
                </span>
              )}
              <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                Available for new awards
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-[var(--text-muted)] font-medium block">
                Escrowed
              </span>
              {loading || !treasury ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <span
                  title={formatGen(String(treasury.escrowed)).raw}
                  className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-[var(--text-app)] block mt-1"
                >
                  {formatGen(String(treasury.escrowed)).display}
                </span>
              )}
              <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                Locked in milestone tranches
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-[var(--text-muted)] font-medium block">
                Proposals Evaluated
              </span>
              {loading || !treasury ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <span className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-[var(--text-app)] block mt-1">
                  {treasury.proposal_count}
                </span>
              )}
              <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                Stored on-chain
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-[var(--text-muted)] font-medium block">
                Pass Tier
              </span>
              {loading || !config ? (
                <Skeleton className="h-7 w-20 mt-1" />
              ) : (
                <span className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-[var(--text-app)] block mt-1">
                  {config.pass_tier}{" "}
                  <span className="text-sm font-normal text-[var(--text-faint)]">
                    {config.pass_tier_name}
                  </span>
                </span>
              )}
              <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                Minimum rating to approve
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-app)]">How it works</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            End-to-end evaluation on GenLayer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-[#3B6CFF] block mb-2">01.</span>
              <h3 className="text-xs font-semibold text-[var(--text-app)] mb-1">Submit Proposal</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Applicant sends the exact submission deposit plus title, pitch, HTTPS links, and milestones.
              </p>
            </div>
            <div className="pt-4 text-[11px] font-mono text-[var(--text-faint)]">
              Deposit: {config ? formatGen(String(config.submission_deposit)).display : "—"}
            </div>
          </div>

          <div className="p-4 rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-[#3B6CFF] block mb-2">02.</span>
              <h3 className="text-xs font-semibold text-[var(--text-app)] mb-1">Fetch Evidence</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Validators fetch each public HTTPS link. Fetch failure reverts; the deposit is not taken.
              </p>
            </div>
            <div className="pt-4 text-[11px] font-mono text-[var(--text-faint)]">
              Strict HTTPS validation
            </div>
          </div>

          <div className="p-4 rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-[#3B6CFF] block mb-2">03.</span>
              <h3 className="text-xs font-semibold text-[var(--text-app)] mb-1">LLM Rating</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The evaluator rates only against the published criteria. Validators must agree on one tier word.
              </p>
            </div>
            <div className="pt-4 text-[11px] font-mono text-[var(--text-faint)]">
              Need {config?.pass_tier_name ?? "PASS"} or higher
            </div>
          </div>

          <div className="p-4 rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-semibold text-[#3B6CFF] block mb-2">04.</span>
              <h3 className="text-xs font-semibold text-[var(--text-app)] mb-1">Tranche Payout</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                If approved, tranche 1 pays immediately. The rest stays escrowed until each milestone passes.
              </p>
            </div>
            <div className="pt-4 text-[11px] font-mono text-[var(--text-faint)]">
              Escrow-enforced
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-app)]">
              Public Evaluation Criteria
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Trusted rubric set by the operator. Applicant text cannot override it.
            </p>
          </div>
          {config && (
            <div className="px-2 py-0.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[11px] font-mono text-[var(--text-muted)]">
              Directive v{config.criteria_version}
            </div>
          )}
        </div>
        <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
          {loading || !config ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <div className="space-y-4 text-xs text-[var(--text-app)] leading-relaxed whitespace-pre-line">
              {config.criteria}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};