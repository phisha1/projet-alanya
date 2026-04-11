import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { ToastProvider } from "./components/toast"
import "./styles/globals.css"
import LoginPage from "../app/(auth)/login/login"
import ChatRoomPage from "../app/(protected)/chats/[chatId]/chat"
import ChatsPage from "../app/(protected)/chats/chats"
import CallRoomPage from "../app/(protected)/calls/[callId]/call"
import CallsPage from "../app/(protected)/calls/calls"
import NewCallPage from "../app/(protected)/calls/new-call"
import ProtectedLayout from "../app/(protected)/layout"
import DashboardPage from "../app/(protected)/dashboard/dashboard"
import SignInPage from "../app/(auth)/sign-in/sign-in"
import WelcomePage from "../app/(public)/welcome/welcome"
import NotFoundPage from "../app/(public)/not-found/not-found"
import SettingsPage from "../app/(protected)/settings/settings"
import NewChatPage from "../app/(protected)/chats/new/new-chat"
import ConvInfoPage from "../app/(protected)/chats/[chatId]/chat-info"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in" element={<SignInPage />} />

            <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
            <Route path="/chats" element={<ProtectedLayout><ChatsPage /></ProtectedLayout>} />
            <Route path="/chats/new" element={<ProtectedLayout><NewChatPage /></ProtectedLayout>} />
            <Route path="/chats/:chatId" element={<ProtectedLayout><ChatRoomPage /></ProtectedLayout>} />
            <Route path="/chats/:chatId/info" element={<ProtectedLayout><ConvInfoPage /></ProtectedLayout>} />

            <Route path="/calls" element={<ProtectedLayout><CallsPage /></ProtectedLayout>} />
            <Route path="/calls/new" element={<ProtectedLayout><NewCallPage /></ProtectedLayout>} />
            <Route path="/calls/:callId" element={<ProtectedLayout><CallRoomPage /></ProtectedLayout>} />

            <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
