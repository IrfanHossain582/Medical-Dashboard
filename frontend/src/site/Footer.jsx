import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-grid">
        <div>
          <div className="site-logo light">
            <span className="logo-mark">✚</span> Meridian<span>Health</span>
          </div>
          <p className="footer-tag">
            Premium, compassionate healthcare for your whole family — backed by
            modern technology and world-class specialists.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="#services">Services</a>
          <a href="#doctors">Our Doctors</a>
          <a href="#why">Why Choose Us</a>
          <Link to="/book">Book Appointment</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <p>📍 123 Wellness Ave, Metropolis</p>
          <p>📞 +1 (555) 010-0100</p>
          <p>✉️ care@meridianhealth.com</p>
          <p>🕘 Mon–Fri · 9:00–18:00</p>
        </div>
        <div>
          <h4>For Patients</h4>
          <Link to="/book">Book an appointment</Link>
          <Link to="/account">My account</Link>
          <a href="#why">Patient stories</a>
        </div>
      </div>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} Meridian Health. All rights reserved.</span>
        <span>Built with care · Privacy · Terms</span>
      </div>
    </footer>
  );
}
