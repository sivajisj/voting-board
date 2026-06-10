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

export default function AdminPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fetchingProposals, setFetchingProposals] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [voterWallet, setVoterWallet] = useState("");
  const [registeringVoter, setRegisteringVoter] = useState(false);
  const [voterMsg, setVoterMsg] = useState("");

  const [closingId, setClosingId] = useState<string | null>(null);

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
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchProposals();
  }, [user, loading, router, fetchProposals]);

  const getSigner = async () => {
    if (!window.ethereum) throw new Error("No wallet found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  };

  const handleCreateProposal = async () => {
    setCreateMsg("");
    setError("");
    if (!title || !description || !deadline) {
      setCreateMsg("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const tx = await contract.createProposal(title, description, deadlineTimestamp);
      const receipt = await tx.wait();

      let contractProposalId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed?.name === "ProposalCreated") {
            contractProposalId = Number(parsed.args.id);
            break;
          }
        } catch { /* not this event */ }
      }
      if (contractProposalId === undefined) throw new Error("Could not read proposal ID from contract");

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, deadline, contractProposalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCreateMsg("Proposal created successfully");
      setTitle("");
      setDescription("");
      setDeadline("");
      fetchProposals();
    } catch (err) {
      setCreateMsg(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterVoter = async () => {
    setVoterMsg("");
    if (!voterWallet) {
      setVoterMsg("Wallet address is required");
      return;
    }
    setRegisteringVoter(true);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.registerVoter(voterWallet);
      await tx.wait();

      const res = await fetch("/api/voters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: voterWallet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVoterMsg("Voter registered successfully on-chain");
      setVoterWallet("");
    } catch (err) {
      setVoterMsg(err instanceof Error ? err.message : "Failed to register voter");
    } finally {
      setRegisteringVoter(false);
    }
  };

  const handleCloseProposal = async (proposal: Proposal) => {
    setClosingId(proposal._id);
    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.closeProposal(proposal.contractProposalId);
      await tx.wait();

      const res = await fetch(`/api/proposals/${proposal._id}/close`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close proposal");
    } finally {
      setClosingId(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
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

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Proposal</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Proposal description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {createMsg && (
              <p className={`text-sm ${createMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {createMsg}
              </p>
            )}
            <button
              onClick={handleCreateProposal}
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Register Voter Wallet</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="0x..."
              value={voterWallet}
              onChange={(e) => setVoterWallet(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleRegisterVoter}
              disabled={registeringVoter}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {registeringVoter ? "Registering..." : "Register"}
            </button>
          </div>
          {voterMsg && (
            <p className={`text-sm mt-2 ${voterMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {voterMsg}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Proposals</h2>
          {fetchingProposals ? (
            <p className="text-sm text-gray-500">Loading proposals...</p>
          ) : proposals.length === 0 ? (
            <p className="text-sm text-gray-500">No proposals yet</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((p) => (
                <div key={p._id} className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{p.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {new Date(p.deadline).toLocaleString()}
                      </p>
                      <p className="text-xs mt-1">
                        Yes: {p.yesCount} | No: {p.noCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                      {p.status === "open" && (
                        <button
                          onClick={() => handleCloseProposal(p)}
                          disabled={closingId === p._id}
                          className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          {closingId === p._id ? "Closing..." : "Close"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}