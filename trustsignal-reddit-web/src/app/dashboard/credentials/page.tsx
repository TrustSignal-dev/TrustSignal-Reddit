"use client";

import { useEffect, useState } from "react";

interface CredentialRow {
  id: string;
  issued_to_reddit_username: string;
  credential_type: string;
  issuer: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    type: "expert",
    expiresInDays: "365",
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      const res = await fetch("/api/dashboard/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials ?? []);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.username,
        credential_type: formData.type,
        expires_in_days: parseInt(formData.expiresInDays),
      }),
    });
    if (res.ok) {
      setShowIssueForm(false);
      setFormData({ username: "", type: "expert", expiresInDays: "365" });
      fetchCredentials();
    }
  }

  async function handleRevoke(id: string) {
    await fetch("/api/dashboard/credentials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, revoked: true }),
    });
    fetchCredentials();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Credentials</h1>
        <button
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Issue Verification Link
        </button>
      </div>

      {showIssueForm && (
        <form
          onSubmit={handleIssue}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Reddit Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="u/username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Credential Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="expert">Expert</option>
              <option value="verified_professional">Verified Professional</option>
              <option value="trusted_contributor">Trusted Contributor</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Expires In (days)
            </label>
            <input
              type="number"
              value={formData.expiresInDays}
              onChange={(e) =>
                setFormData({ ...formData, expiresInDays: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              min="1"
              max="3650"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Issue Credential
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Expires
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-white">
                    u/{cred.issued_to_reddit_username}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 capitalize">
                    {cred.credential_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(cred.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cred.revoked
                          ? "bg-red-900/50 text-red-400"
                          : "bg-green-900/50 text-green-400"
                      }`}
                    >
                      {cred.revoked ? "Revoked" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!cred.revoked && (
                      <button
                        onClick={() => handleRevoke(cred.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No credentials issued yet.
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
