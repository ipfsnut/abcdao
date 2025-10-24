import type { Metadata } from "next";
import { generatePageMetadata } from '@/lib/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: "Staking",
  description: "Stake $ABC tokens to earn ETH rewards and unlock commit-based developer rewards in ABC DAO.",
  path: "/staking"
});

export default function StakingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}