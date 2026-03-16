import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  subscribeToMessages,
  deleteMessage as firebaseDeleteMessage,
  db,
} from "../firebase";
import {
  ref as dbRef,
  remove as dbRemove,
  update as dbUpdate,
  get as dbGet,
} from "firebase/database";
import { useAdmin } from "./AdminContext";
import Composer from "./Composer";
import "./Admin.css";
import ChatMessage from "./ChatMessage";
import DateSeparator from "./DateSeparator";
import { supabase } from "../supabaseClient"; // kept for compatibility with other handlers

// --------------------------- PROTECTION CONFIG ---------------------------
// Protect specific conversations client-side (Giulia). Replace password value.
const PROTECTED_CHATS = {
  Giulia: "@money-2026" // <-- set the password you want for Giulia here
};
const UNLOCKED_KEY = "unlockedProtectedChats_client_v1";

function readUnlocked() {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

function addUnlocked(userId) {
  try {
    const list = readUnlocked();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
      // broadcast storage event for other tabs
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: UNLOCKED_KEY, newValue: JSON.stringify(list) }));
      } catch (e) {
        /* ignore */
      }
    }
  } catch (e) {}
}

// ------------------------- End protection config -------------------------

/**
 * ChatPanel
 *
 * Notes about hooks:
 * - All hooks are declared unconditionally at the top of the component to satisfy
 *   React rules-of-hooks. Rendering may return early for unauthenticated users,
 *   but hooks are always created in the same order.
 */

const SESSION_KEY = "client_admin_authenticated_v1";
const PROTECTED_ADMIN_URL = "https://sequence-chat.onrender.com/admin";

// Hard-coded admin credentials (requested). WARNING: insecure in production.
const ADMIN_USERNAME = "Keymus-commerce1128";
const ADMIN_PASSWORD = "Keymus-2026";
const DEFAULT_GLOBAL_PASSWORD = "Chat-with-us";

function readClientAuth() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.ok;
  } catch (e) {
    return false;
  }
}

function formatDateHeader(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const dayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const yesterdayStart = dayStart - 24 * 60 * 60 * 1000;

  if (ts >= dayStart) return "Today";
  if (ts >= yesterdayStart) return "Yesterday";
  return d.toLocaleDateString();
}

export default function ChatPanel() {
  const {
    activeConversation,
    agentId,
    sendFileMessage,
    sendTextMessage,
    setActiveConversation, // used to navigate back after hiding a conversation
  } = useAdmin();

  // Authentication state (client-only guard)
  const [isAuthenticated, setIsAuthenticated] = useState(readClientAuth());
  const [showModal, setShowModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Data & UI state (always declared)
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [uploads, setUploads] = useState({});
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef(null); // sentinel at bottom for scrollIntoView
  const bodyRef = useRef(null); // the scrolling container
  const isAtBottomRef = useRef(true); // track whether user is at bottom

  // Protection state (always declared)
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Keep local copy of grouped/messages derived values as normal
  // (they will be computed below when needed)
  // ---------- Hooks that were previously conditional are now declared here ----------

  // Sync auth from other tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === SESSION_KEY) {
        setIsAuthenticated(readClientAuth());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Primary login handler (modal) - hard-coded check now
  async function handleLogin(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const username = document.getElementById("modal-admin-username")?.value?.trim() || "";
    const password = document.getElementById("modal-admin-password")?.value || "";

    if (!password) {
      setLoginError("Password is required");
      setLoginLoading(false);
      return;
    }

    try {
      // Hard-coded credential check:
      let ok = false;
      if (username) {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) ok = true;
      } else {
        if (password === DEFAULT_GLOBAL_PASSWORD) ok = true;
      }

      if (!ok) {
        setLoginError("Invalid username or password");
        setLoginLoading(false);
        return;
      }

      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ok: true, username: username || null, t: Date.now() }));
      } catch (err) {
        console.warn("Failed to persist admin session:", err);
      }

      setIsAuthenticated(true);
      setShowModal(false);

      // Open external protected admin URL after successful sign-in
      try {
        window.open(PROTECTED_ADMIN_URL, "_blank");
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error("Admin login failed:", err);
      setLoginError("Login error");
    } finally {
      set*
