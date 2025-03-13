import { useState } from 'react'
import SearchBar from './components/SearchBar'
import UserList from './components/UserList'
import { searchUsers } from './services/githubService'
import './App.css'

function App() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (query) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const result = await searchUsers(query)
      setUsers(result.users)
    } catch (err) {
      setError(err.message || '搜索时发生错误')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <SearchBar onSearch={handleSearch} />
      {hasSearched && (
        <UserList
          users={users}
          loading={loading}
          error={error}
        />
      )}
      <footer className="app-footer">
        <p>GitHub用户搜索应用 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
