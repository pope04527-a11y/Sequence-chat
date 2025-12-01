// src/admin/AdminMessages.jsx
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

    onValue(messagesRef, (snapshot) => {
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

          // skip users with no messages
          if (msgArray.length === 0) return null;

          // sort newest first
          msgArray.sort((a, b) => b.createdAt - a.createdAt);

          return {
            userId,
            latestMessage: msgArray[0],
          };
        })
        .filter(Boolean); // remove null entries

      // Sort users by latest message time
      userList.sort(
        (a, b) => b.latestMessage.createdAt - a.latestMessage.createdAt
      );

      setUsers(userList);
    });
  }, []);

  const openChat = (userId) => {
    navigate(`/admin/chat/${userId}`);
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Messages by Users</h1>

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
                  {new Date(latestMessage.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
