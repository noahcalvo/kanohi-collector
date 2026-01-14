import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { BottomNav } from "./components/BottomNav";

const voyanui = localFont({
  src: "../public/fonts/voya-nui.ttf",
  variable: "--font-voya-nui",
});

export const metadata: Metadata = {
  title: "Kanohi Collector",
  description: "Mask collection MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={voyanui.variable}>
      <body className="antialiased bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 text-slate-900 min-h-screen flex flex-col font-sans">
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 pb-32">
          {children}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-[150]">
          <div className="w-full px-4 pb-6">
            <div className="max-w-5xl mx-auto">
              <BottomNav />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
