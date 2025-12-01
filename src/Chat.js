import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { db } from "./firebase";
import { ref, push, onValue } from "firebase/database";

// Get user ID from URL
function getUserId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || "unknown-user";
}

function Chat() {
  const userId = getUserId();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const dummy = useRef();

  useEffect(() => {
    console.log("User Chat subscribing to path:", `messages/${userId}`);
    const chatRef = ref(db, `messages/${userId}`);

    const offFn = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();

      const loaded = data
        ? Object.entries(data)
            .map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        : [];

      setMessages(loaded);
      dummy.current?.scrollIntoView({ behavior: "smooth" });
    });

    // onValue returns the unsubscribe function when using modular API pattern
    // but to be safe we'll return a cleanup that detaches listeners
    return () => chatRef.off && chatRef.off();
  }, [userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const chatRef = ref(db, `messages/${userId}`);

    console.log("User sending message to:", `messages/${userId}`, text);

    await push(chatRef, {
      text,
      sender: userId, // USER IDENTIFIER
      createdAt: Date.now(),
      type: "text",
    });

    setText("");
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn">←</button>
        <h3>Customer Support</h3>
        <div className="header-right">
          <span>English ▾</span>
          <span className="volume-icon">🔊</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-body">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} userId={userId} />
        ))}
        <div ref={dummy}></div>
      </div>

      {/* Input */}
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

function ChatBubble({ message, userId }) {
  const isUser = message.sender === userId;

  return (
    <div className={`bubble-row ${isUser ? "right" : "left"}`}>
      <div className={`bubble ${isUser ? "blue" : "grey"}`}>
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
