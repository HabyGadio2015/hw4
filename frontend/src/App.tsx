import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import ResultsPanel from './components/ResultsPanel'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Login from './pages/Login'
import CreateAccount from './pages/CreateAccount'
import './App.css'

function App() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <div className="announcement">Officially Licensed Yale Merchandise · 57 Broadway, New Haven</div>
      <NavBar />
      <ResultsPanel />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      {/* key: a new shopper (or logging out) starts a fresh widget, so chats never leak between accounts */}
      <ChatWidget key={user?.id ?? 'guest'} />
    </div>
  )
}

export default App
