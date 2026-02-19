import { StatusBar } from "expo-status-bar"
import Constants from "expo-constants"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"

const RUPEE = "\u20b9"
const FALLBACK_API_BASE = "http://localhost:5000"

function resolveApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE
  if (fromEnv) return fromEnv

  const hostUri = Constants.expoConfig?.hostUri
  if (!hostUri) return FALLBACK_API_BASE

  const host = hostUri.split(":")[0]
  if (!host) return FALLBACK_API_BASE

  if (host === "localhost" && Platform.OS === "android") {
    return "http://10.0.2.2:5000"
  }

  return `http://${host}:5000`
}

const API_BASE = resolveApiBase()

const EMPTY_TOTALS = {
  subtotal: 0,
  gst: 0,
  platformFee: 0,
  total: 0
}

export default function App() {
  const [mode, setMode] = useState("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [userName, setUserName] = useState("")

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [totals, setTotals] = useState(EMPTY_TOTALS)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        const msg = data.message || `Request failed (${res.status})`
        throw new Error(msg)
      }
      return data
    },
    [token]
  )

  const fetchProducts = useCallback(async () => {
    const data = await api("/products?page=1&search=")
    setProducts(data.products || [])
  }, [api])

  const fetchCart = useCallback(async () => {
    const data = await api("/products/cart")
    setCart(data.cart || [])
    setTotals(data.totals || EMPTY_TOTALS)
  }, [api])

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      setMessage("")
      try {
        await Promise.all([fetchProducts(), fetchCart()])
      } catch (err) {
        setMessage(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, fetchProducts, fetchCart])

  const submitAuth = async () => {
    setLoading(true)
    setMessage("")
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
      const payload =
        mode === "login" ? { email, password } : { name, email, password }

      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      })

      setToken(data.token || "")
      setUserName(data.name || "")
      setPassword("")
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (id) => {
    setLoading(true)
    setMessage("")
    try {
      const data = await api(`/products/${id}/cart`, {
        method: "POST",
        body: JSON.stringify({ quantity: 1 })
      })
      setCart(data.cart || [])
      setTotals(data.totals || EMPTY_TOTALS)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (id, quantity) => {
    setLoading(true)
    setMessage("")
    try {
      const isDelete = quantity <= 0
      const data = await api(`/products/${id}/cart`, {
        method: isDelete ? "DELETE" : "PATCH",
        ...(isDelete ? {} : { body: JSON.stringify({ quantity }) })
      })
      setCart(data.cart || [])
      setTotals(data.totals || EMPTY_TOTALS)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkout = async () => {
    setLoading(true)
    setMessage("")
    try {
      const data = await api("/products/checkout", { method: "POST" })
      setCart(data.cart || [])
      setTotals(data.totals || EMPTY_TOTALS)
      setMessage(data.message || "Checkout successful")
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cartMap = useMemo(() => {
    const map = {}
    for (const item of cart) {
      map[item.product?._id] = item.quantity
    }
    return map
  }, [cart])

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  )

  if (!token) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.authWrap}>
          <Text style={styles.title}>MicroMarketplace</Text>
          <Text style={styles.subtitle}>Login or create account</Text>
          <Text style={styles.apiText}>API: {API_BASE}</Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode("login")}
              style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "login" && styles.modeBtnTextActive
                ]}
              >
                Login
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("register")}
              style={[
                styles.modeBtn,
                mode === "register" && styles.modeBtnActive
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === "register" && styles.modeBtnTextActive
                ]}
              >
                Register
              </Text>
            </Pressable>
          </View>

          {mode === "register" ? (
            <TextInput
              placeholder="Full name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          ) : null}
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable onPress={submitAuth} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {mode === "login" ? "Login" : "Create account"}
            </Text>
          </Pressable>

          {loading ? <ActivityIndicator color="#152238" /> : null}
          {message ? <Text style={styles.errorText}>{message}</Text> : null}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MicroMarketplace</Text>
          <Text style={styles.subtitle}>Hi, {userName || "User"}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems} items</Text>
        </View>
      </View>

      <Text style={styles.apiText}>API: {API_BASE}</Text>

      {message ? <Text style={styles.infoText}>{message}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const qty = cartMap[item._id] || 0
          return (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.productTitle}>{item.title}</Text>
              <Text style={styles.price}>
                {RUPEE}
                {item.price}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => updateQuantity(item._id, qty - 1)}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </Pressable>
                <Text style={styles.qtyText}>{qty}</Text>
                <Pressable
                  onPress={() =>
                    qty === 0
                      ? addToCart(item._id)
                      : updateQuantity(item._id, qty + 1)
                  }
                  style={[styles.qtyBtn, styles.qtyBtnPrimary]}
                >
                  <Text style={[styles.qtyBtnText, styles.qtyBtnTextPrimary]}>
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          )
        }}
      />

      <View style={styles.billPanel}>
        <Row label="Subtotal" value={totals.subtotal || 0} />
        <Row label="GST (18%)" value={totals.gst || 0} />
        <Row label="Platform Fee" value={totals.platformFee || 0} />
        <Row label="Total" value={totals.total || 0} bold />
        <Pressable onPress={checkout} style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>
        {RUPEE}
        {Number(value).toFixed(2)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7f8fa" },
  authWrap: { padding: 16, paddingTop: 30 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: { fontSize: 22, fontWeight: "800", color: "#152238" },
  subtitle: { color: "#64748b", marginTop: 2 },
  apiText: { color: "#64748b", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  modeRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  modeBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modeBtnActive: { backgroundColor: "#152238", borderColor: "#152238" },
  modeBtnText: { color: "#334155", fontWeight: "700" },
  modeBtnTextActive: { color: "#ffffff" },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe1ea",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10
  },
  primaryBtn: {
    backgroundColor: "#1f7a8c",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  errorText: { color: "#b91c1c", marginTop: 8 },
  infoText: { color: "#b91c1c", paddingHorizontal: 16, marginBottom: 8 },
  badge: {
    backgroundColor: "#152238",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 210 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10
  },
  image: {
    width: "100%",
    height: 145,
    borderRadius: 10,
    backgroundColor: "#edf2f7"
  },
  productTitle: {
    marginTop: 8,
    color: "#1e293b",
    fontWeight: "700",
    fontSize: 15
  },
  price: { marginTop: 4, color: "#ee6c4d", fontWeight: "800", fontSize: 15 },
  qtyRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0"
  },
  qtyBtnPrimary: { backgroundColor: "#1f7a8c" },
  qtyBtnText: { fontSize: 20, fontWeight: "700", color: "#0f172a", lineHeight: 22 },
  qtyBtnTextPrimary: { color: "#fff" },
  qtyText: { minWidth: 20, textAlign: "center", fontWeight: "700", color: "#0f172a" },
  billPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  rowLabel: { color: "#64748b" },
  rowValue: { color: "#0f172a" },
  bold: { fontWeight: "800" },
  checkoutBtn: {
    marginTop: 8,
    backgroundColor: "#152238",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11
  },
  checkoutText: { color: "#fff", fontWeight: "800" }
})
