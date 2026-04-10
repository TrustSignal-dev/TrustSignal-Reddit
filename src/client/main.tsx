import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DashboardPayload, ModActionRecord, TrustSignalScanRecord } from '../shared/types.js';
import './styles.css';

function ScoreBadge({ scan }: { scan: TrustSignalScanRecord }) {
  return (
    <span className={`badge ${scan.flagged ? 'badge-bad' : 'badge-good'}`}>
      {scan.flagged ? 'Flagged' : 'Healthy'} · TS {scan.trustScore}
    </span>
  );
}

function ScanCard({ scan }: { scan: TrustSignalScanRecord }) {
  return (
    <article className="scan-card">
      <div className="scan-header">
        <div>
          <h3 className="scan-title">{scan.authorName || 'Unknown author'}</h3>
          <div className="muted">
            {scan.scanSource.replace('_', ' ')} · {new Date(scan.scannedAt).toLocaleString()}
          </div>
        </div>
        <ScoreBadge scan={scan} />
      </div>
      <div className="muted" style={{ marginTop: 10 }}>
        <a href={scan.postPermalink} target="_blank" rel="noreferrer">
          {scan.postPermalink || `Post ${scan.postId}`}
        </a>
      </div>
      <ul className="reason-list">
        {scan.reasons.slice(0, 2).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </article>
  );
}

function TimelineItem({ action }: { action: ModActionRecord }) {
  return (
    <div className="timeline-item">
      <div className="timeline-header">
        <strong>{action.actionType.replace('_', ' ')}</strong>
        <span className="muted">{new Date(action.performedAt).toLocaleString()}</span>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>
        u/{action.modName} · TS {action.trustScore} · {action.flagged ? 'flagged' : 'healthy'}
      </div>
    </div>
  );
}

function App() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <div className="shell"><div className="panel"><div className="hero"><p className="subtitle">Loading TrustSignal dashboard...</p></div></div></div>;
  }

  if (!payload || error) {
    return <div className="shell"><div className="panel"><div className="hero"><p className="subtitle">{error ?? 'No dashboard data is available yet.'}</p></div></div></div>;
  }

  const flagRate = payload.stats.totalScanned > 0
    ? Math.round((payload.stats.totalFlagged / payload.stats.totalScanned) * 100)
    : 0;

  return (
    <div className="shell">
      <div className="panel">
        <section className="hero">
          <div className="hero-top">
            <div>
              <div className="eyebrow">TrustSignal Devvit Web</div>
              <h1 className="title">r/{payload.subredditName || 'your-community'} moderation cockpit</h1>
              <p className="subtitle">
                Live scan summaries, mod-action receipts, and installation settings now live inside the Reddit app.
              </p>
            </div>
            <div className="actions">
              <button className="button button-secondary" onClick={() => void loadDashboard()}>
                Refresh
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
              <div className="stat-value">{flagRate}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average score</div>
              <div className="stat-value">{payload.stats.averageScore}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Threshold</div>
              <div className="stat-value">{payload.settings.trustThreshold}</div>
            </div>
          </div>
        </section>

        <div className="content">
          <section className="section">
            <h2 className="section-title">Recent scans</h2>
            <div className="scan-list">
              {payload.recentScans.length > 0
                ? payload.recentScans.map((scan) => <ScanCard key={`${scan.postId}:${scan.scannedAt}`} scan={scan} />)
                : <div className="empty">No scans yet. Use the post menu action to seed the first results.</div>}
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Installation settings</h2>
            <div className="settings-list">
              <div className="settings-item">
                <div className="setting-key">Auto-scan</div>
                <div className="setting-value">{payload.settings.autoScanEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Re-scan edits</div>
                <div className="setting-value">{payload.settings.rescanOnEdit ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Apply flair</div>
                <div className="setting-value">{payload.settings.applyPostFlair ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div className="settings-item">
                <div className="setting-key">Flag threshold</div>
                <div className="setting-value">{payload.settings.trustThreshold}</div>
              </div>
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Moderator audit trail</h2>
            <div className="timeline">
              {payload.modActions.length > 0
                ? payload.modActions.map((action) => <TimelineItem key={action.actionId} action={action} />)
                : <div className="empty">No moderator actions logged yet.</div>}
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Current posture</h2>
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
                <div className="setting-key">Architecture</div>
                <div className="setting-value">Devvit Web · client + server · no Blocks runtime</div>
              </div>
            </div>
          </section>
        </div>

        <div className="footer">
          TrustSignal now runs as a single Devvit Web app. Legacy Blocks, `@devvit/public-api`, `devvit.yaml`, and the separate Next dashboard are removed from the shipped path.
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
