import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Tự động phát hiện đổi dự án Firebase để dọn dẹp cache Local Storage cũ
if (typeof window !== 'undefined') {
  const currentProjectId = firebaseConfig.projectId;
  const lastProjectId = localStorage.getItem('last_firebase_project_id');
  if (lastProjectId !== currentProjectId) {
    console.log(`Phát hiện đổi dự án Firebase từ ${lastProjectId} sang ${currentProjectId}. Đang tự động dọn dẹp cache cũ...`);
    localStorage.clear();
    localStorage.setItem('last_firebase_project_id', currentProjectId);
    window.location.reload();
  }
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services (CRITICAL: Must pass the firestoreDatabaseId)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('current_user_role');
    localStorage.removeItem('current_user_email');
    localStorage.setItem('activeModule', 'overview');
    await signOut(auth);
    window.dispatchEvent(new Event('mock-login-changed'));
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

// --- Mandatory Firestore Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global connection health check on initial load (Mandatory skill validation check)
async function testConnectionOnBoot() {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection initialized successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client reported as offline.");
    }
  }
}
testConnectionOnBoot();
