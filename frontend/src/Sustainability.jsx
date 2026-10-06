import { useEffect, useState } from "react";

export default function Sustainability({ apiUrl, fieldValues }) {
  const [token] = useState(() => localStorage.getItem("farmer-token") || "");
  const [notifications, setNotifications] = useState([]);
  const [report, setReport] = useState(null);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const load = async () => {
    if (!token) return;
    const [alerts, performance] = await Promise.all([
      fetch(`${apiUrl}/api/notifications`, { headers }),
      fetch(`${apiUrl}/api/farm-performance`, { method: "POST", headers, body: JSON.stringify({ soilScore: 78, nutrientScore: 76, moisture: fieldValues.moisture, rainfall: fieldValues.rainfall }) })
    ]);
    if (alerts.ok) setNotifications(await alerts.json());
    if (performance.ok) setReport(await performance.json());
  };
  useEffect(() => { load(); }, [token]);
  const markRead = async (entry) => {
    const response = await fetch(`${apiUrl}/api/notifications/${entry.id}`, { method: "PATCH", headers, body: JSON.stringify({ read: true }) });
    if (response.ok) { const updated = await response.json(); setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item)); }
  };
  if (!token) return <section className="sustainability"><p className="eyebrow">FARM SAFETY & SUSTAINABILITY</p><h2>Sign in to get personalized alerts and farm scores.</h2></section>;
  return <section className="sustainability" id="sustainability"><div className="phase-heading"><p className="eyebrow">FARM SAFETY & SUSTAINABILITY</p><h2>Measure farm health before small issues become big losses.</h2><p>Performance combines soil, nutrient, and water signals. Alerts are saved against the farmer account.</p></div><div className="sustainability-grid"><article className="panel score-card"><p className="eyebrow">FARM PERFORMANCE</p>{report ? <><div className="large-score"><b>{report.performance}</b><span>/100</span></div><div className="score-bars">{Object.entries(report.scores).map(([key, value]) => <div key={key}><span>{key}<b>{value}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}</div></> : <div className="empty">Calculating performance…</div>}</article><article className="panel score-card"><p className="eyebrow">SUSTAINABILITY SCORE</p>{report ? <><div className="large-score green"><b>{report.sustainability}</b><span>/100</span></div><ul className="tip-list">{report.tips.map((tip) => <li key={tip}>🌱 {tip}</li>)}</ul></> : <div className="empty">Loading resource-efficiency advice…</div>}</article><article className="panel notification-card"><div className="card-title"><div><p className="eyebrow">ALERT CENTER</p><h3>{notifications.filter((item) => !item.read).length} unread alerts</h3></div><button className="refresh" onClick={load}>↻</button></div>{notifications.map((entry) => <div className={`notification ${entry.read ? "read" : entry.level.toLowerCase()}`} key={entry.id}><span>{entry.level === "Warning" ? "!" : "✓"}</span><div><b>{entry.title}</b><small>{entry.detail}</small></div>{!entry.read && <button onClick={() => markRead(entry)}>Mark read</button>}</div>) || <div className="empty">No alerts yet.</div>}</article></div></section>;
}
