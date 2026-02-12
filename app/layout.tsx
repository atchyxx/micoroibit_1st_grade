import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "IT Passport Priority Trainer",
  description: "Learn high-frequency IT Passport topics in smart order.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#003049",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <main className="app-shell">{children}</main>
        <NavBar />
      </body>
    </html>
  );
}
