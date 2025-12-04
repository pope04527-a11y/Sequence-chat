import React from "react";
import "./Admin.css";
import Avatar from "./Avatar";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminContext";

/*
 ConversationListItem - navigates to /admin/chat/:userId when clicked
*/
export default function ConversationListItem({ user, active }) {
  const lastTime = user.lastTimestamp
    ? new Date(user.lastTimestamp)
    : null;

  const timeLabel = lastTime
    ? lastTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isUnread =
    (user.unreadCount || 0) > 0 && user.lastSender !== "admin";

  const navigate = useNavigate();
  const { setActiveConversation } = useAdmin();

  const handleClick = () => {
    const uid = user.userId || user.id;
    setActiveConversation(uid);
    navigate(`/admin/chat/${encodeURIComponent(uid)}`, {
      replace: false,
    });
  };

  return (
    <div
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="sidebar-item-left">
        <Avatar seed={user.userId} />
        <div className="sidebar-item-meta">
          <div className="sidebar-item-id">{user.userId}</div>
          <div className="sidebar-item-msg">
            {user.lastMessage || "No message yet"}
          </div>
        </div>
      </div>

      <div className="sidebar-item-right">
        <div className="sidebar-time">{timeLabel}</div>
        {isUnread ? (
          <div className="sidebar-badge">{user.unreadCount}</div>
        ) : null}
      </div>
    </div>
  );
}
