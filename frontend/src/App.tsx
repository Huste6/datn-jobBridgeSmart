import { useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register'>('landing')

  const navigate = (page: 'landing' | 'login' | 'register') => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
      {currentPage === 'register' && <RegisterPage onNavigate={navigate} />}
    </>
  )
}

export default App

