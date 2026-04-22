import { AuthProvider, useAuth } from './context/AuthContext'
import Board from './components/Board/Board'
import { LoginScreen } from './components/LoginScreen'

function AppInner() {
  const { user } = useAuth()
  if (user === null) return <LoginScreen />
  return <Board />
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App
