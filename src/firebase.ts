import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4X-Zk3mwD_GTVWRoemdsGTtPxxTtVzPA",
  authDomain: "zimhub-410e0.firebaseapp.com",
  projectId: "zimhub-410e0",
  storageBucket: "zimhub-410e0.firebasestorage.app",
  messagingSenderId: "251598508094",
  appId: "1:251598508094:web:e57da976ff04b0f3e3016f",
  measurementId: "G-8CEM0H161Z"
};

// Initialize Firebase App
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const firebaseAuth = getAuth(firebaseApp);
