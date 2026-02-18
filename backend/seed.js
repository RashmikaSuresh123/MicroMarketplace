const mongoose = require("mongoose")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")
const connectDB = require("./config/db")
const User = require("./models/User")
const Product = require("./models/Product")

dotenv.config()
connectDB()

const seed = async () => {
  await User.deleteMany()
  await Product.deleteMany()

  const password = await bcrypt.hash("password123", 10)

  await User.create([
    { name: "User1", email: "user1@test.com", password },
    { name: "User2", email: "user2@test.com", password }
  ])

  await Product.create([
    { title: "Phone", price: 10000, description: "Smart phone", image: "https://via.placeholder.com/150" },
    { title: "Laptop", price: 50000, description: "Gaming laptop", image: "https://via.placeholder.com/150" },
    { title: "Watch", price: 2000, description: "Smart watch", image: "https://via.placeholder.com/150" },
    { title: "Shoes", price: 1500, description: "Running shoes", image: "https://via.placeholder.com/150" },
    { title: "Bag", price: 800, description: "Travel bag", image: "https://via.placeholder.com/150" },
    { title: "Headphones", price: 3000, description: "Wireless headphones", image: "https://via.placeholder.com/150" },
    { title: "Keyboard", price: 1200, description: "Mechanical keyboard", image: "https://via.placeholder.com/150" },
    { title: "Mouse", price: 700, description: "Gaming mouse", image: "https://via.placeholder.com/150" },
    { title: "Tablet", price: 15000, description: "Android tablet", image: "https://via.placeholder.com/150" },
    { title: "Camera", price: 40000, description: "DSLR camera", image: "https://via.placeholder.com/150" }
  ])

  console.log("Database seeded")
  process.exit()
}

seed()
