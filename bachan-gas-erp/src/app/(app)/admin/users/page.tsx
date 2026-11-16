"use client";
import { useState } from "react";
import {
  Users, UserPlus, Search, Shield, Key, Pencil, Trash2, Check, X,
  Copy, Phone, Mail, Clock, Filter, AlertCircle
} from "lucide-react";
import { useERPStore, StaffUser } from "@/lib/store";

const ROLE_INFO: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  super_admin:    { label: "Super Admin", desc: "Full unrestricted access to all modules and configurations", color: "#1e3a8a", bg: "#dbeafe" },
  admin:          { label: "Admin", desc: "Manage operational modules except core security/system settings", color: "#0891b2", bg: "#cffafe" },
  accounts_staff: { label: "Accounts Staff", desc: "Process payments, invoices, credit limits, and ledgers", color: "#16a34a", bg: "#dcfce7" },
  sales_staff:    { label: "Sales Staff", desc: "Manage customer register, pricing contracts, and sales orders", color: "#f97316", bg: "#ffedd5" },
  dispatch_staff: { label: "Dispatch Staff", desc: "Manage cylinder deliveries, vehicle assignments, and fleet trips", color: "#7c3aed", bg: "#ede9fe" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, resetUserPassword } = useERPStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [resetModal, setResetModal] = useState<{ user: StaffUser; tempPass: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New User Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newRole, setNewRole] = useState<StaffUser["role"]>("sales_staff");
  const [newStatus, setNewStatus] = useState<StaffUser["status"]>("active");
  const [formError, setFormError] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setFormError("Valid email address is required.");
      return;
    }

    addUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      role: newRole,
      status: newStatus,
    });

    setAddModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("+91 ");
    setNewRole("sales_staff");
    setNewStatus("active");
    showToast(`Staff account for ${newName} created successfully!`);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    updateUser(editUser.id, {
      name: editUser.name,
      email: editUser.email,
      phone: editUser.phone,
      role: editUser.role,
      status: editUser.status,
    });

    setEditUser(null);
    showToast(`Permissions updated for ${editUser.name}!`);
  };

  const handleResetPassword = (u: StaffUser) => {
    const tempPass = resetUserPassword(u.id);
    setResetModal({ user: u, tempPass });
    setCopied(false);
  };

  const handleDeleteUser = (u: StaffUser) => {
    if (u.role === "super_admin") {
      alert("Super Admin account cannot be removed.");
      return;
    }
    if (confirm(`Are you sure you want to delete staff account for ${u.name} (${u.email})?`)) {
      deleteUser(u.id);
      showToast(`Staff account for ${u.name} deleted.`);
    }
  };

  // Filtered Users
  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "#1e293b", color: "#fff", padding: "12px 20px", borderRadius: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,.2)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600
        }}>
          <Check size={16} color="#4ade80" /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Staff Accounts & Access Roles
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Manage staff login credentials, enterprise role permissions, and user status
          </p>
        </div>
        <button
          onClick={() => { setFormError(""); setAddModalOpen(true); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: "#f97316", color: "#fff", border: "none", cursor: "pointer",
            boxShadow: "0 1px 3px rgba(249,115,22,.3)"
          }}
        >
          <UserPlus size={15} /> + Add Staff User
        </button>
      </div>

      {/* Roles Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {Object.entries(ROLE_INFO).map(([key, info]) => {
          const count = users.filter(u => u.role === key).length;
          const isSelected = roleFilter === key;
          return (
            <div
              key={key}
              onClick={() => setRoleFilter(isSelected ? "all" : key)}
              style={{
                ...card(),
                padding: 16, cursor: "pointer",
                border: isSelected ? `2px solid ${info.color}` : "1px solid #e2e8f0",
                background: isSelected ? info.bg : "#fff",
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: info.color }}>
                  {info.label}
                </span>
                <Shield size={14} color={info.color} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#1e293b", marginTop: 6 }}>{count}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>{info.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="accounts_staff">Accounts Staff</option>
            <option value="sales_staff">Sales Staff</option>
            <option value="dispatch_staff">Dispatch Staff</option>
          </select>

          {(search || roleFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("all"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fee2e2", border: "none", cursor: "pointer" }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {users.length} staff
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Staff Member", "Contact Details", "Role & Permissions", "Status", "Last Active", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No staff members found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(u => {
                const roleInfo = ROLE_INFO[u.role] || { label: u.role, color: "#475569", bg: "#f1f5f9" };
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#1e293b" }}>
                      <div>{u.phone || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: roleInfo.bg, color: roleInfo.color }}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: u.status === "active" ? "#dcfce7" : "#f1f5f9", color: u.status === "active" ? "#15803d" : "#64748b" }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                      {u.lastActive}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setEditUser({ ...u })}
                          style={{ width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e3a8a", background: "#dbeafe", border: "none", cursor: "pointer" }}
                          title="Edit staff details and role"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          style={{ width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", background: "#fef3c7", border: "none", cursor: "pointer" }}
                          title="Generate temporary password"
                        >
                          <Key size={13} />
                        </button>
                        {u.role !== "super_admin" && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            style={{ width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", background: "#fee2e2", border: "none", cursor: "pointer" }}
                            title="Delete staff account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile User Cards View */}
      <div className="mobile-only-cards" style={{ display: "none" }}>
        {filtered.length === 0 ? (
          <div style={{ ...card(), padding: 30, textAlign: "center", color: "#64748b" }}>
            No staff members match the current filter criteria.
          </div>
        ) : (
          filtered.map(u => {
            const roleInfo = ROLE_INFO[u.role] || { label: u.role, color: "#475569", bg: "#f1f5f9" };
            return (
              <div key={u.id} style={{ ...card(), padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: u.status === "active" ? "#dcfce7" : "#f1f5f9", color: u.status === "active" ? "#15803d" : "#64748b" }}>
                    {u.status}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#64748b", margin: "10px 0 12px", padding: "8px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: roleInfo.bg, color: roleInfo.color }}>
                    {roleInfo.label}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Phone size={12} /> {u.phone || "—"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} /> {u.lastActive}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setEditUser({ ...u })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#1e3a8a", background: "#dbeafe", border: "none" }}
                  >
                    <Pencil size={12} /> Edit Role
                  </button>
                  <button
                    onClick={() => handleResetPassword(u)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#d97706", background: "#fef3c7", border: "none" }}
                  >
                    <Key size={12} /> Reset Pass
                  </button>
                  {u.role !== "super_admin" && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fee2e2", border: "none" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {addModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 500, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={18} color="#f97316" />
                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Create New Staff Account</span>
              </div>
              <button onClick={() => setAddModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {formError && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 10, color: "#b91c1c", fontSize: 12 }}>
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Harpreet Singh"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="harpreet@bachangas.in"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>System Role *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="accounts_staff">Accounts Staff</option>
                    <option value="sales_staff">Sales Staff</option>
                    <option value="dispatch_staff">Dispatch Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Account Status *</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={16} color="#1e3a8a" />
                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Edit Staff Permissions</span>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Phone Number</label>
                <input
                  type="tel"
                  value={editUser.phone}
                  onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Role</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser({ ...editUser, role: e.target.value as any })}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="accounts_staff">Accounts Staff</option>
                    <option value="sales_staff">Sales Staff</option>
                    <option value="dispatch_staff">Dispatch Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Status</label>
                  <select
                    value={editUser.status}
                    onChange={e => setEditUser({ ...editUser, status: e.target.value as any })}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Key size={18} color="#d97706" />
                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Temporary Password Generated</span>
              </div>
              <button onClick={() => setResetModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                A temporary one-time password has been generated for <strong>{resetModal.user.name}</strong> ({resetModal.user.email}):
              </p>

              <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <code style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a", letterSpacing: ".08em" }}>
                  {resetModal.tempPass}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetModal.tempPass);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: copied ? "#dcfce7" : "#1e3a8a", color: copied ? "#15803d" : "#fff", border: "none", cursor: "pointer" }}
                >
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>

              <div style={{ fontSize: 11.5, color: "#64748b", background: "#fef3c7", padding: "10px 12px", borderRadius: 8, border: "1px solid #fde68a", lineHeight: 1.4 }}>
                <strong>Security Notice:</strong> The user will be required to change this temporary password upon their next login to Bachan Gas ERP.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  onClick={() => setResetModal(null)}
                  style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
