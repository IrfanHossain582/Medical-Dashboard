import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const ACCESS = "mdp_access";
const REFRESH = "mdp_refresh";

// Dedicated axios client for the patient website session.
export const patientApi = axios.create({ baseURL });
patientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PatientAuthContext = createContext(null);

export function PatientAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    if (!localStorage.getItem(ACCESS)) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await patientApi.get("/patient/me/");
      setUser(data.user);
    } catch {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const storeSession = (data) => {
    localStorage.setItem(ACCESS, data.access);
    if (data.refresh) localStorage.setItem(REFRESH, data.refresh);
    setUser(data.user);
  };

  // Email/password login uses the shared JWT token endpoint (username = email).
  const login = async (email, password) => {
    const { data } = await patientApi.post("/auth/token/", { username: email, password });
    localStorage.setItem(ACCESS, data.access);
    localStorage.setItem(REFRESH, data.refresh);
    await loadMe();
  };

  const register = async (payload) => {
    const { data } = await patientApi.post("/patient/register/", payload);
    storeSession(data);
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await patientApi.post("/patient/google/", { credential });
    storeSession(data);
  };

  const logout = () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    setUser(null);
  };

  return (
    <PatientAuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout, reload: loadMe }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error("usePatientAuth must be used within a PatientAuthProvider");
  return ctx;
}
