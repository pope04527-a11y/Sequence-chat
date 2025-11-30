// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./Welcome";
import Chat from "./Chat";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Welcome (landing) page */}
        <Route path="/" element={<Welcome />} />

        {/* Chat page */}
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
