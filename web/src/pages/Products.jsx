import { useEffect, useState, useContext } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"
import { AuthContext } from "../context/AuthContext"

const emptyTotals = {
  subtotal: 0,
  gst: 0,
  platformFee: 0,
  total: 0
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [totals, setTotals] = useState(emptyTotals)
  const [checkoutMessage, setCheckoutMessage] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)
  const [cartPulse, setCartPulse] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [productsError, setProductsError] = useState("")
  const { user } = useContext(AuthContext)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setProductsError("")
      const { data } = await API.get(
        `/products?page=${page}&search=${search}`
      )
      setProducts(data.products)
      setTotalPages(data.totalPages)
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Could not load products"
      setProductsError(message)
      setProducts([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    if (!user?.token) {
      setCartItems([])
      setTotals(emptyTotals)
      return
    }

    try {
      const { data } = await API.get("/products/cart")
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
    } catch {
      setCartItems([])
      setTotals(emptyTotals)
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

  useEffect(() => {
    fetchCart()
  }, [user])

  const triggerCartPulse = () => {
    setCartPulse(false)
    setTimeout(() => setCartPulse(true), 10)
    setTimeout(() => setCartPulse(false), 520)
  }

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
    } catch {
      alert("Could not update favorite")
    }
  }

  const addToCart = async (id) => {
    if (!user?.token) return alert("Login first")

    try {
      const { data } = await API.post(`/products/${id}/cart`, {
        quantity: 1
      })
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
      setCheckoutMessage("")
      triggerCartPulse()
    } catch {
      alert("Could not add item to cart")
    }
  }

  const updateCartQuantity = async (id, quantity) => {
    try {
      const { data } = await API.patch(`/products/${id}/cart`, { quantity })
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
      setCheckoutMessage("")
      triggerCartPulse()
    } catch {
      alert("Could not update quantity")
    }
  }

  const removeFromCart = async (id) => {
    try {
      const { data } = await API.delete(`/products/${id}/cart`)
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
      setCheckoutMessage("")
      triggerCartPulse()
    } catch {
      alert("Could not remove item")
    }
  }

  const clearCart = async () => {
    try {
      const { data } = await API.delete("/products/cart")
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
      setCheckoutMessage("")
      triggerCartPulse()
    } catch {
      alert("Could not clear cart")
    }
  }

  const proceedToCheckout = async () => {
    if (!user?.token) return alert("Login first")
    if (cartItems.length === 0) return alert("Cart is empty")

    try {
      setCheckingOut(true)
      const { data } = await API.post("/products/checkout")
      setCartItems(data.cart || [])
      setTotals(data.totals || emptyTotals)
      setCheckoutMessage(
        `${data.message}. Order ID: ${data.order?.id || "N/A"}`
      )
      triggerCartPulse()
    } catch (error) {
      alert(error.response?.data?.message || "Checkout failed")
    } finally {
      setCheckingOut(false)
    }
  }

  const inCartQuantity = (id) => {
    const item = cartItems.find((cartItem) => {
      const productId = cartItem.product?._id || cartItem.product
      return productId === id
    })
    return item?.quantity || 0
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

      <div className="shop-layout">
        <div className="shop-main">
          {productsError ? (
            <p className="api-error">
              Failed to load products: {productsError}
            </p>
          ) : null}
          {loading ? <p className="empty-state">Loading products...</p> : null}
          {!loading && products.length === 0 ? (
            <p className="empty-state">No products found for this query.</p>
          ) : null}

          <div className="product-grid">
            {products.map((product) => {
              const isFav = favoriteIds.includes(product._id)
              const cartQty = inCartQuantity(product._id)

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

                  <div className="card-actions">
                    <button
                      className={`fav-btn ${isFav ? "active" : ""}`}
                      onClick={() => toggleFavorite(product._id, isFav)}
                    >
                      {isFav ? "Saved" : "Save"}
                    </button>

                    <button
                      className="btn btn-solid add-cart-btn"
                      onClick={() => addToCart(product._id)}
                    >
                      {cartQty ? `Add More (${cartQty})` : "Add to Cart"}
                    </button>
                  </div>
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
        </div>

        <aside className="billing-panel">
          <div className="billing-header">
            <p className="eyebrow">Cart</p>
            <h2>
              Billing Area
              <span className={`cart-badge ${cartPulse ? "pulse" : ""}`}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </h2>
          </div>

          {!user?.token ? (
            <p className="empty-state">Login to add items to cart.</p>
          ) : null}

          {user?.token && cartItems.length === 0 ? (
            <p className="empty-state">Your cart is empty.</p>
          ) : null}

          {cartItems.length > 0 ? (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="cart-row">
                    <div>
                      <p className="cart-title">{item.product.title}</p>
                      <p className="cart-meta">
                        {"\u20B9"}
                        {item.product.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateCartQuantity(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateCartQuantity(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bill-lines">
                <div className="bill-row">
                  <span>Subtotal</span>
                  <strong>
                    {"\u20B9"}
                    {totals.subtotal}
                  </strong>
                </div>
                <div className="bill-row">
                  <span>GST (18%)</span>
                  <strong>
                    {"\u20B9"}
                    {totals.gst}
                  </strong>
                </div>
                <div className="bill-row">
                  <span>Platform Fee</span>
                  <strong>
                    {"\u20B9"}
                    {totals.platformFee}
                  </strong>
                </div>
                <div className="bill-row total-row">
                  <span>Total</span>
                  <strong>
                    {"\u20B9"}
                    {totals.total}
                  </strong>
                </div>
              </div>

              <button className="btn btn-ghost clear-cart-btn" onClick={clearCart}>
                Clear Cart
              </button>
              <button
                className="btn btn-solid checkout-btn"
                onClick={proceedToCheckout}
                disabled={checkingOut || cartItems.length === 0}
              >
                {checkingOut ? "Processing..." : "Proceed to Checkout"}
              </button>
            </>
          ) : null}

          {checkoutMessage ? (
            <p className="checkout-note">{checkoutMessage}</p>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
