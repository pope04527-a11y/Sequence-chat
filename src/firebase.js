/**
 * firebase.js — Realtime Database + Supabase Uploads
 * No Firebase Storage is used.
 */

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  push as dbPush,
  set as dbSet,
  update as dbUpdate,
  onValue,
  off as dbOff,
  remove as dbRemove,
} from "firebase/database";

import { supabase } from "./supabaseClient";

// -------------------------------------------------------
// 🔥 Firebase RTDB Setup
// -------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDeJhHkhCmsCUe5nFLEb6ey5KruAsNFNuQ",
  authDomain: "stacks-chat-b795c.firebaseapp.com",
  databaseURL:
    "https://stacks-chat-b795c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stacks-chat-b795c",
  storageBucket: "not-used",
  messagingSenderId: "410462423292",
  appId: "1:410462423292:web:48dbeb3d6a5149952b2f79",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
export function buildTextMessage(sender, text) {
  return {
    sender,
    text,
    type: "text",
    createdAt: Date.now(),
  };
}

export function buildFileMessage(sender, url, fileType, fileName) {
  return {
    sender,
    url,                 // 🔥 FIXED (previously fileUrl)
    fileType,
    fileName,
    type: fileType.startsWith("image") ? "image" : "file", // 🔥 FIXED
    createdAt: Date.now(),
  };
}

// -------------------------------------------------------
// 🔥 SEND TEXT OR FILE MESSAGE
// -------------------------------------------------------
export async function pushMessage(userId, message) {
  if (!userId) throw new Error("Missing userId");

  const path = `messages/${userId}`;
  const payload = {
    ...message,
    createdAt: message.createdAt || Date.now(), // 🔥 FIXED
  };

  const msgRef = await dbPush(dbRef(db, path), payload);

  const preview =
    payload.text ||
    (payload.type === "image" ? "📷 Image" : "📎 File");

  await dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    lastMessage: preview,
    lastSender: payload.sender,
    lastTimestamp: payload.createdAt,
    status: "open",
  });

  return msgRef.key;
}

// -------------------------------------------------------
// 📤 UPLOAD FILE VIA SUPABASE & SAVE MESSAGE
// -------------------------------------------------------
export async function pushMessageWithFile(userId, file, { sender }) {
  try {
    const timestamp = Date.now();
    const filePath = `uploads/${timestamp}_${file.name}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from("public-files")
      .upload(filePath, file);

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    // Public URL
    const { data: urlData } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);

    const url = urlData.publicUrl;

    // Create file message
    const msg = buildFileMessage(sender, url, file.type, file.name);

    return pushMessage(userId, msg);
  } catch (e) {
    console.error("pushMessageWithFile ERROR:", e);
    return null;
  }
}

// -------------------------------------------------------
// DELETE MESSAGE
// -------------------------------------------------------
export async function deleteMessage(userId, messageId) {
  if (!userId || !messageId) return;
  return dbRemove(dbRef(db, `messages/${userId}/${messageId}`));
}

// -------------------------------------------------------
// SUBSCRIPTIONS
// -------------------------------------------------------
export function subscribeToMessages(userId, onChange) {
  const r = dbRef(db, `messages/${userId}`);

  const listener = (snap) => {
    const raw = snap.val() || {};

    const arr = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // 🔥 FIXED

    onChange(arr);
  };

  onValue(r, listener);
  return () => dbOff(r, "value", listener);
}

export function subscribeToConversationMeta(onChange) {
  const r = dbRef(db, "meta/conversations");
  const listener = (snap) => onChange(snap.val() || {});
  onValue(r, listener);
  return () => dbOff(r, "value", listener);
}

// -------------------------------------------------------
// META CONTROLS
// -------------------------------------------------------
export function markConversationRead(userId, agentId) {
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    unreadCount: 0,
    lastReadBy: agentId,
    lastReadAt: Date.now(),
  });
}

export function setTyping(userId, senderId, isTyping) {
  return dbSet(dbRef(db, `typing/${userId}/${senderId}`), !!isTyping);
}

export function setPresence(userId, { online }) {
  return dbUpdate(dbRef(db, `presence/${userId}`), {
    online: !!online,
    lastSeen: online ? null : Date.now(),
  });
}
