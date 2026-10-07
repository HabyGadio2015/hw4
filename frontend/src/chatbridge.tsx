import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface AskRequest {
  id: number
  message: string
}

interface ChatBridgeState {
  request: AskRequest | null
  ask: (message: string) => void
  clear: () => void
}

const ChatBridgeContext = createContext<ChatBridgeState | null>(null)

// Lets any part of the page (a gift card, an "Ask about this item" button) open the chat and send a message.
export function ChatBridgeProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<AskRequest | null>(null)
  const ask = useCallback((message: string) => setRequest({ id: Date.now(), message }), [])
  const clear = useCallback(() => setRequest(null), [])
  const value = useMemo(() => ({ request, ask, clear }), [request, ask, clear])
  return <ChatBridgeContext.Provider value={value}>{children}</ChatBridgeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatBridge(): ChatBridgeState {
  const ctx = useContext(ChatBridgeContext)
  if (!ctx) throw new Error('useChatBridge must be used inside <ChatBridgeProvider>')
  return ctx
}
