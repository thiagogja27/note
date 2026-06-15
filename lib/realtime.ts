import { getDatabase, ref, onValue, set, push, serverTimestamp, query, orderByChild, equalTo, get, update, remove } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, isFirebaseConfigured, getConfigErrorMessage } from "./firebase";
import type { Note, NotePayload } from "@/types/note";
import type { StorageLog } from "@/types/storage";

if (!isFirebaseConfigured()) {
  console.error(getConfigErrorMessage());
}

const db = getDatabase(app);
const auth = getAuth(app);

// Notes functions
export const listenToNotes = (userId: string, callback: (notes: Note[]) => void) => {
  const notesRef = ref(db, `notes/${userId}`);
  const notesQuery = query(notesRef, orderByChild('createdAt'));
  return onValue(notesQuery, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((childSnapshot) => {
      notes.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(notes.reverse());
  });
};

export const listenToRadarNotes = (callback: (notes: Note[]) => void) => {
  const notesRef = ref(db, `annotations/RADAR`);
  const notesQuery = query(notesRef, orderByChild('createdAt'));
  return onValue(notesQuery, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((childSnapshot) => {
      notes.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(notes.reverse());
  });
};

export const listenToInfoNotes = (callback: (notes: Note[]) => void) => {
  const notesRef = ref(db, `annotations/Informações`);
  const notesQuery = query(notesRef, orderByChild('createdAt'));
  return onValue(notesQuery, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((childSnapshot) => {
      notes.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(notes.reverse());
  });
};

export const addNote = async (note: NotePayload) => {
    const { category, ...noteData } = note;
    const dbRef = ref(db, category === 'RADAR' || category === 'Informações' ? `annotations/${category}` : `notes/${note.userId}`);
    const newNoteRef = push(dbRef);
    return set(newNoteRef, {
      ...noteData,
      category,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
};

export const updateNote = (noteId: string, updates: Partial<Note>, updatedBy: string, updatedByDepartment: string) => {
    // This is a simplified version. You need to find which user has the note.
    // A real app would need a more complex data structure to easily find notes across users.
    // For now, we will assume we know the user.
    // You might need to query all users, which is not efficient.
    console.warn("updateNote needs a proper implementation to find the note across all users.")
    // This is a placeholder and will not work as intended without the userId.
    // const noteRef = ref(db, `notes/USER_ID_HERE/${noteId}`);
    // return update(noteRef, { ...updates, updatedAt: serverTimestamp(), updatedBy, updatedByDepartment });
};
  

export const deleteNote = async (noteId: string, deletedBy: string, deletedByDepartment: string) => {
    // This is a simplified version. See comment in updateNote.
    console.warn("deleteNote needs a proper implementation to find the note across all users.")
    // const noteRef = ref(db, `notes/USER_ID_HERE/${noteId}`);
    // return remove(noteRef);
};

export const toggleNoteCompleted = async (noteId: string, completed: boolean, toggledBy: string, toggledByDepartment: string) => {
    // This is a simplified version. See comment in updateNote.
    console.warn("toggleNoteCompleted needs a proper implementation to find the note across all users.")
    // const noteRef = ref(db, `notes/USER_ID_HERE/${noteId}`);
    // return update(noteRef, { completed, updatedAt: serverTimestamp(), toggledBy, toggledByDepartment });
};

// Storage functions
export const listenToStorage = (callback: (data: any) => void) => {
  const storageRef = ref(db, 'estocagem/current');
  return onValue(storageRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const saveStorageSelection = async (selection: any) => {
  const storageRef = ref(db, 'estocagem/current');
  const logRef = ref(db, 'estocagem/logs');
  const newLogRef = push(logRef);

  const { updatedBy, updatedByDepartment, ...changes } = selection;

  // Get current state to compare
  const currentStateSnap = await get(storageRef);
  const currentState = currentStateSnap.val() || {};

  const changedFields: { [key: string]: any } = {};
  Object.keys(changes).forEach(key => {
    if (currentState[key] !== changes[key]) {
      changedFields[key] = changes[key];
    }
  });

  // Only proceed if there are actual changes
  if (Object.keys(changedFields).length > 0) {
    await set(storageRef, {
        ...currentState, ...changes, 
        updatedAt: serverTimestamp(), 
        updatedBy, 
        updatedByDepartment 
    });
    await set(newLogRef, {
        timestamp: serverTimestamp(),
        changedBy: updatedBy,
        department: updatedByDepartment,
        changes: changedFields
    });
  }
};

export const listenToStorageLogs = (callback: (logs: StorageLog[]) => void) => {
    const logsRef = ref(db, 'estocagem/logs');
    const logsQuery = query(logsRef, orderByChild('timestamp'));
    return onValue(logsQuery, (snapshot) => {
        const logs: StorageLog[] = [];
        snapshot.forEach(child => {
            logs.push({ id: child.key, ...child.val() });
        });
        callback(logs.reverse());
    });
};