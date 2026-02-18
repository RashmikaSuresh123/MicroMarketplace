import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  })
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const { data } = await API.post("/auth/register", form)
      login(data)
      navigate("/")
    } catch (error) {
      alert(error.response?.data?.message || "Register failed")
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Join MicroMarket</p>
        <h1>Create your account</h1>

        <label>
          <span>Name</span>
          <input
            placeholder="Your name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />
        </label>

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
            placeholder="Create password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />
        </label>

        <button type="submit" className="btn btn-solid">
          Register
        </button>

        <p className="auth-footnote">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  )
}
