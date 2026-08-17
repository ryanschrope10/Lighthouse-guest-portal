import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Guest Portal",
  description: "Manage your bookings, payments, and profile",
  manifest: "/manifest.json",
  // Icons come from the file conventions in this directory — favicon.ico,
  // icon.png, apple-icon.png (see scripts/generate-icons.mjs).
  appleWebApp: {
    capable: true,
    title: "Guest Portal",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#b47a24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
