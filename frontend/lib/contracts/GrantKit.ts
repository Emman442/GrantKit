import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  GrantConfig,
  GrantProposal,
  GrantTreasury,
  TransactionReceipt,
} from "./types";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
  type FeePresetEstimate,
  type FeePresetLevel,
} from "../genlayer/fees";

const DEFAULT_PAGE_SIZE = 50;

function asJsonArray(items: string[], label: string): string {
  if (!Array.isArray(items) || items.length < 1) {
    throw new Error(`${label} must contain at least one string`);
  }
  return JSON.stringify(items);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProposal(raw: any): GrantProposal {
  if (!raw || typeof raw !== "object") {
    return { id: 0, found: false };
  }

  return {
    id: toNumber(raw.id),
    found: Boolean(raw.found ?? true),
    applicant: String(raw.applicant ?? ""),
    title: String(raw.title ?? ""),
    pitch: String(raw.pitch ?? ""),
    links: Array.isArray(raw.links) ? raw.links.map(String) : [],
    milestones: Array.isArray(raw.milestones) ? raw.milestones.map(String) : [],
    amount: toNumber(raw.amount),
    released: toNumber(raw.released),
    next_milestone: toNumber(raw.next_milestone),
    attempts: toNumber(raw.attempts),
    attempt_cap: toNumber(raw.attempt_cap),
    ms_tier: toNumber(raw.ms_tier),
    timeout_days: toNumber(raw.timeout_days),
    status: String(raw.status ?? ""),
    tier: String(raw.tier ?? ""),
    score: toNumber(raw.score),
    criteria_version: toNumber(raw.criteria_version),
    created_at: String(raw.created_at ?? ""),
    last_activity: String(raw.last_activity ?? ""),
    feedback: String(raw.feedback ?? ""),
    log: Array.isArray(raw.log) ? raw.log : [],
  };
}

/**
 * GrantKit client for the OpenCriteriaGrants Intelligent Contract.
 * One deployed contract = one grant program. Applicants submit many proposals.
 */
class GrantKit {
  private contractAddress: `0x${string}`;
  private client: any;
  private studioUrl?: string;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.studioUrl = studioUrl;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    if (this.studioUrl) {
      config.endpoint = this.studioUrl;
    }

    this.client = createClient(config);
  }

  private async estimateFees(
    functionName: string,
    args: unknown[],
    value: bigint,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName,
        args,
        value,
      },
      level
    );
  }

  private async write(
    functionName: string,
    args: unknown[],
    value: bigint = BigInt(0),
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    const fees = feePresetToTransactionFees(feePreset);
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value,
      ...(fees ? { fees } : {}),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 24,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }

  private async read<T>(functionName: string, args: unknown[] = []): Promise<T> {
    return this.client.readContract({
      address: this.contractAddress,
      functionName,
      args,
    }) as Promise<T>;
  }

  // ------------------------------------------------------------------ views

  async getConfig(): Promise<GrantConfig> {
    const raw: any = await this.read("get_config");



    return {
      owner: String(raw?.owner ?? ""),
      pending_owner: String(raw?.pending_owner ?? ""),
      criteria: String(raw?.criteria ?? ""),
      criteria_version: toNumber(raw?.criteria_version, 1),
      pass_tier: toNumber(raw?.pass_tier),
      pass_tier_name: String(raw?.pass_tier_name ?? ""),
      milestone_tier: toNumber(raw?.milestone_tier),
      milestone_tier_name: String(raw?.milestone_tier_name ?? ""),
      max_award: toNumber(raw?.max_award),
      submission_deposit: toNumber(raw?.submission_deposit),
      max_milestones: toNumber(raw?.max_milestones),
      max_attempts: toNumber(raw?.max_attempts),
      inactivity_days: toNumber(raw?.inactivity_days),
      paused: Boolean(raw?.paused),
    };
  }

  async getTreasury(): Promise<GrantTreasury> {
    const raw: any = await this.read("get_treasury");
    return {
      pool: toNumber(raw?.pool),
      escrowed: toNumber(raw?.escrowed),
      proposal_count: toNumber(raw?.proposal_count),
    };
  }

  async getOwner(): Promise<string> {
    const owner = await this.read<unknown>("get_owner");
    return String(owner ?? "");
  }

  async getProposal(pid: number): Promise<GrantProposal> {
    const raw = await this.read<any>("get_proposal", [pid]);
    return normalizeProposal(raw);
  }

  async getProposals(
    start = 1,
    limit = DEFAULT_PAGE_SIZE
  ): Promise<GrantProposal[]> {
    const rows = await this.read<any[]>("get_proposals", [start, limit]);
    if (!Array.isArray(rows)) return [];
    return rows.map(normalizeProposal);
  }

  async getLatestProposalId(applicant: string): Promise<number> {
    const id = await this.read<unknown>("get_latest_proposal_id", [applicant]);
    return toNumber(id);
  }

  async debugCapabilities(): Promise<string> {
    const caps = await this.read<unknown>("debug_capabilities");
    return String(caps ?? "");
  }

  // ------------------------------------------------------------------ fee estimates

  async estimateFundFees(
    amount: bigint,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return this.estimateFees("fund", [], amount, level);
  }

  async estimateSubmitProposalFees(
    title: string,
    pitch: string,
    links: string[],
    milestones: string[],
    amount: number,
    deposit: bigint,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return this.estimateFees(
      "submit_proposal",
      [
        title,
        pitch,
        asJsonArray(links, "links"),
        asJsonArray(milestones, "milestones"),
        amount,
      ],
      deposit,
      level
    );
  }

  async estimateSubmitMilestoneFees(
    pid: number,
    evidenceUrl: string,
    notes: string,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return this.estimateFees(
      "submit_milestone",
      [pid, evidenceUrl, notes],
      BigInt(0),
      level
    );
  }

  // ------------------------------------------------------------------ applicant + public writes

  async fund(
    amount: bigint,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    if (amount <= BigInt(0)) {
      throw new Error("fund amount must be positive");
    }
    try {
      return await this.write("fund", [], amount, feePreset);
    } catch (error) {
      console.error("Error funding pool:", error);
      throw new Error("Failed to fund grant pool");
    }
  }

  async submitProposal(
    title: string,
    pitch: string,
    links: string[],
    milestones: string[],
    amount: number,
    deposit: bigint,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      return await this.write(
        "submit_proposal",
        [
          title,
          pitch,
          asJsonArray(links, "links"),
          asJsonArray(milestones, "milestones"),
          amount,
        ],
        deposit,
        feePreset
      );
    } catch (error) {
      console.error("Error submitting proposal:", error);
      throw new Error("Failed to submit proposal");
    }
  }

  async submitMilestone(
    pid: number,
    evidenceUrl: string,
    notes: string,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      return await this.write(
        "submit_milestone",
        [pid, evidenceUrl, notes],
        BigInt(0),
        feePreset
      );
    } catch (error) {
      console.error("Error submitting milestone:", error);
      throw new Error("Failed to submit milestone");
    }
  }

  async abandonGrant(pid: number): Promise<TransactionReceipt> {
    try {
      return await this.write("abandon_grant", [pid]);
    } catch (error) {
      console.error("Error abandoning grant:", error);
      throw new Error("Failed to abandon grant");
    }
  }

  async reclaimInactiveGrant(pid: number): Promise<TransactionReceipt> {
    try {
      return await this.write("reclaim_inactive_grant", [pid]);
    } catch (error) {
      console.error("Error reclaiming inactive grant:", error);
      throw new Error("Failed to reclaim inactive grant");
    }
  }

  // ------------------------------------------------------------------ owner writes

  async cancelExhaustedGrant(pid: number): Promise<TransactionReceipt> {
    try {
      return await this.write("cancel_exhausted_grant", [pid]);
    } catch (error) {
      console.error("Error cancelling grant:", error);
      throw new Error("Failed to cancel exhausted grant");
    }
  }

  async withdrawPool(amount: number): Promise<TransactionReceipt> {
    try {
      return await this.write("withdraw_pool", [amount]);
    } catch (error) {
      console.error("Error withdrawing pool:", error);
      throw new Error("Failed to withdraw pool");
    }
  }

  async setCriteria(newCriteria: string): Promise<TransactionReceipt> {
    try {
      return await this.write("set_criteria", [newCriteria]);
    } catch (error) {
      console.error("Error setting criteria:", error);
      throw new Error("Failed to set criteria");
    }
  }

  async setParameters(params: {
    passTier: number;
    milestoneTier: number;
    maxAward: number;
    submissionDeposit: number;
    maxMilestones: number;
    maxAttempts: number;
    inactivityDays: number;
  }): Promise<TransactionReceipt> {
    try {
      return await this.write("set_parameters", [
        params.passTier,
        params.milestoneTier,
        params.maxAward,
        params.submissionDeposit,
        params.maxMilestones,
        params.maxAttempts,
        params.inactivityDays,
      ]);
    } catch (error) {
      console.error("Error setting parameters:", error);
      throw new Error("Failed to set parameters");
    }
  }

  async setPaused(paused: boolean): Promise<TransactionReceipt> {
    try {
      return await this.write("set_paused", [paused]);
    } catch (error) {
      console.error("Error setting paused:", error);
      throw new Error("Failed to set paused");
    }
  }

  async proposeOwner(newOwner: string): Promise<TransactionReceipt> {
    try {
      return await this.write("propose_owner", [newOwner]);
    } catch (error) {
      console.error("Error proposing owner:", error);
      throw new Error("Failed to propose owner");
    }
  }

  async cancelOwnershipTransfer(): Promise<TransactionReceipt> {
    try {
      return await this.write("cancel_ownership_transfer", []);
    } catch (error) {
      console.error("Error cancelling ownership transfer:", error);
      throw new Error("Failed to cancel ownership transfer");
    }
  }

  async acceptOwnership(): Promise<TransactionReceipt> {
    try {
      return await this.write("accept_ownership", []);
    } catch (error) {
      console.error("Error accepting ownership:", error);
      throw new Error("Failed to accept ownership");
    }
  }
}

export default GrantKit;