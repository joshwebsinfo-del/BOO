import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase Firestore database (where remaining structured data goes)
export const firestoreDb = getFirestore(firebaseApp);

// Clean Supabase Anon/API Token for storage uploads
const SUPABASE_ANON_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3eml3bml3Ymd1d21mY2hwZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMjk4MjIsImV4cCI6MjA5OTcwNTgyMn0.uF25g9HVY9c5GVBL-Q2tUARcwl8VqdaF6Nqi8Fdu7W8`;

// SUPABASE STORAGE BINARY REST UPLOAD UTILITY
export const uploadToSupabase = async (fileBase64: string, fileName: string): Promise<string> => {
  if (!fileBase64 || !fileBase64.startsWith('data:')) {
    return fileBase64;
  }

  try {
    const parts = fileBase64.split(',');
    const metadata = parts[0];
    const cleanedBase64 = parts[1];

    // Extract mimetype
    const mimeType = metadata.split(';')[0].split(':')[1] || 'image/jpeg';

    // Convert base64 back into binary bytes
    const binary = atob(cleanedBase64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });

    // Sanitize and append timestamp to prevent filename collision
    const sanitizedFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const uploadUrl = `https://jwziwniwbguwmfchpeax.supabase.co/storage/v1/object/uploads/${sanitizedFileName}`;

    console.log(`[Supabase Storage] Dispatching binary stream: ${sanitizedFileName} (${mimeType})`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_TOKEN}`,
        'apikey': SUPABASE_ANON_TOKEN,
        'Content-Type': mimeType
      },
      body: blob
    });

    if (response.ok) {
      const publicUrl = `https://jwziwniwbguwmfchpeax.supabase.co/storage/v1/object/public/uploads/${sanitizedFileName}`;
      console.log(`[Supabase Storage] Successfully uploaded! Public Access URL: ${publicUrl}`);
      return publicUrl;
    } else {
      console.warn(`[Supabase Storage warning] REST endpoint returned status ${response.status}. Falling back to default base64.`);
      return fileBase64;
    }
  } catch (e: any) {
    console.warn(`[Supabase Storage fail] Could not upload file, falling back to base64. Error: ${e.message}`);
    return fileBase64;
  }
};
