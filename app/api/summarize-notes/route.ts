'use server'
import { NextResponse } from "next/server"
import { generateNotesSummary } from "@/lib/gemini"
import type { Note } from "@/types/note"

/**
 * API Route para gerar um resumo de anotações.
 * Espera um método POST com um array de 'notes' no corpo da requisição.
 */
export async function POST(request: Request) {
  try {
    const { notes } = (await request.json()) as { notes: Note[] }

    if (!notes || !Array.isArray(notes)) {
      return NextResponse.json({ error: "O corpo da requisição deve conter um array de 'notes'." }, { status: 400 })
    }

    // Chama a função server-side que interage com a API do Gemini
    const summary = await generateNotesSummary(notes)

    return NextResponse.json({ summary })

  } catch (error: any) {
    console.error("[v0] Erro na API Route /api/summarize-notes:", error)
    return NextResponse.json(
      {
        error: "Falha ao gerar o resumo.",
        details: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
