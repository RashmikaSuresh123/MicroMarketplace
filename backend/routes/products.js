const express = require("express")
const Product = require("../models/Product")
const protect = require("../middleware/authMiddleware")

const router = express.Router()

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
