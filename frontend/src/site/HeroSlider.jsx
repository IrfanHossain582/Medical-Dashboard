import { useEffect, useState } from "react";

/**
 * Hero slider that cycles through doctors, showing a large faded
 * "Meet Dr. X" headline behind the doctor's photo, with credentials and stats.
 */
export default function HeroSlider({ doctors, onBook }) {
  const [i, setI] = useState(0);
  const has = doctors.length > 0;

  useEffect(() => {
    if (doctors.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % doctors.length), 5000);
    return () => clearInterval(t);
  }, [doctors.length]);

  const d = has ? doctors[i] : null;
  const go = (n) => setI((n + doctors.length) % doctors.length);

  return (
    <section className="hero2">
      <div className="hero2-lines" />
      <div className="hero2-inner">
        <span className="pill">✚ Trusted care since 2009</span>

        <h1 className="hero2-title">
          Meet <span className="grad-text">{d ? d.name : "our doctors"}</span>
        </h1>

        <div className="hero2-stage">
          <div className="hero2-photo" key={d?.id}>
            {d && (
              <img src={d.photo_url || `https://i.pravatar.cc/600?u=${d.id}`} alt={d.name} />
            )}
          </div>

          {d && (
            <div className="hero2-cred">
              <span className="cred-spec">{d.specialization}</span>
              {d.location_name && <span className="cred-loc">📍 {d.location_name}</span>}
            </div>
          )}

          <button className="grad-btn lg hero2-book" onClick={onBook}>
            Book Appointment ↗
          </button>

          <div className="hero2-stats">
            <div>
              <strong>10k+</strong>
              <span>Satisfied Patients</span>
            </div>
            <div>
              <strong>10+</strong>
              <span>Years of Experience</span>
            </div>
          </div>
        </div>

        {doctors.length > 1 && (
          <div className="hero2-nav">
            <button onClick={() => go(i - 1)} aria-label="Previous">‹</button>
            <div className="hero2-dots">
              {doctors.map((_, n) => (
                <span
                  key={n}
                  className={n === i ? "active" : ""}
                  onClick={() => setI(n)}
                />
              ))}
            </div>
            <button onClick={() => go(i + 1)} aria-label="Next">›</button>
          </div>
        )}
      </div>
    </section>
  );
}
