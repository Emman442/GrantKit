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

function asRecord(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, any>;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function toWei(value: unknown, fallback = "0"): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" && /^(0|[1-9]\d*)$/.test(value.trim())) return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  return fallback;
}

function asJsonArray(items: string[], label: string): string {
  if (!Array.isArray(items) || items.length < 1) {
    throw new Error(`${label} must contain at least one string`);
  }
  return JSON.stringify(items);
}

function normalizeProposal(raw: unknown): GrantProposal {
  const data = asRecord(raw);
  if (!data.id && data.found === false) return { id: 0, found: false };

  return {
    id: toNumber(data.id),
    found: Boolean(data.found ?? true),
    applicant: toStringValue(data.applicant),
    title: toStringValue(data.title),
    pitch: toStringValue(data.pitch),
    links: Array.isArray(data.links) ? data.links.map(String) : [],
    milestones: Array.isArray(data.milestones) ? data.milestones.map(String) : [],
    amount: toWei(data.amount),
    released: toWei(data.released),
    next_milestone: toNumber(data.next_milestone),
    attempts: toNumber(data.attempts),
    attempt_cap: toNumber(data.attempt_cap),
    ms_tier: toNumber(data.ms_tier),
    timeout_days: toNumber(data.timeout_days),
    status: toStringValue(data.status),
    tier: toStringValue(data.tier),
    score: toNumber(data.score),
    criteria: toStringValue(data.criteria),
    criteria_version: toNumber(data.criteria_version),
    created_at: toStringValue(data.created_at),
    last_activity: toStringValue(data.last_activity),
    feedback: toStringValue(data.feedback),
    log: Array.isArray(data.log) ? data.log : [],
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
    const raw = asRecord(await this.read("get_config"));
    return {
      owner: toStringValue(raw.owner),
      pending_owner: toStringValue(raw.pending_owner),
      criteria: toStringValue(raw.criteria),
      criteria_version: toNumber(raw.criteria_version, 1),
      pass_tier: toNumber(raw.pass_tier),
      pass_tier_name: toStringValue(raw.pass_tier_name),
      milestone_tier: toNumber(raw.milestone_tier),
      milestone_tier_name: toStringValue(raw.milestone_tier_name),
      max_award: toWei(raw.max_award),
      submission_deposit: toWei(raw.submission_deposit),
      max_milestones: toNumber(raw.max_milestones),
      max_attempts: toNumber(raw.max_attempts),
      inactivity_days: toNumber(raw.inactivity_days),
      paused: Boolean(raw.paused),
    };
  }

  async getTreasury(): Promise<GrantTreasury> {
    const raw = asRecord(await this.read("get_treasury"));
    return {
      pool: toWei(raw.pool),
      escrowed: toWei(raw.escrowed),
      proposal_count: toNumber(raw.proposal_count),
    };
  }

  async getOwner(): Promise<string> {
    return toStringValue(await this.read("get_owner"));
  }

  async getProposal(pid: number): Promise<GrantProposal> {
    return normalizeProposal(await this.read("get_proposal", [pid]));
  }

  async getProposals(start = 1, limit = DEFAULT_PAGE_SIZE): Promise<GrantProposal[]> {
    const rows = await this.read<unknown>("get_proposals", [start, limit]);
    return Array.isArray(rows) ? rows.map(normalizeProposal) : [];
  }

  async getLatestProposalId(applicant: string): Promise<number> {
    return toNumber(await this.read("get_latest_proposal_id", [applicant]));
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