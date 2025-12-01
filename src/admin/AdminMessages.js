import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import "./admin.css";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);

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

      // Sort: newest first
      list.sort((a, b) => b.createdAt - a.createdAt);

      setMessages(list);
    });
  }, []);

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
              <tr key={msg.id}>
                <td>{msg.sender || "unknown"}</td>
                <td>{msg.text}</td>
                <td>{msg.type}</td>
                <td>{new Date(msg.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
