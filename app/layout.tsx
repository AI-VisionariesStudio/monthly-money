import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monthly Money",
  description: "Personal expense tracker",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`} style={{ background: "#ffffff", color: "#0f172a" }}>

        <header style={{ background: "linear-gradient(135deg, #0d2b4e 0%, #1a4a8a 100%)" }}
          className="sticky top-0 z-50 shadow-lg">
          <div className="max-w-screen-2xl mx-auto px-6 py-0 flex items-center justify-between h-14">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                $
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                19028 Stone Brook
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/dashboard"
                className="font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.75)" }}>
                Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-16 py-5 text-center text-xs border-t"
          style={{ background: "#fff", borderColor: "#e2e8f0", color: "#94a3b8" }}>
          Monthly Money — Personal Expense Tracker
        </footer>
      </body>
    </html>
  );
}
