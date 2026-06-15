import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../auth/PatientAuthProvider";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#doctors", label: "Doctors" },
  { href: "/#why", label: "Why Us" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = usePatientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goBook = () => navigate(user ? "/book" : "/account/login?next=/book");

  return (
    <header className={`site-nav ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="site-logo">
        <span className="logo-mark">✚</span> Meridian<span>Health</span>
      </Link>
      <nav className="site-links">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="site-nav-actions">
        {user ? (
          <div className="account-chip">
            <Link to="/account" className="ghost-btn">
              <span className="chip-avatar">{(user.name || "U")[0].toUpperCase()}</span>
              My Account
            </Link>
            <button className="link-btn" onClick={() => { logout(); navigate("/"); }}>
              Log out
            </button>
          </div>
        ) : (
          <Link to="/account/login" className="ghost-btn">
            Login
          </Link>
        )}
        <button className="grad-btn" onClick={goBook}>
          Book Appointment
        </button>
      </div>
    </header>
  );
}
