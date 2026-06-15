import { useState } from "react";
import { useSummary, useList } from "../api/hooks";

export default function Dashboard() {
  const [location, setLocation] = useState("");
  const { data, isLoading } = useSummary(location ? { location } : {});
  const { data: locs } = useList("locations", {});
  const locations = locs?.results ?? locs ?? [];

  const cards = [
    { label: "Patients", value: data?.patients_total, icon: "🧑" },
    { label: "Active doctors", value: data?.doctors_total, icon: "👨‍⚕️" },
    { label: "Appointments today", value: data?.appointments_today, icon: "📅" },
    { label: "Total appointments", value: data?.appointments_total, icon: "🗂️" },
    { label: "Revenue (7d)", value: `$${data?.revenue_last_7d ?? 0}`, icon: "💰" },
    { label: "Total dues", value: `$${data?.total_due ?? 0}`, icon: "⚠️", warn: true },
    { label: "Unread messages", value: data?.unread_messages, icon: "✉️" },
  ];

  return (
    <div>
      <header className="page-head">
        <h1>Dashboard</h1>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </header>

      {isLoading && <p>Loading…</p>}

      <div className="card-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.warn ? "warn" : ""}`}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{c.value ?? "—"}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Appointments by status</h3>
        <ul className="bars">
          {(data?.appointments_by_status ?? []).map((s) => (
            <li key={s.status}>
              <span className="bar-label">{s.status}</span>
              <span className="bar" style={{ width: `${Math.min(s.count * 40, 300)}px` }}>
                {s.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h3>Appointments by location</h3>
        <ul className="bars">
          {(data?.appointments_by_location ?? []).map((s) => (
            <li key={s.location__name || "none"}>
              <span className="bar-label">{s.location__name || "Unassigned"}</span>
              <span className="bar alt" style={{ width: `${Math.min(s.count * 40, 300)}px` }}>
                {s.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
