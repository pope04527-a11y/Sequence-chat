// Firebase initialization for Stacks Chat
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeJhHkhCmsCUe5nFLEb6ey5KruAsNFNuQ",
  authDomain: "stacks-chat-b795c.firebaseapp.com",
  databaseURL: "https://stacks-chat-b795c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stacks-chat-b795c",
  storageBucket: "stacks-chat-b795c.appspot.com",
  messagingSenderId: "410462423292",
  appId: "1:410462423292:web:48dbeb3d6a5149952b2f79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Realtime Database instance
export const db = getDatabase(app);
