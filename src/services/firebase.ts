import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDocFromServer,
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc,
  Firestore,
  updateDoc,
  increment
} from 'firebase/firestore';
import { CommunityReport, SavedRoute } from '../types';
import appletConfig from '../../firebase-applet-config.json';

// The verified Firebase Web configuration for safety-route-ai-9150d
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyC-x9irCeuvUulCTClcrKsajQQKvBcwVcA",
  authDomain: appletConfig.authDomain || "safety-route-ai-9150d.firebaseapp.com",
  projectId: appletConfig.projectId || "safety-route-ai-9150d",
  storageBucket: appletConfig.storageBucket || "safety-route-ai-9150d.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "1079872022784",
  appId: appletConfig.appId || "1:1079872022784:web:fac341448609e5ce9e6be5",
  measurementId: appletConfig.measurementId || ""
};

let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, appletConfig.firestoreDatabaseId || '(default)');

// ==================== ERROR HANDLING ====================

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
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error Details]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate live connection to Firestore backend
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] The client is offline or network is unreachable.');
      return false;
    }
    // Missing permission or not found doc on 'test/connection' still confirms the live server replied!
    return true;
  }
}

// Initial connection check
testFirestoreConnection();

// ==================== AUTHENTICATION ====================

export async function registerWithEmail(name: string, email: string, pass: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  if (name.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }

  // Mandatory: Create corresponding user document in users/{uid}
  const userPath = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      name: name.trim() || 'User',
      email: email.trim(),
      createdAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  return user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Ensure/update user document exists in users/{uid}
  const userPath = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email || email.trim(),
      name: user.displayName || 'User',
      lastLogin: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ==================== COMMUNITY REPORTS ====================

export async function submitCommunityReport(
  reportData: Omit<CommunityReport, 'id' | 'timestamp' | 'confirmations'>
): Promise<CommunityReport> {
  const timestamp = Date.now();
  const confirmations = 1;
  const path = 'reports';

  const docPayload = {
    userId: reportData.userId,
    userName: reportData.userName || 'Community Contributor',
    category: reportData.category,
    description: reportData.description,
    latitude: Number(reportData.latitude),
    longitude: Number(reportData.longitude),
    timestamp,
    status: reportData.status || 'Reported',
    confirmations
  };

  try {
    // Actually call Firestore addDoc() to write directly to reports/{reportId}
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, docPayload);

    return {
      id: docRef.id,
      ...docPayload
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchCommunityReports(): Promise<CommunityReport[]> {
  const path = 'reports';
  const reports: CommunityReport[] = [];

  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data();
      reports.push({
        id: d.id,
        userId: data.userId || '',
        userName: data.userName || 'Community User',
        category: data.category,
        description: data.description,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        timestamp: data.timestamp || Date.now(),
        status: data.status || 'Reported',
        confirmations: Number(data.confirmations) || 1
      });
    });

    return reports;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function confirmCommunityReport(reportId: string): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, {
      confirmations: increment(1),
      status: 'Community Confirmed'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== SAVED ROUTES ====================

export async function saveRouteToFirestore(
  userId: string,
  route: {
    source: string;
    destination: string;
    sourceCoords: { lat: number; lng: number };
    destCoords: { lat: number; lng: number };
    travelMode: string;
    routePreference: string;
    distance: string;
    duration: string;
    safetyScore: number;
  }
): Promise<SavedRoute> {
  const path = 'savedRoutes';
  const createdAt = Date.now();

  const docPayload = {
    userId,
    source: route.source,
    destination: route.destination,
    sourceCoords: route.sourceCoords,
    destCoords: route.destCoords,
    travelMode: route.travelMode,
    routePreference: route.routePreference,
    distance: route.distance,
    duration: route.duration,
    safetyScore: route.safetyScore,
    createdAt
  };

  try {
    // Actually call Firestore addDoc() to write directly to savedRoutes/{routeId}
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, docPayload);

    return {
      id: docRef.id,
      ...docPayload
    } as SavedRoute;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserSavedRoutes(userId: string): Promise<SavedRoute[]> {
  if (!userId || userId === 'guest') {
    return [];
  }

  const path = 'savedRoutes';
  const routes: SavedRoute[] = [];

  try {
    const colRef = collection(db, path);
    const q = query(
      colRef, 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data();
      routes.push({
        id: d.id,
        userId: data.userId,
        source: data.source,
        destination: data.destination,
        sourceCoords: data.sourceCoords,
        destCoords: data.destCoords,
        travelMode: data.travelMode,
        routePreference: data.routePreference,
        distance: data.distance,
        duration: data.duration,
        safetyScore: data.safetyScore,
        createdAt: data.createdAt || Date.now()
      });
    });

    return routes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteSavedRoute(routeId: string, userId: string): Promise<void> {
  const path = `savedRoutes/${routeId}`;
  try {
    const docRef = doc(db, 'savedRoutes', routeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
