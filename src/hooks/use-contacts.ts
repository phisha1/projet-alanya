import { useCallback, useEffect, useState } from "react"
import { type Contact, DEFAULT_CONTACTS, loadContacts, persistContacts } from "../data/contacts"

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS)

  useEffect(() => {
    setContacts(loadContacts())
  }, [])

  const updateContacts = useCallback((next: Contact[]) => {
    setContacts(next)
    persistContacts(next)
  }, [])

  const addContact = useCallback((newContact: Contact) => {
    setContacts((prev) => {
      const exists = prev.some((contact) => contact.id === newContact.id)
      if (exists) return prev
      const next = [...prev, newContact]
      persistContacts(next)
      return next
    })
  }, [])

  return { contacts, setContacts: updateContacts, addContact }
}
