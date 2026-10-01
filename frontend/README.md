# GrantKit

> Decentralized intelligent grants platform powered by on-chain LLM committee consensus on **GenLayer**.

GrantKit removes subjective human bias and opaque committees from ecosystem grants. Applicants submit technical proposals with public criteria milestones, GenLayer validator nodes fetch referenced GitHub repositories and specifications via GenLayer Web-Access, and on-chain LLMs execute consensus scoring against public criteria. Approved proposals receive immediately released initial tranches, with remaining funds escrowed until deliverable proof is audited on-chain.

---

## Architecture & Contract Interface

The front end communicates directly with the GenLayer intelligent contract interface using `genlayer-js`:

### Contract Reads
- `get_config()`: Retrieves governance parameters (pass threshold, milestone threshold, tolerance, max award cap, submission deposit, criteria version, public criteria text, and pause state).
- `get_treasury()`: Returns available unescrowed pool liquidity, locked milestone escrow, and total proposals.
- `get_proposal(pid)`: Returns full proposal details, milestone breakdown, tranches, consensus score, status, and JSON audit log.
- `get_proposals(start, limit)`: Paginated query across all historical submissions.
- `get_latest_proposal_id(applicant)`: Resolves active grant proposal ID for a connected wallet address.

### Contract Writes
- `fund(amount)` (payable): Supplies capital to the treasury pool.
- `submit_proposal(title, pitch, links, milestones, amount)` (payable): Submits proposal with anti-spam deposit bond, initiating validator link verification and committee consensus scoring.
- `submit_milestone(pid, evidence_url, notes)`: Submits evidence URL for the current active tranche.
- `abandon_grant(pid)`: Grantee voluntarily relinquishes active grant; unreleased escrow funds return to the treasury pool.
- `cancel_stalled_grant(pid)`: Owner cancels a grant that has exhausted its retry attempt cap.
- `withdraw_pool(amount)`: Owner withdraws unallocated pool funds (escrowed funds cannot be withdrawn).
- `set_criteria(new_criteria)`: Updates public criteria directive (increments version, applies to new submissions).
- `set_parameters(...)`: Governs protocol thresholds and limits.
- `set_paused(paused)`: Emergency circuit breaker.
- `propose_owner(new_owner)` & `accept_ownership()`: Two-step ownership transfer.

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

To connect to a live deployed GenLayer contract, set `VITE_GRANTKIT_CONTRACT_ADDRESS`:

```env
# GenLayer GrantKit Intelligent Contract Address
VITE_GRANTKIT_CONTRACT_ADDRESS="0x..."

# GenLayer RPC URL (defaults to GenLayer studionet)
VITE_GENLAYER_RPC_URL="https://studio.genlayer.com/api"
```

*Note: If `VITE_GRANTKIT_CONTRACT_ADDRESS` is empty, GrantKit seamlessly operates in GenLayer studionet Sandbox mode, allowing full end-to-end interactive testing with simulated validator consensus delays, milestone unlocking, and state persistence.*

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing Profiles & Roles

The top navigation includes a test profile switcher in the wallet dropdown:

1. **Grant Applicant (`0x42A6...48a3`)**:
   - Holds an active approved grant (*GenVM WebAssembly Debugger*).
   - Milestone 1 is completed and released (10,000 GEN). Milestone 2 is currently active for deliverable submission.
2. **Contract Owner (`0x9dCF...DFB6`)**:
   - Accesses the protected **Admin** console.
   - Manages treasury liquidity (fund & withdraw), edits criteria versions, updates protocol parameters, toggles emergency pause, and cancels stalled grants.
3. **Proposed Owner (`0x71C8...6c81`)**:
   - Triggers the on-chain **Accept Ownership** action banner on the Overview page.
4. **New Grantee (`0x992B...c75B`)**:
   - Clean wallet with no existing grants; ready to submit a fresh grant application on the **Apply** page.

---

## Design System

GrantKit strictly adheres to clean, flat, confident fintech infrastructure principles (inspired by Linear, Vercel, and Stripe):

- **Solid Colors Only**: Zero gradients, zero glassmorphism, zero drop shadows.
- **Strict Color Tokens**:
  - Dark background `#0A0A0B`, surface `#111113`, surface-raised `#17171A`, border `#242428`.
  - Light background `#FAFAFA`, surface `#FFFFFF`, surface-raised `#F4F4F5`, border `#E4E4E7`.
  - Single solid accent `#3B6CFF`.
  - Semantic status indicators: success `#2FA36B`, warning `#C9932B`, danger `#D2554D`.
- **Tabular Numerals**: Tabular figures (`tabular-nums`) for all amounts, balances, scores, and timestamps.
- **Real Stepper Feedback**: Multi-step progress tracker with live elapsed counter during validator link fetching and consensus execution.
