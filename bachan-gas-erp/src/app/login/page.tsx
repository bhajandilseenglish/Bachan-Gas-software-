"use client";

import Link from "next/link";
import { ShieldCheck, Users, ArrowRight, Flame } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-xl shadow-orange-500/20 mb-4">
            <Flame className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Bachan Gas Service</h1>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">
            Commercial LPG Distribution ERP
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span>IOCL Distributor Code: <strong className="text-slate-200">0000110351</strong></span>
            <span>·</span>
            <span>Ludhiana, Punjab</span>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Admin Portal Card */}
          <Link
            href="/login/admin"
            className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-6 transition-all duration-200 shadow-xl shadow-black/40 hover:shadow-orange-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-105 group-hover:bg-orange-500/20 transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                Administrator
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Full governance: customer onboarding approvals, product rate master, credit limits, godown inventory, and audit logs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-orange-400">
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Staff Portal Card */}
          <Link
            href="/login/staff"
            className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 shadow-xl shadow-black/40 hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                Operations Staff
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Operational tasks: customer lookups, order processing, delivery recording, cylinder returns, and stock receipts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Staff Login</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Protected Enterprise System · Authenticated Session Required</p>
          <p className="mt-1">Role-based access strictly enforced according to business security policies</p>
        </div>
      </div>
    </div>
  );
}
