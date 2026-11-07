import type { Metadata } from "next";
import "../globals.css";
export const metadata: Metadata = { title: "Sign In — Bachan Gas ERP" };
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}

