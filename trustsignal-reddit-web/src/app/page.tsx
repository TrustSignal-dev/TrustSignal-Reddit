import Link from "next/link";

const features = [
  {
    title: "AI Content Scoring",
    description:
      "Every post analyzed for authenticity, manipulation signals, and quality. Scores update in real-time via your Devvit integration.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    title: "Verified Expert Credentials",
    description:
      "Issue tamper-proof credentials to trusted community members. Cryptographically signed and publicly verifiable.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Tamper-Evident Mod Logs",
    description:
      "Every moderation action is hashed, signed, and logged immutably. Full audit trail with cryptographic receipts.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Basic AI scoring", "Public verification", "1 subreddit"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Full AI scoring",
      "3 subreddits",
      "Credential issuance",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/month",
    features: [
      "Unlimited subreddits",
      "Priority scoring",
      "CSV export",
      "API access",
      "Team management",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">TrustSignal</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <Link
              href="/auth/login"
              className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Know what&apos;s real
          <br />
          <span className="text-orange-500">on Reddit</span>
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
          AI-powered content scoring, verified expert credentials, and
          tamper-evident moderation logs. Built for communities that demand
          trust.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-lg transition-colors"
          >
            Connect your subreddit
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold text-lg transition-colors"
          >
            Learn more
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">
          Trust infrastructure for Reddit
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-8"
            >
              <div className="text-orange-500 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">
          Simple, transparent pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-8 ${
                tier.highlighted
                  ? "bg-orange-600/10 border-2 border-orange-600"
                  : "bg-gray-900 border border-gray-800"
              }`}
            >
              <h3 className="text-xl font-semibold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login"
                className={`mt-8 block text-center py-3 rounded-lg font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TrustSignal. Cryptographic
          verification for Reddit communities.
        </div>
      </footer>
    </div>
  );
}
