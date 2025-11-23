"use client"

import { ref, onValue, set, push, update, remove, get } from "firebase/database"
import { getFirebaseDatabase } from "./firebase"
import type { Note } from "@/types/note"
import type { User, UserRole, Department } from "@/types/user"
import type { StorageSelection } from "@/types/storage"

const COLLECTION_NAME = "anotacoes"
const STORAGE_COLLECTION = "estocagem"
const STORAGE_DOC_ID = "current"
const USERS_COLLECTION = "usuarios"

export function isFirebaseConfigured(): boolean {
  const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const hasDatabaseUrl = !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

  if (typeof window !== "undefined") {
    if (!hasApiKey) console.error("[v0] Missing: NEXT_PUBLIC_FIREBASE_API_KEY")
    if (!hasProjectId) console.error("[v0] Missing: NEXT_PUBLIC_FIREBASE_PROJECT_ID")
    if (!hasDatabaseUrl) console.error("[v0] Missing: NEXT_PUBLIC_FIREBASE_DATABASE_URL")
  }

  return hasApiKey && hasProjectId && hasDatabaseUrl
}

export function getConfigErrorMessage(): string {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY")
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) missing.push("NEXT_PUBLIC_FIREBASE_DATABASE_URL")

  return `Variáveis de ambiente faltando: ${missing.join(", ")}`
}

