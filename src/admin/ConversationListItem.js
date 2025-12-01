import React from "react";
import "./AdminPanel.css";

export default function ConversationListItem({ user, active, onClick }) {
  const lastTime = user.lastTimestamp ? new Date(user.lastTimestamp) : null;
  const timeLabel = lastTime ? lastTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const isUnread = user.lastSender && user.lastSender !== "admin" && (user.unreadCount || 0) > 0;

  const handleClick = (e) => {
    console.log("[ConversationListItem] clicked userId=", user.userId || user.id);
    if (onClick) onClick(e);
  };

  return (
    <div
      className={`user-list-item ${active ? "active" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
    >
      <div className="user-left">
        <div className="avatar">{(user.userId || user.id || "").charAt(0).toUpperCase()}</div>
        <div className="user-meta">
          <div className="user-id">{user.userId || user.id}</div>
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
