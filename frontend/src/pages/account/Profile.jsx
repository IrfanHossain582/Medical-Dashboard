import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { patientApi, usePatientAuth } from "../../auth/PatientAuthProvider";
import SiteNav from "../../site/SiteNav";
import Footer from "../../site/Footer";

const fmt = (s) => (s ? new Date(s).toLocaleString() : "");

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, logout } = usePatientAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/account/login?next=/account");
      return;
    }
    patientApi
      .get("/patient/me/")
      .then((r) => setData(r.data))
      .catch(() => setErr("Could not load your profile."));
  }, [user, loading]);

  if (loading || (!data && !err)) {
    return (
      <div className="book-page">
        <SiteNav />
        <p className="muted" style={{ marginTop: 40 }}>Loading your profile…</p>
      </div>
    );
  }

  const p = data?.patient;
  const cards = [
    { label: "Appointments", value: data?.appointments?.length ?? 0, icon: "📅" },
    { label: "Total paid", value: `$${p?.total_paid ?? 0}`, icon: "💳" },
    { label: "Outstanding due", value: `$${p?.due ?? 0}`, icon: "⚠️", warn: Number(p?.due) > 0 },
    { label: "Patient status", value: p?.patient_type, icon: "⭐", tag: true },
  ];

  return (
    <div className="site profile-page">
      <SiteNav />
      <div className="profile-shell">
        <header className="profile-head">
          <div>
            <span className="eyebrow">My Account</span>
            <h1>Hello, {p?.name || user?.name} 👋</h1>
            <p className="muted">{user?.email}</p>
          </div>
          <div className="profile-head-actions">
            <Link to="/book" className="grad-btn">Book appointment</Link>
            <button className="ghost-btn" onClick={() => { logout(); navigate("/"); }}>Log out</button>
          </div>
        </header>

        {err && <p className="error">{err}</p>}

        <div className="card-grid">
          {cards.map((c) => (
            <div key={c.label} className={`stat-card ${c.warn ? "warn" : ""}`}>
              <div className="stat-icon">{c.icon}</div>
              <div className="stat-value">
                {c.tag ? <span className={`tag ${c.value}`}>{c.value}</span> : c.value}
              </div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        <section className="profile-panel">
          <h3>Appointment history</h3>
          {data.appointments.length === 0 && <p className="muted">No appointments yet. <Link to="/book">Book one →</Link></p>}
          {data.appointments.length > 0 && (
            <table className="data-table">
              <thead>
                <tr><th>Doctor</th><th>When</th><th>Location</th><th>Status</th><th>Fee</th></tr>
              </thead>
              <tbody>
                {data.appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.doctor_name}</td>
                    <td>{fmt(a.scheduled_for)}</td>
                    <td>{a.location_name || "—"}</td>
                    <td><span className={`tag ${a.status}`}>{a.status_display}</span></td>
                    <td>${a.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="profile-panel">
          <h3>Lab & diagnostic tests</h3>
          {data.test_orders.length === 0 && <p className="muted">No tests ordered yet.</p>}
          {data.test_orders.length > 0 && (
            <table className="data-table">
              <thead><tr><th>Test</th><th>Category</th><th>Status</th><th>Price</th></tr></thead>
              <tbody>
                {data.test_orders.map((t) => (
                  <tr key={t.id}>
                    <td>{t.test_name}</td>
                    <td>{t.test_category}</td>
                    <td><span className={`tag ${t.status}`}>{t.status_display}</span></td>
                    <td>${t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="profile-panel">
          <h3>Payment history</h3>
          {data.payments.length === 0 && <p className="muted">No payments recorded yet.</p>}
          {data.payments.length > 0 && (
            <table className="data-table">
              <thead><tr><th>Amount</th><th>Method</th><th>Reference</th><th>When</th></tr></thead>
              <tbody>
                {data.payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>${pay.amount}</td>
                    <td>{pay.method_display}</td>
                    <td>{pay.reference || "—"}</td>
                    <td>{fmt(pay.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
