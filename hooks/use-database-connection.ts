import { ref, onValue } from "firebase/database"
import { getFirebaseDatabase } from "@/lib/firebase"

import { useState as useReactState, useEffect as useReactEffect } from "react"

export function useDatabaseConnection() {
  const [isConnected, setIsConnected] = useReactState<boolean | null>(null)
  const [error, setError] = useReactState<string | null>(null)
  const [isConfigured, setIsConfigured] = useReactState(false)

  useReactEffect(() => {
    // Check if configured
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    if (!dbUrl) {
      setIsConfigured(false)
      setError("URL do banco de dados não configurada")
      return
    }
    setIsConfigured(true)

    try {
      const db = getFirebaseDatabase()
      const connectedRef = ref(db, ".info/connected")

      const unsubscribe = onValue(
        connectedRef,
        (snap) => {
          const connected = snap.val() === true
          setIsConnected(connected)
          if (connected) {
            setError(null)
          } else {
            // Only set error if we were previously connected or if it takes too long?
            // For now, just let isConnected=false speak for itself, but if it stays false too long...
          }
        },
        (err) => {
          console.error("[v0] Erro ao verificar conexão:", err)
          setIsConnected(false)
          setError(err.message)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      if (err.message && err.message.includes("Service database is not available")) {
        console.warn("[v0] Aviso: Banco de dados indisponível ao iniciar verificação de conexão")
        setIsConnected(false)
        setError("Banco de dados indisponível temporariamente")
        return
      }

      console.error("[v0] Erro ao inicializar verificação de conexão:", err)
      setIsConnected(false)
      setError(err.message || "Erro desconhecido ao conectar")
    }
  }, [])

  return { isConnected, error, isConfigured }
}
