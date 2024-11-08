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
  title: "Chain Reaction(beta)",
  description: "Web Version of the Chain Reaction Game",
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
