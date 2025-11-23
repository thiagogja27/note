"use client"

import { getAuth } from "firebase/auth"
import { getFirebaseApp } from "./firebase"

export interface FirebaseAuthUser {
  uid: string
  email: string
  displayName?: string
  emailVerified: boolean
}

export async function getAllFirebaseAuthUsers(): Promise<FirebaseAuthUser[]> {
  try {
    const app = getFirebaseApp()
    const auth = getAuth(app)

    // Note: listUsers is an Admin SDK function and won't work in client-side code
    // We need to use the Realtime Database users collection instead
    console.log("[v0] Firebase Auth listUsers not available in client-side code")
    return []
  } catch (error) {
    console.error("[v0] Erro ao buscar usuários do Firebase Auth:", error)
    return []
  }
}
