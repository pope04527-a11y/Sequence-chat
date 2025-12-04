import React, { useEffect, useRef, useState } from "react";
import {
  subscribeToMessages,
  deleteMessage as firebaseDeleteMessage,
} from "../firebase";
import { useAdmin } from "./AdminContext";
import Composer from "./Composer";
import "./Admin.css";
import ChatMessage from "./ChatMessage";
import DateSeparator from "./DateSeparator";

/*
 FIXES ADDED:
 - Admin text messages now save to Firestore using sendTextMessage()
 - Removed broken CustomEvent sender that saved NOTHING
 - Ensures replies, files, and text all work
*/

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
  } = useAdmin();

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [uploads, setUploads] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setReplyTo(null);
      return;
    }
    const unsub = subscribeToMessages(activeConversation, (msgs) => {
      setMessages(msgs);
      setTimeout(
        () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
        60
      );
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

  // 🔥 FIXED — Now actually sends message to Firestore
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

      setUploads((u) => {
        const next = { ...u };
        delete next[tempId];
        return next;
      });
    } catch (err) {
      console.error("upload failed", err);
      setUploads((u) => {
        const next = { ...u };
        delete next[tempId];
        return next;
      });
      alert("Upload failed");
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    const el = document.querySelector(".chat-composer textarea");
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

  if (!activeConversation)
    return <div className="empty-state">Select a conversation</div>;

  return (
    <div
      className="chat-panel"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div className="chat-header-admin">
        <div>
          <div className="chat-title">
            Chat with <strong>{activeConversation}</strong>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Admin: {agentId}</div>
        </div>
      </div>

      <div className="chat-body-admin">
        {grouped.length === 0 ? (
          <div className="no-msg">No messages yet</div>
        ) : (
          grouped.map((item) => {
            if (item.type === "date") {
              const label = formatDateHeader(item.ts);
              return <DateSeparator key={item.key} label={label} />;
            } else {
              const m = item.msg;
              return (
                <ChatMessage
                  key={m.id}
                  m={m}
                  isAdmin={m.sender === agentId}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onDownload={() => m.url && window.open(m.url, "_blank")}
                  repliedMessage={m.replyTo ? messageById[m.replyTo] : null}
                />
              );
            }
          })
        )}

        {Object.entries(uploads).map(([k, u]) => (
          <div key={k} style={{ alignSelf: "flex-end", marginTop: 8 }}>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: "#fff",
                width: 240,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
              <div
                style={{
                  height: 6,
                  background: "#eee",
                  borderRadius: 6,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: `${u.progress}%`,
                    height: "100%",
                    background: "var(--accent)",
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <div ref={scrollRef} />
      </div>

      <Composer
        onSendText={handleSendText}
        onSendFile={handleSendFile}
        onTyping={() => {}}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
