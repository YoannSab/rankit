import { initializeApp, type FirebaseApp } from "firebase/app"
import { getDatabase, type Database } from "firebase/database"

// TODO: replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCJSV58136sI6LAEbAFSJJqKXZX5pzUciw",
  authDomain: "rankit-c8f36.firebaseapp.com",
  databaseURL: "https://rankit-c8f36-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rankit-c8f36",
  storageBucket: "rankit-c8f36.firebasestorage.app",
  messagingSenderId: "400488599018",
  appId: "1:400488599018:web:5428ecc88ead144cc97693"
};

const isConfigured = !Object.values(firebaseConfig).some((v) =>
  v.startsWith("YOUR_"),
)

export let firebaseApp: FirebaseApp | null = null
export let db: Database | null = null

if (isConfigured) {
  try {
    firebaseApp = initializeApp(firebaseConfig)
    db = getDatabase(firebaseApp)
  } catch (err) {
    console.warn("[Firebase] Initialization failed:", err)
  }
} else {
  console.warn(
    "[Firebase] Config not set — running in offline mode. Edit src/config/firebase.ts to connect.",
  )
}
