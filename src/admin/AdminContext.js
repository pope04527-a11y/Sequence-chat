import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  pushMessage,
  subscribeToConversationMeta,
  markConversationRead,
  setTyping,
  setPresence,
  buildTextMessage,
} from "../firebase";
import { supabase } from "../supabaseClient";

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

  // Listen to conversation metadata
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

  // ==================================================
  // SEND TEXT MESSAGE — MATCHES ADMINCHAT.JS
  // ==================================================
  async function sendTextMessage(userId, text) {
    if (!userId || !text || !text.trim()) return null;

    // Build a Firebase-friendly message object
    const message = {
      sender: agentId,
      type: "text",
      text: text.trim(),
      createdAt: Date.now(),
    };

    return pushMessage(userId, message);
  }

  // ==================================================
  // SEND FILE MESSAGE — SUPABASE ONLY
  // ==================================================
  async function sendFileMessage(userId, file, opts = {}, onProgress) {
    if (!file || !userId) return;

    const filePath = `uploads/${Date.now()}_${file.name}`;

    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from("public-files")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);

    const url = urlData.publicUrl;

    // Message format expected by ChatMessage.js
    const msg = {
      sender: agentId,
      type: file.type.startsWith("image") ? "image" : "file",
      url,
      fileName: file.name,
      fileType: file.type,
      createdAt: Date.now(),
    };

    return pushMessage(userId, msg);
  }

  // ==================================================
  // TYPING + READ STATUS
  // ==================================================
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

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
