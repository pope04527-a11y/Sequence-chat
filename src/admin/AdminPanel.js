import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import AdminChat from "./AdminChat";
import "./Admin.css";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const chatsRef = ref(db, "chats");

    onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUsers([]);
        return;
      }

      const userList = Object.keys(data).map((userId) => ({
        userId,
        lastMessage: getLastMessage(data[userId]),
      }));

      setUsers(userList);
    });
  }, []);

  const getLastMessage = (messagesObj) => {
    const keys = Object.keys(messagesObj);
    const lastKey = keys[keys.length - 1];
    return messagesObj[lastKey]?.text || "Image";
  };

  return (
    <div className="admin-container">

      {/* LEFT SIDE */}
      <div className="admin-users">
        <h2 className="admin-title">Users</h2>

        {users.map((u) => (
          <div
            key={u.userId}
            className={`user-item ${
              activeUser === u.userId ? "active" : ""
            }`}
            onClick={() => setActiveUser(u.userId)}
          >
            <strong>{u.userId}</strong>
            <p className="last-msg">{u.lastMessage}</p>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div className="admin-chat">
        {activeUser ? (
          <AdminChat userId={activeUser} />
        ) : (
          <div className="empty-state">
            <p>Select a user to chat</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
