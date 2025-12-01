import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  ref,
  onValue,
  push,
  serverTimestamp
} from "firebase/database";
import "./admin.css";

export default function AdminChat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const chatRef = ref(db, `chats/${userId}`);

    onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMessages(list);
      }
    });
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (text.trim() === "") return;

    const msgRef = ref(db, `chats/${userId}`);

    await push(msgRef, {
      sender: "admin",
      text,
      type: "text",
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div className="admin-chat-container">
      {/* Header */}
      <div className="admin-chat-header">
        <h2>User: {userId}</h2>
      </div>

      {/* Messages List */}
      <div className="admin-chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${
              msg.sender === "admin" ? "chat-admin" : "chat-user"
            }`}
          >
            <p>{msg.text}</p>
            <span>
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString()
                : ""}
            </span>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* Message Input */}
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
