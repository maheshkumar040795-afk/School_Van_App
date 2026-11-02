// Firebase web app config (safe to be public — Firestore security rules protect the data).
// This file is loaded by both the app page and the notification service worker.
self.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAQLmkwuyVe93vXUvkLDH8NibTYOXlRxfc",
  authDomain: "school-van-cdd91.firebaseapp.com",
  projectId: "school-van-cdd91",
  storageBucket: "school-van-cdd91.firebasestorage.app",
  messagingSenderId: "950219917050",
  appId: "1:950219917050:web:72f01d397d4ba9db56eb43"
};

// Firebase console → Project settings → Cloud Messaging → Web Push certificates → Key pair
// (Needed only for production background push. Demo works without it.)
self.VAPID_KEY = "PASTE_VAPID_KEY";

// Demo mode: the app shows alerts itself while it is open (works on the free Spark plan).
// After enabling billing and deploying functions/ (background push), change this to false.
self.LOCAL_ALERTS = true;
