import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import ThemeRegistry from "@/theme/ThemeRegistry";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beginning — Google Keep Notes & Private Space",
  description:
    "A modern Google Keep-inspired notes application with a secure 4-digit PIN Private Space and offline PWA support.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[#0F172A] text-[#F8FAFC]">
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
