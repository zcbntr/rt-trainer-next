import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Sixtyfour } from "next/font/google";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "~/components/ui/sonner";
import Footer from "./_components/footer";

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

const sixtyfour = Sixtyfour({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sixtyfour",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${sixtyfour.variable}`}>
      <body>
        <Analytics />

        <TRPCReactProvider>
          <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
            <main className="h-fit min-h-dvh overflow-y-scroll">
              {children}

              <Toaster />
            </main>
            <Footer />
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
