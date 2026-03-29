"use client";

import { useEffect, useState } from "react";

interface AuditEntry {
  id: string;
  event_type: string;
  subject_hash: string;
  subreddit: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_entries() {
      try {
        const res = await fetch("/api/dashboard/audit");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries ?? []);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetch_entries();
  }, []);

  function exportCSV() {
    const headers = [
      "Event Type",
      "Subject Hash",
      "Subreddit",
      "Timestamp",
    ];
    const rows = entries.map((e) => [
      e.event_type,
      e.subject_hash,
      e.subreddit,
      e.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustsignal-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Event
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Hash
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Subreddit
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Verified
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-white">
                    {entry.event_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {entry.subject_hash.substring(0, 16)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    r/{entry.subreddit}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                      Verified
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
