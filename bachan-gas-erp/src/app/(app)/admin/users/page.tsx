"use client";
const ROLES = [
  { name:"super_admin", label:"Super Admin", users:1, desc:"Full unrestricted access" },
  { name:"admin", label:"Admin", users:2, desc:"Manage all operations except system settings" },
  { name:"accounts_staff", label:"Accounts Staff", users:3, desc:"Finance, payments, invoices" },
  { name:"sales_staff", label:"Sales Staff", users:4, desc:"Customers and orders" },
  { name:"dispatch_staff", label:"Dispatch Staff", users:2, desc:"Deliveries and dispatch" },
];
const USERS = [
  { name:"Bachan Admin", email:"admin@bachangas.in", role:"super_admin", status:"active", last:"02 Nov 2026" },
  { name:"Ramesh Kumar", email:"ramesh@bachangas.in", role:"admin", status:"active", last:"02 Nov 2026" },
  { name:"Sunita Devi", email:"sunita@bachangas.in", role:"accounts_staff", status:"active", last:"01 Nov 2026" },
  { name:"Ajay Sharma", email:"ajay@bachangas.in", role:"sales_staff", status:"active", last:"02 Nov 2026" },
  { name:"Mohan Lal", email:"mohan@bachangas.in", role:"dispatch_staff", status:"active", last:"02 Nov 2026" },
];
export default function UsersPage() {
  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div><h1 className="page-title">Users & Roles</h1><p className="page-sub">Manage staff accounts and permissions</p></div>
        <button className="btn btn-orange">+ Add User</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {ROLES.map(r=>(
          <div key={r.name} className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:"var(--fg2)", marginBottom:6 }}>{r.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:"var(--navy)" }}>{r.users}</div>
            <div style={{ fontSize:11, color:"var(--fg2)", marginTop:4 }}>{r.desc}</div>
          </div>
        ))}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th></th></tr></thead>
          <tbody>
            {USERS.map(u=>(
              <tr key={u.email}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--navy)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{u.name[0]}</div>
                    <span style={{ fontWeight:700 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color:"var(--fg2)", fontSize:12 }}>{u.email}</td>
                <td><span className="badge b-commercial" style={{ textTransform:"none" }}>{u.role.replace("_"," ")}</span></td>
                <td><span className="badge b-active">{u.status}</span></td>
                <td style={{ fontSize:12, color:"var(--fg2)" }}>{u.last}</td>
                <td>
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="icon-btn" title="Edit">✏</button>
                    <button className="icon-btn" title="Reset password">🔑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
