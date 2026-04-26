import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import "./call-room-page.css"
type CallState = "connecting" | "ringing" | "active" | "ended"
type CallType = "audio" | "video"

interface Participant {
  id: string
  name: string
  initials: string
  color: { bg: string; fg: string }
  muted: boolean
  videoOff: boolean
}

const CONTACTS: Record<string, Participant> = {
  "1": {
    id: "1",
    name: "Kevin Manga",
    initials: "KM",
    color: { bg: "#E8B84B22", fg: "#E8B84B" },
    muted: false,
    videoOff: false,
  },
  "2": {
    id: "2",
    name: "Groupe Alanya II",
    initials: "GA",
    color: { bg: "#60a5fa22", fg: "#60a5fa" },
    muted: false,
    videoOff: false,
  },
  "3": {
    id: "3",
    name: "Dr. NANA BINKEU",
    initials: "NB",
    color: { bg: "#a78bfa22", fg: "#a78bfa" },
    muted: false,
    videoOff: true,
  },
  "4": {
    id: "4",
    name: "Laure Ateba",
    initials: "LA",
    color: { bg: "#34d39922", fg: "#34d399" },
    muted: false,
    videoOff: true,
  },
  "5": {
    id: "5",
    name: "Paul Essomba",
    initials: "PE",
    color: { bg: "#fb718522", fg: "#fb7185" },
    muted: false,
    videoOff: true,
  },
  "6": {
    id: "6",
    name: "Nina Fouda",
    initials: "NF",
    color: { bg: "#E8B84B22", fg: "#E8B84B" },
    muted: false,
    videoOff: true,
  },
}

