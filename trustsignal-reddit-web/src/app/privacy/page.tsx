import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            TrustSignal
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 prose prose-invert">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-4">Last updated: March 29, 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-gray-300 mb-4">
          When you use TrustSignal, we collect:
        </p>
        <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
          <li>
            <strong>Reddit account information:</strong> Your Reddit username and
            public profile data provided through OAuth authentication.
          </li>
          <li>
            <strong>Post content:</strong> Reddit post titles, body text, author names,
            and subreddit information submitted through the Devvit app for AI scoring.
          </li>
          <li>
            <strong>Moderation actions:</strong> Mod action events submitted for
            audit logging and tamper-evident records.
          </li>
          <li>
            <strong>Payment information:</strong> Billing data processed securely
            through Stripe. We do not store credit card numbers.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-300 mb-4">
          We use collected data to:
        </p>
        <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
          <li>Generate AI content authenticity scores for Reddit posts.</li>
          <li>Create cryptographically signed receipts for verification.</li>
          <li>Maintain tamper-evident audit logs of moderation actions.</li>
          <li>Issue and manage verified expert credentials.</li>
          <li>Process subscription payments and manage your account.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. AI Processing</h2>
        <p className="text-gray-300 mb-4">
          Post content is sent to Anthropic&apos;s Claude API for AI scoring. This
          processing is performed in real-time and scores are stored alongside
          cryptographic receipts. Anthropic&apos;s data usage policies apply to content
          processed through their API.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Storage and Security</h2>
        <p className="text-gray-300 mb-4">
          Data is stored in Supabase with row-level security (RLS) enabled on all
          tables. Cryptographic receipts use HMAC-SHA256 signing to ensure data
          integrity. All data is transmitted over HTTPS.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Sharing</h2>
        <p className="text-gray-300 mb-4">
          We do not sell your data. We share data only with:
        </p>
        <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
          <li>
            <strong>Anthropic:</strong> Post content for AI scoring.
          </li>
          <li>
            <strong>Stripe:</strong> Payment processing.
          </li>
          <li>
            <strong>Supabase:</strong> Database hosting.
          </li>
          <li>
            <strong>Vercel:</strong> Application hosting.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Public Verification</h2>
        <p className="text-gray-300 mb-4">
          Cryptographic receipts and verification results are publicly accessible
          by design. Anyone with a receipt ID can verify the integrity of a scored
          post. This is a core feature of the platform, not a data leak.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Data Retention</h2>
        <p className="text-gray-300 mb-4">
          Receipts and audit logs are retained indefinitely as they serve as
          immutable records. Account data is deleted upon request. Cached AI scores
          are retained for the lifetime of the associated receipt.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Your Rights</h2>
        <p className="text-gray-300 mb-4">
          You may request access to, correction of, or deletion of your personal
          data by contacting us. Note that cryptographic receipts cannot be deleted
          as they are immutable by design.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Cookies</h2>
        <p className="text-gray-300 mb-4">
          We use essential cookies for authentication session management. We do not
          use tracking or advertising cookies.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
        <p className="text-gray-300 mb-4">
          We may update this policy from time to time. We will notify users of
          material changes through the dashboard.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact</h2>
        <p className="text-gray-300 mb-4">
          For privacy questions, contact us at privacy@trustsignal.dev.
        </p>
      </main>
    </div>
  );
}
