import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABC DAO - Ship Code, Earn Rewards",
  description: "Stake $ABC, link GitHub, earn crypto for every commit. Built for Farcaster developers.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  openGraph: {
    title: "ABC DAO - Ship Code, Earn Rewards",
    description: "Stake $ABC, link GitHub, earn crypto for every commit. Built for Farcaster developers.",
    url: "https://abc.epicdylan.com",
    siteName: "ABC DAO",
    type: "website",
    images: [
      {
        url: "https://abc.epicdylan.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ABC DAO - Ship Code, Earn Rewards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ABC DAO - Ship Code, Earn Rewards",
    description: "Stake $ABC, link GitHub, earn crypto for every commit. Built for Farcaster developers.",
    images: ["https://abc.epicdylan.com/og-image.png"],
    creator: "@epicdylan",
    site: "@abc_dao",
  },
  other: {
    "fc:miniapp": JSON.stringify({
      frame: {
        name: "ABC_DAO",
        version: "1",
        iconUrl: "https://abc.epicdylan.com/abc-logo.png",
        homeUrl: "https://abc.epicdylan.com",
        imageUrl: "https://abc.epicdylan.com/image.png",
        buttonTitle: "Open",
        splashImageUrl: "https://abc.epicdylan.com/abc-splash-200.png",
        splashBackgroundColor: "#000000",
        webhookUrl: "https://abcdao-production.up.railway.app/api/webhooks/github",
        subtitle: "Always. Be. Coding.",
        description: "Ship code, earn rewards. Stake ABC, link GitHub, earn crypto for every commit.",
        primaryCategory: "social",
        tags: ["social", "dev", "community", "crypto", "dao"],
        tagline: "Always. Be. Coding.",
        heroImageUrl: "https://abc.epicdylan.com/abc-logo.png",
        screenshotUrls: ["https://abc.epicdylan.com/abc-icon-1024.png"],
        ogImageUrl: "https://abc.epicdylan.com/abc-logo.png",
        ogTitle: "Always. Be. Coding.",
        ogDescription: "Always. Be. Coding.",
        castShareUrl: "https://abc.epicdylan.com"
      }
    })
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
