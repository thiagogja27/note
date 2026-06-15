'use client'

import { getAuth, signInWithEmailAndPassword as firebaseSignIn, onAuthStateChanged } from "firebase/auth"
import type { User, Department } from "@/types/user"
import { app } from "./firebase" // Importa a instância do app

const auth = getAuth(app)

export interface FirebaseAuthUser {
  uid: string
  email: string | null
  displayName?: string | null
  idToken: string
  refreshToken: string
}

function mapFirebaseError(errorCode: string): string {
  switch (errorCode) {
    case "auth/invalid-password":
    case "auth/wrong-password":
      return "A senha fornecida está incorreta."
    case "auth/user-not-found":
      return "Nenhum usuário encontrado com este endereço de email."
    case "auth/invalid-email":
      return "O endereço de email fornecido é inválido."
    case "auth/user-disabled":
      return "A conta para este usuário foi desabilitada."
    default:
      return "Ocorreu um erro de autenticação. Verifique suas credenciais."
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseAuthUser> {
  try {
    const userCredential = await firebaseSignIn(auth, email, password)
    const user = userCredential.user
    const idToken = await user.getIdToken()

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      idToken: idToken,
      refreshToken: user.refreshToken,
    }
  } catch (error: any) {
    console.error("[v1] Erro do Firebase Auth SDK:", error.code, error.message)
    throw new Error(mapFirebaseError(error.code))
  }
}

export async function getUserInfo(idToken: string): Promise<FirebaseAuthUser | null> {
  // Esta função pode precisar ser ajustada ou removida,
  // já que o estado de auth agora é gerenciado pelo SDK
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) {
        const currentIdToken = await user.getIdToken()
        if (currentIdToken === idToken) {
          resolve({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            idToken: currentIdToken,
            refreshToken: user.refreshToken,
          })
        } else {
          resolve(null) // O token não corresponde ao usuário atual
        }
      } else {
        resolve(null)
      }
    })
  })
}

export function convertToAppUser(firebaseUser: FirebaseAuthUser, department: Department): User {
  if (!firebaseUser.email) {
    throw new Error("O usuário do Firebase não tem um email.")
  }
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
    if (firebaseUser.email) {
      localStorage.setItem("firebaseAuthToken", firebaseUser.idToken)
      localStorage.setItem("firebaseRefreshToken", firebaseUser.refreshToken)
      localStorage.setItem("firebaseUserId", firebaseUser.uid)
      localStorage.setItem("firebaseUserEmail", firebaseUser.email)
      localStorage.setItem("userDepartment", department)
    }
  } catch (error) {
    console.error("[v1] Erro ao salvar sessão:", error)
  }
}

export async function loadAuthSession(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) {
        const department = (localStorage.getItem("userDepartment") as Department) || "balanca"
        const idToken = await user.getIdToken()
        const firebaseUser: FirebaseAuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          idToken: idToken,
          refreshToken: user.refreshToken,
        }
        resolve(convertToAppUser(firebaseUser, department))
      } else {
        resolve(null)
      }
    })
  })
}

export function clearAuthSession(): void {
  try {
    auth.signOut() // Usa o método do SDK para deslogar
    localStorage.removeItem("firebaseAuthToken")
    localStorage.removeItem("firebaseRefreshToken")
    localStorage.removeItem("firebaseUserId")
    localStorage.removeItem("firebaseUserEmail")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userDepartment")
  } catch (error) {
    console.error("[v1] Erro ao limpar sessão:", error)
  }
}
