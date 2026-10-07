import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { sendChat } from '../api'
import { useResults } from '../results'
import type { ChatMessage } from '../types'

const GREETING: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I’m the Campus Customs assistant. Ask me about hoodies, tees, sizes, or prices.',
}

export default function ChatWidget() {
  const { show } = useResults()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [waiting, setWaiting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
      const reply = await sendChat(text, previous)
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
              <span>Merch assistant</span>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-turn ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>{m.content}</div>
                {m.products && m.products.length > 0 && (
                  <div className="chat-showing">
                    ↑ Showing {m.products.length} {m.products.length === 1 ? 'item' : 'items'} on the page
                  </div>
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
              placeholder="Ask about merch…"
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
