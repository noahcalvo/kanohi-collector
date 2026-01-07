import "./globals.css";
import type { Metadata } from "next";
import { BottomNav } from "./components/BottomNav";

export const metadata: Metadata = {
  title: "Kanohi Collector",
  description: "Mask collection MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 text-slate-900 min-h-screen flex flex-col">
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 pb-28">{children}</main>

        <div className="fixed inset-x-0 bottom-0 z-[150]">
          <div className="max-w-5xl mx-auto w-full px-6 pb-6">
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
