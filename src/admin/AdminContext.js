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

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [agentId, setAgentId] = useState(() => {
    try {
      const saved = localStorage.getItem("stacks_admin_agentId");
      if (saved) return saved;
      const generated = `agent_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("stacks_admin_agentId", generated);
      return generated;
    } catch {
      return `agent_${Math.random().toString(36).slice(2, 8)}`;
    }
  });

  const [conversationsMap, setConversationsMap] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    if (!activeConversation) return;
    console.log("[AdminContext] activeConversation changed ->", activeConversation);
    markConversationRead(activeConversation, agentId).catch(() => {});
  }, [activeConversation, agentId]);

  useEffect(() => {
    if (!agentId) return;
    setPresence(agentId, { online: true }).catch(() => {});
    const onUnload = () => setPresence(agentId, { online: false });
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      setPresence(agentId, { online: false }).catch(() => {});
    };
  }, [agentId]);

  useEffect(() => {
    const unsubscribe = subscribeToConversationMeta((metaObj) => {
      setConversationsMap(metaObj || {});
    });
    return () => unsubscribe && unsubscribe();
  }, []);

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
        meta,
      }))
      .sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
  }, [conversationsMap]);

  async function sendTextMessage(userId, text) {
    if (!userId || !text || !text.trim()) return null;
    const msg = buildTextMessage(agentId, text.trim());
    return pushMessage(userId, msg);
  }

  async function sendFileMessage(userId, file, opts = {}, onProgress) {
    return pushMessageWithFile(userId, file, { ...opts, sender: agentId }, onProgress);
  }

  function setTypingForActive(isTyping) {
    if (!activeConversation || !agentId) return;
    return setTyping(activeConversation, agentId, !!isTyping);
  }

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
      } catch {}
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

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
