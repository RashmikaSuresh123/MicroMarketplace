import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" })
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const { data } = await API.post("/auth/login", form)
      login(data)
      navigate("/")
    } catch (error) {
      alert(error.response?.data?.message || "Login failed")
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome Back</p>
        <h1>Log in to your account</h1>

        <label>
          <span>Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />
        </label>

        <button type="submit" className="btn btn-solid">
          Login
        </button>

        <p className="auth-footnote">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}
