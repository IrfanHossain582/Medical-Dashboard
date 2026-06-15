import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SRC = "https://accounts.google.com/gsi/client";

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    if (document.querySelector(`script[src="${SRC}"]`)) {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Renders the official Google Sign-In button. Calls onCredential(idToken) on
 * success. If VITE_GOOGLE_CLIENT_ID isn't set, renders a small hint instead.
 */
export default function GoogleButton({ onCredential }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi().then(() => {
      if (cancelled || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => onCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  if (!CLIENT_ID) {
    return (
      <p className="muted small" style={{ textAlign: "center" }}>
        Google login isn’t configured yet. Set <code>VITE_GOOGLE_CLIENT_ID</code> to enable it.
      </p>
    );
  }

  return <div ref={ref} style={{ display: "flex", justifyContent: "center" }} />;
}
