import { useEffect, useState, useContext } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"

export default function Products() {
  const [products, setProducts] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useContext(AuthContext)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data } = await API.get(
        `/products?page=${page}&search=${search}`
      )
      setProducts(data.products)
      setTotalPages(data.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [page, search])

  useEffect(() => {
    const ids = (user?.favorites || []).map((fav) =>
      typeof fav === "string" ? fav : fav?._id || fav?.toString()
    )
    setFavoriteIds(ids)
  }, [user])

  const toggleFavorite = async (id, isFav) => {
    if (!user?.token) return alert("Login first")

    try {
      if (isFav) {
        await API.delete(`/products/${id}/favorite`)
        setFavoriteIds((prev) => prev.filter((favId) => favId !== id))
      } else {
        await API.post(`/products/${id}/favorite`)
        setFavoriteIds((prev) =>
          prev.includes(id) ? prev : [...prev, id]
        )
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("user")
      }
      alert(error.response?.data?.message || "Could not update favorite")
    }
  }

  return (
    <section className="catalog">
      <header className="catalog-head">
        <div>
          <p className="eyebrow">Curated Picks</p>
          <h1 className="catalog-title">Find something worth keeping</h1>
        </div>

        <label className="search-box">
          <span>Search</span>
          <input
            placeholder="Laptop, shoes, camera..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
      </header>

      {loading ? <p className="empty-state">Loading products...</p> : null}
      {!loading && products.length === 0 ? (
        <p className="empty-state">No products found for this query.</p>
      ) : null}

      <div className="product-grid">
        {products.map((product) => {
          const isFav = favoriteIds.includes(product._id)

          return (
            <article key={product._id} className="product-card">
              <Link to={`/product/${product._id}`} className="product-link">
                <div className="thumb-wrap">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="product-thumb"
                  />
                </div>
                <h3>{product.title}</h3>
              </Link>

              <p className="price">
                {"\u20B9"}
                {product.price}
              </p>

              <button
                className={`fav-btn ${isFav ? "active" : ""}`}
                onClick={() => toggleFavorite(product._id, isFav)}
              >
                {isFav ? "Saved" : "Save"}
              </button>
            </article>
          )
        })}
      </div>

      <div className="pager">
        <button
          className="btn btn-ghost"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span className="page-count">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn btn-ghost"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
