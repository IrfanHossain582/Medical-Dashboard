import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/patients", label: "Patients", icon: "🧑" },
  { to: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { to: "/admin/appointments", label: "Appointments", icon: "📅" },
  { to: "/admin/tests", label: "Test Catalogue", icon: "🧪" },
  { to: "/admin/test-orders", label: "Lab & Diagnostics", icon: "🔬" },
  { to: "/admin/payments", label: "Payments", icon: "💳" },
  { to: "/admin/messages", label: "Messages", icon: "✉️" },
  { to: "/admin/locations", label: "Locations", icon: "📍" },
  { to: "/admin/staff", label: "Staff & Roles", icon: "🔑" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">✚ Meridian Admin</div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="muted small">{user?.email || user?.username}</div>
          <div className="badge">{user?.role}</div>
          <button
            className="link-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
