import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type {
  GrantConfig,
  GrantProposal,
  GrantTreasury,
  TransactionReceipt,
} from "./types";

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

function toWei(value: unknown, fallback = "0"): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" && /^(0|[1-9]\d*)$/.test(value.trim())) return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  return fallback;
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
    amount: toWei(raw.amount),
    released: toWei(raw.released),
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

class GrantKit {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, address?: string | null, studioUrl?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    if (studioUrl) config.endpoint = studioUrl;
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({
      chain: studionet,
      account: address as `0x${string}`,
    });
  }

  private async read<T>(functionName: string, args: any[] = []): Promise<T> {
    return this.client.readContract({
      address: this.contractAddress,
      functionName,
      args,
    }) as Promise<T>;
  }

  private async write(
    functionName: string,
    args: any[],
    value: bigint
  ): Promise<TransactionReceipt> {
    await this.client.connect("studionet");
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value,
    });
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.ACCEPTED,
      retries: 48,
      interval: 5000,
    });
    return receipt as TransactionReceipt;
  }

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
      max_award: toWei(raw?.max_award),
      submission_deposit: toWei(raw?.submission_deposit),
      max_milestones: toNumber(raw?.max_milestones),
      max_attempts: toNumber(raw?.max_attempts),
      inactivity_days: toNumber(raw?.inactivity_days),
      paused: Boolean(raw?.paused),
    };
  }

  async getTreasury(): Promise<GrantTreasury> {
    const raw: any = await this.read("get_treasury");
    return {
      pool: toWei(raw?.pool),
      escrowed: toWei(raw?.escrowed),
      proposal_count: toNumber(raw?.proposal_count),
    };
  }

  async getOwner(): Promise<string> {
    return String((await this.read<unknown>("get_owner")) ?? "");
  }

  async getProposal(pid: number): Promise<GrantProposal> {
    return normalizeProposal(await this.read<any>("get_proposal", [pid]));
  }

  async getProposals(start = 1, limit = DEFAULT_PAGE_SIZE): Promise<GrantProposal[]> {
    const rows = await this.read<any[]>("get_proposals", [start, limit]);
    if (!Array.isArray(rows)) return [];
    return rows.map(normalizeProposal);
  }

  async getLatestProposalId(applicant: string): Promise<number> {
    return toNumber(await this.read<unknown>("get_latest_proposal_id", [applicant]));
  }

  async fund(amount: bigint): Promise<TransactionReceipt> {
    if (amount <= 0n) throw new Error("fund amount must be positive");
    return this.write("fund", [], amount);
  }

  async submitProposal(
    title: string,
    pitch: string,
    links: string[],
    milestones: string[],
    amount: string | bigint,
    deposit: bigint
  ): Promise<TransactionReceipt> {
    return this.write(
      "submit_proposal",
      [title, pitch, asJsonArray(links, "links"), asJsonArray(milestones, "milestones"), toWei(amount)],
      deposit
    );
  }

  async submitMilestone(pid: number, evidenceUrl: string, notes: string): Promise<TransactionReceipt> {
    return this.write("submit_milestone", [pid, evidenceUrl, notes], 0n);
  }

  async abandonGrant(pid: number): Promise<TransactionReceipt> {
    return this.write("abandon_grant", [pid], 0n);
  }

  async reclaimInactiveGrant(pid: number): Promise<TransactionReceipt> {
    return this.write("reclaim_inactive_grant", [pid], 0n);
  }

  async cancelExhaustedGrant(pid: number): Promise<TransactionReceipt> {
    return this.write("cancel_exhausted_grant", [pid], 0n);
  }

  async withdrawPool(amount: string | bigint): Promise<TransactionReceipt> {
    return this.write("withdraw_pool", [toWei(amount)], 0n);
  }

  async setCriteria(newCriteria: string): Promise<TransactionReceipt> {
    return this.write("set_criteria", [newCriteria], 0n);
  }

  async setParameters(params: {
    passTier: number;
    milestoneTier: number;
    maxAward: string | bigint;
    submissionDeposit: string | bigint;
    maxMilestones: number;
    maxAttempts: number;
    inactivityDays: number;
  }): Promise<TransactionReceipt> {
    return this.write("set_parameters", [
      params.passTier,
      params.milestoneTier,
      toWei(params.maxAward),
      toWei(params.submissionDeposit),
      params.maxMilestones,
      params.maxAttempts,
      params.inactivityDays,
    ], 0n);
  }

  async setPaused(paused: boolean): Promise<TransactionReceipt> {
    return this.write("set_paused", [paused], 0n);
  }

  async proposeOwner(newOwner: string): Promise<TransactionReceipt> {
    return this.write("propose_owner", [newOwner], 0n);
  }

  async cancelOwnershipTransfer(): Promise<TransactionReceipt> {
    return this.write("cancel_ownership_transfer", [], 0n);
  }

  async acceptOwnership(): Promise<TransactionReceipt> {
    return this.write("accept_ownership", [], 0n);
  }
}

export default GrantKit;