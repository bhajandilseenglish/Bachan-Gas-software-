import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bachan Gas Service — ERP",
  description: "LPG Distribution Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
