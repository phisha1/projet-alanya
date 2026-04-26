import { loadSessionToken } from "../data/session-auth"

export class ApiError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status = 0, payload?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path}`
}

function parsePayload(text: string) {
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function inferMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) return payload
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message
    if (typeof message === "string" && message.trim()) return message
  }
  return fallback
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers)
  const sessionToken = loadSessionToken()
  const body =
    options.body && typeof options.body === "object" && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : (options.body ?? undefined)

  if (sessionToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionToken}`)
  }

  if (body && !headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      credentials: "same-origin",
      ...options,
      headers,
      body,
    })
  } catch (error) {
    throw new ApiError("Impossible de joindre le serveur.", 0, error)
  }

  const text = await response.text()
  const payload = parsePayload(text)

  if (!response.ok) {
    throw new ApiError(
      inferMessage(payload, `La requete a echoue (${response.status}).`),
      response.status,
      payload
    )
  }

  return payload as T
}
