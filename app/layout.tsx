import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SanityLive } from "@/sanity/lib/live";
import { getLeaderboardData } from "@/sanity/lib/data";
import "./globals.css";

// One family for headings and body alike. The paired display/text setup this
// replaced added a seam at every card — a single geometric sans across ranks,
// names, amounts and metadata is what makes the board read as one surface.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${outfit.variable} h-full antialiased`}
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
