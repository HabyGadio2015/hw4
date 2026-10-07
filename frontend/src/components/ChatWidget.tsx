import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchChatHistory, sendChat } from '../api'
import { useAuth } from '../auth'
import { useResults } from '../results'
import type { ChatMessage, PageContext } from '../types'

const GREETING: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I’m the Campus Customs assistant. Ask me about hoodies, tees, sizes, or prices.',
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { show, clear } = useResults()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Page context: on a single-item page the agent is told which product "this" means.
  const productId = /^\/products\/([^/]+)$/.exec(pathname)?.[1]
  const page: PageContext = { path: pathname, product_id: productId ? decodeURIComponent(productId) : undefined }

  // This widget is re-created for each shopper (see App.tsx), so on mount: drop the previous shopper's cards,
  // and if someone is logged in, load their saved chat.
  useEffect(() => {
    clear()
    if (!user) return
    let cancelled = false
    fetchChatHistory().then((saved) => {
      if (!cancelled && saved.length > 0) setMessages([GREETING, ...saved])
    })
    return () => {
      cancelled = true
    }
  }, [user, clear])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, waiting, open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || waiting) return
    const previous = messages.slice(1) // skip the local greeting; the agent has its own prompt
    setMessages([...messages, { role: 'user', content: text }])
    setInput('')
    setWaiting(true)
    try {
      const reply = await sendChat(text, previous, page)
      setMessages((m) => [...m, reply])
      if (reply.products && reply.products.length > 0) {
        // The API contract: matching products come back as structured cards, and the page renders them.
        show(reply.resultsTitle ?? text, reply.products)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      const content = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.'
      setMessages((m) => [...m, { role: 'assistant', content }])
    } finally {
      setWaiting(false)
    }
  }

  return (
    <div className="chat-root">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Campus Customs chat">
          <div className="chat-header">
            <div>
              <strong>Campus Customs</strong>
              <span>{user ? `Chatting as ${user.first_name || user.name}` : 'Merch assistant'}</span>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-turn ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>{m.content.replace(/\*\*/g, '')}</div>
                {m.products && m.products.length > 0 && (
                  <button
                    className="chat-showing"
                    onClick={() => {
                      show(m.resultsTitle ?? 'Earlier results', m.products ?? [])
                      // The results panel is hidden on single-item pages, so go to a page where it shows.
                      if (productId) navigate('/products')
                      else window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    ↑ Show these {m.products.length} {m.products.length === 1 ? 'item' : 'items'} on the page
                  </button>
                )}
              </div>
            ))}
            {waiting && (
              <div className="chat-bubble assistant typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={productId ? 'Ask about this item…' : 'Ask about merch…'}
              aria-label="Chat message"
            />
            <button type="submit" className="btn btn-primary" disabled={!input.trim() || waiting}>
              Send
            </button>
          </form>
        </div>
      )}
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close chat' : 'Open chat'}>
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}
