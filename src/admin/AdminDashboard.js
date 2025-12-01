import React from "react";
import { Link } from "react-router-dom";
import "./admin.css";

export default function AdminDashboard() {
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="admin-buttons">
        <Link to="/admin/users" className="admin-btn">
          Manage Users
        </Link>

        <Link to="/admin/messages" className="admin-btn">
          View All Messages
        </Link>
      </div>
    </div>
  );
}
