import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth'
import { ResultsProvider } from './results'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ResultsProvider>
          <App />
        </ResultsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
