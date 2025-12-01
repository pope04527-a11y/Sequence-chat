import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const messagesRef = ref(db, "messages");

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      // Sort newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setMessages(list);
    });
  }, []);

  // Handle navigating to a specific chat
  const openChat = (msg) => {
    let userId = "unknown";

    // If the message is from a user → open their chat
    if (msg.sender && msg.sender !== "admin") {
      userId = msg.sender;
    }

    // If the message is from admin → open the recipient (msg.to)
    if (msg.sender === "admin" && msg.to) {
      userId = msg.to;
    }

    navigate(`/admin/chat/${userId}`);
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">All Messages</h1>

      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Message</th>
              <th>Type</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {messages.map((msg) => (
              <tr
                key={msg.id}
                onClick={() => openChat(msg)}
                style={{ cursor: "pointer" }}
              >
                <td>{msg.sender || "unknown"}</td>
                <td>{msg.text || "(empty)"}</td>
                <td>{msg.type || "text"}</td>
                <td>
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
