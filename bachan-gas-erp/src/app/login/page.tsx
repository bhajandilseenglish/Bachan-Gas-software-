"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url"
    && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    if (!isConfigured) {
      // Demo mode: bypass auth
      setLoading(false);
      router.push("/dashboard");
      return;
    }

    try {
      const { signIn } = await import("@/lib/actions");
      const r = await signIn(email, password);
      if (r.error) { setError(r.error); setLoading(false); return; }
      router.push("/dashboard");
    } catch {
      setError("Unable to connect to database. Check your Supabase credentials.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--sidebar-bg)", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, background:"var(--orange)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>🔥</div>
          <h1 style={{ fontSize:22, fontWeight:900, color:"#fff" }}>Bachan Gas Service</h1>
          <p style={{ fontSize:13, color:"var(--sidebar-text)", marginTop:4 }}>LPG Distribution ERP</p>
        </div>

        {/* Card */}
        <div style={{ background:"var(--card)", borderRadius:16, padding:32, boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
          <h2 style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Sign in to your account</h2>
          <p style={{ fontSize:13, color:"var(--fg2)", marginBottom:24 }}>Enter your credentials to access the ERP.</p>

          {!isConfigured && (
            <div style={{ background:"#fef3c7", border:"1.5px solid #fde68a", borderRadius:10, padding:12, marginBottom:20, fontSize:12, color:"#92400e" }}>
              <strong>Demo mode:</strong> Supabase not configured. Click Sign In to enter the dashboard.
            </div>
          )}

          {error && (
            <div style={{ background:"#fee2e2", border:"1.5px solid #fca5a5", borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:"#b91c1c" }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--fg2)", marginBottom:6 }}>Email Address</label>
              <input name="email" type="email" required defaultValue="admin@bachanagas.in"
                placeholder="admin@bachangas.in"
                style={{ width:"100%", border:"1.5px solid var(--border)", borderRadius:9, padding:"10px 14px", fontSize:14, color:"var(--fg)", background:"var(--bg)", outline:"none" }}
                onFocus={e => e.target.style.borderColor="var(--orange)"}
                onBlur={e => e.target.style.borderColor="var(--border)"}
              />
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--fg2)", marginBottom:6 }}>Password</label>
              <input name="password" type="password" required defaultValue="admin123"
                placeholder="••••••••"
                style={{ width:"100%", border:"1.5px solid var(--border)", borderRadius:9, padding:"10px 14px", fontSize:14, color:"var(--fg)", background:"var(--bg)", outline:"none" }}
                onFocus={e => e.target.style.borderColor="var(--orange)"}
                onBlur={e => e.target.style.borderColor="var(--border)"}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ width:"100%", background:"var(--orange)", color:"#fff", border:"none", borderRadius:9, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1, transition:"opacity .15s" }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div style={{ marginTop:20, padding:14, background:"var(--bg)", borderRadius:10, fontSize:12, color:"var(--fg2)" }}>
            <strong style={{ color:"var(--fg)" }}>Default credentials:</strong><br />
            Email: <code>admin@bachangas.in</code><br />
            Password: <code>admin123</code><br />
            <span style={{ fontSize:11, marginTop:4, display:"block" }}>(Change after first login in Administration → Settings)</span>
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"var(--sidebar-text)", marginTop:16 }}>
          Bachan Gas Service ERP v1.0 · Powered by Next.js + Supabase
        </p>
      </div>
    </div>
  );
}

