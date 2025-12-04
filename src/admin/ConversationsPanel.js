import React, { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import ConversationListItem from "./ConversationListItem";
import "./Admin.css";
import { ref as dbRef, onValue } from "firebase/database";
import { db } from "../firebase";

/*
 ConversationsPanel
 - Prefer meta/conversations (via useAdmin().conversations)
 - If meta is empty, fall back to scanning messages/ to build a list
*/

export default function ConversationsPanel() {
  const { conversations, activeConversation, setActiveConversation } = useAdmin();
  const [fallbackList, setFallbackList] = useState(null);
  const [loadingFallback, setLoadingFallback] = useState(false);

  useEffect(() => {
    // If we already have conversations from meta, no need to watch messages root
    if (conversations && conversations.length > 0) {
      setFallbackList(null);
      return;
    }

    // Otherwise, subscribe to messages/ and build a minimal list
    setLoadingFallback(true);
    const messagesRef = dbRef(db, "messages");
    const off = onValue(messagesRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setFallbackList([]);
        setLoadingFallback(false);
        return;
      }

      const list = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;
          const arr = Object.values(msgs);
          arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const last = arr[0] || {};
          return {
            userId,
            lastMessage: last.text || (last.type === "image" ? "Image" : ""),
            lastSender: last.sender || "unknown",
            lastTimestamp: last.createdAt || 0,
            unreadCount: 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setFallbackList(list);
      setLoadingFallback(false);
    });

    return () => {
      try {
        messagesRef.off && messagesRef.off();
      } catch (e) {}
      off && off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const listToRender = (conversations && conversations.length > 0) ? conversations : (fallbackList || []);

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Conversations</h2>
      </div>

      <div className="users-list">
        {conversations && conversations.length === 0 && loadingFallback ? (
          <div className="no-users">Loading conversations…</div>
        ) : listToRender.length === 0 ? (
          <div className="no-users">No conversations</div>
        ) : (
          listToRender.map((c) => (
            <ConversationListItem
              key={c.userId}
              user={{
                userId: c.userId,
                lastMessage: c.lastMessage,
                lastSender: c.lastSender,
                lastTimestamp: c.lastTimestamp,
                unreadCount: c.unreadCount,
              }}
              active={activeConversation === c.userId}
              onClick={() => setActiveConversation(c.userId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
