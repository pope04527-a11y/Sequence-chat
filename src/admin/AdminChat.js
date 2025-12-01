// src/admin/AdminChat.jsx
import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import "./admin.css";

export default function AdminChat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    if (!userId) return;

    const chatRef = ref(db, `messages/${userId}`);

    onValue(chatRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setMessages([]);
        return;
      }

      const list = Object.entries(data).map(([id, msg]) => ({
        id,
        ...msg,
      }));

      list.sort((a, b) => a.createdAt - b.createdAt);

      setMessages(list);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    });
  }, [userId]);

  const sendMessage = async () => {
    if (text.trim() === "") return;

    const msgRef = push(ref(db, `messages/${userId}`));

    const messageData = {
      text: text.trim(),
      sender: "admin",
      to: userId,
      createdAt: Date.now(),
      type: "text",
    };

    await set(msgRef, messageData);
    setText("");

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  return (
    <div className="admin-chat-container">

      {/* Header */}
      <div className="admin-chat-header">
        <h2>User: {userId}</h2>
      </div>

      {/* Messages area */}
      <div className="admin-chat-body">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.sender === "admin"
                ? "chat-bubble admin-bubble"
                : "chat-bubble user-bubble"
            }
          >
            {msg.text}
            <div className="chat-time">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <div className="admin-chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}
