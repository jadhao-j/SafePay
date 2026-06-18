import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400"
});

const uiFont = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

export const metadata: Metadata = {
  title: "SafePay",
  description: "AI-powered secure payments platform"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`}>{children}</body>
    </html>
  );
}
