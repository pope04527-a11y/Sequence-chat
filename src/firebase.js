// src/firebase.js
// Realtime Database + Storage helpers for Stacks Chat
// Drop this in to replace your existing src/firebase.js

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
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Your Firebase configuration (keep your values)
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

// Initialize Firebase app, DB and Storage
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

/*
  Helper functions
  - messages stored at: messages/{userId}/{messageId}
  - conversation meta stored at: meta/conversations/{userId}
  - typing at: typing/{userId}/{agentId}
  - presence at: presence/{userId}
  - uploads in Storage at: uploads/{userId}/{timestamp}_{filename}
*/

// Push a plain message (text or message object) to a conversation
export async function pushMessage(userId, message) {
  if (!userId) throw new Error("pushMessage requires userId");
  const path = `messages/${userId}`;
  const payload = {
    ...message,
    createdAt: message.createdAt || Date.now(),
  };
  const newRef = await dbPush(dbRef(db, path), payload);
  // update conversation meta (last message)
  await dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    lastMessage: payload.text || (payload.type === "image" ? "Image" : ""),
    lastSender: payload.sender || "unknown",
    lastTimestamp: payload.createdAt,
    status: "open",
  });
  return newRef.key;
}

// Upload a file to Firebase Storage and push a message with the download URL
// file: File object from input
// meta: { type: 'image'|'file', fileName?, caption? , sender }
export function pushMessageWithFile(userId, file, meta = {}, onProgress) {
  if (!userId) return Promise.reject(new Error("userId required"));
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const storagePath = `uploads/${userId}/${timestamp}_${safeName}`;
  const sRef = storageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(sRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(percent, snapshot);
        }
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const payload = {
            type: meta.type || "file",
            url,
            fileName: meta.fileName || file.name,
            caption: meta.caption || "",
            sender: meta.sender || "admin",
            createdAt: Date.now(),
          };
          const messageId = await pushMessage(userId, payload);
          resolve({ messageId, url });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// Subscribe to messages for a conversation. onChange receives (messagesArray).
// Returns an unsubscribe function.
export function subscribeToMessages(userId, onChange) {
  if (!userId) {
    console.warn("subscribeToMessages called without userId");
    return () => {};
  }
  const path = `messages/${userId}`;
  const r = dbRef(db, path);
  const listener = (snap) => {
    const data = snap.val();
    const arr = data
      ? Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      : [];
    onChange(arr);
  };
  onValue(r, listener);
  return () => dbOff(r, "value", listener);
}

// Subscribe to conversation meta (for list views): meta/conversations/{userId}
export function subscribeToConversationMeta(onChange) {
  const r = dbRef(db, "meta/conversations");
  const listener = (snap) => {
    const data = snap.val();
    onChange(data || {});
  };
  onValue(r, listener);
  return () => dbOff(r, "value", listener);
}

// Mark conversation as read by an agent: sets unreadCount = 0 and can set lastReadByAgent
export async function markConversationRead(userId, agentId) {
  if (!userId) return;
  const path = `meta/conversations/${userId}`;
  return dbUpdate(dbRef(db, path), {
    unreadCount: 0,
    lastReadBy: agentId || "admin",
    lastReadAt: Date.now(),
  });
}

// Increase unread count (call when user sends a message and admin is not active)
export async function incrementUnread(userId) {
  const metaRef = dbRef(db, `meta/conversations/${userId}`);
  // Simple increment: read, update. For production use a transaction.
  const snapPromise = new Promise((resolve) => onValue(metaRef, (s) => { resolve(s.val()); }, { onlyOnce: true }));
  const meta = await snapPromise;
  const newCount = ((meta && meta.unreadCount) || 0) + 1;
  return dbUpdate(metaRef, { unreadCount: newCount });
}

// Typing indicator
export function setTyping(userId, agentId, isTyping) {
  if (!userId || !agentId) return Promise.resolve();
  const path = `typing/${userId}/${agentId}`;
  return dbSet(dbRef(db, path), !!isTyping);
}

// Presence (simple)
export function setPresence(userId, { online } = { online: true }) {
  if (!userId) return Promise.resolve();
  const path = `presence/${userId}`;
  return dbUpdate(dbRef(db, path), { online: !!online, lastSeen: online ? null : Date.now() });
}

// Utility: delete a message
export async function deleteMessage(userId, messageId) {
  if (!userId || !messageId) return;
  await dbRemove(dbRef(db, `messages/${userId}/${messageId}`));
  // Optionally recompute lastMessage in meta/conversations (not implemented here).
}

// Small helper to update conversation meta (assign agent, close/open, tags)
export async function updateConversationMeta(userId, patch = {}) {
  if (!userId) return;
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), patch);
}

// Convenience: build a message object for UI
export function buildTextMessage(sender, text) {
  return {
    text,
    sender,
    type: "text",
    createdAt: Date.now(),
  };
}

// Exports summary
export default {
  db,
  storage,
  pushMessage,
  pushMessageWithFile,
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
