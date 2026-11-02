// Paste your Firebase web app config here (Firebase console → Project settings → Your apps → Web app).
// This file is loaded by both the app page and the notification service worker.
self.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};

// Firebase console → Project settings → Cloud Messaging → Web Push certificates → Key pair
self.VAPID_KEY = "PASTE_VAPID_KEY";

// Demo mode: the app shows alerts itself while it is open (works on the free Spark plan).
// After enabling billing and deploying functions/ (background push), change this to false.
self.LOCAL_ALERTS = true;
