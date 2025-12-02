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
  get as dbGet,
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
  storageBucket: "no-storage-used-here", // not used anymore
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

export function buildFileMessage(sender, fileUrl, fileType, fileName) {
  return {
    sender,
    fileUrl,
    fileType,
    fileName,
    type: "image",
    createdAt: Date.now(),
  };
}

// -------------------------------------------------------
// 🔥 SEND TEXT MESSAGE
// -------------------------------------------------------
export async function pushMessage(userId, message) {
  if (!userId) throw new Error("Missing userId");

  const path = `messages/${userId}`;
  const payload = { ...message, createdAt: Date.now() };

  const msgRef = await dbPush(dbRef(db, path), payload);

  await dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    lastMessage:
      payload.text || (payload.type === "image" ? "📷 Image" : "File"),
    lastSender: payload.sender,
    lastTimestamp: payload.createdAt,
    status: "open",
  });

  return msgRef.key;
}

// -------------------------------------------------------
// 📤 SEND IMAGE/FILE (Supabase Upload)
// -------------------------------------------------------
export async function pushMessageWithFile(
  userId,
  file,
  { sender },
  onProgress
) {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from("public-files")
      .upload(filePath, file);

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    // Public URL
    const { data: urlData } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Save message to RTDB
    const msg = buildFileMessage(sender, publicUrl, file.type, file.name);

    return pushMessage(userId, msg);
  } catch (err) {
    console.error("pushMessageWithFile ERROR:", err);
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
// SUBSCRIPTIONS & META
// -------------------------------------------------------
export function subscribeToMessages(userId, onChange) {
  const r = dbRef(db, `messages/${userId}`);

  const listener = (snap) => {
    const raw = snap.val() || {};

    const arr = Object.entries(raw)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.createdAt - b.createdAt);

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
