import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConversationListItem from "./ConversationListItem";
import "./Admin.css";
import { ref as dbRef, onValue, off } from "firebase/database";
import { db } from "../firebase";
import { useAdmin } from "./AdminContext";

export default function ConversationsPanel() {
  const { activeConversation, setActiveConversation } = useAdmin();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenConversations, setHiddenConversations] = useState(() => {
    try {
      const raw = localStorage.getItem("hiddenConversations");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "hiddenConversations") {
        try {
          setHiddenConversations(e.newValue ? JSON.parse(e.newValue) : []);
        } catch (err) {
          setHiddenConversations([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  // Filter out locally-hidden conversations
  const visibleList = list.filter((c) => !hiddenConversations.includes(c.userId));

  return (
    <div className="admin-users">
      <div className="sidebar-header">
        <h2 className="admin-title">Conversations</h2>
      </div>

      <div className="users-list">
        {loading ? (
          <div className="no-msg">Loading conversations…</div>
        ) : visibleList.length === 0 ? (
          <div className="no-msg">No conversations</div>
        ) : (
          visibleList.map((c) => (
            <ConversationListItem
              key={c.userId}
              user={c}
              active={activeConversation === c.userId}
              onClick={() => {
                setActiveConversation(c.userId);
                navigate(`/admin/chat/${encodeURIComponent(c.userId)}`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
