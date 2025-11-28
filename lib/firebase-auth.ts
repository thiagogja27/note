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
  uid: string
  email: string
  displayName?: string
  idToken: string
  refreshToken: string
  expiresIn: string
}

// Mapeia códigos de erro do Firebase para mensagens amigáveis em português.
function mapFirebaseError(errorCode: string): string {
  switch (errorCode) {
    case "INVALID_PASSWORD":
      return "A senha fornecida está incorreta."
    case "EMAIL_NOT_FOUND":
      return "Nenhum usuário encontrado com este endereço de email."
    case "INVALID_EMAIL":
      return "O endereço de email fornecido é inválido."
    case "USER_DISABLED":
      return "A conta para este usuário foi desabilitada."
    default:
      return "Ocorreu um erro de autenticação. Verifique suas credenciais."
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseAuthUser> {
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

  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data.error?.message || "UNKNOWN_ERROR"
    console.error("[v0] Erro do Firebase Auth:", errorMessage, data)
    throw new Error(mapFirebaseError(errorMessage))
  }

  return {
    uid: data.localId,
    email: data.email,
    displayName: data.displayName,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
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
      uid: user.localId,
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
    id: firebaseUser.uid,
    username: firebaseUser.email,
    password: "", // Senha nunca é armazenada no app
    role: "assistente",
    department: department,
  }
}

export function saveAuthSession(firebaseUser: FirebaseAuthUser, department: Department): void {
  try {
    localStorage.setItem("firebaseAuthToken", firebaseUser.idToken)
    localStorage.setItem("firebaseRefreshToken", firebaseUser.refreshToken)
    localStorage.setItem("firebaseUserId", firebaseUser.uid)
    localStorage.setItem("firebaseUserEmail", firebaseUser.email)
    localStorage.setItem("userDepartment", department)
  } catch (error) {
    console.error("[v0] Erro ao salvar sessão:", error)
  }
}

export async function loadAuthSession(): Promise<User | null> {
  try {
    const idToken = localStorage.getItem("firebaseAuthToken")
    const department = (localStorage.getItem("userDepartment") as Department) || "balanca"

    if (!idToken) {
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
