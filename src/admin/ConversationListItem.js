import React from "react";
import "./Admin.css";
import Avatar from "./Avatar";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminContext";

/*
 ConversationListItem - navigates to /admin/chat/:userId when clicked
*/
export default function ConversationListItem({ user, active }) {
  const lastTime = user.lastTimestamp ? new Date(user.lastTimestamp) : null;
  const timeLabel = lastTime ? lastTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const isUnread = (user.unreadCount || 0) > 0 && user.lastSender !== "admin";

  const navigate = useNavigate();
  const { setActiveConversation } = useAdmin();

  const handleClick = (e) => {
    const uid = user.userId || user.id;
    // Set in context
    setActiveConversation(uid);
    // Navigate to chat page (keeps SPA navigation)
    navigate(`/admin/chat/${encodeURIComponent(uid)}`, { replace: false });
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
        <Avatar seed={user.userId} />
        <div className="user-meta">
          <div className="user-id">{user.userId}</div>
          <div className="last-msg">{user.lastMessage || "No message yet"}</div>
        </div>
      </div>

      <div className="user-right">
        <div className="time">{timeLabel}</div>
        {isUnread ? <div className="badge">{user.unreadCount}</div> : null}
      </div>
    </div>
  );
}
