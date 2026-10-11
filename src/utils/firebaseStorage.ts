import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChatThread, UserProfile } from '../types';

export async function fetchCloudUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveCloudUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const payload = {
      ...profile,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCloudThreads(userId: string): Promise<ChatThread[]> {
  const path = 'threads';
  try {
    const q = query(collection(db, 'threads'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const threads: ChatThread[] = [];
    snap.forEach((d) => {
      threads.push(d.data() as ChatThread);
    });
    // Sort descending by updatedAt
    threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return threads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCloudThread(userId: string, thread: ChatThread): Promise<void> {
  const path = `threads/${thread.id}`;
  try {
    const docRef = doc(db, 'threads', thread.id);
    const cleanThread = {
      id: thread.id,
      userId,
      title: thread.title || 'New Chat',
      createdAt: thread.createdAt || Date.now(),
      updatedAt: thread.updatedAt || Date.now(),
      isPinned: !!thread.isPinned,
      modelId: thread.modelId || 'gemini-2.5-flash',
      category: thread.category || 'Today',
      messages: thread.messages || [],
    };
    await setDoc(docRef, cleanThread, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudThread(threadId: string): Promise<void> {
  const path = `threads/${threadId}`;
  try {
    const docRef = doc(db, 'threads', threadId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllCloudThreads(userId: string): Promise<void> {
  const path = 'threads';
  try {
    const q = query(collection(db, 'threads'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCloudThreads(
  userId: string,
  onUpdate: (threads: ChatThread[]) => void
) {
  const path = 'threads';
  const q = query(collection(db, 'threads'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const threads: ChatThread[] = [];
      snap.forEach((d) => {
        threads.push(d.data() as ChatThread);
      });
      threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onUpdate(threads);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
