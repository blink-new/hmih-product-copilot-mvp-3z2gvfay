export interface User {
  id: string
  name: string
  email: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (user: User) => void
  signOut: () => void
  isAuthenticated: boolean
}