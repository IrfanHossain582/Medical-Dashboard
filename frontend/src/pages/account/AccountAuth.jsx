import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePatientAuth } from "../../auth/PatientAuthProvider";
import GoogleButton from "../../auth/GoogleButton";
import SiteNav from "../../site/SiteNav";

export default function AccountAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/account";
  const { login, register, loginWithGoogle } = usePatientAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate(next);
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
          (data && typeof data === "object" ? Object.values(data).flat().join(" ") : null) ||
          (err.response?.status === 401 ? "Invalid email or password." : "Something went wrong.")
      );
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (credential) => {
    setError("");
    try {
      await loginWithGoogle(credential);
      navigate(next);
    } catch (err) {
      setError(err.response?.data?.detail || "Google login failed.");
    }
  };

  return (
    <div className="book-page">
      <SiteNav />
      <div className="book-card auth-card">
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Log in to book appointments and view your history."
            : "Sign up to book appointments and track your visits."}
        </p>

        <div className="google-wrap">
          <GoogleButton onCredential={onGoogle} />
        </div>
        <div className="divider"><span>or</span></div>

        <form onSubmit={submit} className="book-form">
          {mode === "register" && (
            <label>
              Full name
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </label>
          {mode === "register" && (
            <label>
              Phone
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="muted small" style={{ textAlign: "center", marginTop: 14 }}>
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            className="link-btn"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
        <p className="muted small" style={{ textAlign: "center" }}>
          <Link to="/">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
