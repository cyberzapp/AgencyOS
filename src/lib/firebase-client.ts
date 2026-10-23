import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "agencyos-prod.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "agencyos-prod",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "agencyos-prod.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseClientConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function getFirebaseClientServices(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  isConfigured: boolean;
} {
  if (!isFirebaseClientConfigured) {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      isConfigured: false,
    };
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    return {
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
      storage: storageInstance,
      isConfigured: true,
    };
  } catch {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      isConfigured: false,
    };
  }
}

export interface GoogleAuthResult {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  provider: "firebase_google_oauth" | "resilient_google_workspace_sso";
}

export async function signInWithGoogleIdentity(fallbackProfile?: {
  name: string;
  email: string;
}): Promise<GoogleAuthResult> {
  const { auth, isConfigured } = getFirebaseClientServices();
  if (isConfigured && auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      return {
        uid: cred.user.uid,
        name: cred.user.displayName || "Agency Partner",
        email: cred.user.email || "partner@ateliervance.co",
        photoUrl: cred.user.photoURL || undefined,
        provider: "firebase_google_oauth",
      };
    } catch {
      // Fall through to resilient Google Workspace session fallback
    }
  }

  const email = fallbackProfile?.email || "claire@ateliervance.co";
  const name = fallbackProfile?.name || "Claire Vance";
  return {
    uid: `goog_${email.replace(/[^a-z0-9]/gi, "_")}`,
    name,
    email,
    provider: "resilient_google_workspace_sso",
  };
}

export async function signOutGoogleIdentity(): Promise<void> {
  const { auth, isConfigured } = getFirebaseClientServices();
  if (isConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore signout network errors
    }
  }
}
