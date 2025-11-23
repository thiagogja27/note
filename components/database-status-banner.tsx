"use client"

import { useDatabaseConnection } from "@/hooks/use-database-connection"
import { AlertCircle, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DatabaseStatusBanner() {
  const { isConnected, error, isConfigured } = useDatabaseConnection()

  // Don't show anything if connected or still loading (null)
  if (isConnected === true || isConnected === null) {
    return null
  }

  // If not configured, show a specific warning
  if (!isConfigured) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
        <Alert variant="destructive" className="shadow-lg border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração Pendente</AlertTitle>
          <AlertDescription>
            A URL do Firebase Database não foi configurada. Adicione a variável NEXT_PUBLIC_FIREBASE_DATABASE_URL.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // If configured but not connected (offline or error)
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant="destructive" className="shadow-lg border-2 bg-destructive text-destructive-foreground">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Erro de Conexão com o Banco de Dados</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          {error === "Service database is not available" ? (
            <span className="font-semibold block mt-1">
              O banco de dados não foi encontrado. Vá ao Console do Firebase → Criação → Realtime Database e clique em
              "Criar Banco de Dados".
            </span>
          ) : (
            error || "Verificando conexão..."
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
