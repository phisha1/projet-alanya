import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import LoginPage from "../app/(auth)/login/login"
import ChatRoomPage from "../app/(protected)/chats/[chatId]/chat"
import ChatsPage from "../app/(protected)/chats/chats"
import CallRoomPage from "../app/(protected)/calls/[callId]/call"
import CallsPage from "../app/(protected)/calls/calls"
import ProtectedLayout from "../app/(protected)/layout"
import DashboardPage from "../app/(protected)/dashboard/dashboard"
import SignInPage from "../app/(auth)/sign-in/sign-in"
import WelcomePage from "../app/(public)/welcome/welcome"
import NotFoundPage from "../app/(public)/not-found/not-found"

function ProtectedPlaceholder({ title }: { title: string }) {
  return (
    <ProtectedLayout>
      <main style={{ padding: "32px 36px", color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>{title}</h1>
        <p style={{ color: "#9CA3AF" }}>Cette section sera branchee dans la prochaine etape.</p>
      </main>
    </ProtectedLayout>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/chats" element={<ProtectedLayout><ChatsPage /></ProtectedLayout>} />
        <Route path="/chats/new" element={<ProtectedPlaceholder title="Nouveau chat" />} />
        <Route path="/chats/:chatId" element={<ProtectedLayout><ChatRoomPage /></ProtectedLayout>} />
        <Route path="/calls" element={<ProtectedLayout><CallsPage /></ProtectedLayout>} />
        <Route path="/calls/new" element={<ProtectedLayout><CallRoomPage /></ProtectedLayout>} />
        <Route path="/calls/:callId" element={<ProtectedLayout><CallRoomPage /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedPlaceholder title="Parametres" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
