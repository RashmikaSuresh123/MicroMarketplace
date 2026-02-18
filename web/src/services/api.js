import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5000"
})

API.interceptors.request.use((req) => {
  let user = null
  try {
    user = JSON.parse(localStorage.getItem("user"))
  } catch {
    user = null
  }
  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`
  }
  return req
})

export default API
