import React, { useEffect } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import ConversationsPanel from "./ConversationsPanel";
import ChatPanel from "./ChatPanel";
import "./Admin.css";

/*
 AdminApp wraps the admin UI and reads the URL to set activeConversation:
 - /admin -> normal layout (sidebar + chat)
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

  // layout: left sidebar + main chat (details removed per screenshot)
  return (
    <div className="admin-container" style={{ display: "flex", alignItems: "stretch", height: "100vh" }}>
      <ConversationsPanel />
      <div className="admin-main" style={{ flex: 1, minWidth: 0 }}>
        <ChatPanel />
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
