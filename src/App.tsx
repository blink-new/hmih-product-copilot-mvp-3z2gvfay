import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'

// Pages
import LandingPage from './pages/LandingPage'
import BusinessDashboard from './pages/BusinessDashboard'
import ProductSetup from './pages/ProductSetup'
import ConsumerChat from './pages/ConsumerChat'
import BusinessSettings from './pages/BusinessSettings'

// Components
import LoadingSpinner from './components/LoadingSpinner'

function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/p/:productId" element={<ConsumerChat />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={user ? <BusinessDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/setup" 
            element={user ? <ProductSetup /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={user ? <BusinessSettings /> : <Navigate to="/" />} 
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App