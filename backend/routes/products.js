const express = require("express")
const Product = require("../models/Product")
const protect = require("../middleware/authMiddleware")

const router = express.Router()

const getCartTotals = (cart) => {
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + price * item.quantity
  }, 0)

  const gst = Number((subtotal * 0.18).toFixed(2))
  const platformFee = subtotal > 0 ? 49 : 0
  const total = Number((subtotal + gst + platformFee).toFixed(2))

  return { subtotal, gst, platformFee, total }
}

const sendCart = async (user, res) => {
  if (!user.cart) user.cart = []
  await user.populate("cart.product")

  const cart = user.cart.filter((item) => item.product)
  const totals = getCartTotals(cart)

  res.json({ cart, totals })
}

// =======================
// GET ALL PRODUCTS (Search + Pagination)
// =======================
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || ""
    const page = parseInt(req.query.page) || 1
    const limit = 5

    const query = {
      title: { $regex: search, $options: "i" }
    }

    const total = await Product.countDocuments(query)

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// GET CART
// =======================
router.get("/cart", protect, async (req, res) => {
  try {
    await sendCart(req.user, res)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// ADD TO CART
// =======================
router.post("/:id/cart", protect, async (req, res) => {
  try {
    if (!req.user.cart) req.user.cart = []
    const product = await Product.findById(req.params.id)
    if (!product)
      return res.status(404).json({ message: "Product not found" })

    const qtyToAdd = Math.max(1, parseInt(req.body?.quantity) || 1)
    const existing = req.user.cart.find(
      (item) => item.product.toString() === req.params.id
    )

    if (existing) {
      existing.quantity += qtyToAdd
    } else {
      req.user.cart.push({
        product: req.params.id,
        quantity: qtyToAdd
      })
    }

    await req.user.save()
    await sendCart(req.user, res)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// UPDATE CART ITEM QUANTITY
// =======================
router.patch("/:id/cart", protect, async (req, res) => {
  try {
    if (!req.user.cart) req.user.cart = []
    const quantity = parseInt(req.body?.quantity)
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" })
    }

    const cartItem = req.user.cart.find(
      (item) => item.product.toString() === req.params.id
    )

    if (!cartItem)
      return res.status(404).json({ message: "Item not in cart" })

    cartItem.quantity = quantity
    await req.user.save()
    await sendCart(req.user, res)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// REMOVE FROM CART
// =======================
router.delete("/:id/cart", protect, async (req, res) => {
  try {
    if (!req.user.cart) req.user.cart = []
    req.user.cart = req.user.cart.filter(
      (item) => item.product.toString() !== req.params.id
    )

    await req.user.save()
    await sendCart(req.user, res)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// CLEAR CART
// =======================
router.delete("/cart", protect, async (req, res) => {
  try {
    if (!req.user.cart) req.user.cart = []
    req.user.cart = []
    await req.user.save()
    await sendCart(req.user, res)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// =======================
// CHECKOUT
// =======================
router.post("/checkout", protect, async (req, res) => {
  try {
    if (!req.user.cart) req.user.cart = []
    await req.user.populate("cart.product")

    const cart = req.user.cart.filter((item) => item.product)
    if (cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" })
    }

    const totals = getCartTotals(cart)
    const order = {
      id: `ORD-${Date.now()}`,
      items: cart.map((item) => ({
        productId: item.product._id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity
      })),
      totals,
      createdAt: new Date().toISOString()
    }

    req.user.cart = []
    await req.user.save()

    res.json({
      message: "Checkout successful",
      order,
      cart: [],
      totals: getCartTotals([])
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// GET SINGLE PRODUCT
// =======================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product)
      return res.status(404).json({ message: "Product not found" })

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// CREATE PRODUCT
// =======================
router.post("/", protect, async (req, res) => {
  try {
    const { title, price, description, image } = req.body

    if (!title || !price || !description || !image)
      return res.status(400).json({ message: "All fields required" })

    const product = await Product.create({
      title,
      price,
      description,
      image
    })

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// UPDATE PRODUCT
// =======================
router.put("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product)
      return res.status(404).json({ message: "Product not found" })

    Object.assign(product, req.body)
    await product.save()

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// DELETE PRODUCT
// =======================
router.delete("/:id", protect, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: "Deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// ADD TO FAVORITES
// =======================
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    if (!req.user.favorites.includes(req.params.id)) {
      req.user.favorites.push(req.params.id)
      await req.user.save()
    }

    const updatedUser = await req.user.populate("favorites")

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


// =======================
// REMOVE FROM FAVORITES
// =======================
router.delete("/:id/favorite", protect, async (req, res) => {
  try {
    req.user.favorites = req.user.favorites.filter(
      (fav) => fav.toString() !== req.params.id
    )

    await req.user.save()

    const updatedUser = await req.user.populate("favorites")

    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


module.exports = router
