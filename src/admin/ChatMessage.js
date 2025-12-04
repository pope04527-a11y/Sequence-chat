import React from "react";
import "./Admin.css";
import MessageMenu from "./MessageMenu";

export default function ChatMessage({
  m,
  isAdmin,
  onReply,
  onDelete,
  onDownload,
  repliedMessage,
}) {
  const timeLabel = m.createdAt
    ? new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // use both row and bubble naming so CSS covers all
  const rowClass = isAdmin ? "row-admin" : "row-user";
  const bubbleClass = isAdmin ? "bubble-admin" : "bubble-user";

  return (
    <div className={rowClass}>
      <div className="bubble-wrapper">
        <div className={bubbleClass}>
          {/* Reply preview */}
          {repliedMessage && (
            <div className="reply-box">
              <div className="reply-name">
                {repliedMessage.sender === "admin" ? "You" : repliedMessage.sender}
              </div>
              <div className="reply-snippet">
                {repliedMessage.text
                  ? repliedMessage.text.length > 120
                    ? repliedMessage.text.slice(0, 120) + "…"
                    : repliedMessage.text
                  : repliedMessage.type === "image"
                  ? "Image"
                  : repliedMessage.fileName || "File"}
              </div>
            </div>
          )}

          {/* Content */}
          {m.type === "image" ? (
            <img
              src={m.url || m.imageUrl}
              alt={m.fileName || "image"}
              className="bubble-img"
              onClick={() => (m.url || m.imageUrl) && window.open(m.url || m.imageUrl, "_blank")}
            />
          ) : m.type === "file" ? (
            <div
              className="bubble-file"
              onClick={() => (m.url ? window.open(m.url, "_blank") : onDownload && onDownload(m))}
            >
              <div className="file-icon">📄</div>
              <div className="file-name">{m.fileName || "Download file"}</div>
            </div>
          ) : (
            <div className="bubble-text">{m.text}</div>
          )}

          {/* footer */}
          <div className="bubble-footer">
            <span className="bubble-time">{timeLabel}</span>
            {isAdmin && <span className="bubble-ticks">✓✓</span>}
          </div>
        </div>

        <div className="bubble-menu">
          <MessageMenu
            onReply={() => onReply && onReply(m)}
            onDelete={() => onDelete && onDelete(m)}
            onDownload={() => (m.url ? window.open(m.url, "_blank") : onDownload && onDownload(m))}
          />
        </div>
      </div>
    </div>
  );
}
