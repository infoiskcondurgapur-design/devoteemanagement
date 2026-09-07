// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjoCWRSU6ORZ_imB26VveEB3u8uULlWPk",
    authDomain: "iskcon-devotees.firebaseapp.com",
    projectId: "iskcon-devotees",
    storageBucket: "iskcon-devotees.firebasestorage.app",
    messagingSenderId: "982745476488",
    appId: "1:982745476488:web:8cd07941c2e9e2f4bb1e3d",
    measurementId: "G-3T8LZE8P08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
