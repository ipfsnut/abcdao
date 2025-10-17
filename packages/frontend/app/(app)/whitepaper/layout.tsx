import type { Metadata } from "next";
import { generatePageMetadata } from '@/lib/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: "Whitepaper",
  description: "ABC DAO Whitepaper - Complete technical specification for the Always Be Coding developer rewards protocol.",
  path: "/whitepaper"
});

export default function WhitepaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}