import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  subscribeToMessages,
  deleteMessage as firebaseDeleteMessage,
  db,
} from "../firebase";
import {
  ref as dbRef,
  remove as dbRemove,
  update as dbUpdate,
  get as dbGet,
} from "firebase/database";
import { useAdmin } from "./AdminContext";
import Composer from "./Composer";
import "./Admin.css";
import ChatMessage from "./ChatMessage";
import DateSeparator from "./DateSeparator";
import { supabase } from "../supabaseClient"; // kept for compatibility with other handlers

// --------------------------- PROTECTION CONFIG ---------------------------
// Protect specific conversations client-side (Giulia). Replace password value.
const PROTECTED_CHATS = {
  Giulia: "@money-2026" // <-- set the password you want for Giulia here
};
const UNLOCKED_KEY = "unlockedProtectedChats_client_v1";

function readUnlocked() {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

function addUnlocked(userId) {
  try {
    const list = readUnlocked();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
      // broadcast storage event for other tabs
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: UNLOCKED_KEY, newValue: JSON.stringify(list) }));
      } catch (e) {
        /* ignore */
      }
    }
  } catch (e) {}
}

// ------------------------- End protection config -------------------------

/**
 * ChatPanel
 *
 * Notes about hooks:
 * - All hooks are declared unconditionally at the top of the component to satisfy
 *   React rules-of-hooks. Rendering may return early for unauthenticated users,
 *   but hooks are always created in the same order.
 */

const SESSION_KEY = "client_admin_authenticated_v1";
const PROTECTED_ADMIN_URL = "https://sequence-chat.onrender.com/admin";

// Hard-coded admin credentials (requested). WARNING: insecure in production.
const ADMIN_USERNAME = "Keymus-commerce1128";
const ADMIN_PASSWORD = "Keymus-2026";
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

function formatDateHeader(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const dayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const yesterdayStart = dayStart - 24 * 60 * 60 * 1000;

  if (ts >= dayStart) return "Today";
  if (ts >= yesterdayStart) return "Yesterday";
  return d.toLocaleDateString();
}

