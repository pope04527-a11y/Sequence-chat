import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db as realtimeDB } from "../firebase";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // ALSO load last message for each user from Realtime DB
        list.forEach((user) => {
          const msgRef = ref(realtimeDB, `messages/${user.id}`);

          onValue(msgRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
              user.lastMessage = "No messages";
              user.lastSender = "-";
              user.lastTime = "-";
              setUsers([...list]);
              return;
            }

            const array = Object.values(data);
            array.sort((a, b) => b.createdAt - a.createdAt);
            const last = array[0];

            user.lastMessage = last.text || "No text";
            user.lastSender = last.sender || "unknown";
            user.lastTime = new Date(last.createdAt).toLocaleString();

            setUsers([...list]);
          });
        });
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };

    loadUsers();
  }, []);

  const openChat = (userId) => {
    navigate(`/admin/chat/${userId}`);
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Messages by Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Last Message</th>
              <th>Sender</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => openChat(user.id)}
                style={{ cursor: "pointer" }}
              >
                <td>{user.id}</td>
                <td>{user.lastMessage}</td>
                <td>{user.lastSender}</td>
                <td>{user.lastTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
