import React from "react";
import "./AdminPanel.css";

/*
 ChatMessage
 Props:
  - m: message object { id, sender, text, type, url, fileName, createdAt }
  - isAdmin: boolean (message sent by current agent)
*/
export default function ChatMessage({ m, isAdmin }) {
  const dateLabel = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const alignClass = isAdmin ? "right" : "left";
  const bubbleClass = isAdmin ? "admin" : "user";

  return (
    <div className={`admin-msg-row ${alignClass}`}>
      <div className={`admin-msg-bubble ${bubbleClass}`}>
        {m.type === "image" ? (
          <img src={m.url} alt={m.fileName || "img"} style={{ width: "100%", borderRadius: 8, marginBottom: 8 }} />
        ) : m.type === "file" ? (
          <div>
            <a href={m.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {m.fileName || "Download file"}
            </a>
          </div>
        ) : (
          <div className="msg-text">{m.text}</div>
        )}

        <div className="msg-footer">
          <div className="msg-time">{dateLabel}</div>
          {isAdmin ? (
            // Simple double-tick icon for delivered/read visuals (static)
            <div style={{ color: "#0aa85a", fontSize: 14 }}>✓✓</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
