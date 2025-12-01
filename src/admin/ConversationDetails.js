import React from "react";
import { useAdmin } from "./AdminContext";
import "./AdminPanel.css";

/*
 ConversationDetails - polished right-side panel
*/
export default function ConversationDetails() {
  const { activeConversation, conversationsMap } = useAdmin();
  if (!activeConversation) return (
    <div className="conv-details">
      <h3>Details</h3>
      <div className="row">Select a conversation to view details</div>
    </div>
  );
  const meta = conversationsMap?.[activeConversation] || {};
  return (
    <div className="conv-details">
      <h3>Details</h3>
      <div className="row"><strong>User:</strong> {activeConversation}</div>
      <div className="row"><strong>Last message:</strong> {meta.lastMessage || "—"}</div>
      <div className="row"><strong>Status:</strong> {meta.status || "open"}</div>
      <div className="row"><strong>Assigned:</strong> {meta.assignedAgent || "—"}</div>
      <div style={{ marginTop:12 }}>
        <button style={{ padding:"8px 12px", borderRadius:8, border:"none", background:"#eee", cursor:"pointer" }}>Archive</button>
        <button style={{ marginLeft:8, padding:"8px 12px", borderRadius:8, border:"none", background:"var(--accent)", color:"white", cursor:"pointer" }}>Assign</button>
      </div>
    </div>
  );
}
