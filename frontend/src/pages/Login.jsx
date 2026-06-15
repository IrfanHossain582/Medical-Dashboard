import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Invalid username or password."
          : err.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form onSubmit={submit} className="login-card">
        <h1>🏥 Medical Dashboard</h1>
        <p className="muted">Sign in to continue</p>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="muted small">Demo: admin / admin12345</p>
        <p className="muted small">
          Are you a patient? <a href="/book">Book an appointment →</a>
        </p>
      </form>
    </div>
  );
}
