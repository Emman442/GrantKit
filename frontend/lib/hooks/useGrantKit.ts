"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import GrantKit from "../contracts/GrantKit";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type {
  GrantConfig,
  GrantProposal,
  GrantTreasury,
} from "../contracts/types";

export function useGrantKitContract(): GrantKit | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }

    return new GrantKit(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

function invalidateGrantQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["grantConfig"] });
  queryClient.invalidateQueries({ queryKey: ["grantTreasury"] });
  queryClient.invalidateQueries({ queryKey: ["grantProposals"] });
  queryClient.invalidateQueries({ queryKey: ["grantProposal"] });
  queryClient.invalidateQueries({ queryKey: ["grantLatestProposalId"] });
  queryClient.invalidateQueries({ queryKey: ["grantOwner"] });
}

export function useGrantConfig() {
  const contract = useGrantKitContract();

  return useQuery<GrantConfig | null, Error>({
    queryKey: ["grantConfig"],
    queryFn: () => {
      if (!contract) return Promise.resolve(null);
      return contract.getConfig();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useGrantTreasury() {
  const contract = useGrantKitContract();

  return useQuery<GrantTreasury | null, Error>({
    queryKey: ["grantTreasury"],
    queryFn: () => {
      if (!contract) return Promise.resolve(null);
      return contract.getTreasury();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useGrantOwner() {
  const contract = useGrantKitContract();

  return useQuery<string, Error>({
    queryKey: ["grantOwner"],
    queryFn: () => {
      if (!contract) return Promise.resolve("");
      return contract.getOwner();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useProposals(start = 1, limit = 50) {
  const contract = useGrantKitContract();

  return useQuery<GrantProposal[], Error>({
    queryKey: ["grantProposals", start, limit],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getProposals(start, limit);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useProposal(pid: number | null) {
  const contract = useGrantKitContract();

  return useQuery<GrantProposal | null, Error>({
    queryKey: ["grantProposal", pid],
    queryFn: () => {
      if (!contract || !pid) return Promise.resolve(null);
      return contract.getProposal(pid);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!pid,
  });
}

export function useLatestProposalId(applicant: string | null) {
  const contract = useGrantKitContract();

  return useQuery<number, Error>({
    queryKey: ["grantLatestProposalId", applicant],
    queryFn: () => {
      if (!contract || !applicant) return Promise.resolve(0);
      return contract.getLatestProposalId(applicant);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!applicant,
  });
}

export function useFundPool() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isFunding, setIsFunding] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to fund the pool.");
      }
      setIsFunding(true);
      return contract.fund(amount);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      setIsFunding(false);
      success("Pool funded", {
        description: "GEN was added to the grant pool.",
      });
    },
    onError: (err: any) => {
      console.error("Error funding pool:", err);
      setIsFunding(false);
      error("Failed to fund pool", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isFunding,
    fundPool: mutation.mutate,
    fundPoolAsync: mutation.mutateAsync,
  };
}

export function useSubmitProposal() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      title,
      pitch,
      links,
      milestones,
      amount,
      deposit,
    }: {
      title: string;
      pitch: string;
      links: string[];
      milestones: string[];
      amount: number;
      deposit: bigint;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to submit a proposal.");
      }
      setIsSubmitting(true);
      return contract.submitProposal(title, pitch, links, milestones, amount, deposit);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      setIsSubmitting(false);
      success("Proposal submitted", {
        description:
          "Validators are evaluating the proposal against the published criteria. This can take a while.",
      });
    },
    onError: (err: any) => {
      console.error("Error submitting proposal:", err);
      setIsSubmitting(false);
      error("Failed to submit proposal", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSubmitting,
    submitProposal: mutation.mutate,
    submitProposalAsync: mutation.mutateAsync,
  };
}

export function useSubmitMilestone() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPid, setSubmittingPid] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      pid,
      evidenceUrl,
      notes,
    }: {
      pid: number;
      evidenceUrl: string;
      notes: string;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to submit a milestone.");
      }
      setIsSubmitting(true);
      setSubmittingPid(pid);
      return contract.submitMilestone(pid, evidenceUrl, notes);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      setIsSubmitting(false);
      setSubmittingPid(null);
      success("Milestone submitted", {
        description: "Evidence is being evaluated on-chain.",
      });
    },
    onError: (err: any) => {
      console.error("Error submitting milestone:", err);
      setIsSubmitting(false);
      setSubmittingPid(null);
      error("Failed to submit milestone", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSubmitting,
    submittingPid,
    submitMilestone: mutation.mutate,
    submitMilestoneAsync: mutation.mutateAsync,
  };
}

export function useAbandonGrant() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (pid: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.abandonGrant(pid);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      success("Grant abandoned", {
        description: "Unreleased funds returned to the pool.",
      });
    },
    onError: (err: any) => {
      console.error("Error abandoning grant:", err);
      error("Failed to abandon grant", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    abandonGrant: mutation.mutate,
    abandonGrantAsync: mutation.mutateAsync,
  };
}

export function useReclaimInactiveGrant() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (pid: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.reclaimInactiveGrant(pid);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      success("Inactive grant reclaimed", {
        description: "Leftover escrow returned to the pool.",
      });
    },
    onError: (err: any) => {
      console.error("Error reclaiming grant:", err);
      error("Failed to reclaim grant", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    reclaimInactiveGrant: mutation.mutate,
    reclaimInactiveGrantAsync: mutation.mutateAsync,
  };
}

export function useCancelExhaustedGrant() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (pid: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.cancelExhaustedGrant(pid);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      success("Grant cancelled", {
        description: "Attempts were exhausted. Escrow returned to the pool.",
      });
    },
    onError: (err: any) => {
      console.error("Error cancelling grant:", err);
      error("Failed to cancel grant", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    cancelExhaustedGrant: mutation.mutate,
    cancelExhaustedGrantAsync: mutation.mutateAsync,
  };
}

export function useWithdrawPool() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.withdrawPool(amount);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      success("Pool withdrawal sent", {
        description: "Unreserved funds were withdrawn.",
      });
    },
    onError: (err: any) => {
      console.error("Error withdrawing pool:", err);
      error("Failed to withdraw pool", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    withdrawPool: mutation.mutate,
    withdrawPoolAsync: mutation.mutateAsync,
  };
}

export function useSetCriteria() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newCriteria: string) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.setCriteria(newCriteria);
    },
    onSuccess: () => {
      invalidateGrantQueries(queryClient);
      success("Criteria updated", {
        description: "New proposals will be judged against the new rubric.",
      });
    },
    onError: (err: any) => {
      console.error("Error setting criteria:", err);
      error("Failed to set criteria", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    setCriteria: mutation.mutate,
    setCriteriaAsync: mutation.mutateAsync,
  };
}

export function useSetPaused() {
  const contract = useGrantKitContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (paused: boolean) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      return contract.setPaused(paused);
    },
    onSuccess: (_data, paused) => {
      invalidateGrantQueries(queryClient);
      success(paused ? "Contract paused" : "Contract unpaused");
    },
    onError: (err: any) => {
      console.error("Error setting paused:", err);
      error("Failed to update pause state", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    setPaused: mutation.mutate,
    setPausedAsync: mutation.mutateAsync,
  };
}