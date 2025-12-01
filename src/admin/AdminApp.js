import React, { useEffect } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import ConversationsPanel from "./ConversationsPanel";
import ChatPanel from "./ChatPanel";
import ConversationDetails from "./ConversationDetails";
import "./AdminPanel.css";

/*
 AdminApp wraps the admin UI and reads the URL to set activeConversation:
 - /admin -> normal layout (sidebar + chat + details)
 - /admin/chat/:userId -> opens the chat page for that user (sidebar still accessible)
*/

function AdminAppInner() {
  const { setActiveConversation } = useAdmin();

  useEffect(() => {
    function syncFromPath() {
      try {
        const path = window.location.pathname || "";
        // look for /admin/chat/:userId
        const match = path.match(/\/admin\/chat\/([^/]+)/);
        if (match && match[1]) {
          setActiveConversation(decodeURIComponent(match[1]));
        } else {
          // leave activeConversation as-is or null if no explicit chat in URL
        }
      } catch (e) {
        console.warn("Failed to sync path to active conversation", e);
      }
    }
    // On initial mount:
    syncFromPath();
    // Also update when history changes (back/forward)
    const onPop = () => syncFromPath();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setActiveConversation]);

  // single layout: sidebar, main chat, details
  return (
    <div className="admin-panel-root">
      <ConversationsPanel />
      <div className="admin-main">
        <ChatPanel />
      </div>
      <div style={{ width: 320 }}>
        <ConversationDetails />
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <AdminAppInner />
    </AdminProvider>
  );
}
