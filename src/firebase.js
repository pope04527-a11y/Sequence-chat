// src/firebase.js
// Realtime Database + Storage helpers for Stacks Chat

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
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

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

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

// ----------------- Helpers -----------------

export async function pushMessage(userId, message) {
  if (!userId) throw new Error("userId required");
  const path = `messages/${userId}`;
  const payload = { ...message, createdAt: message.createdAt || Date.now() };
  const newRef = await dbPush(dbRef(db, path), payload);

  await dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    lastMessage: payload.text || (payload.type === "image" ? "Image" : ""),
    lastSender: payload.sender || "unknown",
    lastTimestamp: payload.createdAt,
    status: "open",
  });

  return newRef.key;
}

export function pushMessageWithFile(userId, file, meta = {}, onProgress) {
  if (!userId) return Promise.reject(new Error("userId required"));

  const timestamp = Date.now();
  const safeName = (file.name || "file").replace(/\s+/g, "_");
  const storagePath = `uploads/${userId}/${timestamp}_${safeName}`;
  const sRef = storageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(sRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            sender: meta.sender || "admin", // FIXED: user OR admin can send file
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
      ? Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort(
            (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
          )
      : [];
    onChange(arr);
  };

  const unsubscribe = onValue(r, listener);
  return () => dbOff(r, "value", listener) || unsubscribe();
}

export function subscribeToConversationMeta(onChange) {
  const r = dbRef(db, "meta/conversations");
  const listener = (snap) => onChange(snap.val() || {});
  const unsubscribe = onValue(r, listener);
  return () => dbOff(r, "value", listener) || unsubscribe();
}

export async function markConversationRead(userId, agentId) {
  if (!userId) return;
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), {
    unreadCount: 0,
    lastReadBy: agentId || "admin",
    lastReadAt: Date.now(),
  });
}

export async function incrementUnread(userId) {
  if (!userId) return;
  const metaRef = dbRef(db, `meta/conversations/${userId}`);
  const snapshot = await dbGet(metaRef);
  const meta = snapshot.val();
  const newCount = ((meta && meta.unreadCount) || 0) + 1;

  return dbUpdate(metaRef, { unreadCount: newCount });
}

export function setTyping(userId, agentId, isTyping) {
  if (!userId || !agentId) return Promise.resolve();
  return dbSet(dbRef(db, `typing/${userId}/${agentId}`), !!isTyping);
}

export function setPresence(userId, { online } = { online: true }) {
  if (!userId) return Promise.resolve();
  return dbUpdate(dbRef(db, `presence/${userId}`), {
    online: !!online,
    lastSeen: online ? null : Date.now(),
  });
}

export async function deleteMessage(userId, messageId) {
  if (!userId || !messageId) return;
  await dbRemove(dbRef(db, `messages/${userId}/${messageId}`));
}

export async function updateConversationMeta(userId, patch = {}) {
  if (!userId) return;
  return dbUpdate(dbRef(db, `meta/conversations/${userId}`), patch);
}

export function buildTextMessage(sender, text) {
  return {
    text,
    sender,
    type: "text",
    createdAt: Date.now(),
  };
}

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
