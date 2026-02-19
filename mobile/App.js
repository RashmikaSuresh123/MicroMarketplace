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
  View
} from "react-native"

const FALLBACK_API_BASE = "http://localhost:5000"
const RUPEE = "\u20b9"

function getApiBase() {
  const hostUri = Constants.expoConfig?.hostUri
  if (!hostUri) return FALLBACK_API_BASE

  const host = hostUri.split(":")[0]
  if (!host) return FALLBACK_API_BASE

  if (host === "localhost" && Platform.OS === "android") {
    return "http://10.0.2.2:5000"
  }

  return `http://${host}:5000`
}

const API_BASE = getApiBase()

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cart, setCart] = useState({})

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/products?page=1&search=`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      setProducts([])
      setError("Could not load products. Check backend connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const addToCart = (id) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const removeFromCart = (id) => {
    setCart((prev) => {
      const current = prev[id] || 0
      if (current <= 1) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: current - 1 }
    })
  }

  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  )

  const subtotal = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + (cart[p._id] || 0) * Number(p.price || 0),
        0
      ),
    [products, cart]
  )

  const gst = Number((subtotal * 0.18).toFixed(2))
  const platformFee = subtotal > 0 ? 49 : 0
  const total = Number((subtotal + gst + platformFee).toFixed(2))

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.productTitle}>
          {item.title}
        </Text>
        <Text style={styles.price}>
          {RUPEE}
          {item.price}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => removeFromCart(item._id)}
          style={[styles.qtyBtn, styles.qtyBtnLight]}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </Pressable>

        <Text style={styles.qtyValue}>{cart[item._id] || 0}</Text>

        <Pressable
          onPress={() => addToCart(item._id)}
          style={[styles.qtyBtn, styles.qtyBtnDark]}
        >
          <Text style={[styles.qtyBtnText, styles.qtyBtnTextLight]}>+</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>MicroMarketplace</Text>
          <Text style={styles.subheading}>Fresh picks for your cart</Text>
        </View>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{totalItems} items</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#ee6c4d" size="large" />
          <Text style={styles.helperText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadProducts} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.billPanel}>
        <Text style={styles.billTitle}>Billing Summary</Text>
        <Row label="Subtotal" value={subtotal} />
        <Row label="GST (18%)" value={gst} />
        <Row label="Platform Fee" value={platformFee} />
        <Row label="Total" value={total} bold />
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
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7f8fa"
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#152238"
  },
  subheading: {
    marginTop: 2,
    fontSize: 13,
    color: "#5f6f86"
  },
  cartBadge: {
    backgroundColor: "#152238",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  cartBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 210
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#0e1528",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: "#edf1f7"
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1d2a44"
  },
  price: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#ee6c4d"
  },
  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  qtyBtnLight: {
    backgroundColor: "#e8ecf4"
  },
  qtyBtnDark: {
    backgroundColor: "#1f7a8c"
  },
  qtyBtnText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1c2940",
    lineHeight: 21
  },
  qtyBtnTextLight: {
    color: "#ffffff"
  },
  qtyValue: {
    minWidth: 18,
    textAlign: "center",
    fontWeight: "700",
    color: "#2b3d5b"
  },
  billPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  billTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#152238",
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3
  },
  rowLabel: {
    color: "#5f6f86",
    fontSize: 13
  },
  rowValue: {
    color: "#1d2a44",
    fontSize: 13
  },
  bold: {
    fontWeight: "800",
    fontSize: 14
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28
  },
  helperText: {
    marginTop: 10,
    color: "#5f6f86"
  },
  errorText: {
    color: "#aa2e25",
    textAlign: "center",
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: "#152238",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "700"
  }
})
