import React, { useEffect, useRef, useState } from "react";
import {
  subscribeToMessages,
  deleteMessage as firebaseDeleteMessage,
} from "../firebase";
import { useAdmin } from "./AdminContext";
import Composer from "./Composer";
import "./Admin.css";
import ChatMessage from "./ChatMessage";
import DateSeparator from "./DateSeparator";

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
  } = useAdmin();

  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [uploads, setUploads] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setReplyTo(null);
      return;
    }
    const unsub = subscribeToMessages(activeConversation, (msgs) => {
      setMessages(msgs);
      setTimeout(
        () => scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
        60
      );
    });
    return () => unsub && unsub();
  }, [activeConversation]);

  const messageById = messages.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});

  const grouped = [];
  let lastDay = null;
  messages.forEach((m) => {
    const day = new Date(m.createdAt || 0);
    const dayKey = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate()
    ).getTime();
    if (lastDay !== dayKey) {
      grouped.push({ type: "date", ts: m.createdAt, key: `d-${dayKey}` });
      lastDay = dayKey;
    }
    grouped.push({ type: "msg", msg: m, key: m.id });
  });

  const handleSendText = async (text) => {
    if (!activeConversation) return;

    await sendTextMessage(
      activeConversation,
      {
        text,
        sender: agentId,
        type: "text",
      },
      replyTo
    );

    setReplyTo(null);
  };

  const handleSendFile = async (file, onProgress) => {
    if (!activeConversation || !sendFileMessage) return;
    const tempId = `upload_${Date.now()}`;
    setUploads((u) => ({
      ...u,
      [tempId]: { name: file.name, progress: 0 },
    }));

    await sendFileMessage(activeConversation, file, {}, (percent) => {
      setUploads((u) => ({
        ...u,
        [tempId]: { name: file.name, progress: percent },
      }));
    });

    setUploads((u) => {
      const next = { ...u };
      delete next[tempId];
      return next;
    });
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleDelete = async (message) => {
    if (!activeConversation || !message?.id) return;
    await firebaseDeleteMessage(activeConversation, message.id);
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  };

  if (!activeConversation)
    return <div className="empty-state">Select a conversation</div>;

  return (
    <div className="admin-chat">
      <div className="adminchat-header">
        <div className="chat-title">
          Chat with <strong>{activeConversation}</strong>
        </div>
        <div className="chat-sub">Admin: {agentId}</div>
      </div>

      <div className="adminchat-body">
        {grouped.length === 0 ? (
          <div className="no-msg">No messages yet</div>
        ) : (
          grouped.map((item) =>
            item.type === "date" ? (
              <DateSeparator key={item.key} label={formatDateHeader(item.ts)} />
            ) : (
              <ChatMessage
                key={item.msg.id}
                m={item.msg}
                isAdmin={item.msg.sender === agentId}
                onReply={handleReply}
                onDelete={handleDelete}
                onDownload={() =>
                  item.msg.url && window.open(item.msg.url, "_blank")
                }
                repliedMessage={
                  item.msg.replyTo ? messageById[item.msg.replyTo] : null
                }
              />
            )
          )
        )}

        {Object.entries(uploads).map(([k, u]) => (
          <div key={k} className="upload-bubble">
            <div className="upload-name">{u.name}</div>
            <div className="upload-bar">
              <div
                className="upload-bar-fill"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          </div>
        ))}

        <div ref={scrollRef} />
      </div>

      <div className="adminchat-inputbar">
        <Composer
          onSendText={handleSendText}
          onSendFile={handleSendFile}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={() => {}}
        />
      </div>
    </div>
  );
}
