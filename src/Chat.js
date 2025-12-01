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
  const [uploading, setUploading] = useState(null); // { name, progress }
  const dummy = useRef();
  const fileRef = useRef();

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

    return () => chatRef.off && chatRef.off();
  }, [userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const chatRef = ref(db, `messages/${userId}`);

    console.log("User sending message to:", `messages/${userId}`, text);

    await push(chatRef, {
      text,
      sender: userId,
      createdAt: Date.now(),
      type: "text",
    });

    setText("");
  };

  // Open file picker
  const onAttachClick = () => {
    fileRef.current && fileRef.current.click();
  };

  // ⭐ UPDATED FILE UPLOAD HANDLER (Cloudinary → Netlify)
  const handleFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        const base64 = result.split(",")[1];

        const res = await fetch("/.netlify/functions/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: f.name,
            contentType: f.type,
            data: base64,
          }),
        });

        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();

        // write message to RTDB
        const chatRef = ref(db, `messages/${userId}`);
        await push(chatRef, {
          sender: userId,
          type: f.type && f.type.startsWith("image") ? "image" : "file",
          url,
          fileName: f.name,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error("client upload error", err);
        alert("Upload failed");
      } finally {
        try { e.target.value = ""; } catch {}
      }
    };

    reader.readAsDataURL(f);
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
        {/* hidden file input */}
        <input
          type="file"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={handleFile}
        />

        <button type="button" className="attach-btn" onClick={onAttachClick}>
          📎
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your message"
        />

        <button type="submit" className="send-btn">➤</button>
      </form>

      {/* Minimal upload progress indicator */}
      {uploading && (
        <div style={{
          position: "fixed",
          bottom: 80,
          left: 24,
          background: "#fff",
          padding: 10,
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{uploading.name}</div>
          <div style={{ width: 240, height: 8, background: "#eee", borderRadius: 6, marginTop: 8 }}>
            <div style={{ width: `${uploading.progress}%`, height: "100%", background: "#0b7bdb", borderRadius: 6 }} />
          </div>
        </div>
      )}
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
        <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}
        </div>
      </div>
    </div>
  );
}

export default Chat;
