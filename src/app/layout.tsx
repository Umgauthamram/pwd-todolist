import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Beginning — Google Keep Notes & Private Space",
  description:
    "A modern Google Keep-inspired notes application with a secure 4-digit PIN Private Space and offline PWA support.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Beginning",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-black text-white">
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
