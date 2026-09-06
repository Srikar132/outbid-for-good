import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { Providers } from "./providers";
import { SanityLive } from "@/sanity/lib/live";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SanityLive />
      </body>
    </html>
  );
}
