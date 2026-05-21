import { apiRequest } from "../lib/api-client"

export type CallDirection = "in" | "out" | "missed"
export type CallType = "audio" | "video"
export type CallStatus = "ended" | "declined" | "no_answer"

export interface CallRecord {
  id: string
  contactId: string
  contactName: string
  contactInitials: string
  contactColor: keyof typeof CALL_COLORS
  direction: CallDirection
  type: CallType
  status: CallStatus
  duration?: string
  ts: Date
  isGroup?: boolean
}

export const CALL_COLORS = {
  amber: { bg: "#E8B84B22", fg: "#E8B84B" },
  blue: { bg: "#60a5fa22", fg: "#60a5fa" },
  violet: { bg: "#a78bfa22", fg: "#a78bfa" },
  teal: { bg: "#34d39922", fg: "#34d399" },
  rose: { bg: "#fb718522", fg: "#fb7185" },
}

const COLOR_WHEEL: (keyof typeof CALL_COLORS)[] = ["amber", "blue", "violet", "teal", "rose"]

function pickColor(id: string): keyof typeof CALL_COLORS {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return COLOR_WHEEL[sum % COLOR_WHEEL.length]
}

interface BackendCall {
  id: string
  contactId: string
  contactName: string
  contactInitials?: string
  direction: CallDirection
  type: CallType
  status: CallStatus
  duration?: string
  createdAt?: string
  isGroup?: boolean
}

interface ListCallsResponse {
  calls: BackendCall[]
}

interface CreateCallResponse {
  call: BackendCall
}

function toCallRecord(c: BackendCall): CallRecord {
  return {
    id: c.id,
    contactId: c.contactId,
    contactName: c.contactName,
    contactInitials: c.contactInitials ?? "??",
    contactColor: pickColor(c.contactId),
    direction: c.direction,
    type: c.type,
    status: c.status,
    duration: c.duration && c.duration !== "00:00" ? c.duration : undefined,
    ts: c.createdAt ? new Date(c.createdAt) : new Date(),
    isGroup: Boolean(c.isGroup),
  }
}

/** GET /api/calls — historique d'appels de l'utilisateur. */
export async function fetchCallsHistory(): Promise<CallRecord[]> {
  try {
    const response = await apiRequest<ListCallsResponse>("/api/calls")
    return (response.calls ?? []).map(toCallRecord)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[calls] fetch a echoue", error)
    return []
  }
}

/** POST /api/calls — enregistre un nouvel appel sortant. */
export async function createCall(contactId: string, type: CallType): Promise<CallRecord> {
  const response = await apiRequest<CreateCallResponse>("/api/calls", {
    method: "POST",
    body: { contactId, type },
  })
  return toCallRecord(response.call)
}
