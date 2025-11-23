"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getDatabase, type Database } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let firebaseApp: FirebaseApp | null = null
let firebaseDatabase: Database | null = null

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp

  const apps = getApps()
  firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig)

  return firebaseApp
}

export function getFirebaseDatabase(): Database {
  if (typeof window === "undefined") {
    throw new Error("Firebase Database só pode ser acessado no client")
  }

  if (firebaseDatabase) return firebaseDatabase

  const app = getFirebaseApp()
  let databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

  if (!databaseURL) {
    throw new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL não configurada")
  }

  databaseURL = databaseURL.trim()
  if (databaseURL === "") {
    throw new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL está vazia")
  }

  console.log(`[v0] Inicializando Firebase Database com URL: ${databaseURL}`)

  try {
    firebaseDatabase = getDatabase(app, databaseURL)
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn(
        "[v0] Aviso: Banco de dados não encontrado. Verifique se o Realtime Database foi CRIADO no console do Firebase.",
      )
      throw new Error("Service database is not available")
    }

    console.error("[v0] Erro fatal ao inicializar Firebase Database:", error)
    // If the service is not available, we might need to re-initialize or throw a clearer error
    throw new Error(`Falha ao conectar ao banco de dados (URL: ${databaseURL}): ${error.message}`)
  }

  return firebaseDatabase
}

export const database = {
  get instance() {
    return getFirebaseDatabase()
  },
}
