// src/admin/AdminDashboard.js
import React from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

export default function AdminDashboard() {
  return (
    <div className="admin-container" style={{ padding: 18 }}>
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="admin-menu" style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <Link to="/admin/users" className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", minWidth: 180 }}>
            <h2 style={{ margin: 0 }}>Users</h2>
            <p style={{ marginTop: 6, color: "var(--muted)" }}>View all registered users</p>
          </div>
        </Link>

        <Link to="/admin/messages" className="admin-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.02)", minWidth: 180 }}>
            <h2 style={{ margin: 0 }}>Messages</h2>
            <p style={{ marginTop: 6, color: "var(--muted)" }}>View all user conversations</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