export function listenToNotes(userId: string | undefined, callback: (notes: Note[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const notesRef = ref(db, COLLECTION_NAME)

    console.log("[v0] Iniciando listener em tempo real para notas do usuário...")

    const unsubscribe = onValue(
      notesRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            callback([])
            return
          }

          let notes: Note[] = Object.entries(data).map(([id, value]: any) => ({
            id,
            title: value.title || "",
            content: value.content || "",
            category: value.category || "",
            userId: value.userId || "",
            completed: value.completed || false,
            createdBy: value.createdBy || "",
            createdByDepartment: value.createdByDepartment || "balanca",
            updatedBy: value.updatedBy,
            updatedByDepartment: value.updatedByDepartment,
            createdAt: new Date(value.createdAt || Date.now()),
            updatedAt: new Date(value.updatedAt || Date.now()),
          }))

          if (userId) {
            notes = notes.filter((n) => n.userId === userId)
          }

          notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          callback(notes)
        } catch (error) {
          console.error("[v0] Erro ao processar dados em tempo real:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de notas não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener de notas:", error)
    return () => {}
  }
}

export function listenToRadarNotes(callback: (notes: Note[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const notesRef = ref(db, COLLECTION_NAME)

    console.log("[v0] Iniciando listener em tempo real para RADAR...")

    const unsubscribe = onValue(
      notesRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            callback([])
            return
          }

          const notes = Object.entries(data)
            .map(([id, value]: any) => ({
              id,
              title: value.title || "",
              content: value.content || "",
              category: value.category || "",
              userId: value.userId || "",
              completed: value.completed || false,
              createdBy: value.createdBy || "",
              createdByDepartment: value.createdByDepartment || "balanca",
              updatedBy: value.updatedBy,
              updatedByDepartment: value.updatedByDepartment,
              createdAt: new Date(value.createdAt || Date.now()),
              updatedAt: new Date(value.updatedAt || Date.now()),
            }))
            .filter((note) => note.category === "RADAR")
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

          callback(notes)
        } catch (error) {
          console.error("[v0] Erro ao processar notas RADAR em tempo real:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão RADAR em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener RADAR não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener RADAR:", error)
    return () => {}
  }
}

export function listenToStorage(callback: (storage: StorageSelection | null) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`)

    console.log("[v0] Iniciando listener em tempo real para células de estocagem...")

    const unsubscribe = onValue(
      storageRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            callback(null)
            return
          }

          const storage: StorageSelection = {
            id: STORAGE_DOC_ID,
            tegRoad: data.tegRoad || "",
            tegRoadTombador: data.tegRoadTombador || "",
            tegRailwayMoega01: data.tegRailwayMoega01 || "",
            tegRailwayMoega02: data.tegRailwayMoega02 || "",
            teagRoad: data.teagRoad || "",
            teagRailway: data.teagRailway || "",
            updatedBy: data.updatedBy,
            updatedByDepartment: data.updatedByDepartment,
            updatedAt: new Date(data.updatedAt || Date.now()),
          }

          callback(storage)
        } catch (error) {
          console.error("[v0] Erro ao processar estocagem em tempo real:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão de estocagem em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de estocagem não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener de estocagem:", error)
    return () => {}
  }
}

/* ======================== NOTES ======================== */

export async function getAllNotes(userId?: string): Promise<Note[]> {
  try {
    const db = getFirebaseDatabase()
    const notesRef = ref(db, COLLECTION_NAME)
    const snapshot = await get(notesRef)
    const data = snapshot.val()

    if (!data) return []

    let notes: Note[] = Object.entries(data).map(([id, value]: any) => ({
      id,
      title: value.title || "",
      content: value.content || "",
      category: value.category || "",
      userId: value.userId || "",
      completed: value.completed || false,
      createdBy: value.createdBy || "",
      createdByDepartment: value.createdByDepartment || "balanca",
      updatedBy: value.updatedBy,
      updatedByDepartment: value.updatedByDepartment,
      createdAt: new Date(value.createdAt || Date.now()),
      updatedAt: new Date(value.updatedAt || Date.now()),
    }))

    if (userId) {
      notes = notes.filter((n) => n.userId === userId)
    }

    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível buscar anotações (Banco de dados indisponível).")
      return []
    }
    console.error("Erro ao buscar anotações:", error)
    return []
  }
}

export async function addNote(
  noteData: Omit<Note, "id" | "createdAt" | "updatedAt"> & { createdBy: string; createdByDepartment: Department },
): Promise<Note> {
  const db = getFirebaseDatabase()
  const notesRef = ref(db, COLLECTION_NAME)
  const newNoteRef = push(notesRef)

  const now = new Date().toISOString()
  const newNote = { ...noteData, createdAt: now, updatedAt: now }

  await set(newNoteRef, newNote)

  return { id: newNoteRef.key!, ...newNote, createdAt: new Date(now), updatedAt: new Date(now) } as Note
}

export async function updateNote(
  id: string,
  noteData: Partial<Omit<Note, "id" | "createdAt" | "updatedAt" | "createdBy" | "createdByDepartment">>,
  updatedBy: string,
  updatedByDepartment: Department,
): Promise<Note> {
  const db = getFirebaseDatabase()
  const noteRef = ref(db, `${COLLECTION_NAME}/${id}`)

  const updatedAt = new Date().toISOString()
  const updatedData = { ...noteData, updatedBy, updatedByDepartment, updatedAt }

  await update(noteRef, updatedData)

  return { id, ...updatedData, updatedAt: new Date(updatedAt) } as Note
}

export async function deleteNote(id: string): Promise<void> {
  const db = getFirebaseDatabase()
  const noteRef = ref(db, `${COLLECTION_NAME}/${id}`)
  await remove(noteRef)
}

export async function toggleNoteCompleted(
  id: string,
  completed: boolean,
  updatedBy: string,
  updatedByDepartment: Department,
): Promise<Note> {
  const db = getFirebaseDatabase()
  const noteRef = ref(db, `${COLLECTION_NAME}/${id}`)

  const updatedAt = new Date().toISOString()
  const fields = { completed, updatedBy, updatedByDepartment, updatedAt }

  await update(noteRef, fields)

  return { id, ...fields, updatedAt: new Date(updatedAt) } as Note
}

/* ======================== STORAGE ======================== */

export async function getStorageSelection(): Promise<StorageSelection | null> {
  try {
    const db = getFirebaseDatabase()
    const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`)
    const snapshot = await get(storageRef)
    const data = snapshot.val()

    if (!data) return null

    return {
      id: STORAGE_DOC_ID,
      tegRoad: data.tegRoad || "",
      tegRoadTombador: data.tegRoadTombador || "",
      tegRailwayMoega01: data.tegRailwayMoega01 || "",
      tegRailwayMoega02: data.tegRailwayMoega02 || "",
      teagRoad: data.teagRoad || "",
      teagRailway: data.teagRailway || "",
      updatedBy: data.updatedBy,
      updatedByDepartment: data.updatedByDepartment,
      updatedAt: new Date(data.updatedAt || Date.now()),
    }
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível buscar estocagem (Banco de dados indisponível).")
      const stored = localStorage.getItem("storageSelection")
      return stored ? JSON.parse(stored) : null
    }
    console.error("Erro ao buscar estocagem:", error)
    const stored = localStorage.getItem("storageSelection")
    return stored ? JSON.parse(stored) : null
  }
}

