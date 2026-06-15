import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import publicClient from "../api/publicClient";
import { patientApi, usePatientAuth } from "../auth/PatientAuthProvider";
import SiteNav from "../site/SiteNav";
import Footer from "../site/Footer";
import HeroSlider from "../site/HeroSlider";

const SERVICES = [
  { icon: "❤️", title: "Cardiology", desc: "Comprehensive heart care, diagnostics, and preventive screening." },
  { icon: "🧠", title: "Neurology", desc: "Expert care for headaches, epilepsy, stroke, and nerve disorders." },
  { icon: "🩺", title: "General Medicine", desc: "Everyday health, check-ups, and chronic condition management." },
  { icon: "👶", title: "Pediatrics", desc: "Gentle, attentive care for infants, children, and teens." },
  { icon: "🦷", title: "Dental Care", desc: "Modern dentistry from routine cleaning to cosmetic work." },
  { icon: "🔬", title: "Lab & Diagnostics", desc: "On-site lab tests and imaging with fast, accurate results." },
];

const FACILITIES = [
  { img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop", title: "Modern Operating Theatres" },
  { img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop", title: "Advanced Diagnostic Imaging" },
  { img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop", title: "Comfortable Patient Rooms" },
];

const STATS = [
  { value: "25+", label: "Specialist Doctors" },
  { value: "50k+", label: "Patients Treated" },
  { value: "15+", label: "Years of Care" },
  { value: "4.9★", label: "Patient Rating" },
];

const TESTIMONIALS = [
  { name: "Sarah M.", text: "Booking online was effortless and the cardiologist was incredibly thorough. Best clinic experience I've had.", avatar: "https://i.pravatar.cc/100?img=5" },
  { name: "James T.", text: "Clean, modern, and the staff genuinely care. My kids actually enjoy their pediatric visits now!", avatar: "https://i.pravatar.cc/100?img=12" },
  { name: "Aisha K.", text: "Got my lab results the same day through a quick, friendly process. Highly recommend Meridian.", avatar: "https://i.pravatar.cc/100?img=32" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = usePatientAuth();
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    publicClient.get("/public/doctors/").then((r) => setDoctors(r.data)).catch(() => {});
  }, []);

  const goBook = () => navigate(user ? "/book" : "/account/login?next=/book");

  return (
    <div className="site">
      <SiteNav />
      <HeroSlider doctors={doctors} onBook={goBook} />

      {/* Services */}
      <section className="section" id="services">
        <div className="section-head">
          <span className="eyebrow">What we offer</span>
          <h2>Comprehensive medical services</h2>
          <p>From everyday check-ups to specialist care — all under one roof.</p>
        </div>
        <div className="service-grid">
          {SERVICES.map((s) => (
            <div key={s.title} className="service-card">
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <button className="text-link link-btn" onClick={goBook}>Book now →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section className="section tint">
        <div className="section-head">
          <span className="eyebrow">Our facilities</span>
          <h2>Built for comfort & precision</h2>
          <p>State-of-the-art equipment in a calm, welcoming environment.</p>
        </div>
        <div className="facility-grid">
          {FACILITIES.map((f) => (
            <div key={f.title} className="facility-card">
              <img src={f.img} alt={f.title} />
              <div className="facility-overlay"><h3>{f.title}</h3></div>
            </div>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section className="section" id="doctors">
        <div className="section-head">
          <span className="eyebrow">Meet the team</span>
          <h2>Our expert doctors</h2>
          <p>Board-certified specialists dedicated to your wellbeing.</p>
        </div>
        <div className="doctor-grid">
          {doctors.map((d) => (
            <div key={d.id} className="doctor-card">
              <div className="doctor-photo">
                <img src={d.photo_url || `https://i.pravatar.cc/400?u=${d.id}`} alt={d.name} />
                <span className="doctor-spec">{d.specialization}</span>
              </div>
              <div className="doctor-body">
                <h3>{d.name}</h3>
                {d.location_name && <p className="doctor-loc">📍 {d.location_name}</p>}
                <p className="doctor-bio">{d.bio}</p>
                <div className="doctor-foot">
                  <span className="fee">${d.consultation_fee}</span>
                  <button className="grad-btn sm" onClick={goBook}>Book</button>
                </div>
              </div>
            </div>
          ))}
          {doctors.length === 0 && <p className="muted">Loading doctors…</p>}
        </div>
      </section>

      {/* Why us + stats */}
      <section className="section why" id="why">
        <div className="why-inner">
          <div className="why-copy">
            <span className="eyebrow">Why choose us</span>
            <h2>Care that goes beyond the appointment</h2>
            <ul className="why-list">
              <li><span>✓</span> Same-day online booking with instant confirmation</li>
              <li><span>✓</span> Transparent pricing — no surprise bills</li>
              <li><span>✓</span> Friendly, multilingual medical staff</li>
              <li><span>✓</span> Digital records & fast lab results</li>
            </ul>
            <button className="grad-btn lg" onClick={goBook}>Start your visit</button>
          </div>
          <div className="stat-row">
            {STATS.map((s) => (
              <div key={s.label} className="stat-glass">
                <strong className="grad-text">{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section tint">
        <div className="section-head">
          <span className="eyebrow">Patient stories</span>
          <h2>Loved by our community</h2>
        </div>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testi-card">
              <div className="stars">★★★★★</div>
              <p>“{t.text}”</p>
              <div className="testi-author">
                <img src={t.avatar} alt={t.name} />
                <strong>{t.name}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <ContactSection user={user} onLogin={() => navigate("/account/login?next=/")} />

      {/* CTA */}
      <section className="cta-band">
        <div className="cta-inner">
          <h2>Ready to feel your best?</h2>
          <p>Book your appointment online in under two minutes.</p>
          <button className="grad-btn lg light" onClick={goBook}>Book an Appointment</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactSection({ user, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [error, setError] = useState("");
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (user) setForm((s) => ({ ...s, name: s.name || user.name, email: s.email || user.email }));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await patientApi.post("/patient/contact/", form);
      setStatus("sent");
      setForm({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.detail || "Could not send message.");
    }
  };

  return (
    <section className="section contact" id="contact">
      <div className="contact-inner">
        <div className="contact-copy">
          <span className="eyebrow">Get in touch</span>
          <h2>We're here to help</h2>
          <p>Have a question about our services, doctors, or your visit? Send us a message and our team will reply shortly.</p>
          <ul className="contact-list">
            <li>📍 123 Wellness Ave, Metropolis</li>
            <li>📞 +1 (555) 010-0100</li>
            <li>✉️ care@meridianhealth.com</li>
          </ul>
        </div>
        <div className="contact-form-wrap">
          {!user ? (
            <div className="contact-locked">
              <span className="lock-icon">🔒</span>
              <h3>Please log in to send a message</h3>
              <p className="muted">Messaging is available to registered patients.</p>
              <button className="grad-btn" onClick={onLogin}>Login to continue</button>
            </div>
          ) : status === "sent" ? (
            <div className="contact-locked">
              <span className="lock-icon">✅</span>
              <h3>Message sent!</h3>
              <p className="muted">Thanks — we'll get back to you soon.</p>
              <button className="ghost-btn" onClick={() => setStatus(null)}>Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="contact-form">
              <label>Name<input value={form.name} onChange={(e) => set("name", e.target.value)} required /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
              <label>Subject<input value={form.subject} onChange={(e) => set("subject", e.target.value)} /></label>
              <label>Message<textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} required /></label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="grad-btn" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
