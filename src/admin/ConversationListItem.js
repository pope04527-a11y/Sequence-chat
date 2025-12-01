import React from "react";
import "./AdminPanel.css";

export default function ConversationListItem({ user, active, onClick }) {
  const lastTime = user.lastTimestamp ? new Date(user.lastTimestamp) : null;
  const timeLabel = lastTime ? lastTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const isUnread = user.lastSender && user.lastSender !== "admin" && (user.unreadCount || 0) > 0;

  return (
    <div className={`user-list-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="user-left">
        <div className="avatar">{(user.userId || "").charAt(0).toUpperCase()}</div>
        <div className="user-meta">
          <div className="user-id">{user.userId}</div>
          <div className="last-msg">{user.lastMessage || ""}</div>
        </div>
      </div>

      <div className="user-right">
        <div className="time">{timeLabel}</div>
        {isUnread && <div className="badge">{user.unreadCount || "●"}</div>}
      </div>
    </div>
  );
}
