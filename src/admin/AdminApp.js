import React from "react";
import { AdminProvider } from "./AdminContext";
import ConversationsPanel from "./ConversationsPanel";
import ChatPanel from "./ChatPanel";
import ConversationDetails from "./ConversationDetails";
import "./AdminPanel.css";

/*
 AdminApp: top-level admin layout. Wraps AdminProvider and lays out:
  - left: ConversationsPanel
  - main: ChatPanel
  - right: ConversationDetails (optional)
*/
export default function AdminApp() {
  return (
    <AdminProvider>
      <div className="admin-panel-root">
        <ConversationsPanel />
        <div className="admin-main">
          <ChatPanel />
        </div>
        <div style={{ width: 300 }}>
          <ConversationDetails />
        </div>
      </div>
    </AdminProvider>
  );
}
