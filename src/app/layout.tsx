import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: { template: "%s | RT-Trainer", default: "RT-Trainer" },
  description:
    "Practice your Radio Telephony Skills from the comfort of your browser",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  applicationName: "RT-Trainer",
  referrer: "origin-when-cross-origin",
  keywords: [
    "Radio",
    "Radio Telephony",
    "Pilot",
    "Practice",
    "FRTOL",
    "Flight School",
  ],
  authors: [{ name: "Zac Benattar" }],
  creator: "Zac Benattar",
  publisher: "Zac Benattar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Analytics />

        <TRPCReactProvider>
          <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
            <main className="h-min min-h-dvh overflow-y-scroll">
              {children}

              <Toaster />
            </main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
