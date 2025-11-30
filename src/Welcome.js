import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">

      {/* Top Bar */}
      <div className="top-bar">
        <div className="profile">
          <img
            src="https://i.pravatar.cc/60?img=32"
            alt="profile"
            className="avatar"
          />
          <div className="profile-text">
            <h4>sequencecommerce</h4>
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
      <div className="chat-box" onClick={() => navigate("/chat")}>
        <span className="chat-text">Chat with us</span>
        <span className="chat-arrow">➜</span>
      </div>
    </div>
  );
}

