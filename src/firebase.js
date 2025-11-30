import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDeJhHkhCmsCUe5nFLEb6ey5KruAsNFNuQ",
  authDomain: "stacks-chat-b795c.firebaseapp.com",
  databaseURL: "https://stacks-chat-b795c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stacks-chat-b795c",
  storageBucket: "stacks-chat-b795c.appspot.com",
  messagingSenderId: "410462423292",
  appId: "1:410462423292:web:48dbeb3d6a5149952b2f79"
};

const app = initializeApp(firebaseConfig);

// Use Realtime Database
export const db = getDatabase(app);
