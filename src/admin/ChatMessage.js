import React from "react";
import "./AdminPanel.css";
import MessageMenu from "./MessageMenu";

/*
 ChatMessage
 Props:
  - m: message object { id, sender, text, type, url, fileName, createdAt, replyTo, replyText }
  - isAdmin: boolean (message sent by current agent)
  - onReply(message)
  - onDelete(message)
  - onDownload(message)
  - repliedMessage: optional message object that this message replies to (for inline quote)
*/
export default function ChatMessage({ m, isAdmin, onReply, onDelete, onDownload, repliedMessage }) {
  const dateLabel = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const alignClass = isAdmin ? "right" : "left";
  const bubbleClass = isAdmin ? "admin" : "user";

  return (
    <div className={`admin-msg-row ${alignClass}`} style={{ alignItems: "flex-end" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {/* Bubble */}
        <div className={`admin-msg-bubble ${bubbleClass}`} style={{ position: "relative" }}>
          {/* quoted reply preview */}
          {repliedMessage ? (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#f5f7f8", border: "1px solid rgba(0,0,0,0.03)", fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{repliedMessage.sender === "admin" ? "You" : repliedMessage.sender}</div>
              <div style={{ color: "var(--muted)" }}>{repliedMessage.text ? (repliedMessage.text.length > 120 ? repliedMessage.text.slice(0, 120) + "…" : repliedMessage.text) : (repliedMessage.type === "image" ? "Image" : repliedMessage.fileName || "File")}</div>
            </div>
          ) : null}

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

          <div className="msg-footer" style={{ marginTop: 10 }}>
            <div className="msg-time">{dateLabel}</div>
            {isAdmin ? <div style={{ color: "#0aa85a", fontSize: 14 }}>✓✓</div> : null}
          </div>
        </div>

        {/* Actions menu (only show on hover or always visible) */}
        <div style={{ alignSelf: "flex-start", marginTop: 6 }}>
          <MessageMenu
            onReply={() => onReply && onReply(m)}
            onDelete={() => onDelete && onDelete(m)}
            onDownload={() => {
              if (m.url) {
                // open download in new tab
                window.open(m.url, "_blank");
              } else {
                onDownload && onDownload(m);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
