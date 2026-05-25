import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Somnia Forms",
  description: "Monospace-enforced, Inception-themed forms builder and submission engine",
};

import NextTopLoader from "nextjs-toploader";
import { PageTransition } from "~/components/PageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased font-sans bg-background text-foreground`}>
        <NextTopLoader color="#C9933A" height={1} showSpinner={false} shadow={false} />
        <GlobalProviders>
          <PageTransition>{children}</PageTransition>
        </GlobalProviders>
      </body>
    </html>
  );
}
