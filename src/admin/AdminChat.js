import React, { useEffect, useRef, useState } from "react";
import { ref, onValue, push, off } from "firebase/database";
import { db } from "../firebase";
import "./Admin.css";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminChat({ userId: propUserId }) {
  const params = useParams();
  const userId = propUserId || params?.userId;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const messagesRef = ref(db, `messages/${userId}`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }

      const msgArray = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      setMessages(msgArray);

      setTimeout(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    });

    return () => off(messagesRef);
  }, [userId]);

  const sendMessage = async () => {
    if (!text.trim() || !userId) return;

    const msgRef = ref(db, `messages/${userId}`);

    await push(msgRef, {
      sender: "admin",
      text,
      createdAt: Date.now(),
      type: "text",
    });

    setText("");
  };

  const sendFile = async () => {
    if (!file || !userId) return;

    const filePath = `uploads/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("public-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    const msgRef = ref(db, `messages/${userId}`);
    await push(msgRef, {
      sender: "admin",
      imageUrl,
      createdAt: Date.now(),
      type: "image",
    });

    setFile(null);
    document.getElementById("adminFileInput").value = "";
  };

  return (
    <div className="adminchat-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="adminchat-header">
        <div className="adminchat-header-avatar">{userId?.charAt(0)}</div>
        <div className="adminchat-header-info">
          <div className="adminchat-header-name">{userId || "Unknown User"}</div>
          <div className="adminchat-header-status">Online</div>
        </div>
      </div>

      <div className="adminchat-body" ref={bodyRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender === "admin" ? "chat-bubble bubble-right" : "chat-bubble bubble-left"}
          >
            {msg.type === "image" ? (
              <img src={msg.imageUrl || msg.url} alt="upload" className="chat-image" onClick={() => (msg.imageUrl || msg.url) && window.open(msg.imageUrl || msg.url, "_blank")} />
            ) : (
              <div className="bubble-text">{msg.text}</div>
            )}

            <div className="bubble-time">
              {new Date(msg.createdAt || 0).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="adminchat-inputbar">
        <label className="file-btn" title="Attach file" style={{ cursor: "pointer" }}>
          📎
          <input id="adminFileInput" type="file" onChange={(e) => setFile(e.target.files[0])} hidden />
        </label>

        <input
          type="text"
          className="message-input"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button className="send-btn" onClick={sendMessage}>➤</button>
        <button
          onClick={sendFile}
          style={{
            marginLeft: 8,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.03)",
            color: "var(--text)",
            padding: "8px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
