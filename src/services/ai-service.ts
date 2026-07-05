import { apiRequest } from "../lib/api-client"

/** Message du fil de discussion avec l'assistant (Gemini cote backend). */
export interface AiMessage {
  id: string
  role: "USER" | "MODEL"
  content: string
  createdAt: string
}

/** GET /api/ai/messages — historique du fil unique de l'utilisateur. */
export async function fetchAiMessages(): Promise<AiMessage[]> {
  const response = await apiRequest<{ threadId: string | null; messages: AiMessage[] }>(
    "/api/ai/messages"
  )
  return response.messages ?? []
}

/** POST /api/ai/chat — envoie un message et renvoie la reponse de l'assistant. */
export async function sendAiMessage(message: string): Promise<AiMessage> {
  const response = await apiRequest<{ threadId: string; reply: AiMessage }>("/api/ai/chat", {
    method: "POST",
    body: { message },
  })
  return response.reply
}

/** DELETE /api/ai/messages — efface tout l'historique. */
export async function clearAiHistory(): Promise<void> {
  await apiRequest("/api/ai/messages", { method: "DELETE" })
}
