import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Thilan Hewage",
    template: "%s — Thilan Hewage",
  },
  description: "Personal site and research digest.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="app-shell">
          <Nav />
          <main className="main">{children}</main>
          <footer className="site-footer">
            <span>&copy; {new Date().getFullYear()} Thilan Hewage</span>
            <a href="/rss.xml">RSS</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
