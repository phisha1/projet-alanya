import { useCallback, useEffect, useState } from "react"
import { type Contact, loadContacts, persistContacts } from "../data/contacts"
import { fetchContacts, removeContactById } from "../services/contacts-service"

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    // Charge instantanement la version locale pour eviter un flash
    setContacts(loadContacts())

    // Puis tente de remplacer avec la liste backend
    let cancelled = false
    void fetchContacts().then((list) => {
      if (!cancelled) setContacts(list)
    })

    return () => {
      cancelled = true
    }
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

  const removeContact = useCallback(async (id: string) => {
    await removeContactById(id)
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id)
      persistContacts(next)
      return next
    })
  }, [])

  return { contacts, setContacts: updateContacts, addContact, removeContact }
}
