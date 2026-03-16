import React, { useEffect, useState } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import ConversationsPanel from "./ConversationsPanel";
import ChatPanel from "./ChatPanel";
import "./Admin.css";

/*
  AdminApp (client-guarded)

  - Intro text and feature highlights are shown on the landing page.
  - There is a single top-right "Sign in" button. The inline sign-in card has been removed
    as requested. The sign-in process happens via a modal opened by that button.
  - Client-only protection uses a sessionStorage key; this does NOT replace server-side auth.
  - When signed in (client-side), the Admin UI mounts.
*/

// Session storage key used by the client-only admin gate
const SESSION_KEY = "client_admin_authenticated_v1";

// Helper to read auth state from sessionStorage
function readClientAuth() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.ok;
  } catch (e) {
    return false;
  }
}

function AdminAppInner() {
  const { setActiveConversation } = useAdmin();

  useEffect(() => {
    function syncFromPath() {
      try {
        const path = window.location.pathname || "";
        const match = path.match(/\/admin\/chat\/([^/]+)/);
        if (match && match[1]) {
          setActiveConversation(decodeURIComponent(match[1]));
        }
      } catch (e) {
        console.warn("Failed to sync path to active conversation", e);
      }
    }
    syncFromPath();
    const onPop = () => syncFromPath();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setActiveConversation]);

  return (
    <div className="admin-container" style={{ display: "flex", alignItems: "stretch", height: "100vh" }}>
      <ConversationsPanel />
      <div className="admin-main" style={{ flex: 1, minWidth: 0 }}>
        <ChatPanel />
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(readClientAuth());
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === SESSION_KEY) {
        setIsAuthenticated(readClientAuth());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Background image path (from public folder). Encode in case of spaces.
  const backgroundImageUrl = encodeURI("/ChatGPT Image Dec 6, 2025, 06_09_52 AM.png");

  // Primary login handler (modal)
  async function handleLogin(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const username = document.getElementById("modal-admin-username")?.value?.trim() || "";
    const password = document.getElementById("modal-admin-password")?.value || "";

    if (!password) {
      setLoginError("Password is required");
      setLoginLoading(false);
      return;
    }

    try {
      // Client-only acceptance: require non-empty password.
      // Replace this with a secret check if you want a fixed password in the bundle.
      const ok = password.length > 0;
      if (!ok) {
        setLoginError("Invalid credentials");
        setLoginLoading(false);
        return;
      }

      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ok: true, username: username || null, t: Date.now() }));
      } catch (err) {
        console.warn("Failed to persist admin session:", err);
      }

      setIsAuthenticated(true);
      setShowModal(false);
    } catch (err) {
      console.error("Admin login failed:", err);
      setLoginError("Login error");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    setIsAuthenticated(false);
  }

  // If authenticated, render the admin UI
  if (isAuthenticated) {
    return (
      <>
        <div style={{ position: "absolute", right: 12, top: 12, zIndex: 1000 }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
            }}
          >
            Logout
          </button>
        </div>
        <AdminProvider>
          <AdminAppInner />
        </AdminProvider>
      </>
    );
  }

  // Not authenticated: landing page with intro, features, and a single top-right Sign in button
  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(7,12,25,0.62), rgba(7,12,25,0.62)), url("${backgroundImageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          zIndex: -1,
          filter: "saturate(1.02) contrast(1.03)"
        }}
      />

      {/* Responsive tweaks */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; padding: 20px; }
          .hero-left { text-align: center; }
        }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg,#2563eb,#06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            boxShadow: "0 10px 30px rgba(37,99,235,0.18)"
          }}>
            SC
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Stacks Chat</div>
            <div style={{ fontSize: 12, opacity: 0.95 }}>Admin Portal</div>
          </div>
        </div>

        <div>
          {/* Top-right sign-in button opens modal */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.10)",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(0,0,0,0.14)"
            }}
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Main: Intro text then feature bullets (no inline card) */}
      <main style={{ display: "flex", justifyContent: "center", padding: "36px 20px 60px" }}>
        <div className="hero-grid" style={{ width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          {/* Left: Intro copy */}
          <div className="hero-left" style={{ color: "#fff" }}>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>Welcome to your admin workspace</h1>
            <p style={{ marginTop: 12, fontSize: 16, color: "rgba(255,255,255,0.92)", maxWidth: 680 }}>
              Monitor conversations, assist users, and moderate content with ease. Use the sign-in button to continue to the admin workspace.
            </p>

            <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18
                }}>⚡</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Real-time</div>
                  <div style={{ color: "rgba(255,255,255,0.85)" }}>Instant conversation updates</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18
                }}>🔒</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Controls</div>
                  <div style={{ color: "rgba(255,255,255,0.85)" }}>Block, remove, and manage interactions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Decorative panel prompting sign-in (inline, not a card for credentials) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 14,
              padding: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 18px 50px rgba(2,6,23,0.55)",
              color: "#fff",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Ready to manage</div>
              <div style={{ color: "rgba(255,255,255,0.88)", marginBottom: 14 }}>Click the Sign in button at the top-right to open the secure sign-in dialog.</div>

              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(90deg,#06b6d4,#2563eb)",
                  color: "#071035",
                  border: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 32px rgba(6,182,212,0.12)"
                }}
              >
                Open sign-in
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "18px 20px", color: "rgba(255,255,255,0.9)", fontSize: 13 }}>
        © {new Date().getFullYear()} Stacks Chat — Admin
      </footer>

      {/* Modal for credentials (only modal now) */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.68)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2200
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: "92%",
              background: "#0b1220",
              borderRadius: 12,
              padding: 22,
              boxShadow: "0 30px 70px rgba(2,6,23,0.6)",
              border: "1px solid rgba(255,255,255,0.04)",
              color: "#fff"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>Administrator sign in</h3>
            <div style={{ marginBottom: 12, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              Use your administrator credentials.
            </div>

            <div style={{ marginBottom: 10 }}>
              <input id="modal-admin-username" placeholder="Username (optional)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#fff",
                  outline: "none",
                  fontSize: 14
                }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <input id="modal-admin-password" placeholder="Password" type="password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#fff",
                  outline: "none",
                  fontSize: 14
                }} />
            </div>

            {loginError && <div style={{ color: "#ff8b8b", marginBottom: 10 }}>{loginError}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={(e) => handleLogin(e)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "linear-gradient(90deg,#06b6d4,#2563eb)",
                  color: "#071035",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {loginLoading ? "Signing in..." : "Sign in"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  fontWeight: 700
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
