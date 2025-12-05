// src/Welcome.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  // 🔥 Create or reuse a persistent user ID
  useEffect(() => {
    let user = localStorage.getItem("chat-username");

    if (!user) {
      user = "user-" + Math.floor(Math.random() * 10000000);
      localStorage.setItem("chat-username", user);
    }
  }, []);

  const startChat = () => {
    const user = localStorage.getItem("chat-username");

    navigate("/chat", {
      state: { username: user },
    });
  };

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
            src="/ChatGPT Image Dec 6, 2025, 06_09_52 AM.png"
            alt="Stacks Logo"
            className="avatar"
          />
          <div className="profile-text">
            <h4>Stacks-CS</h4>
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
      <div className="chat-box" onClick={startChat}>
        <span className="chat-text">Chat with us</span>
        <span className="chat-arrow">➜</span>
      </div>
    </div>
  );
}
