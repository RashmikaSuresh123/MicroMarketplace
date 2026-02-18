import { useContext } from "react"
import { Link } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          MicroMarket
        </Link>

        <div className="topbar-actions">
          {user ? (
            <>
              <span className="user-pill">
                {user.name || user.email}
              </span>
              <button className="btn btn-ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Login
              </Link>
              <Link className="btn btn-solid" to="/register">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
