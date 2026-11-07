"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Sun, Moon, Menu, PanelLeftClose, PanelLeftOpen,
  User, Building2, Phone, RotateCcw, LogOut, Check, Settings, X, ArrowLeft
} from "lucide-react";
import { useERPStore } from "@/lib/store";

interface Props { onMenu: () => void; onToggle: () => void; collapsed: boolean; }

export default function Header({ onMenu, onToggle, collapsed }: Props) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { customers, orders, deliveries, resetToSeed } = useERPStore();

  const toggleDark = () => {
    setDark(p => !p);
    document.documentElement.classList.toggle("dark");
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDrop(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter customers matching query
  const searchResults = query.trim().length > 0
    ? customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.business.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.mobile.includes(query) ||
        c.city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pendingDispatches = orders.filter(o => o.status === "pending_dispatch").length;
  const pendingDeliveries = deliveries.filter(d => d.status === "pending").length;

  return (
    <header id="header" className="app-header" style={{
      height: 58,
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 18px",
      flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      position: "relative",
      zIndex: 30,
    }}>
      {/* Mobile Full-Width Search Mode */}
      {mobileSearchOpen ? (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          zIndex: 100,
        }}>
          <button
            onClick={() => { setMobileSearchOpen(false); setShowDrop(false); }}
            title="Back"
            style={{
              width: 36, height: 36, borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#64748b", background: "#f1f5f9", border: "none", cursor: "pointer"
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "#f8fafc", border: "1.5px solid #cbd5e1",
            borderRadius: 8, padding: "7px 12px"
          }}>
            <Search size={16} color="#f97316" />
            <input
              ref={mobileInputRef}
              autoFocus
              placeholder="Search customer, mobile, code..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 13, color: "#1e293b", width: "100%"
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ color: "#94a3b8", display: "flex", background: "none", border: "none" }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Mobile search dropdown container */}
          {showDrop && query.trim().length > 0 && (
            <div className="hdr-search-dropdown" style={{
              position: "absolute", top: 58, left: 10, right: 10,
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.15)",
              zIndex: 200, overflow: "hidden", maxHeight: "70vh", overflowY: "auto"
            }}>
              <div style={{
                padding: "9px 14px", fontSize: 10.5, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: ".07em",
                color: "#64748b", borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc", display: "flex", justifyContent: "space-between"
              }}>
                <span>Matching Customers</span>
                <span>{searchResults.length} found</span>
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: "18px 14px", textAlign: "center", color: "#64748b", fontSize: 12.5 }}>
                  No customers found matching &quot;{query}&quot;
                </div>
              ) : (
                searchResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setShowDrop(false);
                      setMobileSearchOpen(false);
                      setQuery("");
                      router.push(`/customers/${c.id}`);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", width: "100%", textAlign: "left",
                      background: "transparent", border: "none", borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: "#1e3a8a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0
                    }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{c.name}</span>
                        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#1e3a8a", fontWeight: 700, background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>
                          {c.code}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{c.city}</span>
                        <span>·</span>
                        <span>{c.mobile}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
              <Link
                href={`/customers?search=${encodeURIComponent(query)}`}
                onClick={() => { setShowDrop(false); setMobileSearchOpen(false); setQuery(""); }}
                style={{
                  display: "block", padding: "10px 14px", borderTop: "1px solid #e2e8f0",
                  textAlign: "center", fontSize: 12, fontWeight: 600, color: "#f97316",
                  textDecoration: "none", background: "#fff"
                }}
              >
                Search all customers for &quot;{query}&quot; →
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {/* Sidebar toggle - desktop */}
      <button
        onClick={onToggle}
        title="Toggle sidebar"
        className="desktop-toggle-btn"
        style={{
          width: 34, height: 34, borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "#64748b", background: "transparent", border: "none",
          cursor: "pointer", transition: "background .15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Mobile menu */}
      <button
        onClick={onMenu}
        title="Menu"
        className="mob-menu-btn"
        aria-label="Open Navigation Drawer"
        style={{
          width: 36, height: 36, borderRadius: 8, display: "none",
          alignItems: "center", justifyContent: "center",
          color: "#0d1f3c", background: "#f8fafc", border: "1px solid #e2e8f0",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <Menu size={19} />
      </button>

      {/* Brand */}
      <Link href="/dashboard" style={{ fontSize: 13.5, color: "#64748b", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <strong style={{ color: "#0d1f3c", fontWeight: 800, whiteSpace: "nowrap" }}>Bachan Gas</strong>
        <span className="hdr-brand-sub" style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4, fontWeight: 500, whiteSpace: "nowrap" }}>· Enterprise ERP</span>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Mobile search trigger icon */}
      <button
        onClick={() => {
          setMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 60);
        }}
        title="Search customers"
        className="mob-search-btn"
        aria-label="Search"
        style={{
          width: 34, height: 34, borderRadius: 8, display: "none",
          alignItems: "center", justifyContent: "center",
          color: "#64748b", background: "transparent", border: "none",
          cursor: "pointer", flexShrink: 0
        }}
      >
        <Search size={18} />
      </button>

      {/* Global Customer Search (Desktop) */}
      <div ref={dropRef} className="hdr-search-desktop" style={{ position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f8fafc", border: "1.5px solid #e2e8f0",
          borderRadius: 8, padding: "7px 12px",
          width: 260, transition: "width .2s, border-color .2s",
        }}>
          <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            placeholder="Search any customer, mobile, code..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: 12.5, color: "#1e293b", width: "100%",
            }}
          />
          <span style={{
            fontSize: 10, color: "#94a3b8", background: "#e2e8f0",
            padding: "1px 5px", borderRadius: 4, fontWeight: 600, flexShrink: 0,
          }}>Ctrl+K</span>
        </div>

        {/* Search Results Dropdown */}
        {showDrop && query.trim().length > 0 && (
          <div className="hdr-search-dropdown" style={{
            position: "absolute", top: 44, right: 0,
            width: 380, maxWidth: "calc(100vw - 20px)", background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            zIndex: 200, overflow: "hidden",
          }}>
            <div style={{
              padding: "9px 14px", fontSize: 10.5, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".07em",
              color: "#64748b", borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc", display: "flex", justifyContent: "space-between"
            }}>
              <span>Matching Customers</span>
              <span>{searchResults.length} found</span>
            </div>

            {searchResults.length === 0 ? (
              <div style={{ padding: "18px 14px", textAlign: "center", color: "#64748b", fontSize: 12.5 }}>
                No customers found matching &quot;{query}&quot;
              </div>
            ) : (
              searchResults.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setShowDrop(false);
                    setQuery("");
                    router.push(`/customers/${c.id}`);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", width: "100%", textAlign: "left",
                    background: "transparent", border: "none", borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer", transition: "background .12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: "#1e3a8a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{c.name}</span>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#1e3a8a", fontWeight: 700, background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>
                        {c.code}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, display: "flex", gap: 10 }}>
                      <span>{c.city}</span>
                      <span>·</span>
                      <span>{c.mobile}</span>
                      <span>·</span>
                      <span style={{ color: (c.outstanding || 0) > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                        {c.outstanding !== null ? `₹${(c.outstanding || 0).toLocaleString("en-IN")} Dr` : "Unconfigured"}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}

            <Link
              href={`/customers?search=${encodeURIComponent(query)}`}
              onClick={() => { setShowDrop(false); setQuery(""); }}
              style={{
                display: "block", padding: "10px 14px", borderTop: "1px solid #e2e8f0",
                textAlign: "center", fontSize: 12, fontWeight: 600, color: "#f97316",
                textDecoration: "none", background: "#fff"
              }}
            >
              Search all customers for &quot;{query}&quot; →
            </Link>
          </div>
        )}
      </div>

      {/* Notifications bell */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowNotif(p => !p)}
          title="Notifications"
          style={{
            position: "relative", width: 34, height: 34, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b", background: "transparent", border: "none",
            cursor: "pointer", transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <Bell size={17} />
          {(pendingDispatches > 0 || pendingDeliveries > 0) && (
            <span style={{
              position: "absolute", top: 7, right: 7, width: 7, height: 7,
              background: "#f97316", borderRadius: "50%",
              border: "1.5px solid #fff",
            }} />
          )}
        </button>

        {showNotif && (
          <div style={{
            position: "absolute", top: 44, right: 0, width: 300, background: "#fff",
            border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            zIndex: 200, padding: 14
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Operational Alerts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
              <Link href="/orders?status=pending_dispatch" onClick={() => setShowNotif(false)} style={{ color: "#b45309", textDecoration: "none", background: "#fffbeb", padding: "8px 10px", borderRadius: 6 }}>
                ⏳ {pendingDispatches} orders pending dispatch
              </Link>
              <Link href="/deliveries?status=pending" onClick={() => setShowNotif(false)} style={{ color: "#1d4ed8", textDecoration: "none", background: "#eff6ff", padding: "8px 10px", borderRadius: 6 }}>
                🚛 {pendingDeliveries} deliveries in transit / pending
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleDark}
        title="Toggle dark/light theme"
        style={{
          width: 34, height: 34, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#64748b", background: "transparent", border: "none",
          cursor: "pointer", transition: "background .15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        {dark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* User profile Menu */}
      <div ref={userMenuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowUserMenu(p => !p)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "none", cursor: "pointer", padding: "3px 6px",
            borderRadius: 8, transition: "background .15s"
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 32, height: 32, background: "#f97316", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>BA</div>
        </button>

        {showUserMenu && (
          <div style={{
            position: "absolute", top: 44, right: 0,
            width: 220, background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,.15)",
            zIndex: 200, overflow: "hidden"
          }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Bachan Admin</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>admin@bachangas.in</div>
              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4, marginTop: 4 }}>
                SUPER ADMIN
              </span>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Link href="/settings" onClick={() => setShowUserMenu(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12.5, color: "#1e293b", textDecoration: "none" }}>
                <Settings size={14} color="#64748b" /> Agency Settings
              </Link>
              <button
                onClick={() => {
                  if (confirm("Reset demo data to default clean state?")) {
                    resetToSeed();
                    setShowUserMenu(false);
                    alert("Data reset to seed values.");
                    router.refresh();
                  }
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12.5, color: "#d97706", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <RotateCcw size={14} /> Reset Demo Data
              </button>
              <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
              <Link href="/login" onClick={() => setShowUserMenu(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", fontSize: 12.5, color: "#dc2626", textDecoration: "none" }}>
                <LogOut size={14} /> Sign Out
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
