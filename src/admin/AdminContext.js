import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  pushMessage,
  pushMessageWithFile,
  subscribeToConversationMeta,
  markConversationRead,
  setTyping,
  setPresence,
  buildTextMessage,
} from "../firebase";

/**
 * AdminContext
 *
 * Provides:
 *  - agentId (auto-generated or stored in localStorage)
 *  - conversations (array of conversation meta objects from meta/conversations/)
 *  - activeConversation (userId)
 *  - helpers: setActiveConversation, sendTextMessage, sendFileMessage, markActiveRead, setTypingForActive
 *
 * Usage:
 *  Wrap your admin app with <AdminProvider> and use useAdmin() in child components.
 */

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  // Agent identity (simple). Persist to localStorage so reload keeps same id.
  const [agentId, setAgentId] = useState(() => {
    try {
      const saved = localStorage.getItem("stacks_admin_agentId");
      if (saved) return saved;
      const generated = `agent_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("stacks_admin_agentId", generated);
      return generated;
    } catch (err) {
      return `agent_${Math.random().toString(36).slice(2, 8)}`;
    }
  });

  // Conversations meta (object keyed by userId) coming from subscribeToConversationMeta
  const [conversationsMap, setConversationsMap] = useState({});
  // active conversation userId
  const [activeConversation, setActiveConversation] = useState(null);

  // When activeConversation changes we mark it read
  useEffect(() => {
    if (!activeConversation) return;
    // mark as read so unreadCount resets (server-side transaction recommended later)
    markConversationRead(activeConversation, agentId).catch((e) => {
      console.warn("markConversationRead failed:", e);
    });
  }, [activeConversation, agentId]);

  // presence: set agent online when mounted, offline when unmounted
  useEffect(() => {
    if (!agentId) return;
    setPresence(agentId, { online: true }).catch(() => {});
    // set agent offline on unload
    const onUnload = () => {
      try {
        // best-effort
        setPresence(agentId, { online: false });
      } catch (e) {}
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      try {
        setPresence(agentId, { online: false });
      } catch (e) {}
    };
  }, [agentId]);

  // subscribe to conversation metadata (meta/conversations)
  useEffect(() => {
    const unsubscribe = subscribeToConversationMeta((metaObj) => {
      // metaObj is raw object from RTDB: { userId: { lastMessage,... }, ... }
      setConversationsMap(metaObj || {});
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Derived conversations array sorted by lastTimestamp desc
  const conversations = useMemo(() => {
    return Object.entries(conversationsMap || {})
      .map(([userId, meta]) => ({
        userId,
        lastMessage: meta?.lastMessage || "",
        lastSender: meta?.lastSender || "unknown",
        lastTimestamp: meta?.lastTimestamp || 0,
        unreadCount: meta?.unreadCount || 0,
        assignedAgent: meta?.assignedAgent || null,
        status: meta?.status || "open",
        // copy raw meta so UI can show tags/other fields if needed
        meta,
      }))
      .sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
  }, [conversationsMap]);

  // Helper: send a text message as this agent
  async function sendTextMessage(userId, text) {
    if (!userId || !text || !text.trim()) return null;
    const msg = buildTextMessage(agentId, text.trim());
    try {
      const id = await pushMessage(userId, msg);
      return id;
    } catch (e) {
      console.error("sendTextMessage error:", e);
      throw e;
    }
  }

  // Helper: upload a file and push a message (reports progress via onProgress callback)
  // onProgress(percent) optional
  async function sendFileMessage(userId, file, { type = "file", caption = "" } = {}, onProgress) {
    if (!userId || !file) throw new Error("userId and file are required");
    return pushMessageWithFile(userId, file, { type, fileName: file.name, caption, sender: agentId }, onProgress);
  }

  // Typing control for active conversation
  function setTypingForActive(isTyping) {
    if (!activeConversation || !agentId) return;
    return setTyping(activeConversation, agentId, !!isTyping);
  }

  // Mark active conversation read explicitly
  function markActiveRead() {
    if (!activeConversation) return;
    return markConversationRead(activeConversation, agentId);
  }

  const value = {
    agentId,
    setAgentId: (id) => {
      setAgentId(id);
      try {
        localStorage.setItem("stacks_admin_agentId", id);
      } catch (e) {}
    },
    conversations,
    conversationsMap,
    activeConversation,
    setActiveConversation,
    sendTextMessage,
    sendFileMessage,
    setTypingForActive,
    markActiveRead,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// Hook for convenience
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return ctx;
}
