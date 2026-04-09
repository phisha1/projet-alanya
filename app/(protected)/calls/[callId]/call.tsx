import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

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
  "1": { id: "1", name: "Kevin Manga", initials: "KM", color: { bg: "#E8B84B22", fg: "#E8B84B" }, muted: false, videoOff: false },
  "2": { id: "2", name: "Groupe Alanya II", initials: "GA", color: { bg: "#60a5fa22", fg: "#60a5fa" }, muted: false, videoOff: false },
  "3": { id: "3", name: "Dr. NANA BINKEU", initials: "NB", color: { bg: "#a78bfa22", fg: "#a78bfa" }, muted: false, videoOff: true },
  "4": { id: "4", name: "Laure Ateba", initials: "LA", color: { bg: "#34d39922", fg: "#34d399" }, muted: false, videoOff: true },
  "5": { id: "5", name: "Paul Essomba", initials: "PE", color: { bg: "#fb718522", fg: "#fb7185" }, muted: false, videoOff: true },
  "6": { id: "6", name: "Nina Fouda", initials: "NF", color: { bg: "#E8B84B22", fg: "#E8B84B" }, muted: false, videoOff: true },
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
      navigate("/calls")
    }, 1400)
  }, [navigate])

  const stateLabel: Record<CallState, string> = {
    connecting: "Connexion en cours...",
    ringing: "Appel en cours...",
    active: formatElapsed(elapsed),
    ended: "Appel termine",
  }

  const statusColor = callState === "active" ? "#4ade80" : callState === "ended" ? "#ef4444" : "#E8B84B"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .room-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh;
          background: #050810;
          color: white;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          user-select: none;
        }

        .bg-layer { position: absolute; inset: 0; z-index: 0; }
        .bg-video { width: 100%; height: 100%; object-fit: cover; filter: brightness(.45) blur(1px); }
        .bg-audio-pattern {
          width: 100%;
          height: 100%;
          background: #080C14;
          background-image:
            radial-gradient(circle at 30% 20%, #E8B84B08 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, #60a5fa06 0%, transparent 50%),
            radial-gradient(circle, #ffffff05 1px, transparent 1px);
          background-size: auto, auto, 28px 28px;
        }

        .room-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

        .room-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: linear-gradient(to bottom, #00000060, transparent);
          flex-shrink: 0;
        }

        .back-btn {
          background: #ffffff15;
          border: 1px solid #ffffff15;
          border-radius: 9px;
          padding: 8px 14px;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }
        .back-btn:hover { background: #ffffff25; }

        .call-type-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff10;
          border: 1px solid #ffffff15;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffffcc;
        }

        .rec-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          animation: recBlink 1.5s ease-in-out infinite;
        }
        @keyframes recBlink { 0%,100%{opacity:1;} 50%{opacity:.3;} }

        .room-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .contact-avatar-wrap { position: relative; margin-bottom: 20px; }
        .contact-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 32px;
          font-weight: 800;
          position: relative;
          z-index: 1;
        }

        .pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid currentColor;
          opacity: 0;
          animation: pulseRing 2s ease-out infinite;
        }
        .pulse-ring:nth-child(2) { animation-delay: .5s; }
        .pulse-ring:nth-child(3) { animation-delay: 1s; }
        @keyframes pulseRing { 0%{opacity:.4;transform:scale(1);} 100%{opacity:0;transform:scale(1.6);} }

        .contact-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #fff;
          margin-bottom: 8px;
          text-align: center;
        }

        .call-status {
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot-live {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          animation: recBlink 2s ease-in-out infinite;
        }

        .local-video-pip {
          position: absolute;
          bottom: 140px;
          right: 24px;
          width: 130px;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #ffffff20;
          z-index: 10;
          background: #1A2030;
        }
        .local-video-pip video { width: 100%; height: 100%; object-fit: cover; }

        .pip-no-cam {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1A2030;
          color: #4B5563;
          font-size: 11px;
        }

        .controls-bar {
          padding: 20px 28px 28px;
          background: linear-gradient(to top, #00000080, transparent);
          flex-shrink: 0;
          transition: opacity .3s, transform .3s;
        }
        .controls-bar.hidden { opacity: 0; pointer-events: none; transform: translateY(10px); }

        .controls-inner { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }

        .ctrl-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .ctrl-btn-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .1s, background .15s;
        }
        .ctrl-btn:hover .ctrl-btn-icon { transform: scale(1.06); }
        .ctrl-btn:active .ctrl-btn-icon { transform: scale(.96); }

        .ctrl-btn-label { font-size: 11px; color: #ffffffaa; }

        .ctrl-on  { background: #ffffff20; }
        .ctrl-off { background: #374151; }
        .ctrl-end { background: #ef4444; width: 60px; height: 60px; }
        .ctrl-end:hover { background: #dc2626 !important; }

        .ended-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          background: #050810ee;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .ended-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #1E2736;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .ended-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -.5px;
          color: #fff;
        }

        .ended-duration { font-size: 14px; color: #4B5563; }

        .confirm-overlay {
          position: absolute;
          inset: 0;
          z-index: 40;
          background: #00000080;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirm-card {
          background: #10151F;
          border: 1px solid #1E2736;
          border-radius: 16px;
          padding: 28px 32px;
          max-width: 340px;
          width: 90%;
          text-align: center;
        }

        .confirm-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.3px;
          color: #fff;
          margin-bottom: 8px;
        }

        .confirm-sub {
          font-size: 13px;
          color: #4B5563;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .confirm-btns { display: flex; gap: 10px; }

        .confirm-cancel {
          flex: 1;
          background: #1E2736;
          border: 1px solid #2a3444;
          border-radius: 9px;
          padding: 12px;
          color: #9CA3AF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }
        .confirm-cancel:hover { background: #2a3444; }

        .confirm-end {
          flex: 1;
          background: #ef4444;
          border: none;
          border-radius: 9px;
          padding: 12px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }
        .confirm-end:hover { background: #dc2626; }
      `}</style>

      <div className="room-root" onMouseMove={resetHideTimer} onClick={resetHideTimer}>
        <div className="bg-layer">
          {isVideo && callState === "active"
            ? <video ref={remoteVideoRef} className="bg-video" autoPlay playsInline muted />
            : <div className="bg-audio-pattern" />}
        </div>

        <div className="room-content">
          <div className="room-top">
            <button
              className="back-btn"
              onClick={() => {
                if (callState === "active") {
                  setShowEndConfirm(true)
                } else {
                  navigate("/calls")
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Retour
            </button>

            <div className="call-type-pill">
              {callState === "active" && <div className="rec-dot" />}
              {isVideo ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              )}
              Appel {isVideo ? "video" : "audio"}
            </div>
          </div>

          <div className="room-center">
            <div className="contact-avatar-wrap">
              <div className="contact-avatar" style={{ background: contact.color.bg, color: contact.color.fg }}>
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
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              ) : (
                <div className="pip-no-cam">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34" />
                  </svg>
                </div>
              )}
            </div>
          )}

          <div className={`controls-bar ${!controlsVisible && isVideo && callState === "active" ? "hidden" : ""}`}>
            <div className="controls-inner">
              <button className="ctrl-btn" onClick={() => setMicOn((value) => !value)} aria-label={micOn ? "Couper le micro" : "Activer le micro"}>
                <div className={`ctrl-btn-icon ${micOn ? "ctrl-on" : "ctrl-off"}`}>
                  {micOn ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
                    </svg>
                  )}
                </div>
                <span className="ctrl-btn-label">{micOn ? "Micro" : "Muet"}</span>
              </button>

              {isVideo && (
                <button className="ctrl-btn" onClick={() => setCamOn((value) => !value)} aria-label={camOn ? "Couper la camera" : "Activer la camera"}>
                  <div className={`ctrl-btn-icon ${camOn ? "ctrl-on" : "ctrl-off"}`}>
                    {camOn ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34M23 7l-7 5 7 5V7z" />
                      </svg>
                    )}
                  </div>
                  <span className="ctrl-btn-label">{camOn ? "Camera" : "Camera off"}</span>
                </button>
              )}

              {isVideo && (
                <button className="ctrl-btn" onClick={() => setScreenShare((value) => !value)} aria-label="Partager l'ecran">
                  <div className={`ctrl-btn-icon ${screenShare ? "ctrl-on" : "ctrl-off"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      {screenShare && <path d="M9 10l3-3 3 3M12 7v7" strokeWidth="2" />}
                    </svg>
                  </div>
                  <span className="ctrl-btn-label">{screenShare ? "Partage" : "Ecran"}</span>
                </button>
              )}

              <button className="ctrl-btn" onClick={() => setSpeakerOn((value) => !value)} aria-label="Haut-parleur">
                <div className={`ctrl-btn-icon ${speakerOn ? "ctrl-on" : "ctrl-off"}`}>
                  {speakerOn ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </div>
                <span className="ctrl-btn-label">{speakerOn ? "Son" : "Muet"}</span>
              </button>

              <button className="ctrl-btn" onClick={() => navigate(`/chats/${contact.id}`)} aria-label="Ouvrir le chat">
                <div className="ctrl-btn-icon ctrl-on">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <span className="ctrl-btn-label">Chat</span>
              </button>

              <button className="ctrl-btn" onClick={() => setShowEndConfirm(true)} aria-label="Raccrocher">
                <div className="ctrl-btn-icon ctrl-end" style={{ width: 60, height: 60 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path
                      d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 012 2V21a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2h3.5a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.49 10a16 16 0 001.19 3.31z"
                      style={{ transform: "rotate(135deg)", transformOrigin: "center" }}
                    />
                  </svg>
                </div>
                <span className="ctrl-btn-label" style={{ color: "#fca5a5" }}>Raccrocher</span>
              </button>
            </div>
          </div>
        </div>

        {callState === "ended" && (
          <div className="ended-overlay">
            <div className="ended-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round">
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
                L'appel avec {contact.name} sera termine.<br />
                Duree actuelle: {formatElapsed(elapsed)}
              </div>
              <div className="confirm-btns">
                <button className="confirm-cancel" onClick={() => setShowEndConfirm(false)}>Annuler</button>
                <button className="confirm-end" onClick={hangUp}>Raccrocher</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
