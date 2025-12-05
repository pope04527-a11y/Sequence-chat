import React, { useEffect, useState } from "react";
import ConversationListItem from "./ConversationListItem";
import "./Admin.css";
import { ref as dbRef, onValue, off } from "firebase/database";
import { db } from "../firebase";
import { useAdmin } from "./AdminContext";

export default function ConversationsPanel() {
  const { activeConversation, setActiveConversation } = useAdmin();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const messagesRef = dbRef(db, "messages");

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setList([]);
        setLoading(false);
        return;
      }

      // Convert messages into a list
      const users = Object.entries(data)
        .map(([userId, msgs]) => {
          if (!msgs) return null;

          const arr = Object.values(msgs);

          // Sort by time
          arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const last = arr[0] || {};

          let lastMsgText = "";
          if (last.type === "text") lastMsgText = last.text || "";
          else if (last.type === "image") lastMsgText = "📷 Image";
          else if (last.type === "file") lastMsgText = last.fileName || "📁 File";

          return {
            userId,
            lastMessage: lastMsgText,
            lastSender: last.sender || "unknown",
            lastTimestamp: last.createdAt || 0,
            unreadCount: 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setList(users);
      setLoading(false);
    });

    return () => {
      off(messagesRef);
      unsubscribe && unsubscribe();
    };
  }, []);

  return (
    <div className="admin-users">
      <div className="sidebar-header">
        <h2 className="admin-title">Conversations</h2>
      </div>

      <div className="users-list">
        {loading ? (
          <div className="no-msg">Loading conversations…</div>
        ) : list.length === 0 ? (
          <div className="no-msg">No conversations</div>
        ) : (
          list.map((c) => (
            <ConversationListItem
              key={c.userId}
              user={c}
              active={activeConversation === c.userId}
              onClick={() => setActiveConversation(c.userId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
