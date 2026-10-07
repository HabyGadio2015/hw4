import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Confetti from './components/Confetti'
import Pennants from './components/Pennants'
import ThemeToggles from './components/ThemeToggles'
import ResultsPanel from './components/ResultsPanel'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Login from './pages/Login'
import CreateAccount from './pages/CreateAccount'
import './App.css'

// Re-creates the Products page when the link's search text changes (e.g. clicking a college shield).
function ProductsRoute() {
  const { search } = useLocation()
  return <Products key={search} />
}

function App() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <div className="announcement">
        <span>Officially Licensed Yale Merchandise · 57 Broadway, New Haven</span>
        <ThemeToggles />
      </div>
      <NavBar />
      <Pennants />
      <ResultsPanel />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsRoute />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <Confetti />
      {/* key: a new shopper (or logging out) starts a fresh widget, so chats never leak between accounts */}
      <ChatWidget key={user?.id ?? 'guest'} />
    </div>
  )
}

export default App
