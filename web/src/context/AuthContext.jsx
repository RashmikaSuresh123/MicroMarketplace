import { createContext, useState } from "react"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"))
      return stored?.token ? stored : null
    } catch {
      return null
    }
  })

  const login = (data) => {
    localStorage.setItem("user", JSON.stringify(data))
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