export default function ChatPanel() {
  const {
    activeConversation,
    agentId,
    sendFileMessage,
    sendTextMessage,
    setActiveConversation, // used to navigate back after hiding a conversation
  } = useAdmin();

  // Authentication state (client-only guard)
  const [isAuthenticated, setIsAuthenticated] = useState(readClientAuth());
  const [showModal, setShowModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Data & UI state (always declared)
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [uploads, setUploads] = useState({});
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef(null); // sentinel at bottom for scrollIntoView
  const bodyRef = useRef(null); // the scrolling container
  const isAtBottomRef = useRef(true); // track whether user is at bottom

  // Protection state (always declared)
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Keep local copy of grouped/messages derived values as normal
  // (they will be computed below when needed)
  // ---------- Hooks that were previously conditional are now declared here ----------

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

  // Primary login handler (modal) - hard-coded check now
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
      // Hard-coded credential check:
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

      // Open external protected admin URL after successful sign-in
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

  // helper to scroll to bottom
  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = bodyRef.current;
    if (!el) return;
    // set scrollTop first then ensure sentinel into view so it works across browsers
    el.scrollTop = el.scrollHeight;
    scrollRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setShowJump(false);
  }, []);

  // onScroll handler to track if user is near bottom
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120; // px from bottom to consider "at bottom"
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      isAtBottomRef.current = atBottom;
      setShowJump(!atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // run once to initialize
    onScroll();

    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Update protection state when activeConversation changes or when unlocked list changes
  useEffect(() => {
    const check = () => {
      if (!activeConversation) {
        setIsProtected(false);
        setIsUnlocked(false);
        return;
      }
      const prot = PROTECTED_CHATS && Object.prototype.hasOwnProperty.call(PROTECTED_CHATS, activeConversation);
      setIsProtected(Boolean(prot));
      if (!prot) {
        setIsUnlocked(true);
        setShowUnlockModal(false);
      } else {
        const unlockedList = readUnlocked();
        const unlocked = unlockedList.includes(activeConversation);
        setIsUnlocked(unlocked);
        // If protected and not unlocked, do not auto-open chat; show modal
        if (!unlocked) {
          setShowUnlockModal(true);
        } else {
          setShowUnlockModal(false);
        }
      }
    };

    check();

    // Listen for cross-tab unlocked changes
    function onStorage(e) {
      if (e.key === UNLOCKED_KEY) {
        check();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [activeConversation]);

  // subscribe to messages ONLY when conversation present AND (not protected OR unlocked)
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setReplyTo(null);
      return;
    }

    if (isProtected && !isUnlocked) {
      // Do not subscribe to Firebase for protected locked conversation
      setMessages([]);
      return;
    }

    // Normal subscription flow
    const unsub = subscribeToMessages(activeConversation, (msgs) => {
      // msgs is expected to be an array
      setMessages(msgs);

      // After DOM updates, scroll only if user was at bottom
      setTimeout(() => {
        if (isAtBottomRef.current) {
          if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
          setShowJump(false);
        } else {
          setShowJump(true);
        }
      }, 60);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [activeConversation, isProtected, isUnlocked]);

  const messageById = messages.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});

  const grouped = [];
  let lastDay = null;
  messages.forEach((m) => {
    const day = new Date(m.createdAt || 0);
    const dayKey = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate()
    ).getTime();
    if (lastDay !== dayKey) {
      grouped.push({ type: "date", ts: m.createdAt, key: `d-${dayKey}` });
      lastDay = dayKey;
    }
    grouped.push({ type: "msg", msg: m, key: m.id });
  });

  const handleSendText = async (text) => {
    if (!activeConversation) return;

    if (isProtected && !isUnlocked) {
      alert("This conversation is protected. Unlock it before sending messages.");
      return;
    }

    try {
      await sendTextMessage(
        activeConversation,
        {
          text,
          sender: agentId,
          type: "text",
        },
        replyTo
      );
    } catch (e) {
      console.error("Admin text send failed:", e);
      alert("Failed to send message.");
    }

    setReplyTo(null);
  };

  const handleSendFile = async (file, onProgress) => {
    if (!activeConversation || !sendFileMessage) return;
    if (isProtected && !isUnlocked) {
      alert("This conversation is protected. Unlock it before sending files.");
      return;
    }
    const tempId = `upload_${Date.now()}`;
    setUploads((u) => ({
      ...u,
      [tempId]: { name: file.name, progress: 0 },
    }));

    try {
      await sendFileMessage(activeConversation, file, {}, (percent) => {
        setUploads((u) => ({
          ...u,
          [tempId]: { name: file.name, progress: percent },
        }));
      });
    } catch (err) {
      console.error("upload failed", err);
      alert("Upload failed");
    } finally {
      setUploads((u) => {
        const next = { ...u };
        delete next[tempId];
        return next;
      });
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    const el = document.querySelector(".message-input, textarea");
    if (el) el.focus();
  };

  const handleDelete = async (message) => {
    if (!activeConversation || !message?.id) return;
    if (isProtected && !isUnlocked) {
      alert("This conversation is protected. Unlock it before deleting messages.");
      return;
    }
    try {
      await firebaseDeleteMessage(activeConversation, message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (e) {
      console.error("delete failed", e);
      alert("Failed to delete message");
    }
  };

  // Admin action: block user (mark conversation and user meta)
  const handleBlockUser = useCallback(async () => {
    if (!activeConversation) return;
    const ok = window.confirm("Block this user? They will be marked blocked.");
    if (!ok) return;
    try {
      await dbUpdate(dbRef(db, `meta/conversations/${activeConversation}`), {
        status: "blocked",
        blockedAt: Date.now(),
      });
      await dbUpdate(dbRef(db, `meta/users/${activeConversation}`), {
        is_blocked: true,
        blockedAt: Date.now(),
      });
      alert("User blocked.");
    } catch (err) {
      console.error("Failed to block user", err);
      alert("Failed to block user: " + (err.message || err));
    }
  }, [activeConversation]);

  // Admin action: delete entire conversation (remove messages + update meta)
  const handleDeleteConversation = useCallback(async () => {
    if (!activeConversation) return;
    const ok = window.confirm("Delete this conversation and all messages? This is irreversible.");
    if (!ok) return;
    try {
      await dbRemove(dbRef(db, `messages/${activeConversation}`));
      await dbUpdate(dbRef(db, `meta/conversations/${activeConversation}`), {
        lastMessage: null,
        lastSender: null,
        lastTimestamp: null,
        status: "deleted",
        deletedAt: Date.now(),
      });
      // optional: mark user meta as deleted
      await dbUpdate(dbRef(db, `meta/users/${activeConversation}`), {
        is_deleted: true,
        deletedAt: Date.now(),
      });

      // clear local UI
      setMessages([]);
      setReplyTo(null);
      alert("Conversation deleted.");
    } catch (err) {
      console.error("Failed to delete conversation", err);
      alert("Failed to delete conversation: " + (err.message || err));
    }
  }, [activeConversation]);

  // NEW: Hide conversation locally from admin panel only (no DB changes)
  const handleHideConversationLocally = useCallback(() => {
    if (!activeConversation) return;
    const ok = window.confirm(
      "Remove this conversation from the admin panel view? This only hides it locally and does NOT delete data from the database. Continue?"
    );
    if (!ok) return;

    try {
      const raw = localStorage.getItem("hiddenConversations");
      let hidden = [];
      if (raw) {
        try {
          hidden = JSON.parse(raw) || [];
        } catch (e) {
          hidden = [];
        }
      }

      if (!hidden.includes(activeConversation)) {
        hidden.push(activeConversation);
        localStorage.setItem("hiddenConversations", JSON.stringify(hidden));
      }

      // Clear UI and navigate back to /admin
      setMessages([]);
      setReplyTo(null);

      setActiveConversation(null);

      try {
        window.history.pushState({}, "", "/admin");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (e) {}
      alert("Conversation removed from this panel. To restore, remove it from the browser's localStorage key 'hiddenConversations'.");
    } catch (err) {
      console.error("Failed to hide conversation locally:", err);
      alert("Failed to remove conversation from panel.");
    }
  }, [activeConversation, setActiveConversation]);

  // Unlock modal submit
  const submitUnlock = (e) => {
    e && e.preventDefault();
    if (!activeConversation) return;
    const expected = PROTECTED_CHATS[activeConversation];
    if (unlockPwd === expected) {
      addUnlocked(activeConversation);
      setIsUnlocked(true);
      setShowUnlockModal(false);
      setUnlockPwd("");
      setUnlockError("");
    } else {
      setUnlockError("Incorrect password");
    }
  };

  // If not authenticated show landing + sign-in UI (hooks declared above)
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", padding: 20, boxSizing: "border-box", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800
            }}>SC</div>
            <div>
              <div style={{ fontWeight: 800 }}>Stacks Chat</div>
              <div style={{ fontSize: 12, color: "#666" }}>Admin Portal</div>
            </div>
          </div>

          <div>
            <button onClick={() => setShowModal(true)} style={{ padding: "8px 12px", borderRadius: 8, background: "#0366d6", color: "#fff", border: "none", cursor: "pointer" }}>
              Sign in
            </button>
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Admin Chat — sign in required</h2>
          <p>You must sign in locally to access protected admin chat features. Click Sign in to open the secure dialog.</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowModal(true)} style={{ padding: "10px 14px", borderRadius: 8, background: "linear-gradient(90deg,#06b6d4,#2563eb)", color: "#071035", border: "none", fontWeight: 800 }}>
              Open sign‑in
            </button>
          </div>
        </div>

        {/* Modal for credentials */}
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
            <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "92%", background: "#0b1220", borderRadius: 12, padding: 22, boxShadow: "0 30px 70px rgba(2,6,23,0.6)", border: "1px solid rgba(255,255,255,0.04)", color: "#fff" }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Administrator sign in</h3>
              <div style={{ marginBottom: 12, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Use your administrator credentials.</div>

              <div style={{ marginBottom: 10 }}>
                <input id="modal-admin-username" placeholder="Username (optional)" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff" }} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <input id="modal-admin-password" placeholder="Password" type="password" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff" }} />
              </div>

              {loginError && <div style={{ color: "#ff8b8b", marginBottom: 10 }}>{loginError}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={(e) => handleLogin(e)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "linear-gradient(90deg,#06b6d4,#2563eb)", color: "#071035", border: "none", fontWeight: 700 }}>
                  {loginLoading ? "Signing in..." : "Sign in"}
                </button>

                <button onClick={() => { setShowModal(false); setLoginError(""); }} style={{ padding: "10px 12px", borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontWeight: 700 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal ChatPanel UI when not protected or unlocked
  return (
    <div className="admin-chat">
      <div className="chat-stage" style={{ position: "relative" }}>
        <div className="adminchat-header">
          {/* Presentational avatar to match Admin.css (no logic change) */}
          <div
            className="adminchat-header-avatar"
            title={activeConversation || "Conversation"}
          >
            {activeConversation ? activeConversation.charAt(0).toUpperCase() : "?"}
          </div>

          <div className="adminchat-header-info">
            <div className="adminchat-header-name">
              Chat with <strong>{activeConversation}</strong>
            </div>
            <div className="adminchat-header-status">Admin: {agentId}</div>
          </div>

          {/* Admin action buttons (block user / delete convo / hide locally) */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={handleBlockUser}
              title="Block user"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid rgba(0,0,0,0.06)"
              }}
            >
              Block
            </button>
            <button
              onClick={handleDeleteConversation}
              title="Delete conversation"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: "#ffdede",
                border: "1px solid rgba(0,0,0,0.04)",
                color: "#9a1a1a",
                fontWeight: 600
              }}
            >
              Delete Conversation
            </button>

            {/* Hide locally button (no DB changes) */}
            <button
              onClick={handleHideConversationLocally}
              title="Remove from panel (local only)"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: "#4b5563",
                border: "1px solid rgba(0,0,0,0.06)",
                color: "#fff",
                fontWeight: 700
              }}
            >
              Remove from panel
            </button>
          </div>
        </div>

        <div className="adminchat-body" ref={bodyRef}>
          <div className="messages-inner">
            {grouped.length === 0 ? (
              <div className="no-msg">No messages yet</div>
            ) : (
              grouped.map((item) =>
                item.type === "date" ? (
                  <DateSeparator key={item.key} label={formatDateHeader(item.ts)} />
                ) : (
                  <ChatMessage
                    key={item.msg.id}
                    m={item.msg}
                    isAdmin={item.msg.sender === agentId}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onDownload={() =>
                      item.msg.url && window.open(item.msg.url, "_blank")
                    }
                    repliedMessage={
                      item.msg.replyTo ? messageById[item.msg.replyTo] : null
                    }
                  />
                )
              )
            )}

            {Object.entries(uploads).map(([k, u]) => (
              <div key={k} className="upload-bubble">
                <div className="upload-name">{u.name}</div>
                <div className="upload-bar">
                  <div
                    className="upload-bar-fill"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
            ))}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Jump to latest button */}
        {showJump && (
          <button
            onClick={() => scrollToBottom("smooth")}
            aria-label="Jump to latest"
            style={{
              position: "absolute",
              right: 20,
              bottom: 84, // above the composer
              zIndex: 60,
              background: "linear-gradient(180deg,#6b63ff,#5348e6)",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 12,
              boxShadow: "0 8px 20px rgba(83,72,230,0.12)",
              cursor: "pointer",
            }}
          >
            Jump to latest
          </button>
        )}

        <div className="adminchat-inputbar">
          <Composer
            onSendText={handleSendText}
            onSendFile={handleSendFile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onTyping={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
