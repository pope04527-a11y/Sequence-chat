import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { db } from "./firebase";
import {
  ref,
  push,
  onValue,
  serverTimestamp,
} from "firebase/database";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const dummy = useRef();

  useEffect(() => {
    const messagesRef = ref(db, "messages");

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loaded = data
        ? Object.keys(data).map((id) => ({ id, ...data[id] }))
        : [];

      setMessages(loaded);
      dummy.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messagesRef = ref(db, "messages");

    await push(messagesRef, {
      text,
      sender: "admin", // BLUE BUBBLE
      createdAt: serverTimestamp(),
      type: "text",
    });

    setText("");
  };

  return (
    <div className="chat-container">

      {/* Top Header */}
      <div className="chat-header">
        <button className="back-btn">←</button>
        <h3>Message</h3>
        <div className="header-right">
          <span>English ▾</span>
          <span className="volume-icon">🔊</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-body">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={dummy}></div>
      </div>

      {/* Input Bar */}
      <form className="chat-input" onSubmit={sendMessage}>
        <button type="button" className="attach-btn">📎</button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your message"
        />

        <button type="submit" className="send-btn">➤</button>
      </form>
    </div>
  );
}

function ChatBubble({ message }) {
  const isAdmin = message.sender === "admin";

  return (
    <div
      className={`bubble-row ${isAdmin ? "right" : "left"}`}
    >
      <div
        className={`bubble ${isAdmin ? "blue" : "grey"}`}
      >
        {message.type === "image" ? (
          <img src={message.url} alt="sent" className="bubble-img" />
        ) : (
          <p>{message.text}</p>
        )}
      </div>
    </div>
  );
}

export default Chat;

