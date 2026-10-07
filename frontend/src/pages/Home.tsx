import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Awning from '../components/Awning'
import Reveal from '../components/Reveal'
import { fetchProducts } from '../api'
import { useChatBridge } from '../chatbridge'

const WINDOW_ITEMS = [
  { id: 'basic-hoodie-big-yale', label: 'Big Yale Hoodie' },
  { id: '2025-yale-vs-harvard-t-shirt', label: 'The Game Tee' },
  { id: 'baseball-left-chest-crewneck', label: 'Baseball Crewneck' },
]

// The 14 residential colleges. The shield colors are illustrative, not official college colors.
const COLLEGES = [
  { name: 'Benjamin Franklin', term: 'franklin', color: '#1f5fa8' },
  { name: 'Berkeley', term: 'berkeley', color: '#6d2e46' },
  { name: 'Branford', term: 'branford', color: '#2a6f5f' },
  { name: 'Davenport', term: 'davenport', color: '#8a4b1f' },
  { name: 'Ezra Stiles', term: 'stiles', color: '#3d4f8a' },
  { name: 'Grace Hopper', term: 'hopper', color: '#7a3b86' },
  { name: 'Jonathan Edwards', term: 'edwards', color: '#235a3a' },
  { name: 'Morse', term: 'morse', color: '#a33a2f' },
  { name: 'Pauli Murray', term: 'murray', color: '#1d6f8a' },
  { name: 'Pierson', term: 'pierson', color: '#6b6f1f' },
  { name: 'Saybrook', term: 'saybrook', color: '#a0662a' },
  { name: 'Silliman', term: 'silliman', color: '#4a3f8f' },
  { name: 'Timothy Dwight', term: 'dwight', color: '#8a2a5b' },
  { name: 'Trumbull', term: 'trumbull', color: '#2b6b4f' },
]

const GIFTS = [
  { icon: '🎓', title: 'For a student', ask: 'What are good Yale gifts for a college student?' },
  { icon: '👨‍👩‍👧', title: 'For a parent', ask: 'What are good Yale gifts for a parent visiting campus?' },
  { icon: '🏛️', title: 'For an alum', ask: 'What are good Yale gifts for an alum?' },
  { icon: '🧢', title: 'For a sibling', ask: 'What are good Yale gifts for a younger sibling?' },
]

const TRUST = [
  { icon: '✓', text: 'Officially licensed Yale merchandise' },
  { icon: '↩', text: '30-day returns on unworn items with tags' },
  { icon: '📍', text: '57 Broadway, New Haven, CT', pin: true },
  { icon: '✉', text: 'Order help: orderdept@campuscustoms.com' },
]

function Hanger() {
  return (
    <svg className="hanger" viewBox="0 0 40 28" aria-hidden="true">
      <path d="M20 2 a4 4 0 1 1 4 4 q-4 1 -4 4 v3" fill="none" stroke="#d8d8d8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 13 L3 24 h34 Z" fill="none" stroke="#d8d8d8" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  const { ask } = useChatBridge()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  // How many catalogue items mention each college, so the shields show real numbers.
  useEffect(() => {
    fetchProducts()
      .then((products) => {
        const next: Record<string, number> = {}
        for (const c of COLLEGES) {
          next[c.term] = products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(c.term)).length
        }
        setCounts(next)
      })
      .catch(() => setCounts({}))
  }, [])

  const countLabel = (term: string) => {
    if (counts === null || counts[term] === undefined) return '\u00a0'
    return counts[term] > 0 ? `${counts[term]} ${counts[term] === 1 ? 'item' : 'items'}` : 'No items yet'
  }

  return (
    <>
      <section className="shop-hero">
        <Awning />
        <div className="shop-hero-inner">
          <div>
            <span className="open-sign">OPEN · 57 BROADWAY</span>
            <p className="eyebrow">Officially Licensed Merchandise</p>
            <h1 className="felt">Big Pride, Big Yale.</h1>
            <hr className="stitch" />
            <p className="hero-text">
              Casual comfort and classic Bulldog pride for students, alumni, families, and fans, straight from our shop at
              57 Broadway in New Haven.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-light">
                Shop Products
              </Link>
              <Link to="/about" className="btn btn-outline">
                Our Story
              </Link>
            </div>
          </div>
          <div className="window" aria-label="Window display">
            <div className="rail" aria-hidden="true" />
            <div className="window-items">
              {WINDOW_ITEMS.map((item, i) => (
                <Link key={item.id} to={`/products/${item.id}`} className="window-item" style={{ ['--i' as string]: i }}>
                  <Hanger />
                  <img
                    src={`/media/products/${item.id}.jpg`}
                    alt={item.label}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="home-section">
          <p className="section-kicker">Shop by identity</p>
          <h2 className="section-title">Find your college</h2>
          <div className="shield-grid">
            {COLLEGES.map((c) => (
              <Link key={c.term} to={`/products?q=${c.term}`} className="shield" style={{ ['--c' as string]: c.color }}>
                <span className="shield-crest">{c.name[0]}</span>
                <span className="shield-name">{c.name}</span>
                <span className="shield-count">{countLabel(c.term)}</span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="game-band">
          <div className="game-band-inner">
            <div>
              <p className="eyebrow">Harvard–Yale</p>
              <h2>The Game is coming. Gear up.</h2>
              <p className="hero-text">Tees and gear for the big weekend, and a Game Day look for this site (button at the very top).</p>
            </div>
            <Link to="/products?q=harvard" className="btn btn-light">
              Shop The Game
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-section">
          <p className="section-kicker">Not sure what to get?</p>
          <h2 className="section-title">Gifts for the whole family</h2>
          <div className="gift-grid">
            {GIFTS.map((g) => (
              <button key={g.title} className="gift-card" onClick={() => ask(g.ask)}>
                <span className="gift-emoji" aria-hidden="true">
                  {g.icon}
                </span>
                <strong>{g.title}</strong>
                <span className="muted">Ask our assistant for ideas</span>
              </button>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="trust">
          <div className="trust-inner">
            {TRUST.map((t) => (
              <div key={t.text} className="trust-item">
                <span className={t.pin ? 'trust-icon trust-pin' : 'trust-icon'} aria-hidden="true">
                  {t.icon}
                </span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </>
  )
}
