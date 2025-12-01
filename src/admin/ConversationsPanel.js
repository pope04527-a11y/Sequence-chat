import React from "react";
import { useAdmin } from "./AdminContext";
import ConversationListItem from "./ConversationListItem";
import "./AdminPanel.css";

export default function ConversationsPanel() {
  const { conversations, activeConversation, setActiveConversation } = useAdmin();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Conversations</h2>
        <div className="search">
          {/* keep simple; later add search input */}
        </div>
      </div>

      <div className="users-list">
        {conversations.length === 0 ? (
          <div className="no-users">No conversations</div>
        ) : (
          conversations.map((c) => (
            <ConversationListItem
              key={c.userId}
              user={c}
              active={activeConversation === c.userId}
              onClick={() => setActiveConversation(c.userId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
