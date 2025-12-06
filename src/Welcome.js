import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  // ✅ Get username from URL (required)
  const params = new URLSearchParams(window.location.search);
  const user = params.get("user");

  return (
    <div
      className="welcome-container"
      style={{
        paddingTop: 0,
        marginTop: 0,
      }}
    >
      {/* Top Bar */}
      <div
        className="top-bar"
        style={{
          marginTop: 0,
          paddingTop: 10,
          position: "relative",
          top: 0,
          left: 0,
          width: "100%",
        }}
      >
        <div className="profile">
          <img
            src="/ChatGPT Image Dec 6, 2025, 06_09_52 AM.png"  // 🔥 YOUR LOGO
            alt="Stacks Logo"
            className="avatar"
          />
          <div className="profile-text">
            <h4>Stacks-CS</h4>              {/* 🔥 UPDATED NAME */}
            <span>Customer Service</span>
          </div>
        </div>

        <div className="top-right">
          <span className="language">English ▾</span>
          <span className="speaker">🔊</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="greeting">
        <h1>Hello 👋</h1>
        <h2>How can we help?</h2>
      </div>

      {/* Chat Button */}
      <div
        className="chat-box"
        onClick={() => navigate(`/chat?user=${user || ""}`)}  // ✅ Pass username to chat
      >
        <span className="chat-text">Chat with us</span>
        <span className="chat-arrow">➜</span>
      </div>
    </div>
  );
}
