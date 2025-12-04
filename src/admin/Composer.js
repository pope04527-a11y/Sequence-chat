import React, { useRef, useState, useEffect } from "react";
import "./Admin.css";

/*
 Composer (with reply preview support)
 Props:
  - onSendText(text)
  - onSendFile(file, onProgress)
  - onTyping(bool)
  - replyTo: optional message object { id, text, sender }
  - onCancelReply()
*/
export default function Composer({ onSendText, onSendFile, onTyping, replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    // clear text when replyTo changes (optional)
  }, [replyTo]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    const t = text.trim();
    if (t) {
      await onSendText && onSendText(t);
      setText("");
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (onSendFile) onSendFile(f, (p) => console.log("upload progress", p));
    fileRef.current.value = "";
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFileChange} />
      <button type="button" className="attach-btn" onClick={() => fileRef.current.click()}>📎</button>

      <div style={{ flex: 1 }}>
        {replyTo ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Replying to <strong>{replyTo.sender === "admin" ? "You" : replyTo.sender}</strong></div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f6f7f8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "var(--muted)" }}>{replyTo.text ? (replyTo.text.length > 140 ? replyTo.text.slice(0, 140) + "…" : replyTo.text) : (replyTo.type === "image" ? "Image" : replyTo.fileName || "File")}</div>
              <button type="button" onClick={() => onCancelReply && onCancelReply()} style={{ marginLeft: 12, border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ) : null}

        <textarea
          placeholder="Type a message..."
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping && onTyping(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
              onTyping && onTyping(false);
            }
          }}
        />
      </div>

      <button type="submit" className="send-btn-admin">Send</button>
    </form>
  );
}
