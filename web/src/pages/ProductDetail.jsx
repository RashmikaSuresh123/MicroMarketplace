import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import API from "../services/api"

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await API.get(`/products/${id}`)
      setProduct(data)
    }

    fetchProduct()
  }, [id])

  if (!product) {
    return <p className="empty-state">Loading product details...</p>
  }

  return (
    <section className="detail">
      <Link to="/" className="back-link">
        Back to products
      </Link>

      <article className="detail-card">
        <div className="detail-image-wrap">
          <img
            src={product.image}
            alt={product.title}
            className="detail-image"
          />
        </div>

        <div className="detail-body">
          <p className="eyebrow">Product Story</p>
          <h1>{product.title}</h1>
          <p className="detail-description">{product.description}</p>
          <p className="price detail-price">
            {"\u20B9"}
            {product.price}
          </p>
        </div>
      </article>
    </section>
  )
}
