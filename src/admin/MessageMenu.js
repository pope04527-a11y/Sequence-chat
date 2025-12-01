import React, { useState, useRef, useEffect } from "react";

/*
 MessageMenu - small dropdown menu for message actions
 Props:
  - onReply()
  - onDelete()
  - onDownload()
*/
export default function MessageMenu({ onReply, onDelete, onDownload }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("click", onDoc);
    return () => window.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          borderRadius: 6,
        }}
        aria-label="Message menu"
        title="Message actions"
      >
        ⋯
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 28,
            background: "white",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            borderRadius: 8,
            minWidth: 160,
            zIndex: 50,
            padding: 8,
            fontSize: 14,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={{ display: "block", width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => { setOpen(false); onReply && onReply(); }}
          >
            Reply
          </button>

          <button
            style={{ display: "block", width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => { setOpen(false); onDownload && onDownload(); }}
          >
            Download
          </button>

          <button
            style={{ display: "block", width: "100%", padding: "8px 10px", textAlign: "left", color: "#b03030", background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => { setOpen(false); if (confirm("Delete this message?")) { onDelete && onDelete(); } }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
