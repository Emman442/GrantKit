
export type GrantLogEntry = {
  type?: string;
  tier?: string;
  score?: number;
  passed?: boolean;
  feedback?: string;
  reason?: string;
  returned?: number;
  index?: number;
  at?: string;
};

export type GrantProposal = {
  id: number;
  found: boolean;
  applicant?: string;
  title?: string;
  pitch?: string;
  links?: string[];
  milestones?: string[];
  amount?: number;
  released?: number;
  next_milestone?: number;
  attempts?: number;
  attempt_cap?: number;
  ms_tier?: number;
  timeout_days?: number;
  status?: string;
  tier?: string;
  score?: number;
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
  max_award: number;
  submission_deposit: number;
  max_milestones: number;
  max_attempts: number;
  inactivity_days: number;
  paused: boolean;
};

export type GrantTreasury = {
  pool: number;
  escrowed: number;
  proposal_count: number;
};

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}





// export const GrantStatus = {
//   Approved: 1, // Active grant, milestone tranches unlocking
//   Completed: 2, // All milestones completed and paid out
//   Cancelled: 3, // Abandoned by grantee or cancelled by owner
//   Rejected: 4, // Failed initial LLM committee consensus
// } as const;

// export type GrantStatusCode = typeof GrantStatus[keyof typeof GrantStatus];

// export interface EvaluationLogEntry {
//   type: 'proposal_evaluation' | 'milestone_evaluation';
//   score: number;
//   passed: boolean;
//   reasoning: string;
//   timestamp: number;
//   milestone_index?: number;
//   attempts_used?: number;
// }

// export interface Proposal {
//   id: number;
//   applicant: string;
//   title: string;
//   pitch: string;
//   links: string[];
//   milestones: string[];
//   milestone_tranches: string[]; // BigInt string representations (wei / smallest unit)
//   amount: string; // BigInt string
//   released: string; // BigInt string
//   current_milestone: number; // 0-indexed milestone
//   score: number;
//   status: GrantStatusCode;
//   reasoning: string;
//   attempts_used: number;
//   evidence_url?: string;
//   notes?: string;
//   log: string[]; // Array of JSON serialized EvaluationLogEntry strings
//   submitted_at: number;
// }

// export interface ContractConfig {
//   owner: string;
//   pending_owner: string;
//   pass_threshold: number; // 1 to 100
//   milestone_threshold: number; // 1 to 100
//   tolerance: number; // 1 to 30
//   max_award: string; // BigInt string
//   submission_deposit: string; // BigInt string
//   max_milestones: number; // 1 to 12
//   attempt_cap: number; // 1 to 10
//   criteria_version: number;
//   criteria: string;
//   paused: boolean;
// }

// export interface Treasury {
//   pool: string; // BigInt string
//   escrowed: string; // BigInt string
//   total_proposals: number;
// }

// export type WriteStatus = 'idle' | 'signing' | 'pending' | 'success' | 'error';

// export interface EvaluationStepState {
//   currentStep: 1 | 2 | 3 | 4;
//   elapsedSeconds: number;
//   isEvaluating: boolean;
//   result?: {
//     passed: boolean;
//     score: number;
//     reasoning: string;
//     firstTrancheReleased?: string;
//   };
//   error?: string;
// }
