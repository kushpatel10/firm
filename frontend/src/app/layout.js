import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/components/providers/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SafeAreaProvider } from "@/components/providers/safe-area-provider";
import { StealthProvider } from "@/contexts/stealth-context";
import { StealthDecoyGuard } from "@/components/decoy/stealth-decoy-guard";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Firm — Business Management",
  description: "Production-grade multi-tenant business management platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased"
      >
        <SafeAreaProvider>
          <ThemeProvider>
            <StealthProvider>
              <StealthDecoyGuard>
                <AuthProvider>
                  <TooltipProvider>
                    {children}
                    <ToastProvider />
                  </TooltipProvider>
                </AuthProvider>
              </StealthDecoyGuard>
            </StealthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </body>
    </html>
  );
}
