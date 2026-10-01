import React, { useMemo, useState } from "react";
import { PageId } from "../nav/Navbar";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Drawer } from "../ui/Drawer";
import { Skeleton } from "../ui/Skeleton";
import { useProposals, useGrantTreasury } from "@/lib/hooks/useGrantKit";
import type { GrantProposal } from "@/lib/contracts/types";
import { formatGen, truncateAddress } from "../../utils/format";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface AllProposalsPageProps {
  onNavigate: (page: PageId) => void;
}

type StatusFilter = "ALL" | "approved" | "completed" | "cancelled" | "rejected";

export const AllProposalsPage: React.FC<AllProposalsPageProps> = ({
  onNavigate,
}) => {
  const [selectedProposal, setSelectedProposal] = useState<GrantProposal | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const start = page * limit + 1;
  const { data: proposals = [], isLoading } = useProposals(start, limit);
  const { data: treasury } = useGrantTreasury();
  const total = treasury?.proposal_count ?? proposals.length;

  const filteredProposals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return proposals.filter((p) => {
      const status = String(p.status ?? "").toLowerCase();
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesSearch =
        !q ||
        String(p.title ?? "").toLowerCase().includes(q) ||
        String(p.applicant ?? "").toLowerCase().includes(q) ||
        String(p.id) === q;
      return matchesStatus && matchesSearch;
    });
  }, [proposals, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filters: { id: StatusFilter; label: string }[] = [
    { id: "ALL", label: `All Proposals (${total})` },
    { id: "approved", label: "Approved (Active)" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[var(--text-app)] tracking-[-0.02em]">
            All Proposals
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Complete registry of grant proposals evaluated on GenLayer.
          </p>
        </div>
        <Button size="md" variant="primary" onClick={() => onNavigate("apply")}>
          Submit New Proposal
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 p-1 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] overflow-x-auto text-xs">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-[var(--bg-surface-raised)] text-[var(--text-app)] border border-[var(--border-app)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search
            size={14}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search title, applicant, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[36px] pl-9 pr-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-[8px] text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus-visible:outline-2 focus-visible:outline-[#3B6CFF]"
          />
        </div>
      </div>

      <div className="rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">
            No proposals found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--bg-surface-raised)] border-b border-[var(--border-app)] text-[var(--text-muted)] font-medium">
                <tr>
                  <th className="py-2.5 px-4 font-mono w-16">ID</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4 font-mono">Applicant</th>
                  <th className="py-2.5 px-4 text-right font-mono">Amount</th>
                  <th className="py-2.5 px-4 text-right font-mono">Released</th>
                  <th className="py-2.5 px-4 text-right font-mono">Score</th>
                  <th className="py-2.5 px-4 w-28">Status</th>
                  <th className="py-2.5 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-app)]">
                {filteredProposals.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProposal(p)}
                    className="hover:bg-[var(--bg-surface-raised)] transition-colors cursor-pointer select-none group"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-[var(--text-faint)]">
                      #{p.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-app)] max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                      {truncateAddress(p.applicant || "", 6, 4)}
                    </td>
                    <td
                      title={formatGen(String(p.amount ?? 0)).raw}
                      className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[var(--text-app)]"
                    >
                      {formatGen(String(p.amount ?? 0)).display}
                    </td>
                    <td
                      title={formatGen(String(p.released ?? 0)).raw}
                      className="py-3 px-4 text-right font-mono tabular-nums text-[var(--color-success)]"
                    >
                      {formatGen(String(p.released ?? 0)).display}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[var(--text-app)]">
                      {p.score ?? 0}
                      <span className="text-[10px] text-[var(--text-faint)] font-normal">
                        {" "}
                        {p.tier ? `(${p.tier})` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Eye
                        size={14}
                        strokeWidth={1.5}
                        className="text-[var(--text-faint)] group-hover:text-[var(--text-app)] transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-xs text-[var(--text-muted)]">
            <span className="font-mono">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
                <span>Previous</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Drawer
        proposal={selectedProposal}
        isOpen={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
      />
    </div>
  );
};