export async function saveStorageSelection(
  selection: Omit<StorageSelection, "id" | "updatedAt"> & { updatedBy: string; updatedByDepartment: Department },
): Promise<void> {
  try {
    localStorage.setItem("storageSelection", JSON.stringify(selection))

    const db = getFirebaseDatabase()
    const storageRef = ref(db, `${STORAGE_COLLECTION}/${STORAGE_DOC_ID}`)

    const updatedSelection = {
      ...selection,
      updatedAt: new Date().toISOString(),
    }

    await set(storageRef, updatedSelection)
  } catch (error) {
    console.error("Erro ao salvar estocagem:", error)
  }
}

/* ======================== USERS ======================== */

export async function saveOrUpdateUser(user: User): Promise<void> {
  try {
    const db = getFirebaseDatabase()
    const usersRef = ref(db, `${USERS_COLLECTION}/${user.id}`)

    await set(usersRef, {
      username: user.username,
      password: user.password || "",
      role: user.role,
      department: user.department,
      lastLogin: new Date().toISOString(),
    })

    console.log("[v0] Usuário salvo/atualizado no banco de dados:", user.username)
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível salvar usuário (Banco de dados indisponível).")
      return
    }
    console.error("[v0] Erro ao salvar usuário no banco:", error)
  }
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  try {
    const db = getFirebaseDatabase()
    const usersRef = ref(db, USERS_COLLECTION)
    const snapshot = await get(usersRef)
    const data = snapshot.val()

    if (!data) return null

    const entry = Object.entries(data).find(
      ([, value]: any) => value.username === username && value.password === password,
    )

    if (!entry) return null

    const [id, value]: any = entry
    return {
      id,
      username: value.username,
      password: value.password,
      role: value.role as UserRole,
      department: value.department as Department,
    }
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível validar usuário (Banco de dados indisponível).")
      return null
    }
    console.error("Erro ao validar usuário:", error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const db = getFirebaseDatabase()
    const usersRef = ref(db, USERS_COLLECTION)
    const snapshot = await get(usersRef)
    const data = snapshot.val()

    if (!data) return []
    return Object.entries(data).map(([id, value]: any) => ({
      id,
      username: value.username,
      password: value.password,
      role: value.role as UserRole,
      department: value.department as Department,
    }))
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível buscar usuários (Banco de dados indisponível).")
      return []
    }
    console.error("Erro ao buscar usuários:", error)
    return []
  }
}

/* ======================== RADAR ======================== */

export async function getRadarNotes(): Promise<Note[]> {
  try {
    const db = getFirebaseDatabase()
    const notesRef = ref(db, COLLECTION_NAME)
    const snapshot = await get(notesRef)
    const data = snapshot.val()

    if (!data) return []

    const notes = Object.entries(data)
      .map(([id, value]: any) => ({
        id,
        title: value.title || "",
        content: value.content || "",
        category: value.category || "",
        userId: value.userId || "",
        completed: value.completed || false,
        createdBy: value.createdBy || "",
        createdByDepartment: value.createdByDepartment || "balanca",
        updatedBy: value.updatedBy,
        updatedByDepartment: value.updatedByDepartment,
        createdAt: new Date(value.createdAt || Date.now()),
        updatedAt: new Date(value.updatedAt || Date.now()),
      }))
      .filter((note) => note.category === "RADAR")

    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Aviso: Não foi possível buscar notas RADAR (Banco de dados indisponível).")
      return []
    }
    console.error("Erro ao buscar notas RADAR:", error)
    return []
  }
}
