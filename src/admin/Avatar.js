import React from "react";
import "./Avatar.css"; // optional if you want external styles

/**
 * Avatar Component
 * Props:
 * - name: user full name or id ("Trust Richards")
 * - src: image url (optional)
 * - size: number (default: 40)
 * - online: boolean (green indicator)
 * - bg: custom background color (defaults to your blue)
 */
export default function Avatar({ name = "", src = "", size = 40, online = false, bg = "#1076D6" }) {
  const initials = name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const s = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: "50%",
    background: bg,
    color: "#fff",
    fontWeight: 700,
    fontSize: size * 0.38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  };

  return (
    <div className="avatar" style={s}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        initials
      )}

      {online && (
        <div
          style={{
            position: "absolute",
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: "#3ee07a", // WhatsApp online green
            bottom: -2,
            right: -2,
            border: "2px solid #fff",
            boxShadow: "0 0 0 4px rgba(16,118,214,0.05)",
          }}
        />
      )}
    </div>
  );
}
