"use client"

import type { User, Department } from "@/types/user"

const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1"

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY não está configurada")
  }
  return apiKey
}

export interface FirebaseAuthUser {
  localId: string
  email: string
  displayName?: string
  idToken: string
  refreshToken: string
  expiresIn: string
}

export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseAuthUser | null> {
  try {
    const url = `${AUTH_BASE_URL}/accounts:signInWithPassword?key=${getApiKey()}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Erro ao fazer login:", error)
      return null
    }

    const data = await response.json()

    return {
      localId: data.localId,
      email: data.email,
      displayName: data.displayName,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    }
  } catch (error) {
    console.error("[v0] Erro ao fazer login com Firebase Auth:", error)
    return null
  }
}

export async function getUserInfo(idToken: string): Promise<FirebaseAuthUser | null> {
  try {
    const url = `${AUTH_BASE_URL}/accounts:lookup?key=${getApiKey()}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const users = data.users || []

    if (users.length === 0) {
      return null
    }

    const user = users[0]

    return {
      localId: user.localId,
      email: user.email,
      displayName: user.displayName,
      idToken,
      refreshToken: "",
      expiresIn: "",
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar informações do usuário:", error)
    return null
  }
}

export function convertToAppUser(firebaseUser: FirebaseAuthUser, department: Department): User {
  return {
    id: firebaseUser.localId,
    username: firebaseUser.email,
    password: "",
    role: "assistente",
    department: department,
  }
}

export function saveAuthSession(firebaseUser: FirebaseAuthUser, department: Department): void {
  try {
    localStorage.setItem("firebaseAuthToken", firebaseUser.idToken)
    localStorage.setItem("firebaseRefreshToken", firebaseUser.refreshToken)
    localStorage.setItem("firebaseUserId", firebaseUser.localId)
    localStorage.setItem("firebaseUserEmail", firebaseUser.email)
    localStorage.setItem("userDepartment", department)
  } catch (error) {
    console.error("[v0] Erro ao salvar sessão:", error)
  }
}

export async function loadAuthSession(): Promise<User | null> {
  try {
    const idToken = localStorage.getItem("firebaseAuthToken")
    const userId = localStorage.getItem("firebaseUserId")
    const userEmail = localStorage.getItem("firebaseUserEmail")
    const department = (localStorage.getItem("userDepartment") as Department) || "balanca"

    if (!idToken || !userId || !userEmail) {
      return null
    }

    const firebaseUser = await getUserInfo(idToken)

    if (!firebaseUser) {
      clearAuthSession()
      return null
    }

    return convertToAppUser(firebaseUser, department)
  } catch (error) {
    console.error("[v0] Erro ao carregar sessão:", error)
    clearAuthSession()
    return null
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem("firebaseAuthToken")
    localStorage.removeItem("firebaseRefreshToken")
    localStorage.removeItem("firebaseUserId")
    localStorage.removeItem("firebaseUserEmail")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userDepartment")
  } catch (error) {
    console.error("[v0] Erro ao limpar sessão:", error)
  }
}
