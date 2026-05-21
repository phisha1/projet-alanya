import { apiRequest } from "../lib/api-client"
import {
  type Contact,
  type ContactColor,
  loadContacts,
  normalizePhone,
  persistContacts,
  toInitials,
} from "../data/contacts"

interface BackendContact {
  id: string
  name: string
  initials?: string
  email?: string
  phone: string
  online?: boolean
}

interface ContactsListResponse {
  contacts: BackendContact[]
}

interface AddContactResponse {
  contact: BackendContact
}

const COLOR_WHEEL: ContactColor[] = ["amber", "blue", "violet", "teal", "rose"]

function pickColor(id: string): ContactColor {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return COLOR_WHEEL[sum % COLOR_WHEEL.length]
}

function toFrontContact(c: BackendContact): Contact {
  return {
    id: c.id,
    name: c.name,
    initials: c.initials || toInitials(c.name),
    color: pickColor(c.id),
    online: Boolean(c.online),
    email: c.email ?? "",
    phone: c.phone,
  }
}

/**
 * GET /api/contacts — Charge la liste depuis le backend.
 * Si le backend echoue, on retombe sur le cache localStorage (pas de mock).
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    const response = await apiRequest<ContactsListResponse>("/api/contacts")
    const contacts = (response.contacts ?? []).map(toFrontContact)
    persistContacts(contacts)
    return contacts
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[contacts] fetch a echoue", error)
    return loadContacts()
  }
}

/** POST /api/contacts — Ajoute un contact par numero. */
export async function addContactByPhone(rawPhone: string): Promise<Contact> {
  const phone = normalizePhone(rawPhone)
  const response = await apiRequest<AddContactResponse>("/api/contacts", {
    method: "POST",
    body: { phone },
  })
  return toFrontContact(response.contact)
}

/** DELETE /api/contacts/{id} — Retire un contact. */
export async function removeContactById(id: string): Promise<void> {
  await apiRequest<void>(`/api/contacts/${id}`, { method: "DELETE" })
}
