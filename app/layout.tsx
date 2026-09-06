import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SanityLive } from "@/sanity/lib/live";
import { getLeaderboardData } from "@/sanity/lib/data";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "OutBid for Good",
  description: "A donation leaderboard where every contribution can outbid the current top.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { entries } = await getLeaderboardData();
  const totalRaised = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream">
        <Providers>
          <Nav stats={{ totalRaised, donorCount: entries.length }} />
          {children}
          <Footer />
        </Providers>
        <SanityLive />
      </body>
    </html>
  );
}
