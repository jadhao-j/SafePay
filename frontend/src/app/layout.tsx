import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafePay",
  description: "AI-powered secure payments platform"
};

const dmSans = localFont({
  src: [
    { path: "../../public/fonts/dm-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/dm-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/dm-sans-700.woff2", weight: "700", style: "normal" }
  ],
  variable: "--font-dm-sans",
  display: "swap"
});

const ibmPlexMono = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono-700.woff2", weight: "700", style: "normal" }
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

const spaceGrotesk = localFont({
  src: [
    { path: "../../public/fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/space-grotesk-700.woff2", weight: "700", style: "normal" }
  ],
  variable: "--font-space-grotesk",
  display: "swap"
});

const bebasNeue = localFont({
  src: [{ path: "../../public/fonts/bebas-neue-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-bebas-neue",
  display: "swap"
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable} ${bebasNeue.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}