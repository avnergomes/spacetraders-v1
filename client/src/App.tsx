import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [token, setToken] = useState(localStorage.getItem('SPACETRADERS_TOKEN') || '')
  const [ships, setShips] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSaveToken = () => {
    localStorage.setItem('SPACETRADERS_TOKEN', token)
    window.location.reload()
  }

  useEffect(() => {
    if (!token) return
    const fetchShips = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/my/ships', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setShips(data?.data || [])
      } catch (err: any) {
        setError('Falha ao buscar naves. Verifique o token.')
      }
    }
    fetchShips()
  }, [token])

  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>🪐 SpaceTraders Control Center</h2>
        <p>Insira o seu token para começar:</p>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Cole aqui seu SPACETRADERS_TOKEN"
          style={{ width: '400px', padding: '8px' }}
        />
        <br />
        <button onClick={handleSaveToken} style={{ marginTop: '1rem', padding: '8px 16px' }}>
          Salvar Token
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🚀 SpaceTraders Control Center</h1>
      <p>Token ativo: {token.slice(0, 6)}...{token.slice(-6)}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Minhas naves:</h2>
      {ships.length === 0 ? (
        <p>Nenhuma nave encontrada.</p>
      ) : (
        <ul>
          {ships.map((ship) => (
            <li key={ship.symbol}>
              <strong>{ship.symbol}</strong> — {ship.nav.status}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => {
          localStorage.removeItem('SPACETRADERS_TOKEN')
          window.location.reload()
        }}
        style={{ marginTop: '1rem', padding: '8px 16px' }}
      >
        Sair
      </button>
    </div>
  )
}

export default App
