"use client"

import { ref, onValue, set, push, update, remove, get } from "firebase/database"
import { getFirebaseDatabase } from "./firebase"
import type { Annotation } from "@/types/annotation"
import type { Department } from "@/types/user"

const ANNOTATIONS_COLLECTION = "anotacoes_gerais"

export function listenToAnnotations(callback: (annotations: Annotation[]) => void): () => void {
  try {
    const db = getFirebaseDatabase()
    const annotationsRef = ref(db, ANNOTATIONS_COLLECTION)

    console.log("[v0] Iniciando listener em tempo real para anotações gerais...")

    const unsubscribe = onValue(
      annotationsRef,
      (snapshot) => {
        try {
          const data = snapshot.val()

          if (!data || data === null) {
            console.log("[v0] Nenhuma anotação encontrada no Firebase")
            callback([])
            return
          }

          const annotations: Annotation[] = Object.entries(data).map(([id, value]: any) => ({
            id,
            title: value.title || "",
            content: value.content || "",
            type: value.type || "geral",
            url: value.url,
            createdBy: value.createdBy || "",
            createdByDepartment: value.createdByDepartment || "balanca",
            updatedBy: value.updatedBy,
            updatedByDepartment: value.updatedByDepartment,
            createdAt: new Date(value.createdAt || Date.now()),
            updatedAt: new Date(value.updatedAt || Date.now()),
          }))

          annotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          console.log(`[v0] ${annotations.length} anotações carregadas do Firebase`)
          callback(annotations)
        } catch (error) {
          console.error("[v0] Erro ao processar anotações em tempo real:", error)
        }
      },
      (error) => {
        console.error("[v0] Erro na conexão de anotações em tempo real:", error)
      },
    )

    return unsubscribe
  } catch (error: any) {
    if (error.message && error.message.includes("Service database is not available")) {
      console.warn("[v0] Listener de anotações não iniciado: Banco de dados indisponível.")
      return () => {}
    }
    console.error("[v0] Erro ao iniciar listener de anotações (banco de dados indisponível):", error)
    return () => {}
  }
}

export async function getAllAnnotations(): Promise<Annotation[]> {
  try {
    const db = getFirebaseDatabase()
    const annotationsRef = ref(db, ANNOTATIONS_COLLECTION)
    const snapshot = await get(annotationsRef)
    const data = snapshot.val()

    if (!data) return []

    const annotations: Annotation[] = Object.entries(data).map(([id, value]: any) => ({
      id,
      title: value.title || "",
      content: value.content || "",
      type: value.type || "geral",
      url: value.url,
      createdBy: value.createdBy || "",
      createdByDepartment: value.createdByDepartment || "balanca",
      updatedBy: value.updatedBy,
      updatedByDepartment: value.updatedByDepartment,
      createdAt: new Date(value.createdAt || Date.now()),
      updatedAt: new Date(value.updatedAt || Date.now()),
    }))

    return annotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Erro ao buscar anotações:", error)
    return []
  }
}

export async function addAnnotation(
  annotationData: Omit<Annotation, "id" | "createdAt" | "updatedAt"> & {
    createdBy: string
    createdByDepartment: Department
  },
): Promise<Annotation> {
  const db = getFirebaseDatabase()
  const annotationsRef = ref(db, ANNOTATIONS_COLLECTION)
  const newAnnotationRef = push(annotationsRef)

  const now = new Date().toISOString()

  // 🔎 Verificação e limpeza dos dados antes de salvar
  const cleanedAnnotation: any = {
    ...annotationData,
    createdAt: now,
    updatedAt: now,
  }

  // 🔧 Remove campos undefined
  Object.keys(cleanedAnnotation).forEach((key) => {
    if (cleanedAnnotation[key] === undefined) {
      delete cleanedAnnotation[key]
    }
  })

  // 🔧 Se o departamento for um objeto, extrai o nome
  if (typeof cleanedAnnotation.createdByDepartment === "object") {
    cleanedAnnotation.createdByDepartment =
      cleanedAnnotation.createdByDepartment?.name || cleanedAnnotation.createdByDepartment?.nome || "balanca"
  }

  // 🧩 Log de depuração
  console.log("[DEBUG addAnnotation]", typeof cleanedAnnotation, cleanedAnnotation)

  // 🚀 Salva no Firebase
  await set(newAnnotationRef, cleanedAnnotation)

  return {
    id: newAnnotationRef.key!,
    ...cleanedAnnotation,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  } as Annotation
}

export async function updateAnnotation(
  id: string,
  annotationData: Partial<Omit<Annotation, "id" | "createdAt" | "updatedAt" | "createdBy" | "createdByDepartment">>,
  updatedBy: string,
  updatedByDepartment: Department,
): Promise<Annotation> {
  const db = getFirebaseDatabase()
  const annotationRef = ref(db, `${ANNOTATIONS_COLLECTION}/${id}`)

  const updatedAt = new Date().toISOString()
  const updatedData: any = { ...annotationData, updatedBy, updatedByDepartment, updatedAt }

  // 🔧 Remove undefined e trata departamento
  Object.keys(updatedData).forEach((key) => {
    if (updatedData[key] === undefined) {
      delete updatedData[key]
    }
  })

  if (typeof updatedData.updatedByDepartment === "object") {
    updatedData.updatedByDepartment =
      updatedData.updatedByDepartment?.name || updatedData.updatedByDepartment?.nome || "balanca"
  }

  await update(annotationRef, updatedData)

  return { id, ...updatedData, updatedAt: new Date(updatedAt) } as Annotation
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = getFirebaseDatabase()
  const annotationRef = ref(db, `${ANNOTATIONS_COLLECTION}/${id}`)
  await remove(annotationRef)
}
