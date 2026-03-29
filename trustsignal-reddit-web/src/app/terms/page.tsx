import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-4">Last updated: March 29, 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-300 mb-4">
          By accessing or using TrustSignal (&quot;the Service&quot;), including our web application
          and Reddit Devvit app, you agree to be bound by these Terms of Service. If you
          do not agree, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p className="text-gray-300 mb-4">
          TrustSignal provides AI-powered content scoring, cryptographic verification,
          and credential management for Reddit communities. The Service includes a web
          dashboard and a Devvit app that integrates with Reddit.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p className="text-gray-300 mb-4">
          You must have a valid Reddit account to use TrustSignal. You are responsible
          for maintaining the security of your account and API keys. You agree not to
          share your API keys with unauthorized parties.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Subscriptions and Billing</h2>
        <p className="text-gray-300 mb-4">
          TrustSignal offers Free, Pro ($29/mo), and Team ($99/mo) tiers. Paid
          subscriptions are billed monthly through Stripe. You may cancel at any time.
          Refunds are handled on a case-by-case basis.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Acceptable Use</h2>
        <p className="text-gray-300 mb-4">
          You agree not to: (a) use the Service to harass, abuse, or harm others;
          (b) attempt to reverse-engineer the AI scoring system; (c) use the Service
          to generate false or misleading verification receipts; (d) violate Reddit&apos;s
          Terms of Service or Content Policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. AI Scoring Disclaimer</h2>
        <p className="text-gray-300 mb-4">
          AI content scores are advisory and not definitive. TrustSignal does not
          guarantee the accuracy of scores. Moderation decisions should not be based
          solely on AI scores.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Data and Privacy</h2>
        <p className="text-gray-300 mb-4">
          Your use of data is also governed by our{" "}
          <Link href="/privacy" className="text-orange-400 hover:underline">
            Privacy Policy
          </Link>
          . By using the Service, you consent to the collection and use of data as
          described therein.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p className="text-gray-300 mb-4">
          TrustSignal is provided &quot;as is&quot; without warranties of any kind. We are not
          liable for any damages arising from your use of the Service, including but
          not limited to lost data, lost profits, or service interruptions.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Termination</h2>
        <p className="text-gray-300 mb-4">
          We reserve the right to suspend or terminate your access to the Service at
          any time for violation of these terms or for any other reason at our discretion.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
        <p className="text-gray-300 mb-4">
          We may update these terms from time to time. Continued use of the Service
          after changes constitutes acceptance of the updated terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact</h2>
        <p className="text-gray-300 mb-4">
          For questions about these terms, contact us at support@trustsignal.dev.
        </p>
      </main>
    </div>
  );
}
