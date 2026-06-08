"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { abi, CONTRACT_ADDRESS } from "@/lib/contract";
interface Proposal {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  status: "open" | "closed";
  contractProposalId: number;
  yesCount: string;
  noCount: string;
}

export default function VoterPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fetchingProposals, setFetchingProposals] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [votedProposals, setVotedProposals] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [voteMsg, setVoteMsg] = useState<Record<string, string>>({});

  const fetchProposals = useCallback(async () => {
    setFetchingProposals(true);
    try {
      const res = await fetch("/api/proposals");
      const data = await res.json();
      if (res.ok) setProposals(data.proposals);
      else setError(data.error);
    } catch {
      setError("Failed to fetch proposals");
    } finally {
      setFetchingProposals(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "voter")) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchProposals();
  }, [user, loading, router, fetchProposals]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask is not installed");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const voted = new Set<string>();
      for (const p of proposals) {
        const hasVoted = await contract.hasVoted(p.contractProposalId, address);
        if (hasVoted) voted.add(p._id);
      }
      setVotedProposals(voted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleVote = async (proposal: Proposal, vote: boolean) => {
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }
    setVotingId(proposal._id);
    setVoteMsg((prev) => ({ ...prev, [proposal._id]: "" }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.castVote(proposal.contractProposalId, vote);
      await tx.wait();

      const res = await fetch(`/api/proposals/${proposal._id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote,
          walletAddress,
          txHash: tx.hash,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVotedProposals((prev) => new Set([...prev, proposal._id]));
      setVoteMsg((prev) => ({
        ...prev,
        [proposal._id]: "Vote cast successfully",
      }));
      fetchProposals();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cast vote";
      if (msg.includes("Already voted")) {
        setVoteMsg((prev) => ({
          ...prev,
          [proposal._id]: "You have already voted on this proposal",
        }));
        setVotedProposals((prev) => new Set([...prev, proposal._id]));
      } else {
        setVoteMsg((prev) => ({ ...prev, [proposal._id]: msg }));
      }
    } finally {
      setVotingId(null);
    }
  };

const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted || loading) return <div className="p-8">Loading...</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Voter Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
          <button
            onClick={() => router.push("/results")}
            className="text-sm text-blue-600 hover:underline"
          >
            Results
          </button>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
          {walletAddress ? (
            <div>
              <p className="text-sm text-gray-500">Connected Wallet</p>
              <p className="text-sm font-mono text-gray-800">{walletAddress}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No wallet connected</p>
          )}
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            {walletAddress ? "Reconnect Wallet" : "Connect Wallet"}
          </button>
        </div>

        <h2 className="text-lg font-semibold text-gray-800">Open Proposals</h2>

        {fetchingProposals ? (
          <p className="text-sm text-gray-500">Loading proposals...</p>
        ) : proposals.filter((p) => p.status === "open").length === 0 ? (
          <p className="text-sm text-gray-500">No open proposals</p>
        ) : (
          <div className="space-y-4">
            {proposals
              .filter((p) => p.status === "open")
              .map((p) => {
                const hasVoted = votedProposals.has(p._id);
                const isVoting = votingId === p._id;
                const isPastDeadline = new Date() > new Date(p.deadline);
                const disabled =
                  hasVoted || isVoting || isPastDeadline || !walletAddress;

                return (
                  <div
                    key={p._id}
                    className="bg-white border border-gray-200 rounded-lg p-5"
                  >
                    <h3 className="font-semibold text-gray-800">{p.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Deadline: {new Date(p.deadline).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Yes: {p.yesCount} | No: {p.noCount}
                    </p>

                    {hasVoted && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        You have voted on this proposal
                      </p>
                    )}

                    {!walletAddress && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Connect your wallet to vote
                      </p>
                    )}

                    {isPastDeadline && (
                      <p className="text-xs text-red-500 mt-2">
                        Deadline has passed
                      </p>
                    )}

                    {voteMsg[p._id] && (
                      <p
                        className={`text-xs mt-2 ${
                          voteMsg[p._id].includes("success")
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {voteMsg[p._id]}
                      </p>
                    )}

                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleVote(p, true)}
                        disabled={disabled}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isVoting ? "Voting..." : "Yes"}
                      </button>
                      <button
                        onClick={() => handleVote(p, false)}
                        disabled={disabled}
                        className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isVoting ? "Voting..." : "No"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}