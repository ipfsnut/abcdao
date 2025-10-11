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
  openGraph: {
    title: "ABC DAO - Ship Code, Earn Rewards",
    description: "Stake $ABC, link GitHub, earn crypto for every commit. Built for Farcaster developers.",
    images: [
      {
        url: "https://abc.epicdylan.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ABC DAO - Ship Code, Earn Rewards",
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      name: "ABC DAO",
      iconUrl: "https://abc.epicdylan.com/icon.png",
      homeUrl: "https://abc.epicdylan.com/",
      imageUrl: "https://abc.epicdylan.com/og-image.png",
      description: "Ship code, earn rewards. Stake $ABC, link GitHub, earn crypto for every commit.",
      buttonTitle: "Start Earning"
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
