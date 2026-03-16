// src/admin/AdminPanel.js
// Ensure we read from the "messages" root (NOT "chats") so admin opens the same path users write to.
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import AdminChat from "./AdminChat";
import "./Admin.css";
import { db } from "../firebase";

/*
  Added a small client-side admin gate (matching the auth/login behaviour you requested).
  - Uses the same sessionStorage key: "client_admin_authenticated_v1"
  - When not authenticated, a landing view + Sign in button is shown and a modal prompts for credentials.
  - Successful sign-in stores the session key and reveals the admin UI (client-side only).
  - After successful sign-in the protected external admin URL is opened in a new tab.
  - NOTE: Hard-coded credentials are present below as requested. This is INSECURE for production.
*/

const SESSION_KEY = "client_admin_authenticated_v1";
const PROTECTED_ADMIN_URL = "https://sequence-chat.onrender.com/admin";

/*
  Hard-coded admin credentials (as requested).
  - ADMIN_USERNAME and ADMIN_PASSWORD must match exactly to sign in when a username is provided.
  - DEFAULT_GLOBAL_PASSWORD is accepted when username is left empty (global password).
  WARNING: These values live in client-side JS and can be read by anyone who fetches the bundle.
*/
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Cs-Channel-2026";
const DEFAULT_GLOBAL_PASSWORD = "Chat-with-us";

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

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AdminPanel() {
  // Authentication state (client-only guard)
  const [isAuthenticated, setIsAuthenticated] = useState(readClientAuth());
  const [showModal, setShowModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  // Sync auth from other tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === SESSION_KEY) {
        setIsAuthenticated(readClientAuth());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
      // Hard-coded check:
      // - If username provided, require exact match to ADMIN_USERNAME/ADMIN_PASSWORD
      // - If username empty, require DEFAULT_GLOBAL_PASSWORD
      let ok = false;
      if (username) {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) ok = true;
      } else {
        if (password === DEFAULT_GLOBAL_PASSWORD) ok = true;
      }

      if (!ok) {
        setLoginError("Invalid username or password");
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

      // Open the protected external admin URL in a new tab after successful login
      try {
        window.open(PROTECTED_ADMIN_URL, "_blank");
      } catch (err) {
        // ignore
      }
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

  useEffect(() => {
    const messagesRef = ref(db, "messages");

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUsers([]);
        return;
      }

      const userList = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;
          const msgArray = Object.entries(msgs).map(([k, v]) => ({
            id: k,
            ...v,
          }));
          // newest first
          msgArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const lastMsg = msgArray[0];

          return {
            userId,
            lastMessage: lastMsg ? (lastMsg.type === "image" ? "Image" : lastMsg.text || "") : "",
            lastTimestamp: lastMsg?.createdAt || 0,
          };
        })
        .filter(Boolean);

      userList.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setUsers(userList);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // set default active user when users change (pick most recent)
  useEffect(() => {
    if (!activeUser && users.length > 0) {
      setActiveUser(users[0].userId);
    }
  }, [users, activeUser]);

  // If not authenticated, show landing + sign-in modal (client-side gate)
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", color: "#111" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, boxShadow: "0 10px 30px rgba(37,99,235,0.18)"
            }}>
              SC
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Stacks Chat</div>
              <div style={{ fontSize: 12, opacity: 0.95 }}>Admin Portal</div>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#0366d6",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(0,0,0,0.14)"
              }}
            >
              Sign in
            </button>
          </div>
        </header>

        <main style={{ padding: 28 }}>
          <h1 style={{ fontSize: 28, margin: "6px 0 8px 0" }}>Admin Panel — sign in required</h1>
          <p style={{ maxWidth: 760, color: "#444" }}>
            This admin console is protected. Sign in to access conversations and chat with users.
            After successful sign-in the protected admin page ({PROTECTED_ADMIN_URL}) will be opened in a new tab.
          </p>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "linear-gradient(90deg,#06b6d4,#2563eb)",
                color: "#071035",
                border: "none",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Open sign‑in
            </button>
          </div>
        </main>

        <footer style={{ textAlign: "center", padding: 16, color: "#666" }}>
          © {new Date().getFullYear()} Stacks Chat — Admin
        </footer>

        {/* Modal for credentials (only modal now) */}
        {showModal && (
          <div
            onClick={() => { setShowModal(false); setLoginError(""); }}
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
                  onClick={() => { setShowModal(false); setLoginError(""); }}
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

  // Authenticated: original AdminPanel UI (unchanged)
  return (
    <div className="admin-container">
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

      {/* LEFT SIDEBAR (user list) */}
      <div className="admin-users">
        <h2 className="admin-title">Users</h2>

        {users.length === 0 && <div className="no-msg">No conversations yet</div>}

        {users.map((u) => (
          <div
            key={u.userId}
            className={`user-item ${activeUser === u.userId ? "active" : ""}`}
            onClick={() => setActiveUser(u.userId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveUser(u.userId)}
          >
            <div className="user-left">
              <div className="user-avatar" title={u.userId}>
                {u.userId?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="user-meta">
                <div className="user-id">{u.userId}</div>
                <div className="last-msg">{u.lastMessage}</div>
              </div>
            </div>

            <div className="user-right">
              <div className="time">{formatTime(u.lastTimestamp)}</div>
              {/* badge placeholder (if you have unread counts, render inside .badge) */}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE (chat window) */}
      <div className="admin-chat">
        {activeUser ? (
          <AdminChat userId={activeUser} />
        ) : (
          <div className="empty-state">
            <p>Select a user to chat</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
