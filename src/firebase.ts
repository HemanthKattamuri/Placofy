import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Firebase web config for project: placofy-e4bc3
const firebaseConfig = {
  apiKey: "AIzaSyDcYjtEAk50tbU64krhTNbxCDXW_4WT8Y8",
  authDomain: "placofy-e4bc3.firebaseapp.com",
  projectId: "placofy-e4bc3",
  storageBucket: "placofy-e4bc3.firebasestorage.app",
  messagingSenderId: "569818394842",
  appId: "1:569818394842:web:8166d2cfbdb3bb1b1235e3",
  measurementId: "G-Y3JG93ES3S",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export let analytics: Analytics | null = null;

// Analytics only works in supported browser environments
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics init failures (ad blockers, unsupported browsers, etc.)
    });
}
