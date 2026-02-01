import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { BottomNav } from "./components/BottomNav";

const voyanui = localFont({
  src: "../public/fonts/voya-nui.ttf",
  variable: "--font-voya-nui",
});

export const metadata: Metadata = {
  title: "Kanohi Collector",
  description: "Bionicle Mask Collecting Game",
  applicationName: "Kanohi Collector",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kanohi Collector",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasClerkKeys =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

  const content = (
    <html
      lang="en"
      className={`${voyanui.variable} bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 bg-fixed`}
    >
      <body className="antialiased bg-transparent text-slate-900 min-h-screen flex flex-col font-sans relative isolate">
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 pointer-events-none"
        />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 pb-32">
          {children}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-[150] backdrop-blur">
          <div className="w-full px-4 pb-6">
            <div className="max-w-5xl mx-auto">
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </div>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );

  return hasClerkKeys ? <ClerkProvider>{content}</ClerkProvider> : content;
}
