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
    navigate(`/admin/chat/${userId}`);
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Messages by Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Last Message</th>
              <th>Sender</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => openChat(user.id)}
                style={{ cursor: "pointer" }}
              >
                <td>{user.id}</td>
                <td>{user.lastMessage}</td>
                <td>{user.lastSender}</td>
                <td>{user.lastTimeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
