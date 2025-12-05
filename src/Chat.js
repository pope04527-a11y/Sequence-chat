// src/Chat.js
import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { db } from "./firebase";
import { ref, push, onValue, update } from "firebase/database";
import { supabase } from "./supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

// ❗ We no longer rely on URL ?user=
// Only used as fallback
function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || null;
}

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 NEW USER ID LOGIC
  const userId =
    location.state?.username ||
    localStorage.getItem("chat-username") ||
    getUserIdFromURL() ||
    "unknown-user";

  // 🔥 Save username so it persists across navigation
  useEffect(() => {
    if (location.state?.username) {
      localStorage.setItem("chat-username", location.state.username);
    }
  }, [location.state]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(null);
  const dummy = useRef();
  const fileRef = useRef();

  useEffect(() => {
    const chatRef = ref(db, `messages/${userId}`);

    const off = onValue(chatRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      setMessages(arr);
      dummy.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => off();
  }, [userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const chatRef = ref(db, `messages/${userId}`);

    await push(chatRef, {
      text,
      sender: userId,
      createdAt: Date.now(),
      type: "text",
    });

    await update(ref(db, `chats/${userId}/profile`), {
      lastMessage: text,
      lastMessageTimestamp: Date.now(),
      name: userId,
    });

    setText("");
  };

  const onAttachClick = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    setUploading({ name: f.name, progress: 10 });

    try {
      const filePath = `chat/${Date.now()}_${f.name}`;

      const { error } = await supabase.storage
        .from("public-files")
        .upload(filePath, f);

      if (error) {
        console.error(error);
        alert("Upload failed");
        return;
      }

      setUploading({ name: f.name, progress: 70 });

      const { data: urlData } = supabase.storage
        .from("public-files")
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;

      setUploading({ name: f.name, progress: 100 });

      const chatRef = ref(db, `messages/${userId}`);

      await push(chatRef, {
        sender: userId,
        type: f.type.startsWith("image") ? "image" : "file",
        url,
        fileName: f.name,
        createdAt: Date.now(),
      });

      await update(ref(db, `chats/${userId}/profile`), {
        lastMessage: f.type.startsWith("image") ? "📷 Image" : f.name,
        lastMessageTimestamp: Date.now(),
        name: userId,
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      try {
        e.target.value = "";
      } catch {}
      setTimeout(() => setUploading(null), 600);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {/* 🔥 BACK BUTTON — now keeps username */}
        <button
          className="back-btn"
          onClick={() =>
            navigate("/", { state: { username: userId } })
          }
        >
          ←
        </button>

        <h3>Customer Support</h3>

        <div className="header-right">
          <span>English ▾</span>
          <span className="volume-icon">🔊</span>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} userId={userId} />
        ))}
        <div ref={dummy}></div>
      </div>

      <form className="chat-input" onSubmit={sendMessage}>
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

      {uploading && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            left: 24,
            background: "#fff",
            padding: 10,
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>{uploading.name}</div>
          <div
            style={{
              width: 240,
              height: 8,
              background: "#eee",
              borderRadius: 6,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: `${uploading.progress}%`,
                height: "100%",
                background: "#0b7bdb",
                borderRadius: 6,
              }}
            />
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
        ) : message.type === "file" ? (
          <a
            href={message.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#fff" }}
          >
            📄 {message.fileName}
          </a>
        ) : (
          <p>{message.text}</p>
        )}

        <div style={{ fontSize: 11, color: "#ddd", marginTop: 6 }}>
          {message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString()
            : ""}
        </div>
      </div>
    </div>
  );
}

export default Chat;
