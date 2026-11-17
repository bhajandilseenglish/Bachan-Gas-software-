"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useERPStore } from "@/lib/store";
import { Users, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginUser } = useERPStore();
  const [username, setUsername] = useState("staff");
  const [password, setPassword] = useState("staff123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = loginUser(username, password, "staff");
      if (!res.success) {
        setError(res.error || "Authentication failed. Staff credentials required.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portal Selection
          </Link>
        </div>

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bachan Gas Service</h1>
          <p className="text-xs text-sky-400 font-semibold tracking-wider uppercase mt-1">
            Operations Staff Portal
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Distributor Code: 0000110351 · Ludhiana, Punjab
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/60">
          <div className="mb-5 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Staff Member Login</h2>
              <p className="text-xs text-slate-400">Daily operations and delivery workflows</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Staff Role
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="staff"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Operations"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role permissions note */}
          <div className="mt-5 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Staff Permitted Activities:</p>
            <p>• Search & view customers; submit registrations for Admin approval</p>
            <p>• Record cylinder deliveries & empty returns</p>
            <p>• Record godown stock receipts & customer payment receipts</p>
            <p className="text-amber-400/80 pt-1">
              Note: Staff cannot modify rates, approve customers, or change credit limits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Bachan Gas Service ERP · Enterprise Commercial LPG Management
        </p>
      </div>
    </div>
  );
}
