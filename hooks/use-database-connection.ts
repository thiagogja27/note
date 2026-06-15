'use client'

import { ref, onValue } from "firebase/database"
import { db } from "@/lib/firebase"

import { useState as useReactState, useEffect as useReactEffect } from "react"

export function useDatabaseConnection() {
  const [isConnected, setIsConnected] = useReactState<boolean | null>(null)
  const [error, setError] = useReactState<string | null>(null)
  const [isConfigured, setIsConfigured] = useReactState(false)

  useReactEffect(() => {
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    if (!dbUrl) {
      setIsConfigured(false)
      setError("URL do banco de dados não configurada")
      return
    }
    setIsConfigured(true)

    try {
      const connectedRef = ref(db, ".info/connected")
      const unsubscribe = onValue(
        connectedRef,
        (snapshot) => {
          const connected = snapshot.val() === true
          setIsConnected(connected)
          if (!connected) {
            setError("Desconectado do banco de dados")
          } else {
            setError(null)
          }
        },
        (err) => {
          setError(`Erro de conexão: ${err.message}`)
          setIsConnected(false)
        },
      )

      return () => unsubscribe()
    } catch (err: any) {
      setError(`Falha ao inicializar o Firebase: ${err.message}`)
      setIsConnected(false)
    }
  }, [])

  return { isConnected, error, isConfigured }
}
