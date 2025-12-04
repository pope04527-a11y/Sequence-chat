import React from "react";
import { useAdmin } from "./AdminContext";
import "./Admin.css";

/*
 ConversationDetails - polished right-side panel
*/
export default function ConversationDetails() {
  const { activeConversation, conversationsMap } = useAdmin();
  if (!activeConversation) return (
    <div className="conv-details" style={{ padding: 16, color: "var(--muted)" }}>
      <h3 style={{ marginTop: 0 }}>Details</h3>
      <div className="row">Select a conversation to view details</div>
    </div>
  );
  const meta = conversationsMap?.[activeConversation] || {};
  return (
    <div className="conv-details" style={{ padding: 16, color: "var(--muted)" }}>
      <h3 style={{ marginTop: 0 }}>Details</h3>
      <div className="row"><strong style={{ color: "var(--text)" }}>User:</strong> {activeConversation}</div>
      <div className="row"><strong style={{ color: "var(--text)" }}>Last message:</strong> {meta.lastMessage || "—"}</div>
      <div className="row"><strong style={{ color: "var(--text)" }}>Status:</strong> {meta.status || "open"}</div>
      <div className="row"><strong style={{ color: "var(--text)" }}>Assigned:</strong> {meta.assignedAgent || "—"}</div>
      <div style={{ marginTop:12 }}>
        <button
          className="btn"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.04)",
            background: "transparent",
            color: "var(--muted)",
            cursor: "pointer"
          }}
        >
          Archive
        </button>
        <button
          className="btn-primary"
          style={{
            marginLeft:8,
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(180deg,var(--accent),var(--accent-600))",
            color: "white",
            cursor: "pointer"
          }}
        >
          Assign
        </button>
      </div>
    </div>
  );
}
