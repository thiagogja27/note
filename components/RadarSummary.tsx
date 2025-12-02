"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, AlertTriangle } from "lucide-react"
import type { Note } from "@/types/note"

interface RadarSummaryProps {
  radarNotes: Note[]
}

export function RadarSummary({ radarNotes }: RadarSummaryProps) {
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateSummary = async () => {
    setIsLoading(true)
    setError("")
    setSummary("")

    if (radarNotes.length === 0) {
      setError("Não há anotações no RADAR para resumir.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/summarize-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: radarNotes }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Falha na comunicação com a API.")
      }

      const data = await response.json()
      setSummary(data.summary)

    } catch (err: any) {
      console.error("[v0] Erro ao buscar resumo:", err)
      setError(err.message || "Ocorreu um erro ao gerar o resumo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border border-border bg-card/80 rounded-lg p-4 space-y-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Resumo Inteligente (RADAR)
        </h3>
        <Button onClick={handleGenerateSummary} disabled={isLoading || radarNotes.length === 0} size="sm" className="mt-2 sm:mt-0">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            "Gerar Resumo"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {summary && (
        <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
          <p className="text-sm text-foreground whitespace-pre-wrap font-medium">{summary}</p>
        </div>
      )}

      {!summary && !isLoading && !error && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Clique em "Gerar Resumo" para analisar as anotações do RADAR com IA.
        </div>
      )}
    </div>
  )
}
