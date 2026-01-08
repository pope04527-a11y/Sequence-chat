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

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [uploads, setUploads] = useState({});
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef(null); // sentinel at bottom for scrollIntoView
  const bodyRef = useRef(null); // the scrolling container
  const isAtBottomRef = useRef(true); // track whether user is at bottom

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

  // subscribe to messages
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setReplyTo(null);
      return;
    }

    const unsub = subscribeToMessages(activeConversation, (msgs) => {
      // msgs is expected to be an array
      setMessages(msgs);

      // After DOM updates, scroll only if user was at bottom
      setTimeout(() => {
        if (isAtBottomRef.current) {
          // user is at bottom => auto-scroll
          if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
          setShowJump(false);
        } else {
          // user has scrolled up: don't auto-scroll; show jump button
          setShowJump(true);
        }
      }, 60);
    });

    return () => unsub && unsub();
  }, [activeConversation]);

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
  // This stores the hidden conversation id in localStorage under "hiddenConversations"
  // and clears the activeConversation in the UI.
  const handleHideConversationLocally = useCallback(() => {
    if (!activeConversation) return;
    const ok = window.confirm(
      "Remove this conversation from the admin panel view? This only hides it locally and does NOT delete data from the database. Continue?"
    );
    if (!ok) return;

    try {
      // Read existing hidden list
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

      // Clear active conversation in context (if available)
      if (typeof setActiveConversation === "function") {
        setActiveConversation(null);
      }

      // Update URL to /admin so AdminApp syncs to no active chat
      try {
        window.history.pushState({}, "", "/admin");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (e) {
        // ignore; not critical
      }

      alert("Conversation removed from this panel. To restore, remove it from the browser's localStorage key 'hiddenConversations'.");
    } catch (err) {
      console.error("Failed to hide conversation locally:", err);
      alert("Failed to remove conversation from panel.");
    }
  }, [activeConversation, setActiveConversation]);

  if (!activeConversation)
    return <div className="empty-state">Select a conversation</div>;

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
          {/* messages-inner is a constrained column centered in chat-stage.
              adminchat-body is the scroll container (so scrolling is stable). */}
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
