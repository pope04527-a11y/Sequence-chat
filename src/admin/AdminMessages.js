// src/admin/AdminMessages.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminMessages() {
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

      const userList = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;

          const msgArray = Object.entries(msgs).map(([id, value]) => ({
            id,
            ...value,
          }));

          if (msgArray.length === 0) return null;

          // Sort by date (newest first)
          msgArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          const latest = msgArray[0];

          return {
            userId,
            latestMessage: {
              text: latest.text || "",
              sender: latest.sender || "unknown",
              createdAt: latest.createdAt || 0,
            },
          };
        })
        .filter(Boolean); // remove invalid entries

      // Sort users by message time
      userList.sort(
        (a, b) =>
          (b.latestMessage?.createdAt || 0) -
          (a.latestMessage?.createdAt || 0)
      );

      setUsers(userList);
    });

    return () => off();
  }, []);

  const openChat = (userId) => {
    navigate(`/admin/chat/${userId}`);
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Messages</h1>

      {users.length === 0 ? (
        <p>No messages found.</p>
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
            {users.map(({ userId, latestMessage }) => (
              <tr
                key={userId}
                onClick={() => openChat(userId)}
                style={{ cursor: "pointer" }}
              >
                <td>{userId}</td>
                <td>{latestMessage.text}</td>
                <td>{latestMessage.sender}</td>
                <td>
                  {latestMessage.createdAt
                    ? new Date(latestMessage.createdAt).toLocaleString()
                    : "No time"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
