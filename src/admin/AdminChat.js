import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push } from "firebase/database";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import "./AdminChat.css";

export default function AdminChat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const userRef = ref(db, `messages/${userId}`);

    onValue(userRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const msgArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      // Fix the Invalid Date issue: ensure createdAt exists
      msgArray.forEach((m) => {
        if (!m.createdAt) {
          m.createdAt = Date.now();
        }
      });

      msgArray.sort((a, b) => a.createdAt - b.createdAt);

      setMessages(msgArray);

      // Scroll to bottom on new messages
      setTimeout(scrollToBottom, 100);
    });
  }, [userId]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const userRef = ref(db, `messages/${userId}`);

    push(userRef, {
      sender: "admin",
      text,
      type: "text",
      createdAt: Date.now(),
    });

    setText("");

    setTimeout(scrollToBottom, 100);
  };

  return (
    <div className="admin-chat-wrapper">
      <div className="admin-chat-header">Chat with: {userId}</div>

      <div className="admin-chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.sender === "admin"
                ? "admin-bubble bubble-right"
                : "user-bubble bubble-left"
            }
          >
            <div className="bubble-text">{msg.text}</div>
            <div className="bubble-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="admin-chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
