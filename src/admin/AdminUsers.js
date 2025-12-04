// src/admin/AdminUsers.js
// Build admin user list directly from the "messages" root in Realtime DB.

import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const messagesRef = ref(db, "messages");

    const off = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUsers([]);
        return;
      }

      const list = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;

          const msgArray = Object.entries(msgs).map(([id, value]) => ({
            id,
            ...value,
          }));

          // sort newest first by raw timestamp
          msgArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const latest = msgArray[0] || {};

          // detect message preview
          let preview = "No message";
          if (latest.type === "text" && latest.text) preview = latest.text;
          else if (latest.type === "image") preview = "📷 Image";
          else if (latest.type === "file") preview = latest.fileName || "📄 File";

          return {
            id: userId,
            lastMessage: preview,
            lastSender: latest.sender || "unknown",
            lastTimestamp: latest.createdAt || 0,
            lastTimeLabel: latest.createdAt
              ? new Date(latest.createdAt).toLocaleString()
              : "—",
          };
        })
        .filter(Boolean);

      // sort by timestamp, not formatted string
      list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setUsers(list);
    });

    return () => off();
  }, []);

  const openChat = (userId) => {
    navigate(`/admin/chat/${encodeURIComponent(userId)}`);
  };

  if (users.length === 0) {
    return (
      <div className="admin-users" style={{ padding: 12 }}>
        <h2 className="admin-title">Messages by Users</h2>
        <div className="no-msg">No users found.</div>
      </div>
    );
  }

  return (
    <div className="admin-users" style={{ padding: 12 }}>
      <h2 className="admin-title">Messages by Users</h2>

      <div className="users-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {users.map((user) => (
          <div
            key={user.id}
            className="user-item"
            onClick={() => openChat(user.id)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openChat(user.id)}
          >
            <div className="user-left">
              <div className="user-avatar" title={user.id}>
                <div className="avatar" style={{ background: "#6cc9f8", color: "#000", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: 700 }}>
                  {user.id?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>

              <div className="user-meta">
                <div className="user-id">{user.id}</div>
                <div className="last-msg">{user.lastMessage}</div>
              </div>
            </div>

            <div className="user-right">
              <div className="time">{user.lastTimeLabel}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
