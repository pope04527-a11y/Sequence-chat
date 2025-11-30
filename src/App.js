import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { db } from "./firebase";
import {
  ref,
  push,
  onValue,
  serverTimestamp,
} from "firebase/database";

function App() {
  return (
    <div className="App">
      <h1>Live Chat</h1>
      <ChatRoom />
    </div>
  );
}

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const dummy = useRef();

  // Load messages from Realtime DB
  useEffect(() => {
    const messagesRef = ref(db, "messages");

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = data
        ? Object.keys(data).map((id) => ({ id, ...data[id] }))
        : [];

      setMessages(loadedMessages);
      dummy.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Send a message
  const sendMessage = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const messagesRef = ref(db, "messages");

    push(messagesRef, {
      text,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <>
      <main>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message…"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function ChatMessage({ message }) {
  return (
    <div className="message">
      <p>{message.text}</p>
    </div>
  );
}

export default App;
