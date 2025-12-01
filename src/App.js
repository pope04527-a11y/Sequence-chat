// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Client-side pages
import Welcome from "./Welcome";
import Chat from "./Chat";

// Admin pages (new AdminApp)
import AdminApp from "./admin/AdminApp"; // <-- new integrated admin app

import "./App.css";

// TEMPORARY ADMIN CHECK
const isAdmin = true; // while testing

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Welcome />} />
        <Route path="/chat" element={<Chat />} />

        {/* Integrated Admin App (handles sidebar + chat + details) */}
        <Route
          path="/admin/*"
          element={isAdmin ? <AdminApp /> : <Navigate to="/" />}
        />

        {/* Keep old direct admin routes if you still need them (optional)
            If you prefer the AdminApp to fully replace them, you can remove them.
        */}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
