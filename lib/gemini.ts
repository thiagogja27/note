'use server'

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import type { Note } from "@/types/note"

const MODEL_NAME = "gemini-2.5-flash-lite"

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não está configurada.")
  }
  return apiKey
}

export async function generateNotesSummary(notes: Note[]): Promise<string> {
  if (!notes || notes.length === 0) {
    return "Nenhuma anotação no RADAR para resumir."
  }

  try {
    const genAI = new GoogleGenerativeAI(getApiKey())
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `
      Você é um assistente de supervisão em um terminal portuário. Sua tarefa é ler uma lista de anotações urgentes (do sistema RADAR) e criar um resumo executivo extremamente conciso e direto para o seu gerente. Destaque os pontos mais críticos e as ações necessárias.

      Anotações Recebidas:
      ${notes.map((note) => `- ${note.content} (Criado por: ${note.createdBy}, Data: ${new Date(note.createdAt).toLocaleString()})`).join("\n")}

      Resumo Executivo (seja breve e foque no que é mais importante):
    `

    const generationConfig = {
      temperature: 0.5,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096,
    }

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ]

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    })

    const response = result.response
    const summary = response.text()

    if (!summary) {
      const reason = response.promptFeedback?.blockReason
      console.error("[v0] A API do Gemini retornou uma resposta vazia. Motivo do bloqueio:", reason)
      console.error("[v0] Resposta completa da API:", JSON.stringify(response, null, 2))
      return `A IA não pôde gerar um resumo. Motivo: ${reason || 'Limite de processamento excedido'}.`
    }

    console.log(`[v0] Resumo gerado com sucesso.`)
    return summary

  } catch (error: any) {
    console.error(`[v0] Erro ao chamar a API do Gemini:`, error)
    // MODIFICADO: Em vez de um erro genérico, vamos propagar a mensagem de erro original.
    // Isso enviará a causa real para o frontend.
    throw new Error(error.message || "Falha ao comunicar com a API do Gemini. Causa desconhecida.")
  }
}
