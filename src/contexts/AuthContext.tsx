import React, { useState, useEffect, ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { User, AuthContextType } from '../types/auth'

interface AuthProviderProps {
  children: ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('hmih_user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('hmih_user')
      } finally {
        setIsLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const signIn = (userData: User) => {
    setUser(userData)
    localStorage.setItem('hmih_user', JSON.stringify(userData))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('hmih_user')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider }