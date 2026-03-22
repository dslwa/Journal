import { useState } from 'react'
import './App.css'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin
      ? { email, password }
      : { email, password, username }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'Something went wrong')
        return
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setMessage(`Welcome, ${data.username}!`)
    } catch {
      setMessage('Connection error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setMessage('')
  }

  if (token) {
    return (
      <div className="container">
        <h1>Trading Journal</h1>
        <p>You are logged in.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>{isLogin ? 'Login' : 'Register'}</h1>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>

      {message && <p className="message">{message}</p>}

      <p className="switch">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <span onClick={() => { setIsLogin(!isLogin); setMessage('') }}>
          {isLogin ? 'Register' : 'Login'}
        </span>
      </p>
    </div>
  )
}

export default App
