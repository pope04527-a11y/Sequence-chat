import React from "react";
import "./AdminPanel.css";

export default function ChatMessage({ m, isAdmin }) {
  const dateLabel = m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : "";
  return (
    <div className={`admin-msg-row ${isAdmin ? "right" : "left"}`}>
      <div className={`admin-msg-bubble ${isAdmin ? "admin" : "user"}`}>
        {m.type === "image" ? (
          <img src={m.url} alt={m.fileName || "img"} style={{ maxWidth: 320, borderRadius: 8 }} />
        ) : m.type === "file" ? (
          <a href={m.url} target="_blank" rel="noreferrer">{m.fileName || "Download file"}</a>
        ) : (
          <div className="msg-text">{m.text}</div>
        )}
        <div className="msg-time">{dateLabel}</div>
      </div>
    </div>
  );
}
