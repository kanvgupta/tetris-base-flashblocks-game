import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlashCatch - Experience 10x Faster Flashblocks on Base Sepolia",
  description: "An interactive game that visualizes the speed difference between traditional 2-second blocks and 200-millisecond Flashblocks on Base Sepolia.",
  keywords: "Base, Flashblocks, blockchain, game, ETHDenver, Base Sepolia, Web3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
