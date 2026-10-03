# GrantKit

Open-criteria grants on GenLayer. One deployed contract is one grant program. Anyone can fund the pool. Applicants submit a proposal, validators rate it against the criteria locked in the contract, and an approved grant pays out in milestone tranches held in escrow.

## How a grant runs

The owner sets the criteria, the pass tier, the milestone tier, the maximum award, the submission deposit, the milestone cap, the attempt cap, and the inactivity window at deploy time.

An applicant sends the exact deposit and a proposal: title, pitch, public https links, milestone text, and a requested amount. Validators fetch those links and return one word: DISQUALIFIED, FAIL, PARTIAL, PASS, or EXCELLENT. A result at or above the pass tier is approved. Anything lower is rejected. A rejected deposit is added to the pool. An approved deposit is refunded with the first tranche.

The award is split across the milestones. The first tranche is paid on approval. Later tranches stay in escrow until that milestone passes its own review. The last tranche receives any remainder from integer division. A void or failed milestone does not pay. It consumes one attempt. After every attempt is used, only the owner can cancel, and the unreleased amount returns to the pool.

The applicant can abandon an active grant. Anyone can reclaim one after its inactivity window. Both return unreleased funds to the pool, not to the caller. The owner can withdraw only the unreserved pool. Escrow cannot be withdrawn that way.

## Rules

- Criteria must be 20 to 4000 characters. Pass tier and milestone tier must be 2, 3, or 4.
- Maximum award is at least 1. Deposit cannot be negative. Milestones are 1 to 12. Attempts are 1 to 10. Inactivity is 7 to 365 days.
- Links must be public https URLs with a domain name. IP literals and local names are rejected.
- The requested amount must cover one unit per milestone, must not exceed the maximum award, and must fit in the pool.
- The owner cannot apply. An applicant can have only one approved grant at a time.
- A paused contract rejects new proposals and milestone submissions. Abandon, reclaim, and owner controls still run.
- Ownership transfer is two steps: the owner proposes, the pending owner accepts.

## Contract

File: contracts/grantkit.py
Class: OpenCriteriaGrants
SDK: v0.2.16
Depends: py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6
Network: Studionet, studio.genlayer.com

Constructor:

OpenCriteriaGrants(criteria, pass_tier, milestone_tier, max_award, submission_deposit, max_milestones, max_attempts, inactivity_days)

Writes:

- fund: payable. Add GEN to the pool.
- submit_proposal: payable. Send the exact deposit and open a proposal.
- submit_milestone: applicant. Submit evidence for the next milestone.
- abandon_grant: applicant. Return unreleased funds to the pool.
- reclaim_inactive_grant: anyone, after the timeout. Return unreleased funds to the pool.
- cancel_exhausted_grant: owner, after every attempt is used.
- withdraw_pool: owner. Withdraw unreserved funds only.
- set_criteria, set_parameters, set_paused: owner.
- propose_owner, cancel_ownership_transfer, accept_ownership: two-step owner change.

Views:

get_config, get_treasury, get_proposal, get_proposals, get_latest_proposal_id, get_owner.

Status on a proposal is rejected, approved, completed, or cancelled.

## Tests

Direct mode, with web and LLM mocked. From the repo root, with genlayer-test installed:

pytest tests/direct/test_grantkit.py -v

The suite checks funding, input rejection, owner exclusion, an approved escrow split, a rejected proposal, milestone completion, and owner-only withdrawal. The first run downloads the v0.2.16 runner.