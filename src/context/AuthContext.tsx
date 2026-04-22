import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ZDAgent } from '../api/tickets'
import { searchZDUserByEmail, fetchGroupAgents } from '../api/tickets'

interface AuthUser {
  id: number
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  colleagues: ZDAgent[]
  viewedAgentId: number | null
  setViewedAgentId: (id: number | null) => void
  login: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  const id = localStorage.getItem('zd-user-id')
  const name = localStorage.getItem('zd-user-name')
  const email = localStorage.getItem('zd-user-email')
  if (id && name && email) {
    return { id: Number(id), name, email }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)
  const [colleagues, setColleagues] = useState<ZDAgent[]>([])
  const [viewedAgentId, setViewedAgentId] = useState<number | null>(null)

  const loadColleagues = useCallback(async () => {
    try {
      const agents = await fetchGroupAgents()
      setColleagues(agents)
    } catch {
      setColleagues([])
    }
  }, [])

  // Fetch colleagues on mount if already logged in
  useEffect(() => {
    if (user) {
      void loadColleagues()
    }
  }, [user, loadColleagues])

  const login = useCallback(async (email: string) => {
    const zdUser = await searchZDUserByEmail(email)
    if (!zdUser) {
      throw new Error('No Zendesk user found for that email address.')
    }
    const authUser: AuthUser = { id: zdUser.id, name: zdUser.name, email: zdUser.email }
    localStorage.setItem('zd-user-id', String(zdUser.id))
    localStorage.setItem('zd-user-name', zdUser.name)
    localStorage.setItem('zd-user-email', zdUser.email)
    setUser(authUser)
    void loadColleagues()
  }, [loadColleagues])

  const logout = useCallback(() => {
    localStorage.removeItem('zd-user-id')
    localStorage.removeItem('zd-user-name')
    localStorage.removeItem('zd-user-email')
    setUser(null)
    setColleagues([])
    setViewedAgentId(null)
  }, [])

  const value: AuthContextValue = {
    user,
    colleagues,
    viewedAgentId,
    setViewedAgentId,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
