"use client";
const LOGS = [
  { time:"02 Nov 2026 11:42", user:"Bachan Admin", action:"create", resource:"Order BGS-ORD-00218", ip:"192.168.1.5" },
  { time:"02 Nov 2026 10:15", user:"Ramesh Kumar", action:"update", resource:"Customer BCG-00003", ip:"192.168.1.8" },
  { time:"02 Nov 2026 09:30", user:"Sunita Devi", action:"post", resource:"Invoice BGS-INV-00217", ip:"192.168.1.10" },
  { time:"01 Nov 2026 17:22", user:"Bachan Admin", action:"approve", resource:"Order BGS-ORD-00216", ip:"192.168.1.5" },
  { time:"01 Nov 2026 15:10", user:"Ajay Sharma", action:"create", resource:"Customer BCG-00428", ip:"192.168.1.12" },
];
const ACOLOR: Record<string,{bg:string;color:string}> = {
  create:{bg:"#dcfce7",color:"#15803d"},
  update:{bg:"#dbeafe",color:"#1d4ed8"},
  approve:{bg:"#ede9fe",color:"#6d28d9"},
  post:{bg:"#fef3c7",color:"#92400e"},
  delete:{bg:"#fee2e2",color:"#991b1b"},
};
export default function AuditPage() {
  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      <div style={{ marginBottom:20 }}><h1 className="page-title">Audit Logs</h1><p className="page-sub">All system actions are logged and immutable</p></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th></tr></thead>
          <tbody>
            {LOGS.map((l,i)=>{ const c=ACOLOR[l.action]||{bg:"#f1f5f9",color:"#475569"}; return (
              <tr key={i}>
                <td style={{ fontSize:12, color:"var(--fg2)", fontFamily:"monospace" }}>{l.time}</td>
                <td style={{ fontWeight:600 }}>{l.user}</td>
                <td><span className="badge" style={{ background:c.bg, color:c.color }}>{l.action}</span></td>
                <td style={{ fontSize:13 }}>{l.resource}</td>
                <td style={{ fontSize:12, color:"var(--fg2)", fontFamily:"monospace" }}>{l.ip}</td>
              </tr>
            );})}
          </tbody>
        </table>
        <div className="tbl-footer"><span className="tbl-footer-info">Showing 5 of 1,248 log entries</span></div>
      </div>
    </div>
  );
}
