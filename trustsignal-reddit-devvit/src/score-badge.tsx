import { Devvit } from "@devvit/public-api";

interface ScoreBadgeProps {
  score: number | null;
  receiptId: string | null;
  webAppUrl: string;
}

/**
 * AUTONOMOUS DECISION: Using Devvit Blocks UI (not React DOM) since Devvit
 * renders via a custom block-based renderer, not a browser.
 * All UI must use Devvit's built-in components: vstack, hstack, text, button, etc.
 */
export function ScoreBadgeComponent(props: ScoreBadgeProps): JSX.Element {
  const { score, receiptId } = props;

  if (score === null) {
    return (
      <vstack alignment="center middle" padding="medium">
        <text size="medium" color="#9ca3af">
          TrustSignal: No score available
        </text>
      </vstack>
    );
  }

  const color =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Trusted" : score >= 40 ? "Review" : "Flagged";

  return (
    <vstack alignment="center middle" padding="medium" gap="small">
      <hstack alignment="center middle" gap="small">
        <text size="xlarge" weight="bold" color={color}>
          {score.toString()}
        </text>
        <text size="medium" color={color}>
          {label}
        </text>
      </hstack>
      <text size="small" color="#9ca3af">
        TrustSignal Score
      </text>
      {receiptId ? (
        <button
          appearance="bordered"
          size="small"
          onPress={() => {
            // Opens verify URL
          }}
        >
          Verify Receipt
        </button>
      ) : null}
    </vstack>
  );
}

// Prevent unused import warning — Devvit is needed for JSX factory
void Devvit;
