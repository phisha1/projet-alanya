import { useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "../../../../src/components/toast"
import { CONTACT_COLORS, findDirectoryAccountByPhone, normalizePhone, toInitials } from "../../../../src/data/contacts"
import { ensureDirectConversation, ensureGroupConversation } from "../../../../src/data/local-conversations"
import { createLocalGroup } from "../../../../src/data/local-groups"
import { useContacts } from "../../../../src/hooks/use-contacts"

type Mode = "chat" | "group"

export function NewChatModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { contacts, addContact } = useContacts()

  const [mode, setMode] = useState<Mode>("chat")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState("")
  const [loading, setLoading] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [newPhone, setNewPhone] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const q = query.toLowerCase()
      return contact.name.toLowerCase().includes(q) || contact.phone.includes(query)
    })
  }, [contacts, query])

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startDirectChat = (contactId: string) => {
    const contact = contacts.find((entry) => entry.id === contactId)
    if (contact) {
      ensureDirectConversation(contact)
    }
    navigate(`/chats/${contactId}`)
  }

  const createGroup = async () => {
    if (groupName.trim().length < 2 || selected.size < 2) {
      error("Groupe incomplet", "Ajoutez un nom et au moins 2 membres.")
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    const group = createLocalGroup(groupName, Array.from(selected))
    ensureGroupConversation(group)
    success("Groupe cree", `${selected.size} membres ajoutes.`)
    setLoading(false)
    navigate(`/chats/${group.id}`)
  }

  const createContact = () => {
    const phone = normalizePhone(newPhone)

    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      error("Numero invalide", "Utilisez un numero valide (8 a 15 chiffres).")
      return
    }

    const exists = contacts.some((contact) => normalizePhone(contact.phone) === phone)
    if (exists) {
      error("Contact existant", "Ce numero est deja dans vos contacts.")
      return
    }

    const account = findDirectoryAccountByPhone(phone)
    if (!account) {
      error("Compte introuvable", "Aucun compte Alanya trouve pour ce numero (verification locale prototype).")
      return
    }

    const contactId = `c-${Date.now()}`

    addContact({
      id: contactId,
      name: account.name,
      initials: toInitials(account.name),
      color: account.color,
      online: account.online,
      email: account.email,
      phone,
    })
    ensureDirectConversation({
      id: contactId,
      name: account.name,
      initials: toInitials(account.name),
      color: account.color,
      online: account.online,
      email: account.email,
      phone,
    })

    success("Contact ajoute", `${account.name} est disponible.`)
    setNewPhone("")
    setShowAdd(false)
  }

  return (
    <>
      <style>{`
        .ncm-overlay { position: fixed; inset: 0; z-index: 8000; background: var(--overlay); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ncm-card { width: min(480px, 100%); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid var(--border-subtle); background: var(--bg-surface); box-shadow: 0 24px 64px #00000080; }
        .ncm-head { padding: 18px; border-bottom: 1px solid var(--border-subtle); }
        .ncm-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .ncm-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--text-primary); }
        .ncm-actions { display: flex; align-items: center; gap: 8px; }
        .ncm-close, .ncm-add-btn { border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-secondary); border-radius: 8px; padding: 7px 10px; font-size: 12px; cursor: pointer; }
        .ncm-close:hover, .ncm-add-btn:hover { border-color: var(--accent-border); color: var(--accent); }
        .ncm-tabs { display: flex; gap: 8px; margin-bottom: 10px; }
        .ncm-tab { flex: 1; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-secondary); border-radius: 8px; padding: 9px; font-size: 12px; cursor: pointer; }
        .ncm-tab.on { border-color: var(--accent-border); background: var(--accent-dim); color: var(--accent); font-weight: 600; }
        .ncm-search { width: 100%; border: 1px solid var(--border-subtle); background: var(--bg-input); color: var(--text-primary); border-radius: 9px; padding: 10px 12px; outline: none; }
        .ncm-search:focus { border-color: var(--accent-border); }
        .ncm-add-box { margin-top: 10px; padding: 10px; border: 1px solid var(--border-subtle); border-radius: 10px; display: grid; gap: 8px; background: var(--bg-elevated); }
        .ncm-add-box input { border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 10px; background: var(--bg-input); color: var(--text-primary); outline: none; }
        .ncm-add-row { display: flex; gap: 8px; }
        .ncm-add-row button { border: none; border-radius: 7px; font-size: 12px; cursor: pointer; padding: 7px 10px; }
        .ncm-add-row .cancel { background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary); }
        .ncm-add-row .confirm { background: var(--accent); color: var(--accent-text); font-weight: 700; }
        .ncm-list { overflow: auto; padding: 8px 0; }
        .ncm-list::-webkit-scrollbar { width: 4px; }
        .ncm-list::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
        .ncm-item { display: flex; align-items: center; gap: 12px; padding: 10px 18px; cursor: pointer; }
        .ncm-item:hover { background: var(--bg-hover); }
        .ncm-item.checked { background: var(--accent-dim); }
        .ncm-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; position: relative; }
        .ncm-online { position: absolute; right: 1px; bottom: 1px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--bg-surface); background: var(--success); }
        .ncm-meta { flex: 1; min-width: 0; }
        .ncm-name { color: var(--text-primary); font-size: 13px; font-weight: 500; }
        .ncm-phone { color: var(--text-muted); font-size: 11px; }
        .ncm-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-default); display: flex; align-items: center; justify-content: center; }
        .ncm-item.checked .ncm-check { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
        .ncm-empty { text-align: center; color: var(--text-muted); font-size: 13px; padding: 28px 12px; }
        .ncm-foot { border-top: 1px solid var(--border-subtle); padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .ncm-foot-label { color: var(--text-muted); font-size: 12px; }
        .ncm-main-btn { border: none; border-radius: 9px; background: var(--accent); color: var(--accent-text); font-weight: 700; font-size: 13px; padding: 10px 14px; cursor: pointer; }
        .ncm-main-btn:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>

      <div className="ncm-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="ncm-card" role="dialog" aria-label="Nouveau chat">
          <div className="ncm-head">
            <div className="ncm-title-row">
              <h2 className="ncm-title">{mode === "chat" ? "Nouveau message" : "Nouveau groupe"}</h2>
              <div className="ncm-actions">
                <button className="ncm-add-btn" onClick={() => setShowAdd((value) => !value)}>+ Contact</button>
                <button className="ncm-close" onClick={onClose}>Fermer</button>
              </div>
            </div>

            <div className="ncm-tabs">
              <button className={`ncm-tab ${mode === "chat" ? "on" : ""}`} onClick={() => setMode("chat")}>Message direct</button>
              <button className={`ncm-tab ${mode === "group" ? "on" : ""}`} onClick={() => setMode("group")}>Nouveau groupe</button>
            </div>

            <input
              ref={inputRef}
              className="ncm-search"
              placeholder={mode === "chat" ? "Chercher un contact..." : "Ajouter des membres..."}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              autoComplete="off"
            />

            {showAdd && (
              <div className="ncm-add-box">
                <input placeholder="Numero de telephone (+237...)" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} />
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Verification locale (prototype) par numero uniquement.
                </div>
                <div className="ncm-add-row">
                  <button className="cancel" onClick={() => setShowAdd(false)}>Annuler</button>
                  <button className="confirm" onClick={createContact}>Ajouter</button>
                </div>
              </div>
            )}
          </div>

          <div className="ncm-list">
            {filtered.length === 0 && <div className="ncm-empty">Aucun contact trouve pour "{query}"</div>}

            {filtered.map((contact) => {
              const color = CONTACT_COLORS[contact.color]
              const checked = selected.has(contact.id)

              return (
                <div
                  key={contact.id}
                  className={`ncm-item ${checked ? "checked" : ""}`}
                  onClick={() => (mode === "chat" ? startDirectChat(contact.id) : toggleSelection(contact.id))}
                >
                  <div className="ncm-avatar" style={{ background: color.bg, color: color.fg }}>
                    {contact.initials}
                    {contact.online && <div className="ncm-online" />}
                  </div>

                  <div className="ncm-meta">
                    <div className="ncm-name">{contact.name}</div>
                    <div className="ncm-phone">{contact.phone}</div>
                  </div>

                  {mode === "group" && (
                    <div className="ncm-check">
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {mode === "group" && (
            <div className="ncm-foot">
              <div className="ncm-foot-label">{selected.size} membre(s) selectionne(s)</div>
              <input
                className="ncm-search"
                style={{ maxWidth: 180 }}
                placeholder="Nom du groupe"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
              <button className="ncm-main-btn" onClick={createGroup} disabled={loading || groupName.trim().length < 2 || selected.size < 2}>
                {loading ? "Creation..." : "Creer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function NewChatPage() {
  const navigate = useNavigate()
  return <NewChatModal onClose={() => navigate("/chats")} />
}


