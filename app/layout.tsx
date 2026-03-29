import type { Metadata } from "next";
import { Geist_Mono, Manrope, Playfair_Display } from "next/font/google";
import HistoryNav from "@/app/ui/history-nav";
import "./globals.css";

const bodySans = Manrope({
  variable: "--font-body-sans",
  subsets: ["latin"],
});

const displaySerif = Playfair_Display({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Journal Day",
    template: "%s | Journal Day",
  },
  description:
    "A calm, warm journal space for writing, reflecting, and keeping gentle notes from your day.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodySans.variable} ${displaySerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <HistoryNav />
      </body>
    </html>
  );
}
