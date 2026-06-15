import { getDatabase, ref, onValue, set, push, serverTimestamp, query, orderByChild, equalTo, get, update, remove } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase";
import type { Note, NotePayload, Department } from "@/types/note";
import type { StorageSelection, StorageLog } from "@/types/storage";

const db = getDatabase(app);

const COLLECTION_NAME = "anotacoes"
const STORAGE_COLLECTION = "estocagem"
const STORAGE_LOGS_COLLECTION = "storage_logs"
const STORAGE_DOC_ID = "current"
const USERS_COLLECTION = "usuarios"
const RADAR_CATEGORY = "RADAR"
const INFO_CATEGORY = "Informações"

function cleanupObject(obj: any) {
  const newObj: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

function createNotesListener(category: string | null, callback: (notes: Note[]) => void): () => void {
  try {
    const notesRef = ref(db, COLLECTION_NAME)
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback([])
        return
      }
      let notes: Note[] = Object.entries(data)
        .map(([id, value]: any) => ({
          id,
          ...value,
          createdAt: new Date(value.createdAt || Date.now()),
          updatedAt: new Date(value.updatedAt || Date.now()),
        }))
        .filter((note) => !note.deleted)

      if (category) {
        notes = notes.filter((note) => note.category === category)
      }
      notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      callback(notes)
    })
    return unsubscribe
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de notas:", error)
    return () => {}
  }
}

export function listenToNotes(userId: string, callback: (notes: Note[]) => void): () => void {
  return createNotesListener(null, (allNotes) => {
    const userNotes = allNotes.filter(
      (note) =>
        note.userId === userId && note.category !== RADAR_CATEGORY && note.category !== INFO_CATEGORY,
    )
    callback(userNotes)
  })
}

export function listenToAllUserNotes(callback: (notes: Note[]) => void): () => void {
  return createNotesListener(null, (allNotes) => {
    const userNotes = allNotes.filter(
      (note) => note.category !== RADAR_CATEGORY && note.category !== INFO_CATEGORY,
    )
    callback(userNotes)
  })
}

export function listenToRadarNotes(callback: (notes: Note[]) => void): () => void {
  return createNotesListener(RADAR_CATEGORY, callback)
}

export function listenToInfoNotes(callback: (notes: Note[]) => void): () => void {
  return createNotesListener(INFO_CATEGORY, callback)
}

export async function addNote(noteData: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
  const notesRef = ref(db, COLLECTION_NAME)
  const newNoteRef = push(notesRef)
  const now = new Date().toISOString()
  const newNote = { ...noteData, createdAt: now, updatedAt: now, deleted: false }
  await set(newNoteRef, newNote)
  return { id: newNoteRef.key!, ...newNote } as unknown as Note
}

export async function updateNote(
  id: string,
  noteData: Partial<Omit<Note, "id">>,
  updatedBy: string,
  updatedByDepartment: Department,
): Promise<void> {
  const noteRef = ref(db, `${COLLECTION_NAME}/${id}`)
  const updatedAt = new Date().toISOString()
  const updatedData = { ...noteData, updatedBy, updatedByDepartment, updatedAt }
  await update(noteRef, cleanupObject(updatedData))
}

export async function deleteNote(id: string, updatedBy: string, updatedByDepartment: Department): Promise<void> {
  const noteRef = ref(db, `anotacoes/${id}`)
  const fieldsToUpdate = {
    deleted: true,
    updatedAt: new Date().toISOString(),
    updatedBy,
    updatedByDepartment,
  }
  await update(noteRef, fieldsToUpdate)
}

export async function toggleNoteCompleted(
  id: string,
  completed: boolean,
  updatedBy: string,
  updatedByDepartment: Department,
): Promise<void> {
  const noteRef = ref(db, `${COLLECTION_NAME}/${id}`)
  await update(noteRef, { completed, updatedBy, updatedByDepartment, updatedAt: new Date().toISOString() })
}

export function listenToStorage(callback: (storage: StorageSelection | null) => void): () => void {
  try {
    const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`)
    const unsubscribe = onValue(storageRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback(null)
        return
      }
      callback({ id: STORAGE_DOC_ID, ...data, updatedAt: new Date(data.updatedAt) })
    })
    return unsubscribe
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de estocagem:", error)
    return () => {}
  }
}

export function listenToStorageLogs(callback: (logs: StorageLog[]) => void): () => void {
  try {
    const logsRef = ref(db, STORAGE_LOGS_COLLECTION)
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback([])
        return
      }
      const logs: StorageLog[] = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
        timestamp: new Date(value.timestamp),
      }))
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      callback(logs)
    })
    return unsubscribe
  } catch (error) {
    console.error("[v0] Erro ao iniciar listener de logs:", error)
    return () => {}
  }
}

export async function saveStorageSelection(selection: Omit<StorageSelection, "id">): Promise<void> {
    const timestampISO = new Date().toISOString();
    const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`);

    const currentSnapshot = await get(storageRef);
    const currentData = currentSnapshot.val() || {};

    const dataToSave = { ...selection, updatedAt: timestampISO };
    
    await set(storageRef, dataToSave);

    const changes: Partial<StorageSelection> = {};
    for (const key in selection) {
        if (key !== 'updatedAt' && key !== 'updatedBy' && key !== 'updatedByDepartment') {
            if (currentData[key] !== (selection as any)[key]) {
                (changes as any)[key] = (selection as any)[key];
            }
        }
    }

    if (Object.keys(changes).length > 0) {
        const logRef = push(ref(db, STORAGE_LOGS_COLLECTION));
        const newLog: Omit<StorageLog, "id"> = {
            changedBy: selection.updatedBy,
            department: selection.updatedByDepartment,
            timestamp: timestampISO as any,
            changes: changes,
        };
        await set(logRef, newLog);
    }
}

export async function saveOrUpdateUser(user: any): Promise<void> {
  try {
    const userRef = ref(db, `${USERS_COLLECTION}/${user.id}`)

    const snapshot = await get(userRef)

    const userData = {
      username: user.username,
      password: user.password || "",
      role: user.role,
      department: user.department,
      lastLogin: new Date().toISOString(),
    }

    await set(userRef, userData)
  } catch (error) {
    console.error("[v0] Erro ao salvar usuário no banco:", error)
  }
}

export async function validateUser(username: string, password: string): Promise<any | null> {
  try {
    const usersRef = ref(db, USERS_COLLECTION)
    const snapshot = await get(usersRef)
    const data = snapshot.val()
    if (!data) return null

    const userEntry = Object.entries(data).find(
      ([, value]: any) => value.username === username && value.password === password,
    )

    if (!userEntry) return null

    const [id, value]: any = userEntry
    const user = { id, ...value }

    const userRef = ref(db, `${USERS_COLLECTION}/${id}`)
    update(userRef, { lastLogin: new Date().toISOString() })

    return user
  } catch (error) {
    console.error("Erro ao validar usuário:", error)
    return null
  }
}

export async function getAllUsers(): Promise<any[]> {
  try {
    const usersRef = ref(db, USERS_COLLECTION)
    const snapshot = await get(usersRef)
    const data = snapshot.val()
    if (!data) return []

    return Object.entries(data).map(([id, value]: any) => ({
      id,
      ...value,
    }))
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }
}

export async function getUser(userId: string): Promise<any | null> {
  try {
    const userRef = ref(db, `${USERS_COLLECTION}/${userId}`)
    const snapshot = await get(userRef)
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() }
    }
    return null
  } catch (error) {
    console.error("[v0] Erro ao buscar usuário:", error)
    return null
  }
}
