import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Welcome.css";

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Get username from:
  // 1. State (when coming BACK from chat)
  // 2. URL
  // 3. LocalStorage
  const params = new URLSearchParams(window.location.search);
  const urlUser = params.get("user");

  const storedUser = localStorage.getItem("chat-username");

  const user =
    location.state?.username ||
    urlUser ||
    storedUser ||
    null;

  // 🔥 Always save username if found
  if (user) {
    localStorage.setItem("chat-username", user);
  }

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
            src="/Cs.jpg"
            alt="Stacks Logo"
            className="avatar"
          />
          <div className="profile-text">
            <h4>Sequence</h4>
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
        onClick={() =>
          navigate(`/chat?user=${user || ""}`, {
            state: { username: user },
          })
        }
      >
        <span className="chat-text">Chat with us</span>
        <span className="chat-arrow">➜</span>
      </div>
    </div>
  );
}
