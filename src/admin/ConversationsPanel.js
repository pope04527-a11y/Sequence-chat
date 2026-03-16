import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConversationListItem from "./ConversationListItem";
import "./Admin.css";
import { ref as dbRef, onValue, off } from "firebase/database";
import { db } from "../firebase";
import { useAdmin } from "./AdminContext";

/*
  ConversationsPanel — updated to include the same client-side auth/login behaviour.
  - Uses sessionStorage key "client_admin_authenticated_v1"
  - When unauthenticated shows a simple landing + sign-in modal.
  - Successful sign-in persists the session and opens the protected admin URL in a new tab.
*/

const SESSION_KEY = "client_admin_authenticated_v1";
const PROTECTED_ADMIN_URL = "https://sequence-chat.onrender.com/admin";

// Hard-coded admin credentials (requested). WARNING: insecure in production.
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

export default function ConversationsPanel() {
  const { activeConversation, setActiveConversation } = useAdmin();
  const navigate = useNavigate();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(readClientAuth());
  const [showModal, setShowModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    function onStorage(e) {
      if (e.key === SESSION_KEY) {
        setIsAuthenticated(readClientAuth());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // login handler (hard-coded credential check)
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

      // Open protected external admin URL in new tab
      try {
        window.open(PROTECTED_ADMIN_URL, "_blank");
      } catch (err) {
        // ignore
      }
    } catch (err) {
      setLoginError("Login error");
      console.error("Admin login failed:", err);
    } finally {
      setLoginLoading(false);
    }
  }

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenConversations, setHiddenConversations] = useState(() => {
    try {
      const raw = localStorage.getItem("hiddenConversations");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "hiddenConversations") {
        try {
          setHiddenConversations(e.newValue ? JSON.parse(e.newValue) : []);
        } catch (err) {
          setHiddenConversations([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const messagesRef = dbRef(db, "messages");

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setList([]);
        setLoading(false);
        return;
      }

      // Convert messages into a list
      const users = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;

          const arr = Object.values(msgs);

          // Sort by time
          arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const last = arr[0] || {};

          let lastMsgText = "";
          if (last.type === "text") lastMsgText = last.text || "";
          else if (last.type === "image") lastMsgText = "📷 Image";
          else if (last.type === "file") lastMsgText = last.fileName || "📁 File";

          return {
            userId,
            lastMessage: lastMsgText,
            lastSender: last.sender || "unknown",
            lastTimestamp: last.createdAt || 0,
            unreadCount: 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setList(users);
      setLoading(false);
    });

    return () => {
      off(messagesRef);
      unsubscribe && unsubscribe();
    };
  }, []);

  // Filter out locally-hidden conversations
  const visibleList = list.filter((c) => !hiddenConversations.includes(c.userId));

  // If not authenticated show landing + sign-in modal
  if (!isAuthenticated) {
    return (
      <div style={{ padding: 18, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Conversations (Admin)</h2>
          <div>
            <button onClick={() => setShowModal(true)} style={{ padding: "8px 12px", borderRadius: 8, background: "#0366d6", color: "#fff", border: "none", cursor: "pointer" }}>
              Sign in
            </button>
          </div>
        </div>

        <div style={{ color: "#444" }}>
          <p>You must sign in to view conversations. Click Sign in and enter the admin password.</p>
          <p>After successful sign-in the protected admin URL ({PROTECTED_ADMIN_URL}) will be opened in a new tab.</p>
        </div>

        {/* Sign-in modal */}
        {showModal && (
          <div
            onClick={() => { setShowModal(false); setLoginError(""); }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <form onSubmit={handleLogin} style={{ width: 380, background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginTop: 0 }}>Admin Login</h3>

              <label style={{ fontSize: 13 }}>Username (optional)</label>
              <input id="modal-admin-username" name="username" placeholder="admin (optional)" style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 6, border: "1px solid #ddd" }} />

              <label style={{ fontSize: 13, marginTop: 12 }}>Password</label>
              <input id="modal-admin-password" name="password" type="password" required style={{ width: "100%", padding: 8, marginTop: 6, borderRadius: 6, border: "1px solid #ddd" }} />

              {loginError && <div style={{ color: "crimson", marginTop: 10 }}>{loginError}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button type="submit" disabled={loginLoading} style={{ flex: 1, padding: "8px 10px", background: "#0366d6", color: "#fff", border: "none", borderRadius: 6 }}>
                  {loginLoading ? "Signing in..." : "Sign in"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setLoginError(""); }} style={{ padding: "8px 10px", background: "#eee", border: "none", borderRadius: 6 }}>
                  Close
                </button>
              </div>

              <div style={{ fontSize: 12, marginTop: 10, color: "#666" }}>
                Note: This is a client-side gate. For robust protection you must use server-side authentication.
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="sidebar-header">
        <h2 className="admin-title">Conversations</h2>
      </div>

      <div className="users-list">
        {loading ? (
          <div className="no-msg">Loading conversations…</div>
        ) : visibleList.length === 0 ? (
          <div className="no-msg">No conversations</div>
        ) : (
          visibleList.map((c) => (
            <ConversationListItem
              key={c.userId}
              user={c}
              active={activeConversation === c.userId}
              onClick={() => {
                setActiveConversation(c.userId);
                navigate(`/admin/chat/${encodeURIComponent(c.userId)}`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
