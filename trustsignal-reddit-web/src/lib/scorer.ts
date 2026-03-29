import Anthropic from "@anthropic-ai/sdk";

// AUTONOMOUS DECISION: Using Claude claude-sonnet-4-5-20250514 for scoring to balance cost/quality.
// Production users on Team tier could be upgraded to Opus.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ScoreResult {
  score: number; // 0-100, higher = more trustworthy
  signals: {
    category: string;
    label: string;
    value: number;
  }[];
  summary: string;
}

const SCORING_PROMPT = `You are a content authenticity scorer for Reddit posts. Analyze the post and return a JSON object with:
- score: 0-100 integer (100 = highly trustworthy, 0 = likely manipulated/AI-generated)
- signals: array of {category, label, value} where category is one of "authenticity", "quality", "credibility" and value is 0-100
- summary: one-sentence explanation

Signals to evaluate:
- authenticity/ai_generated: likelihood content is AI-generated (100 = definitely human)
- authenticity/manipulation: likelihood of coordinated manipulation (100 = organic)
- quality/substance: depth and substance of content (100 = very substantive)
- credibility/source_consistency: consistency with author's history (100 = very consistent)

Return ONLY valid JSON, no markdown fences.`;

export async function scorePost(post: {
  title: string;
  body: string;
  author: string;
  subreddit: string;
}): Promise<ScoreResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `${SCORING_PROMPT}\n\nPost title: ${post.title}\nSubreddit: r/${post.subreddit}\nAuthor: u/${post.author}\nBody:\n${post.body}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  try {
    return JSON.parse(text) as ScoreResult;
  } catch {
    // AUTONOMOUS DECISION: Return a neutral score if Claude's response can't be parsed
    return {
      score: 50,
      signals: [
        { category: "authenticity", label: "ai_generated", value: 50 },
        { category: "authenticity", label: "manipulation", value: 50 },
        { category: "quality", label: "substance", value: 50 },
        { category: "credibility", label: "source_consistency", value: 50 },
      ],
      summary: "Unable to fully analyze this post. Neutral score assigned.",
    };
  }
}
