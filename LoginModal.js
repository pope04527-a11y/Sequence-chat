import React, { useState } from "react";

export default function LoginModal({ onClose, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    const res = await onLogin({ username: username.trim() || undefined, password });
    setLoading(false);
    if (res && res.success) {
      onClose && onClose();
    } else {
      setError(res.message || "Login failed");
    }
  };

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, right: 0, bottom: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", zIndex: 9999
    }}>
      <form onSubmit={submit} style={{
        background: "#fff", padding: 20, borderRadius: 8, width: 360, boxShadow: "0 8px 30px rgba(0,0,0,0.15)"
      }}>
        <h3 style={{ marginTop: 0 }}>Admin Login</h3>

        <label style={{ fontSize: 13 }}>Username (optional)</label>
        <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }} />

        <label style={{ fontSize: 13, marginTop: 12 }}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: 8, marginTop: 6 }} />

        {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: "8px 10px" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button type="button" onClick={() => onClose && onClose()} style={{ padding: "8px 10px" }}>
            Cancel
          </button>
        </div>
        <div style={{ fontSize: 12, marginTop: 8, color: "#666" }}>
          You may log in with an admin username/password or with the global admin password.
        </div>
      </form>
    </div>
  );
}
