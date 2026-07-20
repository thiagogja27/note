'use client'

import { ref, onValue, set, push, update, remove, get } from "firebase/database"
import { db } from "./firebase"
import type { Note } from "@/types/note"
import { RADAR_CATEGORY, INFO_CATEGORY } from "@/types/note"
import type { Department } from "@/types/user"
import type { StorageSelection, StorageLog } from "@/types/storage"
import type { SpoutTrack } from "@/types/spout-track"
import type { Classification, ClassificationStatus } from "@/types/classification"

// Coleções existentes
const COLLECTION_NAME = "anotacoes"
const STORAGE_COLLECTION = "estocagem"
const STORAGE_LOGS_COLLECTION = "storage_logs"
const SPOUT_TRACKS_COLLECTION = "spout_tracks"
const CLASSIFICATION_COLLECTION = "classificacao" 
const STORAGE_DOC_ID = "current"
const USERS_COLLECTION = "usuarios"

// Nova coleção para os alertas
const ALERT_COLLECTION = "operator_alert";

function cleanupObject(obj: any) {
  const newObj: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

// ... (todo o código existente permanece aqui) ...

export function isFirebaseConfigured(): boolean {
  const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const hasDatabaseUrl = !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  return hasApiKey && hasProjectId && hasDatabaseUrl
}

export function getConfigErrorMessage(): string {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY")
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) missing.push("NEXT_PUBLIC_FIREBASE_DATABASE_URL")
  return `Variáveis de ambiente faltando: ${missing.join(", ")}`
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

export async function saveStorageSelection(
  selection: Omit<StorageSelection, "id" | "updatedAt"> & { updatedBy: string; updatedByDepartment: Department },
): Promise<void> {
  const timestampISO = new Date().toISOString();
  const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`);

  const currentSnapshot = await get(storageRef);
  const currentData = currentSnapshot.val() || {};

  const dataToSave = {
    ...selection,
    updatedAt: timestampISO,
  };

  await set(storageRef, dataToSave);

  const changes: Partial<StorageLog["changes"]> = {};
  for (const key in selection) {
    if (key !== "updatedBy" && key !== "updatedByDepartment") {
      const typedKey = key as keyof typeof selection;
      if (currentData[typedKey] !== selection[typedKey]) {
        (changes as any)[typedKey] = selection[typedKey];
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

export async function saveSpoutTrack(
  spoutTrack: Omit<SpoutTrack, "id" | "operator"> & { operator: string }
): Promise<void> {
  const spoutTrackRef = push(ref(db, SPOUT_TRACKS_COLLECTION));
  await set(spoutTrackRef, spoutTrack);
}

export async function updateSpoutTrack(
  id: string,
  spoutTrackData: Partial<Omit<SpoutTrack, "id">>
): Promise<void> {
  const spoutTrackRef = ref(db, `${SPOUT_TRACKS_COLLECTION}/${id}`);
  await update(spoutTrackRef, cleanupObject(spoutTrackData));
}

export async function deleteSpoutTrack(id: string): Promise<void> {
  const spoutTrackRef = ref(db, `${SPOUT_TRACKS_COLLECTION}/${id}`);
  await remove(spoutTrackRef);
}

export function listenToSpoutTrack(callback: (spoutTracks: SpoutTrack[]) => void): () => void {
  const spoutTracksRef = ref(db, SPOUT_TRACKS_COLLECTION);
  const unsubscribe = onValue(spoutTracksRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const spoutTracks: SpoutTrack[] = Object.entries(data).map(([id, value]: any) => ({
      id,
      ...value,
      startTimestamp: new Date(value.startTimestamp),
      endTimestamp: new Date(value.endTimestamp),
    }));
    spoutTracks.sort((a, b) => new Date(b.endTimestamp).getTime() - new Date(a.endTimestamp).getTime());
    callback(spoutTracks);
  });
  return unsubscribe;
}

export async function addClassification(classificationData: Omit<Classification, "id" | "createdAt" | "status">): Promise<void> {
  const classificationRef = push(ref(db, CLASSIFICATION_COLLECTION));
  const now = new Date().toISOString();
  const newClassification = {
    ...cleanupObject(classificationData),
    status: "aguardando",
    createdAt: now,
  };
  await set(classificationRef, newClassification);
}

export async function updateClassification(
  id: string, 
  classificationData: Partial<Omit<Classification, "id">>
): Promise<void> {
  const classificationRef = ref(db, `${CLASSIFICATION_COLLECTION}/${id}`);
  await update(classificationRef, cleanupObject(classificationData));
}

export async function deleteClassification(id: string): Promise<void> {
  const classificationRef = ref(db, `${CLASSIFICATION_COLLECTION}/${id}`);
  await remove(classificationRef);
}

export async function updateClassificationStatus(
  id: string,
  status: ClassificationStatus,
  user: string,
): Promise<void> {
  const classificationRef = ref(db, `${CLASSIFICATION_COLLECTION}/${id}`);
  const now = new Date().toISOString();
  const updateData: any = { status };

  if (status === "liberado") {
    updateData.releasedAt = now;
    updateData.releasedBy = user;
  } else if (status === "recusado") {
    updateData.refusedAt = now;
    updateData.refusedBy = user;
  } else if (status === "descarregando") {
    updateData.unloadingStartedAt = now;
    updateData.unloadingStartedBy = user;
  } else if (status === "concluido") {
    updateData.unloadingFinishedAt = now;
    updateData.unloadingFinishedBy = user;
  } else if (status === "aguardando") {
    updateData.releasedAt = null;
    updateData.releasedBy = null;
    updateData.refusedAt = null;
    updateData.refusedBy = null;
    updateData.unloadingStartedAt = null;
    updateData.unloadingStartedBy = null;
    updateData.unloadingFinishedAt = null;
    updateData.unloadingFinishedBy = null;
    updateData.analysisStartedAt = null; // Limpa a análise
    updateData.analysisStartedBy = null; // Limpa a análise
  } else if (status === "em-analise") { // Novo estado
    updateData.analysisStartedAt = now;
    updateData.analysisStartedBy = user;
  }

  await update(classificationRef, updateData);
}

export function listenToClassifications(callback: (classifications: Classification[]) => void): () => void {
  const classificationsRef = ref(db, CLASSIFICATION_COLLECTION);
  const unsubscribe = onValue(classificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const classifications: Classification[] = Object.entries(data).map(([id, value]: any) => ({
      id,
      ...value,
      createdAt: new Date(value.createdAt),
    }));
    classifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(classifications);
  });
  return unsubscribe;
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

// --- Novas Funções de Alerta --- //

export type OperatorAlertMessage = {
    from: string;
    message: string;
    timestamp: string;
};

/**
 * Envia um alerta para o operador.
 * @param from - Quem está enviando o alerta (ex: nome do usuário).
 * @param message - A mensagem de alerta.
 */
export async function sendAlert(from: string, message: string): Promise<void> {
  const alertRef = ref(db, ALERT_COLLECTION);
  const newAlert: OperatorAlertMessage = {
    from,
    message,
    timestamp: new Date().toISOString(),
  };
  await set(alertRef, newAlert);
}

/**
 * Fica à escuta por novos alertas para o operador.
 * @param callback - Função a ser chamada quando um alerta é recebido ou removido.
 * @returns Uma função para cancelar o listener.
 */
export function listenForAlerts(callback: (alert: OperatorAlertMessage | null) => void): () => void {
  const alertRef = ref(db, ALERT_COLLECTION);
  const unsubscribe = onValue(alertRef, (snapshot) => {
    const data = snapshot.val();
    callback(data as OperatorAlertMessage | null);
  });
  return unsubscribe;
}

/**
 * Limpa/remove o alerta atual da base de dados.
 */
export async function clearAlert(): Promise<void> {
  const alertRef = ref(db, ALERT_COLLECTION);
  await remove(alertRef);
}
