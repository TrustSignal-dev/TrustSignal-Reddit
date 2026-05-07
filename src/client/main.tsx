import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DashboardPayload, ModActionRecord, TrustSignalScanRecord } from '../shared/types.js';
import { REMOVAL_TEMPLATES, APPROVAL_TEMPLATES } from '../shared/types.js';
import './styles.css';

function ScoreBadge({ scan }: { scan: TrustSignalScanRecord }) {
  return (
    <span className={`badge ${scan.flagged ? 'badge-bad' : 'badge-good'}`}>
      {scan.flagged ? '⚑ Flagged' : '✓ Healthy'} · TS {scan.trustScore}
    </span>
  );
}

function ScoreBar({ score, threshold }: { score: number; threshold: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = score < threshold ? '#ef4444' : score < threshold + 15 ? '#f59e0b' : '#22c55e';
  return (
    <div className="score-bar-track" title={`Trust score: ${score} / threshold: ${threshold}`}>
      <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScanCard({ scan }: { scan: TrustSignalScanRecord }) {
  const [expanded, setExpanded] = useState(false);
  const displayReasons = expanded ? scan.reasons : scan.reasons.slice(0, 2);
  return (
    <article className="scan-card">
      <div className="scan-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="scan-title">
            <a href={scan.postPermalink} target="_blank" rel="noreferrer" className="scan-title-link">
              {scan.postTitle || `Post ${scan.postId}`}
            </a>
          </h3>
          <div className="muted scan-meta">
            u/{scan.authorName || 'unknown'} · {scan.scanSource.replace(/_/g, ' ')} · {new Date(scan.scannedAt).toLocaleString()}
          </div>
        </div>
        <ScoreBadge scan={scan} />
      </div>
      <ScoreBar score={scan.trustScore} threshold={scan.trustThreshold} />
      <ul className="reason-list">
        {displayReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {scan.reasons.length > 2 && (
        <button className="expand-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '▲ Show less' : `▼ ${scan.reasons.length - 2} more signal${scan.reasons.length - 2 > 1 ? 's' : ''}`}
        </button>
      )}
    </article>
  );
}

function TimelineItem({ action }: { action: ModActionRecord }) {
  const icon = action.actionType === 'approve' ? '✓' : action.actionType === 'remove' ? '⚑' : '⊙';
  return (
    <div className={`timeline-item timeline-${action.actionType}`}>
      <div className="timeline-header">
        <strong>{icon} {action.actionType.replace(/_/g, ' ')}</strong>
        <span className="muted">{new Date(action.performedAt).toLocaleString()}</span>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>
        u/{action.modName} · TS {action.trustScore} · {action.flagged ? 'was flagged' : 'was healthy'}
      </div>
      {action.reason && (
        <div style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
          <strong>Reason:</strong> {action.reason}
        </div>
      )}
      {action.note && (
        <div style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
          <strong>Note:</strong> {action.note}
        </div>
      )}
      {action.postPermalink && (
        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
          <a href={action.postPermalink} target="_blank" rel="noreferrer">{action.postPermalink}</a>
        </div>
      )}
    </div>
  );
}

function ActionLogger({ postId, onLogged }: { postId: string | null; onLogged: () => void }) {
  const [selectedAction, setSelectedAction] = useState<'approve' | 'remove' | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!postId) return null;

  const templates = selectedAction === 'approve' ? APPROVAL_TEMPLATES : REMOVAL_TEMPLATES;

  async function handleLogAction() {
    try {
      setLoading(true);
      const response = await fetch(`/api/post/${postId}/mod-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: selectedAction,
          reason: selectedReason,
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`log_failed:${response.status}`);
      }

      const data = await response.json();
      console.log('[TrustSignal] Action logged:', data.message);
      setSelectedAction(null);
      setSelectedReason('');
      setNote('');
      onLogged();
    } catch (err) {
      console.error('[TrustSignal] Log action failed:', err);
      alert(`Failed to log action: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <h2 className="section-title">Log moderator action</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`button ${selectedAction === 'approve' ? 'button-primary' : 'button-secondary'}`}
          onClick={() => {
            setSelectedAction('approve');
            setSelectedReason('');
          }}
          disabled={loading}
        >
          ✓ Approve
        </button>
        <button
          className={`button ${selectedAction === 'remove' ? 'button-primary' : 'button-secondary'}`}
          onClick={() => {
            setSelectedAction('remove');
            setSelectedReason('');
          }}
          disabled={loading}
        >
          ⚑ Remove
        </button>
      </div>

      {selectedAction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Select reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="">-- Choose a reason --</option>
              {Object.entries(templates).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Optional note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add additional context (optional)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                minHeight: '60px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="button button-primary"
              onClick={handleLogAction}
              disabled={loading || !selectedReason}
            >
              {loading ? 'Logging...' : 'Log action'}
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                setSelectedAction(null);
                setSelectedReason('');
                setNote('');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function App() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'healthy'>('all');

  async function loadDashboard() {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/init');
      if (!response.ok) {
        throw new Error(`init_failed:${response.status}`);
      }
      setPayload((await response.json()) as DashboardPayload);
    } catch (loadError) {
      console.error(loadError);
      setError('TrustSignal could not load the moderator dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return <div className="shell"><div className="panel"><div className="hero"><p className="subtitle">Loading TrustSignal dashboard…</p></div></div></div>;
  }

  if (!payload || error) {
    return <div className="shell"><div className="panel"><div className="hero"><p className="subtitle">{error ?? 'No dashboard data is available yet. Use "TrustSignal: Dashboard" from the subreddit menu to create this post, then scan a few posts.'}</p></div></div></div>;
  }

  const flagRate = payload.stats.totalScanned > 0
    ? Math.round((payload.stats.totalFlagged / payload.stats.totalScanned) * 100)
    : 0;

  const filteredScans = payload.recentScans.filter((s) => {
    if (filter === 'flagged') return s.flagged;
    if (filter === 'healthy') return !s.flagged;
    return true;
  });

  return (
    <div className="shell">
      <div className="panel">
        <section className="hero">
          <div className="hero-top">
            <div>
              <div className="eyebrow">TrustSignal · Devvit Web</div>
              <h1 className="title">r/{payload.subredditName || 'your-community'}</h1>
              <p className="subtitle">
                Moderation cockpit — live scan summaries, mod-action receipts, and settings. Use the post or subreddit menu to trigger scans.
              </p>
            </div>
            <div className="actions">
              <button className="button button-secondary" onClick={() => void loadDashboard()}>
                ↻ Refresh
              </button>
            </div>
          </div>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">Posts scanned</div>
              <div className="stat-value">{payload.stats.totalScanned}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Flag rate</div>
              <div className="stat-value stat-value-warn">{flagRate}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg score</div>
              <div className="stat-value">{payload.stats.averageScore}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Threshold</div>
              <div className="stat-value">{payload.settings.trustThreshold}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Approved</div>
              <div className="stat-value stat-value-good">{payload.stats.totalApproved}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Removed</div>
              <div className="stat-value stat-value-bad">{payload.stats.totalRemoved}</div>
            </div>
          </div>
        </section>

        <div className="content">
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Recent scans</h2>
              <div className="filter-tabs">
                {(['all', 'flagged', 'healthy'] as const).map((f) => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="scan-list">
              {filteredScans.length > 0
                ? filteredScans.map((scan) => <ScanCard key={`${scan.postId}:${scan.scannedAt}`} scan={scan} />)
                : <div className="empty">
                    {filter === 'all'
                      ? 'No scans yet. Use "TrustSignal: Scan post" from the post overflow menu.'
                      : `No ${filter} posts in the recent scan window.`}
                  </div>}
            </div>
          </section>

          <ActionLogger postId={payload.postId} onLogged={() => void loadDashboard()} />

          <section className="section">
            <h2 className="section-title">Installation settings</h2>
            <div className="settings-list">
              <div className="settings-item">
                <div className="setting-key">Auto-scan</div>
                <div className="setting-value">{payload.settings.autoScanEnabled ? '✓ Enabled' : '✗ Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Re-scan edits</div>
                <div className="setting-value">{payload.settings.rescanOnEdit ? '✓ Enabled' : '✗ Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Apply flair</div>
                <div className="setting-value">{payload.settings.applyPostFlair ? '✓ Enabled' : '✗ Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Flag threshold</div>
                <div className="setting-value">{payload.settings.trustThreshold} / 100</div>
              </div>
            </div>

            <h2 className="section-title" style={{ marginTop: 24 }}>Current posture</h2>
            <div className="settings-list">
              <div className="settings-item">
                <div className="setting-key">Latest scan</div>
                <div className="setting-value">
                  {payload.stats.lastScanAt ? new Date(payload.stats.lastScanAt).toLocaleString() : 'No scans yet'}
                </div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Dashboard mode</div>
                <div className="setting-value">Inline Devvit Web post</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Scoring engine</div>
                <div className="setting-value">local-heuristics-v3</div>
              </div>
            </div>
          </section>

          <section className="section" style={{ gridColumn: '1 / -1' }}>
            <h2 className="section-title">Moderator audit trail</h2>
            <div className="timeline">
              {payload.modActions.length > 0
                ? payload.modActions.map((action) => <TimelineItem key={action.actionId} action={action} />)
                : <div className="empty">No moderator actions logged yet. Use "TrustSignal: Log Approve" or "Log Remove" from the post menu after scanning.</div>}
            </div>
          </section>
        </div>

        <div className="footer">
          TrustSignal v0.2 · Devvit Web · client + server · no Blocks runtime · scoring engine local-heuristics-v3
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing root element');
}

createRoot(root).render(<App />);

