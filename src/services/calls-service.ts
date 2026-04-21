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

const FALLBACK_CALLS: CallRecord[] = [
  { id: "c1", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "out", type: "video", status: "ended", duration: "14:23", ts: new Date(Date.now() - 86400000 * 0.3) },
  { id: "c2", contactId: "4", contactName: "Laure Ateba", contactInitials: "LA", contactColor: "teal", direction: "missed", type: "audio", status: "no_answer", ts: new Date(Date.now() - 86400000 * 0.5) },
  { id: "c3", contactId: "5", contactName: "Paul Essomba", contactInitials: "PE", contactColor: "rose", direction: "in", type: "audio", status: "ended", duration: "3:07", ts: new Date(Date.now() - 86400000 * 1.2) },
  { id: "c4", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "out", type: "audio", status: "ended", duration: "8:44", ts: new Date(Date.now() - 86400000 * 2.1) },
  { id: "c5", contactId: "2", contactName: "Groupe Alanya II", contactInitials: "GA", contactColor: "blue", direction: "in", type: "video", status: "ended", duration: "42:11", ts: new Date(Date.now() - 86400000 * 2.8), isGroup: true },
  { id: "c6", contactId: "6", contactName: "Nina Fouda", contactInitials: "NF", contactColor: "amber", direction: "missed", type: "video", status: "no_answer", ts: new Date(Date.now() - 86400000 * 3.5) },
  { id: "c7", contactId: "5", contactName: "Paul Essomba", contactInitials: "PE", contactColor: "rose", direction: "out", type: "audio", status: "declined", ts: new Date(Date.now() - 86400000 * 4.0) },
  { id: "c8", contactId: "3", contactName: "Dr. NANA BINKEU", contactInitials: "NB", contactColor: "violet", direction: "in", type: "audio", status: "ended", duration: "6:58", ts: new Date(Date.now() - 86400000 * 5.2) },
  { id: "c9", contactId: "1", contactName: "Kevin Manga", contactInitials: "KM", contactColor: "amber", direction: "in", type: "video", status: "ended", duration: "22:05", ts: new Date(Date.now() - 86400000 * 6.9) },
  { id: "c10", contactId: "4", contactName: "Laure Ateba", contactInitials: "LA", contactColor: "teal", direction: "out", type: "audio", status: "ended", duration: "1:44", ts: new Date(Date.now() - 86400000 * 8.1) },
]

export function getCallsHistory() {
  return FALLBACK_CALLS
}
