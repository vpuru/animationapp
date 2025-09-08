import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import TrackingProvider from "@/components/TrackingProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Animate My World",
  description:
    "Transform your photos into stunning animations with our professional AI-powered animation studio.",
  icons: {
    icon: "/mocha-light.svg",
    apple: "/mocha-light.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TrackingProvider>{children}</TrackingProvider>
        <Analytics debug={process.env.NODE_ENV === "development"} />
        <SpeedInsights debug={process.env.NODE_ENV === "development"} />
      </body>
    </html>
  );
}
