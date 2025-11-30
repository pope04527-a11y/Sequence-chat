import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDeJhHkhCmsCUe5nFLEb6ey5KruAsNFNuQ",
  authDomain: "stacks-chat-b795c.firebaseapp.com",
  projectId: "stacks-chat-b795c",
  storageBucket: "stacks-chat-b795c.appspot.com",
  messagingSenderId: "410462423292",
  appId: "1:410462423292:web:48dbeb3d6a5149952b2f79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
