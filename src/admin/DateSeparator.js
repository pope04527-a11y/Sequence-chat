import React from "react";
import "./AdminPanel.css";

/*
 DateSeparator
  - label: string to show (e.g. "Today", "Yesterday", "01 Dec 2025")
*/
export default function DateSeparator({ label }) {
  return <div className="date-sep">{label}</div>;
}
