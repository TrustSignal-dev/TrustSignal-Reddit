import type { Metadata } from "next";
import "./globals.css";

// AUTONOMOUS DECISION: Using system font stack instead of Google Fonts (Inter)
// to avoid build failures in environments without network access.
// Inter can be re-enabled in production by switching to next/font/google.

export const metadata: Metadata = {
  title: "TrustSignal - Know what's real on Reddit",
  description:
    "AI-powered content scoring, verified expert credentials, and tamper-evident moderation logs for Reddit communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
