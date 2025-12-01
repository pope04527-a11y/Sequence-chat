import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import "./admin.css";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setMessages(list);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
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
              <th>User ID</th>
              <th>To</th>
              <th>Message</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td>{msg.userId}</td>
                <td>{msg.to}</td>
                <td>{msg.text}</td>
                <td>{msg.timestamp?.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
