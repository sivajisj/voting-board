"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Proposal {
  _id: string;
  title: string;
  status: "open" | "closed";
  yesCount: string;
  noCount: string;
  deadline: string;
}

const COLORS = ["#22c55e", "#ef4444"];

export default function ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fetchingProposals, setFetchingProposals] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

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
    if (!loading && !user) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchProposals();
  }, [user, loading, router, fetchProposals]);

  const filtered = proposals.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const handleExportCSV = () => {
    const rows = [
      ["Title", "Status", "Yes Votes", "No Votes", "Deadline"],
      ...proposals.map((p) => [
        p.title,
        p.status,
        p.yesCount,
        p.noCount,
        new Date(p.deadline).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voting-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Results</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline"
          >
            Back
          </button>
          <button
            onClick={handleExportCSV}
            className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900"
          >
            Export CSV
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {(["all", "open", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded-full text-sm font-medium border ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {fetchingProposals ? (
          <p className="text-sm text-gray-500">Loading results...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No proposals found</p>
        ) : (
          <div className="space-y-8">
            {filtered.map((p) => {
              const yes = Number(p.yesCount);
              const no = Number(p.noCount);
              const total = yes + no;

              const barData = [{ name: p.title.slice(0, 30), Yes: yes, No: no }];
              const pieData = [
                { name: "Yes", value: yes },
                { name: "No", value: no },
              ];

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-semibold text-gray-800">{p.title}</h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {new Date(p.deadline).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        p.status === "open"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Total votes: {total} | Yes: {yes} | No: {no}
                  </p>

                  {total === 0 ? (
                    <p className="text-sm text-gray-400">No votes cast yet</p>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Bar Chart
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Yes" fill="#22c55e" />
                            <Bar dataKey="No" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Pie Chart
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              dataKey="value"
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {pieData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}