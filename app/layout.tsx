import type { Metadata } from "next";
import "./globals.css";
import { SocketProvider } from "./providers/SocketProvider";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Chain Reaction",
  description: "Play chain reaction game with friends",
  applicationName: "Chain Reaction",
  authors: [{ name: "demosthenix" }],
  keywords: ["game", "chain reaction", "multiplayer", "strategy"],
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chain Reaction",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      {
        url: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#1a1a2e",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Chain Reaction",
    title: "Chain Reaction",
    description: "Play chain reaction game with friends",
    images: [
      {
        url: "/favicon-96x96.png",
        width: 1200,
        height: 630,
        alt: "Chain Reaction Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chain Reaction",
    description: "Play chain reaction game with friends",
    images: ["/favicon-96x96.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
