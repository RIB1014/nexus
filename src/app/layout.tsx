import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Opt-in font families exposed via the Appearance > Font setting.
const rounded = Nunito({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit",
  description:
    "A modular productivity platform — build up exactly the tools you need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${rounded.variable} ${serif.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
