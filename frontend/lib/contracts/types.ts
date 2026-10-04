export type GrantLogEntry = {
  type?: string;
  tier?: string;
  score?: number;
  passed?: boolean;
  feedback?: string;
  reason?: string;
  returned?: string;
  index?: number;
  at?: string;
};

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}


export type GrantProposal = {
  id: number;
  found: boolean;
  applicant?: string;
  title?: string;
  pitch?: string;
  links?: string[];
  milestones?: string[];
  amount?: string;
  released?: string;
  next_milestone?: number;
  attempts?: number;
  attempt_cap?: number;
  ms_tier?: number;
  timeout_days?: number;
  status?: string;
  tier?: string;
  score?: number;
  criteria?: string;
  criteria_version?: number;
  created_at?: string;
  last_activity?: string;
  feedback?: string;
  log?: GrantLogEntry[];
};

export type GrantConfig = {
  owner: string;
  pending_owner: string;
  criteria: string;
  criteria_version: number;
  pass_tier: number;
  pass_tier_name: string;
  milestone_tier: number;
  milestone_tier_name: string;
  max_award: string;
  submission_deposit: string;
  max_milestones: number;
  max_attempts: number;
  inactivity_days: number;
  paused: boolean;
};

export type GrantTreasury = {
  pool: string;
  escrowed: string;
  proposal_count: number;
};