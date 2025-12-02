// src/firebase.js
// Realtime Database only — no Firebase Storage

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

const firebaseConfig = {
  apiKey: "AIzaSyDeJhHkhCmsCUe5nFLEb6ey5KruAsNFNuQ",
  authDomain: "stacks-chat-b795c.firebaseapp.com",
  databaseURL:
    "https://stacks-chat-b795c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stacks-chat-b795c",
  storageBucket: "stacks-chat-b795c.appspot.com",
  messagingSenderId: "410462423292",
  appId: "1:410462423292:web:48dbeb3d6a5149952b2f79",
};

// Initialize
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// --------------------------------------
// MESSAGE HELPERS
// --------------------------------------

export async function pushMessage(userId, message) {
  if (!userId) throw new Error("userId required");

  const path = `messages/${userId}`;
  const payload = { ...message, createdAt: Date.now() };

  const newRef = await dbPush(dbRef(db, path), payload);

  await dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    lastMessage: payload.text || (payload.type === "image" ? "Image" : ""),
    lastSender: payload.sender,
    lastTimestamp: payload.createdAt,
    status: "open",
  });

  return newRef.key;
}

export function subscribeToMessages(userId, onChange) {
  const path = `messages/${userId}`;
  const r = dbRef(db, path);

  const listener = (snap) => {
    const data = snap.val() || {};
    const arr = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    onChange(arr);
  };

  const unsubscribe = onValue(r, listener);
  return () => dbOff(r, "value", listener) || unsubscribe();
}

// --------------------------------------
// META + PRESENCE + OTHERS
// --------------------------------------

export function subscribeToConversationMeta(onChange) {
  const r = dbRef(db, "meta/conversations");
  const listener = (snap) => onChange(snap.val() || {});
  const unsubscribe = onValue(r, listener);
  return () => dbOff(r, "value", listener) || unsubscribe();
}

export async function markConversationRead(userId, agentId) {
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    unreadCount: 0,
    lastReadBy: agentId || "admin",
    lastReadAt: Date.now(),
  });
}

export async function incrementUnread(userId) {
  const metaRef = dbRef(db, `meta/conversations/${userId}`);
  const snapshot = await dbGet(metaRef);
  const meta = snapshot.val();
  return dbUpdate(metaRef, { unreadCount: (meta?.unreadCount || 0) + 1 });
}

export function setTyping(userId, agentId, isTyping) {
  return dbSet(dbRef(db, `typing/${userId}/${agentId}`), !!isTyping);
}

export function setPresence(userId, { online } = { online: true }) {
  return dbUpdate(dbRef(db, `presence/${userId}`), {
    online: !!online,
    lastSeen: online ? null : Date.now(),
  });
}

export async function deleteMessage(userId, messageId) {
  await dbRemove(dbRef(db, `messages/${userId}/${messageId}`));
}

export async function updateConversationMeta(userId, patch = {}) {
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), patch);
}

export function buildTextMessage(sender, text) {
  return { text, sender, type: "text", createdAt: Date.now() };
}

export default {
  db,
  pushMessage,
  subscribeToMessages,
  subscribeToConversationMeta,
  markConversationRead,
  incrementUnread,
  setTyping,
  setPresence,
  deleteMessage,
  updateConversationMeta,
  buildTextMessage,
};
