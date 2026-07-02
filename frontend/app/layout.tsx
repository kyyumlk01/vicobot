import type { Metadata } from "next";
import { Space_Grotesk, Inter, Space_Mono } from "next/font/google";
import { ThemeProvider } from "./ThemeContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Vicobot — Know what to film before you film it",
  description: "AI Topic Radar for YouTube Creators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${spaceMono.variable}`}>
        <ThemeProvider>
          <div className="bg-blobs">
            <div className="blob blob1"></div>
            <div className="blob blob2"></div>
            <div className="blob blob3"></div>
          </div>
          <div className="page">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}