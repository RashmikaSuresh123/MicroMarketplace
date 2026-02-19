const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const connectDB = require("./config/db")

dotenv.config()
connectDB()

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true
  })
)

app.use(express.json())

app.use("/auth", require("./routes/auth"))
app.use("/products", require("./routes/products"))

const PORT = process.env.PORT || 5000

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
)
