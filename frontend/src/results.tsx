import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ProductCard } from './types'

interface Results {
  title: string
  products: ProductCard[]
}

interface ResultsState {
  results: Results | null
  show: (title: string, products: ProductCard[]) => void
  clear: () => void
}

const ResultsContext = createContext<ResultsState | null>(null)

// Holds the product matches the chat agent returned, so any page can show them.
export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Results | null>(null)
  const value: ResultsState = {
    results,
    show: (title, products) => setResults({ title, products }),
    clear: () => setResults(null),
  }
  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResults(): ResultsState {
  const ctx = useContext(ResultsContext)
  if (!ctx) throw new Error('useResults must be used inside <ResultsProvider>')
  return ctx
}
