import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import { GeneratedProject } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with configured databaseId
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection as mandated by Firebase integration guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: client is currently offline or connecting...');
    }
  }
}
testConnection();

// Auth Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Also save/update user profile in Firestore
    if (result.user) {
      await saveUserProfile(result.user);
    }
    return result.user;
  } catch (err: any) {
    if (err?.code === 'auth/network-request-failed') {
      console.warn('Firebase Auth: network request failed in iframe context.');
    }
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await saveUserProfile(result.user);
  }
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await saveUserProfile(result.user, displayName);
  }
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuthState(
  callback: (user: User | null) => void,
  onError?: (err: Error) => void
) {
  return onAuthStateChanged(
    auth,
    callback,
    (err) => {
      console.warn('Firebase Auth state listener notice:', err?.message || err);
      if (onError) onError(err);
    }
  );
}

// User Profile Firestore Helpers
export async function saveUserProfile(user: User, customName?: string) {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: customName || user.displayName || user.email?.split('@')[0] || 'GameForge Creator',
        photoURL: user.photoURL || '',
        updatedAt: Timestamp.now()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not update user profile in Firestore:', err);
  }
}

export async function fetchAdminFirestoreUsers(): Promise<any[]> {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.warn('Admin firestore users query notice:', err);
    return [];
  }
}

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Projects Firestore Helpers
export async function saveProjectToFirestore(project: GeneratedProject, userId: string): Promise<void> {
  // Never attempt Firestore write for guest users or when no Firebase Auth user exists
  if (!userId || userId.startsWith('guest-') || !auth.currentUser) {
    return;
  }
  const path = `projects/${project.id}`;
  try {
    const projectRef = doc(db, 'projects', project.id);
    const now = Date.now();
    await setDoc(
      projectRef,
      {
        id: project.id,
        userId: userId,
        title: project.title || 'New Project',
        type: project.type || 'app',
        description: project.description || '',
        code: project.code || '',
        features: project.features || [],
        conversation: project.conversation || [],
        updatedAt: project.updatedAt || 'Just now',
        updatedAtTimestamp: project.updatedAtTimestamp || now,
        createdAtTimestamp: project.createdAtTimestamp || now,
        isPublic: false
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid.startsWith('guest-')) {
    return;
  }
  const path = `projects/${projectId}`;
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeUserProjects(
  userId: string,
  onProjects: (projects: GeneratedProject[]) => void,
  onError?: (err: Error) => void
) {
  const projectsCol = collection(db, 'projects');
  const q = query(projectsCol, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const projects: GeneratedProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const updatedAtTimestamp =
          typeof data.updatedAtTimestamp === 'number'
            ? data.updatedAtTimestamp
            : typeof data.createdAtTimestamp === 'number'
            ? data.createdAtTimestamp
            : 0;

        projects.push({
          id: data.id || docSnap.id,
          title: data.title || 'Untitled Project',
          type: data.type || 'app',
          description: data.description || '',
          code: data.code || '',
          features: data.features || [],
          conversation: data.conversation || [],
          updatedAt: data.updatedAt || 'Saved to Cloud',
          updatedAtTimestamp,
          createdAtTimestamp: typeof data.createdAtTimestamp === 'number' ? data.createdAtTimestamp : updatedAtTimestamp
        });
      });

      // Sort newest-first so new & recently updated conversations appear at the top
      projects.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));

      onProjects(projects);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}