const MOCK_CALLS: Record<string, { contact: Participant; type: CallType }> = {
  c1: { type: "video", contact: CONTACTS["1"] },
  c2: { type: "audio", contact: CONTACTS["4"] },
  c3: { type: "audio", contact: CONTACTS["5"] },
  c8: { type: "audio", contact: CONTACTS["3"] },
  c9: { type: "video", contact: CONTACTS["1"] },
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function CallRoomPage() {
  const navigate = useNavigate()
  const { callId } = useParams<{ callId?: string }>()
  const [searchParams] = useSearchParams()

  const contactId = searchParams.get("contact") ?? "1"
  const queryType = searchParams.get("type") === "video" ? "video" : "audio"
  const returnTo = searchParams.get("returnTo") || "/calls"

  const callData = useMemo(() => {
    if (callId && callId !== "new" && MOCK_CALLS[callId]) {
      return MOCK_CALLS[callId]
    }

    return {
      type: queryType,
      contact: CONTACTS[contactId] ?? CONTACTS["1"],
    }
  }, [callId, contactId, queryType])

  const isVideo = callData.type === "video"

  const [callState, setCallState] = useState<CallState>("connecting")
  const [elapsed, setElapsed] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(isVideo)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [screenShare, setScreenShare] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [contact, setContact] = useState<Participant>(callData.contact)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const liveTimerRef = useRef<number | null>(null)
  const showControlsTimerRef = useRef<number | null>(null)
  const connectStageTimerRef = useRef<number | null>(null)
  const ringingStageTimerRef = useRef<number | null>(null)
  const leaveTimerRef = useRef<number | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    setContact(callData.contact)
    setCamOn(callData.type === "video")
    setCallState("connecting")
    setElapsed(0)

    connectStageTimerRef.current = window.setTimeout(() => {
      setCallState("ringing")
      ringingStageTimerRef.current = window.setTimeout(() => {
        setCallState("active")
      }, 2200)
    }, 900)

    return () => {
      if (connectStageTimerRef.current !== null) window.clearTimeout(connectStageTimerRef.current)
      if (ringingStageTimerRef.current !== null) window.clearTimeout(ringingStageTimerRef.current)
    }
  }, [callData])

  useEffect(() => {
    if (callState !== "active") {
      if (liveTimerRef.current !== null) {
        window.clearInterval(liveTimerRef.current)
        liveTimerRef.current = null
      }
      return
    }

    liveTimerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000)

    return () => {
      if (liveTimerRef.current !== null) {
        window.clearInterval(liveTimerRef.current)
        liveTimerRef.current = null
      }
    }
  }, [callState])

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true)
    if (showControlsTimerRef.current !== null) {
      window.clearTimeout(showControlsTimerRef.current)
      showControlsTimerRef.current = null
    }

    if (isVideo && callState === "active") {
      showControlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 4000)
    }
  }, [isVideo, callState])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (showControlsTimerRef.current !== null) {
        window.clearTimeout(showControlsTimerRef.current)
        showControlsTimerRef.current = null
      }
    }
  }, [resetHideTimer])

  useEffect(() => {
    let stream: MediaStream | null = null

    async function openLocalCamera() {
      if (!isVideo || !camOn || callState === "ended") return
      if (!navigator.mediaDevices?.getUserMedia) return

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch {
        // keep demo resilient if camera permission is denied
      }
    }

    void openLocalCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
    }
  }, [isVideo, camOn, callState])

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
    }
  }, [])

  const hangUp = useCallback(() => {
    setShowEndConfirm(false)
    setCallState("ended")

    if (liveTimerRef.current !== null) {
      window.clearInterval(liveTimerRef.current)
      liveTimerRef.current = null
    }

    leaveTimerRef.current = window.setTimeout(() => {
      navigate(returnTo)
    }, 1400)
  }, [navigate, returnTo])

  const stateLabel: Record<CallState, string> = {
    connecting: "Connexion en cours...",
    ringing: "Appel en cours...",
    active: formatElapsed(elapsed),
    ended: "Appel termine",
  }

  const statusColor =
    callState === "active" ? "#4ade80" : callState === "ended" ? "#ef4444" : "#E8B84B"

  return (
    <>
      <div className="call-room-root" onMouseMove={resetHideTimer} onClick={resetHideTimer}>
        <div className="bg-layer">
          {isVideo && callState === "active" ? (
            <video ref={remoteVideoRef} className="bg-video" autoPlay playsInline muted />
          ) : (
            <div className="bg-audio-pattern" />
          )}
        </div>

        <div className="room-content">
          <div className="room-top">
            <button
              className="back-btn"
              onClick={() => {
                if (callState === "active") {
                  setShowEndConfirm(true)
                } else {
                  navigate(returnTo)
                }
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Retour
            </button>

            <div className="call-type-pill">
              {callState === "active" && <div className="rec-dot" />}
              {isVideo ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              ) : (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              )}
              Appel {isVideo ? "video" : "audio"}
            </div>
          </div>

          <div className="room-center">
            <div className="contact-avatar-wrap">
              <div
                className="contact-avatar"
                style={{ background: contact.color.bg, color: contact.color.fg }}
              >
                {callState === "active" && (
                  <>
                    <div className="pulse-ring" style={{ color: contact.color.fg }} />
                    <div className="pulse-ring" style={{ color: contact.color.fg }} />
                    <div className="pulse-ring" style={{ color: contact.color.fg }} />
                  </>
                )}
                {contact.initials}
              </div>
            </div>

            <div className="contact-name">{contact.name}</div>
            <div className="call-status" style={{ color: statusColor }}>
              {callState === "active" && <div className="status-dot-live" />}
              {stateLabel[callState]}
            </div>
          </div>

          {isVideo && callState === "active" && (
            <div className="local-video-pip">
              {camOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                  }}
                />
              ) : (
                <div className="pip-no-cam">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" />
                  </svg>
                </div>
              )}
            </div>
          )}

          <div
            className={`controls-bar ${!controlsVisible && isVideo && callState === "active" ? "hidden" : ""}`}
          >
            <div className="controls-inner">
              <button
                className="ctrl-btn"
                onClick={() => setMicOn((value) => !value)}
                aria-label={micOn ? "Couper le micro" : "Activer le micro"}
              >
                <div className={`ctrl-btn-icon ${micOn ? "ctrl-on" : "ctrl-off"}`}>
                  {micOn ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
                    </svg>
                  )}
                </div>
                <span className="ctrl-btn-label">{micOn ? "Micro" : "Muet"}</span>
              </button>

              {isVideo && (
                <button
                  className="ctrl-btn"
                  onClick={() => setCamOn((value) => !value)}
                  aria-label={camOn ? "Couper la camera" : "Activer la camera"}
                >
                  <div className={`ctrl-btn-icon ${camOn ? "ctrl-on" : "ctrl-off"}`}>
                    {camOn ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34M23 7l-7 5 7 5V7z" />
                      </svg>
                    )}
                  </div>
                  <span className="ctrl-btn-label">{camOn ? "Camera" : "Camera off"}</span>
                </button>
              )}

              {isVideo && (
                <button
                  className="ctrl-btn"
                  onClick={() => setScreenShare((value) => !value)}
                  aria-label="Partager l'ecran"
                >
                  <div className={`ctrl-btn-icon ${screenShare ? "ctrl-on" : "ctrl-off"}`}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      {screenShare && <path d="M9 10l3-3 3 3M12 7v7" strokeWidth="2" />}
                    </svg>
                  </div>
                  <span className="ctrl-btn-label">{screenShare ? "Partage" : "Ecran"}</span>
                </button>
              )}

              <button
                className="ctrl-btn"
                onClick={() => setSpeakerOn((value) => !value)}
                aria-label="Haut-parleur"
              >
                <div className={`ctrl-btn-icon ${speakerOn ? "ctrl-on" : "ctrl-off"}`}>
                  {speakerOn ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </div>
                <span className="ctrl-btn-label">{speakerOn ? "Son" : "Muet"}</span>
              </button>

              <button
                className="ctrl-btn"
                onClick={() => navigate(`/chats/${contact.id}`)}
                aria-label="Ouvrir le chat"
              >
                <div className="ctrl-btn-icon ctrl-on">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <span className="ctrl-btn-label">Chat</span>
              </button>

              <button
                className="ctrl-btn"
                onClick={() => setShowEndConfirm(true)}
                aria-label="Raccrocher"
              >
                <div className="ctrl-btn-icon ctrl-end" style={{ width: 60, height: 60 }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path
                      d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 012 2V21a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2h3.5a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.49 10a16 16 0 001.19 3.31z"
                      style={{ transform: "rotate(135deg)", transformOrigin: "center" }}
                    />
                  </svg>
                </div>
                <span className="ctrl-btn-label" style={{ color: "#fca5a5" }}>
                  Raccrocher
                </span>
              </button>
            </div>
          </div>
        </div>

        {callState === "ended" && (
          <div className="ended-overlay">
            <div className="ended-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div className="ended-title">Appel termine</div>
            <div className="ended-duration">Duree: {formatElapsed(elapsed)}</div>
          </div>
        )}

        {showEndConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <div className="confirm-title">Raccrocher ?</div>
              <div className="confirm-sub">
                L'appel avec {contact.name} sera termine.
                <br />
                Duree actuelle: {formatElapsed(elapsed)}
              </div>
              <div className="confirm-btns">
                <button className="confirm-cancel" onClick={() => setShowEndConfirm(false)}>
                  Annuler
                </button>
                <button className="confirm-end" onClick={hangUp}>
                  Raccrocher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
