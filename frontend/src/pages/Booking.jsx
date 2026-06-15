import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import publicClient from "../api/publicClient";
import { patientApi, usePatientAuth } from "../auth/PatientAuthProvider";
import SiteNav from "../site/SiteNav";

const today = () => new Date().toISOString().slice(0, 10);

export default function Booking() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = usePatientAuth();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(today());
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const doctor = doctors.find((d) => String(d.id) === String(doctorId));

  // Booking requires a patient login.
  useEffect(() => {
    if (!authLoading && !user) navigate("/account/login?next=/book");
  }, [authLoading, user]);

  // Prefill the patient's own details.
  useEffect(() => {
    if (user) setForm((s) => ({ ...s, name: s.name || user.name, email: s.email || user.email }));
  }, [user]);

  useEffect(() => {
    publicClient.get("/public/doctors/").then((r) => setDoctors(r.data));
  }, []);

  // Fetch slots when doctor or date changes.
  useEffect(() => {
    if (!doctorId || !date) return;
    setSelectedTime("");
    setLoadingSlots(true);
    publicClient
      .get(`/public/slots/?doctor=${doctorId}&date=${date}`)
      .then((r) => setSlotData(r.data))
      .catch(() => setSlotData(null))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedTime) return setError("Please select a time slot.");
    if (!form.phone && !form.email)
      return setError("Enter a phone number or email so we can reach you.");
    setSubmitting(true);
    try {
      const { data } = await patientApi.post("/patient/book/", {
        doctor: Number(doctorId),
        date,
        time: selectedTime,
        ...form,
      });
      setConfirmation(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Booking failed. Please try again.");
      // Refresh slots in case the slot was just taken.
      publicClient
        .get(`/public/slots/?doctor=${doctorId}&date=${date}`)
        .then((r) => setSlotData(r.data));
      setSelectedTime("");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="book-page">
        <SiteNav />
        <div className="book-card success-card">
          <div className="success-check">✓</div>
          <h2>Appointment confirmed!</h2>
          <p>
            <strong>{confirmation.patient_name}</strong>, your appointment with{" "}
            <strong>{confirmation.doctor_name}</strong> is booked for{" "}
            <strong>{new Date(confirmation.scheduled_for).toLocaleString()}</strong>
            {confirmation.location ? ` at ${confirmation.location}` : ""}.
          </p>
          {confirmation.confirmation_email_sent && (
            <p className="muted">A confirmation email is on its way.</p>
          )}
          <button
            className="primary"
            onClick={() => {
              setConfirmation(null);
              setSelectedTime("");
              setForm({ name: "", phone: "", email: "", reason: "" });
            }}
          >
            Book another appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-page">
      <SiteNav />
      <div className="book-card">
        <h1>Book an Appointment</h1>
        <p className="muted">Choose a doctor, pick an available time, and confirm.</p>

        <div className="book-grid">
          <label>
            Doctor
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialization}
                  {d.location_name ? ` (${d.location_name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              min={today()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {doctor && (
          <p className="fee-note">
            Consultation fee: <strong>${doctor.consultation_fee}</strong>
          </p>
        )}

        {doctorId && (
          <div className="slots-section">
            <h3>Available times</h3>
            {loadingSlots && <p className="muted">Loading slots…</p>}
            {!loadingSlots && slotData && !slotData.has_availability && (
              <p className="muted">No availability this day. Try another date.</p>
            )}
            {!loadingSlots && slotData?.has_availability && (
              <div className="slot-grid">
                {slotData.slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    className={`slot ${selectedTime === s.time ? "selected" : ""}`}
                    onClick={() => setSelectedTime(s.time)}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTime && (
          <form onSubmit={submit} className="book-form">
            <h3>Your details</h3>
            <label>
              Full name
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </label>
            <div className="book-grid">
              <label>
                Phone
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </label>
            </div>
            <label>
              Reason for visit
              <input value={form.reason} onChange={(e) => set("reason", e.target.value)} />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Booking…" : `Confirm ${selectedTime} appointment`}
            </button>
          </form>
        )}

        {error && !selectedTime && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
