"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { clearSession, getSessionUser, getToken, type SessionUser } from "@/lib/client-auth";
import UserAvatar from "@/components/UserAvatar";
import ImageUpload from "@/components/ImageUpload";
import SoilTestSection from "@/components/SoilTestSection";

type Product = {
  _id: string;
  farmerId: string;
  name: string;
  category: string;
  unit: string;
  quantityAvailable: number;
  pricePerUnit: number;
  region: string;
  description?: string;
  imageUrls: string[];
};

type ProductPayload = {
  name: string;
  category: string;
  unit: string;
  quantityAvailable: number;
  pricePerUnit: number;
  region: string;
  description?: string;
  imageUrls: string[];
};

const emptyForm: ProductPayload = {
  name: "",
  category: "",
  unit: "kg",
  quantityAvailable: 0,
  pricePerUnit: 0,
  region: "Kanthalloor",
  description: "",
  imageUrls: [],
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeSection, setActiveSection] = useState<
    "overview" | "analytics" | "crops" | "weather" | "market" | "sales" | "community" | "soiltest" | "aisync" | "settings" | "schemes"
  >("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [marketProducts, setMarketProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Market Feedback
  const [marketFeedback, setMarketFeedback] = useState("");

  // Farmer Orders
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]);

  // IoT Sensor Telemetry State
  const [sensorMoisture, setSensorMoisture] = useState(72);
  const [sensorTemp, setSensorTemp] = useState(24);
  const [sensorPh, setSensorPh] = useState(6.4);
  const [isSimulatingSensors, setIsSimulatingSensors] = useState(false);

  // Regional Farmer Forum Posts
  const [communityPosts, setCommunityPosts] = useState<Array<{ id: string; author: string; role: string; location: string; content: string; date: string; likes: number }>>([
    {
      id: "1",
      author: "Murugan Swamy",
      role: "farmer",
      location: "Kanthalloor Hub",
      content: "Organic Garlic crop is showing incredible growth. Soil treatment with dynamic compost yielded a 14% improvement in size! Anyone else trying organic garlic this season?",
      date: "2 hours ago",
      likes: 8
    },
    {
      id: "2",
      author: "Venkatesh Rao",
      role: "farmer",
      location: "Idukki Sector C",
      content: "Warning: High moisture shifts predicted in Zone 3 over the next 48 hours. Ensure local irrigation grids are paused to avoid waterlogging Heritage Corn.",
      date: "5 hours ago",
      likes: 12
    }
  ]);
  const [forumInput, setForumInput] = useState("");

  // AI Assistant Chat State
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Good morning, Agronomist. I've analyzed your current portfolio. Based on current soil moisture levels in Zone 4, I recommend increasing irrigation by 8.5% to maintain target yields."
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Buyer order modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderProduct, setSelectedOrderProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPaymentMode, setOrderPaymentMode] = useState<"cod" | "upi">("cod");
  const [orderDeliveryNote, setOrderDeliveryNote] = useState("");
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderId: string;
    farmerPhone: string;
    farmerName: string;
    productName: string;
    quantity: number;
    unit: string;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setCurrentUser(user);
    void fetchProducts(user.id);
    void fetchMarketProducts();
    if (user.role === "farmer") {
      void fetchFarmerOrders(user.id);
    }
  }, [router]);

  /** Returns Authorization headers using the stored JWT. */
  function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchProducts(farmerId: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?farmerId=${encodeURIComponent(farmerId)}`, {
        headers: authHeaders(),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setProducts(result.data as Product[]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchMarketProducts() {
    try {
      const response = await fetch("/api/products");
      const result = await response.json();
      if (response.ok && result.success) {
        setMarketProducts(result.data as Product[]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function openOrderModal(product: Product) {
    if (!currentUser) {
      setMarketFeedback("Please login first to place an order.");
      return;
    }
    setSelectedOrderProduct(product);
    setOrderQuantity(1);
    setOrderPaymentMode("cod");
    setOrderDeliveryNote("");
    setOrderSuccessData(null);
    setIsOrderModalOpen(true);
  }

  async function confirmOrder() {
    if (!currentUser || !selectedOrderProduct) return;

    setMarketFeedback("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          farmerId: selectedOrderProduct.farmerId,
          buyerId: currentUser.id,
          paymentMode: orderPaymentMode,
          deliveryNote: orderDeliveryNote,
          items: [
            {
              productId: selectedOrderProduct._id,
              productName: selectedOrderProduct.name,
              quantity: orderQuantity,
              unitPrice: selectedOrderProduct.pricePerUnit,
            },
          ],
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const orderData = result.data.order;
        setOrderSuccessData({
          orderId: orderData._id,
          farmerPhone: result.data.farmerPhone,
          farmerName: result.data.farmerName,
          productName: selectedOrderProduct.name,
          quantity: orderQuantity,
          unit: selectedOrderProduct.unit || "kg",
          totalAmount: orderQuantity * selectedOrderProduct.pricePerUnit,
        });

        setMarketFeedback(`Order placed successfully for ${selectedOrderProduct.name}!`);
        void fetchMarketProducts(); // Refresh market stock levels
        if (currentUser.role === "farmer") {
          void fetchFarmerOrders(currentUser.id);
        }
      } else {
        setMarketFeedback(result.message ?? "Unable to place order.");
      }
    } catch (err) {
      console.error("Order error:", err);
      setMarketFeedback("Server error. Please try again.");
    }
  }

  async function fetchFarmerOrders(farmerId: string) {
    try {
      const response = await fetch(`/api/orders?farmerId=${encodeURIComponent(farmerId)}`, {
        headers: authHeaders(),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setFarmerOrders(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch farmer orders", err);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setMarketFeedback(`Order status successfully updated to ${newStatus}`);
        if (currentUser) {
          void fetchFarmerOrders(currentUser.id);
        }
      } else {
        setMarketFeedback(result.message ?? "Failed to update status.");
      }
    } catch {
      setMarketFeedback("Server error updating status.");
    }
  }

  async function triggerSensorSweep() {
    setIsSimulatingSensors(true);
    setMarketFeedback("Initializing regional satellite IoT sensor telemetry sweep...");
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newMoisture = Math.floor(60 + Math.random() * 25);
    const newTemp = Math.floor(21 + Math.random() * 11);
    const newPh = Number((5.8 + Math.random() * 1.5).toFixed(1));
    
    setSensorMoisture(newMoisture);
    setSensorTemp(newTemp);
    setSensorPh(newPh);
    setIsSimulatingSensors(false);
    
    let aiRec = "";
    if (newPh < 6.2) {
      aiRec = `Soil Vital scan complete. The Soil pH level has dropped to ${newPh} (slightly acidic). I recommend applying 150kg of dolomitic agricultural limestone to Sector B to restore neutral pH.`;
    } else if (newPh > 7.0) {
      aiRec = `Soil Vital scan complete. The Soil pH level is ${newPh} (alkaline shift). I recommend incorporating organic peat compost to naturally neutralize vital levels.`;
    } else if (newMoisture < 65) {
      aiRec = `Soil Vital scan complete. Ambient hydration efficiency has dropped to ${newMoisture}%. I recommend scheduling an automated 12-minute drip irrigation sweep for Zone C-4.`;
    } else {
      aiRec = `Soil Vital scan complete. Moisture (${newMoisture}%), pH (${newPh}) and Temperature (${newTemp}°C) are within stable optimal ranges. Maintain current cycle.`;
    }
    
    setAiMessages(prev => [...prev, { sender: "ai", text: aiRec }]);
    setMarketFeedback("Sensor telemetry sweep complete. Dynamic AI advice generated.");
  }

  function publishForumPost(e: React.FormEvent) {
    e.preventDefault();
    if (!forumInput.trim() || !currentUser) return;
    
    const newPost = {
      id: String(Date.now()),
      author: currentUser.fullName,
      role: currentUser.role,
      location: currentUser.location || "Local Hub",
      content: forumInput,
      date: "Just now",
      likes: 0
    };
    
    setCommunityPosts(prev => [newPost, ...prev]);
    setForumInput("");
    setMarketFeedback("Post published on regional agricultural community forum.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    const payload: ProductPayload = {
      ...form,
      quantityAvailable: Number(form.quantityAvailable),
      pricePerUnit: Number(form.pricePerUnit),
    };

    try {
      const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? payload : { ...payload, farmerId: currentUser.id };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message ?? "Unable to save product.");
        return;
      }

      setMessage(editingId ? "Product updated." : "Product added.");
      setEditingId(null);
      setForm(emptyForm);
      await fetchProducts(currentUser.id);
      await fetchMarketProducts();
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(productId: string) {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const confirmed = confirm("Delete this product?");
    if (!confirmed) return;

    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message ?? "Unable to delete product.");
        return;
      }

      setMessage("Product deleted.");
      if (editingId === productId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await fetchProducts(currentUser.id);
      await fetchMarketProducts();
    } finally {
      setLoading(false);
    }
  }

  function onEdit(product: Product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantityAvailable: product.quantityAvailable,
      pricePerUnit: product.pricePerUnit,
      region: product.region,
      description: product.description ?? "",
      imageUrls: product.imageUrls ?? [],
    });
  }

  async function sendAiMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!aiInput.trim() || isAiThinking) return;

    const userText = aiInput;
    const updatedMessages = [...aiMessages, { sender: "user" as "user" | "ai", text: userText }];
    setAiMessages(updatedMessages);
    setAiInput("");
    setIsAiThinking(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("AI API request failed");
      }

      const result = await response.json();
      if (result.success && result.text) {
        setAiMessages(prev => [...prev, { sender: "ai", text: result.text }]);
      } else {
        throw new Error(result.message || "Failed to process chat response");
      }
    } catch (err) {
      console.error("AI assistant connection failure:", err);
      setAiMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "I encountered a telemetry sync disconnect. Please verify your OpenRouter credentials or regional connection rules."
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  }

  function toggleVoiceInput() {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setIsListening(true);
    setTimeout(() => {
      setSearchQuery("Wheat");
      setIsListening(false);
      setMarketFeedback("Voice recognized: 'Wheat' - filtered marketplace products.");
    }, 2000);
  }

  // Filtered market products
  const filteredMarketProducts = marketProducts.filter(item => {
    const s = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(s) ||
      item.category.toLowerCase().includes(s) ||
      item.region.toLowerCase().includes(s)
    );
  });

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Helper: navigate and close mobile sidebar
  function navTo(section: typeof activeSection) {
    setActiveSection(section);
    setMobileSidebarOpen(false);
  }

  // Sidebar nav content — shared between desktop and mobile drawer
  function SidebarContent() {
    return (
      <>
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8 pl-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-700 to-green-500 shadow-sm">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <span className="font-[var(--font-orbitron)] text-base font-bold tracking-wider text-gray-900">NexGro</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem label="Overview" icon="dashboard" active={activeSection==="overview"} onClick={() => navTo("overview")} />
          {currentUser?.role === "farmer" ? (
            <>
              <NavItem label="My Crops"       icon="eco"            active={activeSection==="crops"}     onClick={() => navTo("crops")} />
              <NavItem label="Sales Orders"   icon="local_shipping" active={activeSection==="sales"}     onClick={() => { navTo("sales"); if (currentUser) void fetchFarmerOrders(currentUser.id); }} />
              <NavItem label="IoT Telemetry"  icon="thermostat"     active={activeSection==="weather"}   onClick={() => navTo("weather")} />
              <NavItem label="Agri Forum"     icon="forum"          active={activeSection==="community"} onClick={() => navTo("community")} />
              <NavItem label="Soil Test"      icon="science"        active={activeSection==="soiltest"}  onClick={() => navTo("soiltest")} />
              <NavItem label="Schemes & Insurance" icon="verified_user" active={activeSection==="schemes"} onClick={() => navTo("schemes")} />
            </>
          ) : (
            <>
              <NavItem label="Agri Marketplace" icon="shopping_basket" active={activeSection==="market"}    onClick={() => navTo("market")} />
              <NavItem label="Pricing Trends"   icon="monitoring"      active={activeSection==="analytics"} onClick={() => navTo("analytics")} />
              <NavItem label="Weather Forecast" icon="cloud"           active={activeSection==="weather"}   onClick={() => navTo("weather")} />
              <NavItem label="Agri Forum"       icon="forum"           active={activeSection==="community"} onClick={() => navTo("community")} />
            </>
          )}
          <NavItem label="Public Market" icon="trending_up" active={activeSection==="market" && currentUser?.role==="farmer"} onClick={() => navTo("market")} />
        </nav>

        <div className="mt-auto pt-5 border-t border-gray-200 space-y-3">
          <button className="btn-primary w-full text-xs py-2.5" onClick={() => navTo("aisync")}>
            <span className="material-symbols-outlined text-sm">bolt</span>
            Launch AI Sync
          </button>
          <div className="space-y-0.5">
            <div className="nav-item cursor-pointer" onClick={() => navTo("settings")}><span className="material-symbols-outlined text-base">settings</span><span>Settings</span></div>
            <div className="nav-item cursor-pointer"><span className="material-symbols-outlined text-base">help</span><span>Support</span></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden flex">

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside className={`fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200 w-72 p-5 flex flex-col transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        {/* Close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 bg-white border-r border-gray-200 w-64 p-5">
        <SidebarContent />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen bg-gray-50 overflow-hidden pb-20 lg:pb-16">
        {/* ── Top Header ── */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 flex justify-between items-center px-4 lg:px-7 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h1 className="font-[var(--font-poppins)] text-sm font-semibold text-gray-900 hidden md:block">
              {activeSection === "overview"   && "Dashboard Overview"}
              {activeSection === "analytics"  && "Crop Performance Analytics"}
              {activeSection === "crops"      && "Crops & Stock Management"}
              {activeSection === "weather"    && "Smart Telemetry & Weather"}
              {activeSection === "market"     && "NexGro Marketplace"}
              {activeSection === "sales"      && "Sales Orders"}
              {activeSection === "community"  && "AgriTech Regional Forum"}
              {activeSection === "soiltest"   && "Kerala Soil Testing Centers"}
              {activeSection === "aisync"     && "NexGro AI — Model Information"}
              {activeSection === "settings"   && "Profile & Settings"}
              {activeSection === "schemes"    && "Farmer Schemes & Insurance"}
            </h1>

            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-100 border border-gray-200 rounded-full pl-9 pr-10 py-1.5 w-44 md:w-60 lg:w-72 focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all text-xs text-gray-900 placeholder-[#6B7280] outline-none"
                placeholder="Search crops, regions…"
              />
              <button
                onClick={toggleVoiceInput}
                className={`absolute inset-y-0 right-3 flex items-center transition-colors ${isListening ? "text-green-600 animate-pulse" : "text-[#6B7280] hover:text-gray-950"}`}
              >
                <span className="material-symbols-outlined text-sm">mic</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Nav links — xl only */}
            <div className="hidden xl:flex items-center gap-5">
              {[
                { label: "Home",        section: null,        href: "/" },
                { label: "Marketplace", section: "market" as const },
                { label: "Farm Hub",    section: "overview" as const },
                { label: "Insights",    section: "analytics" as const },
              ].map((n) =>
                n.href ? (
                  <a
                    key={n.label}
                    href={n.href}
                    className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {n.label}
                  </a>
                ) : (
                  <button
                    key={n.label}
                    onClick={() => setActiveSection(n.section!)}
                    className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeSection === n.section
                        ? "text-green-700 font-bold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {n.label}
                  </button>
                )
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-[#9CA3AF] hover:text-gray-900">
              <span className="material-symbols-outlined text-lg">notifications</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-600 pulse-dot" />
            </button>

            {/* Avatar */}
            {currentUser && <UserAvatar user={currentUser} />}
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50">
          
          {/* Tab 1: Overview */}
          {activeSection === "overview" && (
            <LiveOverview
              currentUser={currentUser}
              products={products}
              marketProducts={marketProducts}
              farmerOrders={farmerOrders}
            />
          )}
          {/* Tab 2: Analytics */}
          {activeSection === "analytics" && (
            <section className="glass-card rounded-xl p-6 text-sm text-gray-600 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Advanced Agri-Pricing Trends</h2>
              <p>Predictive analytics estimates stable pricing for region Kanthalloor.</p>
              <div className="h-64 rounded-lg bg-gradient-to-t from-green-50/50 to-transparent border border-gray-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-green-600 animate-pulse">monitoring</span>
                <span className="ml-4 font-semibold text-gray-900">Telemetry Modeling Engine Live - 98.4% Confidence</span>
              </div>
            </section>
          )}

          {/* Tab 3: Crops (Product Upload & Inventory Tracking) */}
          {activeSection === "crops" && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="glass-card rounded-xl p-5 lg:col-span-5 flex flex-col">
                <h2 className="mb-4 text-base font-bold text-gray-900">
                  {editingId ? "Edit Crop Product" : "Add Crop Product"}
                </h2>
                <form onSubmit={onSubmit} className="space-y-4 flex-1">
                  <Field
                    label="Product Name"
                    value={form.name}
                    onChange={(value) => setForm((c) => ({ ...c, name: value }))}
                  />
                  <Field
                    label="Category"
                    value={form.category}
                    onChange={(value) => setForm((c) => ({ ...c, category: value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Unit (e.g. kg, ton)"
                      value={form.unit}
                      onChange={(value) => setForm((c) => ({ ...c, unit: value }))}
                    />
                    <Field
                      label="Region / Hub"
                      value={form.region}
                      onChange={(value) => setForm((c) => ({ ...c, region: value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Quantity Available"
                      type="number"
                      value={String(form.quantityAvailable)}
                      onChange={(value) =>
                        setForm((c) => ({ ...c, quantityAvailable: Number(value) }))
                      }
                    />
                    <Field
                      label="Price Per Unit (Rs)"
                      type="number"
                      value={String(form.pricePerUnit)}
                      onChange={(value) =>
                        setForm((c) => ({ ...c, pricePerUnit: Number(value) }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">Description</label>
                    <textarea
                      value={form.description ?? ""}
                      onChange={(event) =>
                        setForm((c) => ({ ...c, description: event.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
                      Product Images
                    </label>
                    <ImageUpload
                      value={form.imageUrls}
                      onChange={(urls) => setForm((c) => ({ ...c, imageUrls: urls }))}
                      maxImages={4}
                    />
                  </div>
                  {error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      {error}
                    </p>
                  ) : null}
                  {message ? (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                      {message}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {editingId ? "Update Product" : "Add Product"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setForm(emptyForm);
                        }}
                        className="rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-xs text-gray-700"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              {/* Crop Inventory Table */}
              <div className="glass-card rounded-xl p-5 lg:col-span-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 font-[var(--font-poppins)]">Inventory & Stock Tracking</h2>
                  {loading ? <span className="text-xs text-gray-500 animate-pulse">Syncing...</span> : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500">
                        <th className="px-2 py-3">Product</th>
                        <th className="px-2 py-3">Stock Available</th>
                        <th className="px-2 py-3">Allocation</th>
                        <th className="px-2 py-3">Status</th>
                        <th className="px-2 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-2 py-6 text-center text-gray-500">
                            No crops listed yet. Start uploading above!
                          </td>
                        </tr>
                      ) : null}
                      {products.map((product) => (
                        <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-3">
                              {product.imageUrls?.[0] ? (
                                <img
                                  src={product.imageUrls[0]}
                                  alt={product.name}
                                  className="h-9 w-9 rounded object-cover border border-gray-200"
                                  style={{ contentVisibility: 'auto' }}
                                />
                              ) : (
                                <div className="h-9 w-9 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-green-600 text-sm">eco</span>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-xs text-gray-900">{product.name}</p>
                                <p className="text-[10px] text-gray-500">{product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-gray-900">
                            {product.quantityAvailable} {product.unit}
                          </td>
                          <td className="px-2 py-3">
                            <div className="h-1.5 w-full rounded-full bg-gray-100 max-w-[80px]">
                              <div
                                className="h-1.5 rounded-full bg-green-600"
                                style={{
                                  width: `${Math.max(
                                    8,
                                    Math.min(100, (product.quantityAvailable / 1000) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => onEdit(product)}
                                className="rounded border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void onDelete(product._id)}
                                className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-750 hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
          {/* Tab 4: Weather & Telemetry IoT Simulation */}
          {activeSection === "weather" && (
            <div className="space-y-6">
              <div className="glass-panel p-5 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Live IoT Weather Telemetry</h2>
                  <p className="text-gray-500 text-xs">Real-time agricultural IoT sensor suite for regional moisture, pH, and hydration flux.</p>
                </div>
                <button
                  onClick={triggerSensorSweep}
                  disabled={isSimulatingSensors}
                  className="rounded-lg bg-green-700 hover:bg-green-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm animate-spin" style={{ display: isSimulatingSensors ? "inline-block" : "none" }}>sync</span>
                  <span>{isSimulatingSensors ? "Sweeping Sensors..." : "Trigger Sensor Sweep"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <article className="glass-card rounded-xl p-5 text-center border border-gray-200 hover:border-green-300 transition-all">
                  <p className="mb-2 text-xs uppercase text-gray-500 tracking-wider">Soil Moisture</p>
                  <p className="text-4xl font-extrabold text-green-700 font-mono">{sensorMoisture}%</p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${sensorMoisture < 65 ? "text-yellow-600" : "text-green-700"}`}>
                    {sensorMoisture < 65 ? "Dry Shift" : "Optimal Health"}
                  </p>
                </article>

                <article className="glass-card rounded-xl p-5 text-center border border-gray-200 hover:border-green-300 transition-all">
                  <p className="mb-2 text-xs uppercase text-gray-500 tracking-wider">Ambient Temp</p>
                  <p className="text-4xl font-extrabold text-teal-700 font-mono">{sensorTemp}°C</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-2">Stable (24h)</p>
                </article>

                <article className="glass-card rounded-xl p-5 text-center border border-gray-200 hover:border-green-300 transition-all">
                  <p className="mb-2 text-xs uppercase text-gray-500 tracking-wider">Soil pH</p>
                  <p className="text-4xl font-extrabold text-orange-700 font-mono">{sensorPh}</p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${sensorPh < 6.0 ? "text-red-700" : sensorPh > 7.0 ? "text-yellow-600" : "text-emerald-700"}`}>
                    {sensorPh < 6.0 ? "Acidic Shift" : sensorPh > 7.0 ? "Alkaline Shift" : "Ideal Balance"}
                  </p>
                </article>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center gap-2 text-green-700 text-sm font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">smart_toy</span>
                  <span>AI Crop Telemetry Recommendations</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Our neural agronomist engine has processed the latest IoT soil parameters. Here are the target matches for your sector:
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <RecoCard title="Hybrid Maize X-402" match="98% Match" yieldText="+14%" />
                  <RecoCard title="Cyber-Grain Soy" match="92% Match" yieldText="+8%" />
                  <RecoCard title="Drought-Resistant Barley" match="85% Match" yieldText="+5%" />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Sales / Customer Orders Manager (Farmer Specific) */}
          {activeSection === "sales" && (
            <div className="space-y-6">
              <div className="glass-panel p-5 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Customer Sales Orders</h2>
                  <p className="text-gray-500 text-xs">Track and transition dispatch status parameters for incoming buyer orders.</p>
                </div>
                <button
                  onClick={() => currentUser && void fetchFarmerOrders(currentUser.id)}
                  className="rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-xs">sync</span>
                  <span>Sync Orders</span>
                </button>
              </div>

              <div className="glass-panel rounded-xl overflow-hidden border border-gray-200 p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500">
                        <th className="px-3 py-3">Order Details</th>
                        <th className="px-3 py-3">Crop / Quantity</th>
                        <th className="px-3 py-3">Transaction</th>
                        <th className="px-3 py-3">Delivery / Status</th>
                        <th className="px-3 py-3 text-right">Dispatch Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center text-gray-500">
                            No buyer sales orders placed yet. Product listings are active in marketplace!
                          </td>
                        </tr>
                      ) : null}
                      {farmerOrders.map((order: any) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all">
                          <td className="px-3 py-4">
                            <p className="font-mono text-[10px] text-gray-950">#{order._id.substring(order._id.length - 8).toUpperCase()}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-3 py-4">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx}>
                                <p className="font-semibold text-gray-900">{item.productName}</p>
                                <p className="text-[10px] text-gray-500">{item.quantity} units</p>
                              </div>
                            ))}
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-mono text-sm font-bold text-green-700">Rs. {order.totalAmount}</p>
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 mt-0.5">{order.paymentMode}</p>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              order.status === "pending" && "bg-yellow-100 text-yellow-800" ||
                              order.status === "confirmed" && "bg-blue-100 text-blue-800" ||
                              order.status === "packed" && "bg-purple-100 text-purple-800" ||
                              order.status === "delivered" && "bg-green-100 text-green-800" ||
                              "bg-red-100 text-red-800"
                            }`}>
                              {order.status}
                            </span>
                            {order.deliveryNote && (
                              <p className="text-[9px] text-gray-500 italic mt-1 max-w-[150px] truncate" title={order.deliveryNote}>
                                Note: {order.deliveryNote}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="inline-flex gap-1.5 flex-wrap justify-end">
                              {order.status === "pending" && (
                                <button
                                  onClick={() => void updateOrderStatus(order._id, "confirmed")}
                                  className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
                                >
                                  Confirm
                                </button>
                              )}
                              {order.status === "confirmed" && (
                                <button
                                  onClick={() => void updateOrderStatus(order._id, "packed")}
                                  className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-[9px] font-bold text-purple-700 hover:bg-purple-100 active:scale-95 transition-all"
                                >
                                  Pack
                                </button>
                              )}
                              {["confirmed", "packed"].includes(order.status) && (
                                <button
                                  onClick={() => void updateOrderStatus(order._id, "delivered")}
                                  className="rounded border border-green-200 bg-green-50 px-2 py-1 text-[9px] font-bold text-green-700 hover:bg-green-100 active:scale-95 transition-all"
                                >
                                  Deliver
                                </button>
                              )}
                              {order.status !== "delivered" && order.status !== "cancelled" && (
                                <button
                                  onClick={() => void updateOrderStatus(order._id, "cancelled")}
                                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-bold text-red-700 hover:bg-red-100 active:scale-95 transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Community Forum (Shared Network) */}
          {activeSection === "community" && (
            <div className="space-y-6">
              <div className="glass-panel p-5 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AgriTech Forum Community</h2>
                  <p className="text-gray-500 text-xs">Share cultivation tips, weather alarms, and trade recommendations with local networks.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Publish box */}
                <div className="glass-panel rounded-xl p-5 lg:col-span-5 border border-gray-200 h-fit">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Publish Discussion Thread</h3>
                  <form onSubmit={publishForumPost} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Your Post Details</label>
                      <textarea
                        value={forumInput}
                        onChange={(e) => setForumInput(e.target.value)}
                        placeholder="Share high-yield composting tips, soil details, or crop availability queries..."
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-950 placeholder:text-gray-400 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none transition-all resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-700 hover:bg-green-800 text-white py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                    >
                      Publish Thread
                    </button>
                  </form>
                </div>

                {/* Forum feed */}
                <div className="lg:col-span-7 space-y-4">
                  {communityPosts.map((post) => (
                    <div key={post.id} className="glass-panel rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-all space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs">
                            {post.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-gray-900">{post.author}</h4>
                              <span className="text-[8px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                {post.role}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500">{post.location} • {post.date}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setCommunityPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p))}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 hover:border-green-500 bg-gray-50 hover:bg-green-50 hover:text-green-700 text-[10px] text-gray-550 transition-all"
                        >
                          <span className="material-symbols-outlined text-xs">thumb_up</span>
                          <span>{post.likes}</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Market (Product Information Display) */}
          {activeSection === "market" && (
            <section className="space-y-6">
              <div className="glass-panel p-5 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-[var(--font-poppins)]">Global Agriculture Listings</h2>
                  <p className="text-gray-500 text-xs">Verify live crops and direct-negotiate delivery parameters.</p>
                </div>
                {marketFeedback ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700 animate-pulse">
                    {marketFeedback}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMarketProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-3 text-center py-10">
                    No active crops match your search query. Try searching another term!
                  </p>
                ) : null}
                {filteredMarketProducts.map((product) => (
                  <article key={product._id} className="glass-card overflow-hidden rounded-xl border border-gray-200 hover:border-green-300 transition-all flex flex-col justify-between">
                    {product.imageUrls?.[0] ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="h-40 w-full object-cover border-b border-gray-200"
                        style={{ contentVisibility: 'auto' }}
                      />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 border-b border-gray-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-green-700 opacity-50">eco</span>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-base font-bold text-gray-900">{product.name}</h4>
                          <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">location_on</span> Hub Region: {product.region}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {product.description || "Fresh premium sustainable crop direct from certified farmers."}
                        </p>
                        <p className="text-xs text-green-800 mt-2 font-medium">
                          Available Stock: {product.quantityAvailable} {product.unit}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider block text-gray-500">Price / {product.unit}</span>
                          <span className="text-base font-bold text-green-700 font-mono">Rs. {product.pricePerUnit}</span>
                        </div>
                        <button
                          onClick={() => openOrderModal(product)}
                          className="rounded bg-green-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-green-800 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">shopping_cart</span>
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── Tab: Soil Test ── */}
          {activeSection === "soiltest" && <SoilTestSection />}

          {/* ── Tab: AI Sync Info ── */}
          {activeSection === "aisync" && <AiSyncSection />}

          {/* ── Tab: Settings / Profile ── */}
          {activeSection === "settings" && <SettingsSection user={currentUser} />}

          {/* ── Tab: Schemes & Insurance ── */}
          {activeSection === "schemes" && <SchemesInsuranceSection authHeaders={authHeaders} />}

        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-gray-200 py-2.5 px-6 flex flex-col md:flex-row justify-between items-center gap-2 z-20 text-[10px]">
        <span className="text-gray-500 uppercase tracking-wider font-semibold hidden md:block">© 2026 NexGro AI</span>
        <div className="flex gap-5">
          {["Privacy", "Terms", "API Docs"].map((l) => (
            <a key={l} className="text-gray-500 uppercase tracking-wider hover:text-green-700 transition-colors font-semibold" href="#">
              {l}
            </a>
          ))}
        </div>
      </footer>

      {/* ── Mobile bottom nav bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 bg-white px-2 py-2 lg:hidden">
        {(currentUser?.role === "farmer"
          ? [
              { icon: "dashboard",      label: "Home",    section: "overview"   as const },
              { icon: "eco",            label: "Crops",   section: "crops"      as const },
              { icon: "local_shipping", label: "Orders",  section: "sales"      as const },
              { icon: "science",        label: "Soil",    section: "soiltest"   as const },
              { icon: "more_horiz",     label: "More",    section: null },
            ]
          : [
              { icon: "dashboard",       label: "Home",    section: "overview"   as const },
              { icon: "shopping_basket", label: "Market",  section: "market"     as const },
              { icon: "monitoring",      label: "Trends",  section: "analytics"  as const },
              { icon: "forum",           label: "Forum",   section: "community"  as const },
              { icon: "more_horiz",      label: "More",    section: null },
            ]
        ).map((item) => (
          <button
            key={item.label}
            onClick={() => item.section ? navTo(item.section) : setMobileSidebarOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              item.section && activeSection === item.section
                ? "text-green-700"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={item.section && activeSection === item.section ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[9px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Buyer Order Modal */}
      {isOrderModalOpen && selectedOrderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-5 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-700">shopping_cart</span>
                {orderSuccessData ? "Order Completed!" : "Configure Order"}
              </h3>
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {orderSuccessData ? (
                // Success screen with WhatsApp trigger
                <div className="text-center space-y-4 py-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 border border-green-200 text-green-800 mb-2 animate-bounce">
                    <span className="material-symbols-outlined text-2xl font-bold">check</span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-gray-900">Your order has been placed successfully!</h4>
                  <p className="text-xs text-gray-500">
                    Order ID: <span className="font-mono text-green-700">#{orderSuccessData.orderId.slice(-6)}</span>
                  </p>

                  {/* Order Summary Cards */}
                  <div className="glass-panel p-4 rounded-xl text-left space-y-2 text-xs bg-gray-50 border border-gray-200">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Crop:</span>
                      <span className="font-bold text-gray-900">{orderSuccessData.productName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-bold text-gray-900">{orderSuccessData.quantity} {orderSuccessData.unit}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-bold text-green-700 font-mono">Rs. {orderSuccessData.totalAmount}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500">Farmer:</span>
                      <span className="font-bold text-gray-900">{orderSuccessData.farmerName}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    {/* Glowing WhatsApp Action Button */}
                    <button
                      onClick={() => {
                        let cleanPhone = orderSuccessData.farmerPhone.replace(/\D/g, '');
                        if (cleanPhone.length === 10) {
                          cleanPhone = '91' + cleanPhone;
                        }
                        const message = encodeURIComponent(
                          `வணக்கம் ${orderSuccessData.farmerName}! நான் NexGro-ல் உங்கள் பயிரை ஆர்டர் செய்துள்ளேன்:\n\n🌾 பயிர்: *${orderSuccessData.productName}*\n📦 அளவு: *${orderSuccessData.quantity} ${orderSuccessData.unit}*\n💰 மொத்த தொகை: *Rs. ${orderSuccessData.totalAmount}*\n🆔 ஆர்டர் ஐடி: *#${orderSuccessData.orderId.slice(-6)}*\n\nதயவுசெய்து எனது ஆர்டரை உறுதி செய்யவும். நன்றி!\n\n---\n\nHello ${orderSuccessData.farmerName}! I have placed an order for your crop on NexGro:\n\n🌾 Crop: *${orderSuccessData.productName}*\n📦 Quantity: *${orderSuccessData.quantity} ${orderSuccessData.unit}*\n💰 Total Amount: *Rs. ${orderSuccessData.totalAmount}*\n🆔 Order ID: *#${orderSuccessData.orderId.slice(-6)}*\n\nPlease confirm my order. Thank you!`
                        );
                        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
                      }}
                      className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.411 1.453 5.376.002 9.748-4.37 9.752-9.75.002-2.607-1.013-5.059-2.859-6.907C17.067 2.1 14.622.983 12.008.983c-5.385 0-9.758 4.371-9.762 9.753-.001 1.884.492 3.73 1.428 5.346l-.995 3.635 3.72-.976zm12.39-5.187c-.302-.152-1.793-.885-2.071-.986-.279-.101-.482-.152-.684.152-.201.304-.778.986-.954 1.189-.176.203-.351.229-.653.077-.302-.152-1.276-.47-2.43-1.499-.899-.802-1.505-1.792-1.682-2.096-.177-.304-.019-.469.132-.619.136-.134.302-.354.453-.531.152-.177.202-.304.302-.507.101-.202.05-.38-.025-.531-.076-.152-.684-1.648-.938-2.259-.247-.597-.5-.516-.684-.526-.177-.01-.38-.01-.583-.01-.202 0-.531.077-.811.38-.279.304-1.064 1.039-1.064 2.533 0 1.494 1.089 2.939 1.241 3.142.152.202 2.144 3.273 5.193 4.59.724.314 1.29.502 1.733.643.729.23 1.391.199 1.916.121.584-.087 1.794-.734 2.047-1.443.254-.709.254-1.317.177-1.443-.077-.126-.279-.203-.583-.354z"/>
                      </svg>
                      <span>Notify Farmer on WhatsApp</span>
                    </button>
                    
                    <button
                      onClick={() => setIsOrderModalOpen(false)}
                      className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 text-xs transition-colors"
                    >
                      Close Dashboard Window
                    </button>
                  </div>
                </div>
              ) : (
                // Standard order input screen
                <div className="space-y-4">
                  {/* Selected Product Card */}
                  <div className="glass-panel p-4 rounded-xl flex gap-3 bg-gray-50 border border-gray-200">
                    {selectedOrderProduct.imageUrls?.[0] ? (
                      <img
                        src={selectedOrderProduct.imageUrls[0]}
                        alt={selectedOrderProduct.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-green-700">
                        <span className="material-symbols-outlined text-2xl">eco</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{selectedOrderProduct.name}</h4>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">{selectedOrderProduct.category}</p>
                      <p className="text-xs text-green-700 font-bold mt-1">Rs. {selectedOrderProduct.pricePerUnit} / {selectedOrderProduct.unit || "kg"}</p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Select Quantity ({selectedOrderProduct.unit || "kg"})</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center font-bold text-lg text-green-700 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedOrderProduct.quantityAvailable}
                        value={orderQuantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOrderQuantity(Math.min(selectedOrderProduct.quantityAvailable, Math.max(1, val)));
                        }}
                        className="flex-1 h-10 bg-white border border-gray-200 rounded-xl text-center text-xs text-gray-900 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(q => Math.min(selectedOrderProduct.quantityAvailable, q + 1))}
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center font-bold text-lg text-green-700 active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                    <span className="block text-[9px] text-green-800 text-right">Available Stock: {selectedOrderProduct.quantityAvailable} {selectedOrderProduct.unit || "kg"}</span>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setOrderPaymentMode("cod")}
                        className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                          orderPaymentMode === "cod"
                            ? "bg-green-50 border-green-600 text-green-900"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-bold text-xs block">COD</span>
                        <span className="text-[9px] opacity-75">Cash on Delivery</span>
                      </div>
                      <div
                        onClick={() => setOrderPaymentMode("upi")}
                        className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                          orderPaymentMode === "upi"
                            ? "bg-green-50 border-green-600 text-green-900"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-bold text-xs block">UPI</span>
                        <span className="text-[9px] opacity-75">Scan & Pay</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Note */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Delivery Note (Optional)</label>
                    <textarea
                      value={orderDeliveryNote}
                      onChange={(e) => setOrderDeliveryNote(e.target.value)}
                      placeholder="Add instructions, preferred delivery times, or packaging requests..."
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:ring-1 focus:ring-green-600 focus:border-green-600 placeholder:opacity-50 resize-none outline-none"
                    />
                  </div>

                  {/* Dynamic Total & Confirmation */}
                  <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs text-gray-500">Total Amount:</span>
                      <span className="text-sm font-bold text-green-700 font-mono">Rs. {orderQuantity * selectedOrderProduct.pricePerUnit}</span>
                    </div>
                    
                    <button
                      onClick={confirmOrder}
                      disabled={orderQuantity <= 0 || orderQuantity > selectedOrderProduct.quantityAvailable}
                      className="w-full rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold py-3 text-xs transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Confirm & Place Order</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nav-item w-full ${active ? "active" : ""}`}
    >
      <span
        className="material-symbols-outlined text-base"
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-600" />
      )}
    </button>
  );
}

function RecoCard({
  title,
  match,
  yieldText,
}: {
  title: string;
  match: string;
  yieldText: string;
}) {
  return (
    <article className="glass-card rounded-xl p-4 flex flex-col justify-between">
      <div className="mb-2 flex items-start justify-between">
        <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] text-green-800 font-semibold">{match}</span>
      </div>
      <h4 className="text-xs font-bold text-gray-900">{title}</h4>
      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
        Optimized using current moisture, pH, and weather telemetry.
      </p>
      <p className="mt-2 text-xs font-bold text-green-600">Est. Yield: {yieldText}</p>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
      />
    </div>
  );
}

function fileToDataUrl(_file: File): Promise<string> {
  // Kept as a stub — actual uploads now go through /api/upload → Cloudinary
  return Promise.resolve("");
}


/* ══════════════════════════════════════════
   AI SYNC INFO PAGE
══════════════════════════════════════════ */
function AiSyncSection() {
  const models = [
    {
      name: "DeepSeek V4 Flash",
      provider: "OpenRouter / DeepSeek",
      icon: "psychology",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      badge: "Active",
      badgeColor: "badge-green",
      desc: "Primary AI model powering NexGro's agricultural intelligence. Optimized for fast, accurate farming advice, crop analysis, and market predictions.",
      capabilities: ["Crop disease diagnosis", "Soil health recommendations", "Market price forecasting", "Weather-based farming advice", "Multilingual support (Tamil, Malayalam, English)"],
      context: "128K tokens",
      speed: "~1.2s avg response",
      accuracy: "98.4% confidence",
    },
    {
      name: "NexGro Fallback AI",
      provider: "Built-in Expert System",
      icon: "hub",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      badge: "Standby",
      badgeColor: "badge-yellow",
      desc: "Offline-capable expert system that activates when the primary AI is unavailable. Pre-trained on Kerala and South India agricultural data.",
      capabilities: ["Offline crop advice", "Basic soil pH guidance", "Seasonal crop calendar", "Pest identification", "Irrigation scheduling"],
      context: "Local knowledge base",
      speed: "Instant (offline)",
      accuracy: "Expert-curated data",
    },
    {
      name: "Voice AI Engine",
      provider: "Web Speech API",
      icon: "mic",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      badge: "Browser",
      badgeColor: "badge-blue",
      desc: "Browser-native voice recognition for hands-free farming queries. Supports Tamil, Malayalam, and English voice input across all AI features.",
      capabilities: ["Tamil voice input (ta-IN)", "Malayalam voice input (ml-IN)", "English voice input (en-IN)", "Real-time transcription", "Soil test voice queries"],
      context: "Real-time audio",
      speed: "Real-time",
      accuracy: "Browser dependent",
    },
  ];

  const features = [
    { icon: "agriculture",   title: "Crop Intelligence",    desc: "AI-powered crop selection, disease detection, and yield optimization based on your region and soil type." },
    { icon: "water_drop",    title: "Soil Analysis",        desc: "Real-time soil health monitoring with pH correction, nutrient recommendations, and fertilizer guidance." },
    { icon: "trending_up",   title: "Market Predictions",   desc: "Price forecasting and demand analysis for crops in Kerala and South India markets." },
    { icon: "cloud",         title: "Weather Integration",  desc: "Weather-aware farming advice including irrigation scheduling and harvest timing." },
    { icon: "language",      title: "Multilingual",         desc: "Full support for Tamil, Malayalam, and English — voice and text." },
    { icon: "offline_bolt",  title: "Offline Fallback",     desc: "Expert system ensures AI advice is always available, even without internet." },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-700 to-green-800 p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <span className="material-symbols-outlined text-2xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">NexGro AI Sync</h2>
            <p className="text-green-200 text-sm">Agricultural Intelligence Platform</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
            All Systems Online
          </span>
        </div>
        <p className="text-green-100 text-sm leading-relaxed">
          NexGro AI Sync connects your farm data to powerful AI models trained on agricultural knowledge.
          Get instant advice on crops, soil, weather, and markets — in your language, on any device.
        </p>
      </div>

      {/* AI Models */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">AI Models</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {models.map((model) => (
            <div key={model.name} className={`rounded-2xl border-2 p-5 ${model.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm`}>
                  <span className={`material-symbols-outlined text-xl ${model.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{model.icon}</span>
                </div>
                <span className={`badge ${model.badgeColor}`}>{model.badge}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">{model.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{model.provider}</p>
              <p className="text-xs text-gray-700 mt-2 leading-relaxed">{model.desc}</p>
              <div className="mt-3 space-y-1">
                {model.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span className="material-symbols-outlined text-xs text-green-600">check_circle</span>
                    {cap}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/60 pt-3">
                {[
                  { label: "Context", value: model.context },
                  { label: "Speed",   value: model.speed },
                  { label: "Quality", value: model.accuracy },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">{s.label}</p>
                    <p className="text-[10px] font-bold text-gray-700 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">What AI Sync Can Do</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <span className="material-symbols-outlined text-base text-green-700" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage tip */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-xl text-blue-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <div>
          <p className="text-sm font-bold text-blue-800">How to use AI Sync</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Click the green <strong>AI chat button</strong> (bottom-right of any page) to start a conversation.
            For soil-specific advice, go to <strong>Soil Test → Soil Types</strong> and click "Ask AI About This Soil".
            Voice input is available in Tamil, Malayalam, and English.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SETTINGS / PROFILE PAGE
══════════════════════════════════════════ */
function SettingsSection({ user }: { user: SessionUser | null }) {
  const [editing, setEditing] = useState(false);
  const [name,     setName]     = useState(user?.fullName ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [lang,     setLang]     = useState(user?.preferredLanguage ?? "en");
  const [saved,    setSaved]    = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // In a real app this would call PATCH /api/users/me
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initial = user?.fullName?.charAt(0).toUpperCase() ?? "?";
  const roleColors: Record<string, string> = {
    farmer: "bg-green-100 text-green-800 border-green-200",
    buyer:  "bg-blue-100 text-blue-800 border-blue-200",
    admin:  "bg-purple-100 text-purple-800 border-purple-200",
  };
  const roleColor = roleColors[user?.role ?? "buyer"] ?? roleColors.buyer;

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      {/* Profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 text-2xl font-bold text-white shadow-md">
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName ?? "—"}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`badge border text-xs ${roleColor}`}>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
              </span>
              {user?.location && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {user.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{editing ? "close" : "edit"}</span>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Info grid */}
        {!editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: "person",    label: "Full Name",          value: user?.fullName ?? "—" },
              { icon: "badge",     label: "Role",               value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—" },
              { icon: "language",  label: "Preferred Language", value: user?.preferredLanguage === "ta" ? "Tamil (தமிழ்)" : user?.preferredLanguage === "ml" ? "Malayalam (മലയാളം)" : "English" },
              { icon: "location_on", label: "Location",         value: user?.location ?? "Not set" },
              { icon: "verified",  label: "Account Status",     value: "Active" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <span className="material-symbols-outlined text-base text-green-600 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kanthalloor, Idukki"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Preferred Language</label>
              <select value={lang} onChange={(e) => setLang(e.target.value as "ta"|"ml"|"en")}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100">
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="en">English</option>
              </select>
            </div>
            <button type="submit"
              className="flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800 transition-colors">
              <span className="material-symbols-outlined text-base">save</span>
              Save Changes
            </button>
          </form>
        )}

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Profile updated successfully.
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3">
          {[
            { icon: "security",    label: "Password",        value: "••••••••",        action: "Change" },
            { icon: "notifications", label: "Notifications", value: "SMS & App alerts", action: "Manage" },
            { icon: "language",    label: "Language",        value: lang === "ta" ? "Tamil" : lang === "ml" ? "Malayalam" : "English", action: "Change" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base text-gray-500">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.value}</p>
                </div>
              </div>
              <button className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors">{item.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h3 className="text-sm font-bold text-red-800 mb-1">Danger Zone</h3>
        <p className="text-xs text-red-600 mb-3">These actions are permanent and cannot be undone.</p>
        <button className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors">
          <span className="material-symbols-outlined text-sm">delete_forever</span>
          Delete Account
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LIVE OVERVIEW COMPONENT
══════════════════════════════════════════ */
type LiveOverviewProps = {
  currentUser: SessionUser | null;
  products: Array<{ _id: string; name: string; pricePerUnit: number; quantityAvailable: number; category: string }>;
  marketProducts: Array<{ _id: string; name: string; pricePerUnit: number }>;
  farmerOrders: Array<{ _id: string; totalAmount: number; status: string; createdAt?: string; items?: Array<{ productName: string }> }>;
};

function LiveOverview({ currentUser, products, marketProducts, farmerOrders }: LiveOverviewProps) {
  const isFarmer = currentUser?.role === "farmer";

  // ── Live calculations ──
  const totalRevenue   = farmerOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const pendingOrders  = farmerOrders.filter((o) => o.status === "pending").length;
  const completedOrders = farmerOrders.filter((o) => o.status === "delivered").length;
  const activeProducts = products.filter((p) => (p as unknown as { status?: string }).status === "active" || true).length;

  // ── Animated counter hook ──
  function useCounter(target: number, duration = 1200) {
    const [val, setVal] = useState(0);
    useEffect(() => {
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }, [target, duration]);
    return val;
  }

  const animRevenue  = useCounter(totalRevenue);
  const animOrders   = useCounter(farmerOrders.length);
  const animProducts = useCounter(activeProducts);
  const animPending  = useCounter(pendingOrders);

  // ── Build chart data from real orders (last 7 days) ──
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const ordersByDay = days.map((day) => ({
      day: day.slice(5),
      orders:  farmerOrders.filter((o) => (o.createdAt ?? "").slice(0, 10) === day).length,
      revenue: farmerOrders.filter((o) => (o.createdAt ?? "").slice(0, 10) === day).reduce((s, o) => s + (o.totalAmount ?? 0), 0),
    }));
    // Normalise to 0–100 for SVG
    const maxOrders  = Math.max(...ordersByDay.map((d) => d.orders),  1);
    const maxRevenue = Math.max(...ordersByDay.map((d) => d.revenue), 1);
    return ordersByDay.map((d) => ({
      ...d,
      orderPct:   100 - (d.orders  / maxOrders)  * 80,
      revenuePct: 100 - (d.revenue / maxRevenue) * 80,
    }));
  }, [farmerOrders]);

  // ── SVG path builder ──
  function buildPath(points: number[], xStep: number) {
    return points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * xStep},${y}`).join(" ");
  }
  const xStep = chartData.length > 1 ? 100 / (chartData.length - 1) : 50;
  const orderPath   = buildPath(chartData.map((d) => d.orderPct),   xStep);
  const revenuePath = buildPath(chartData.map((d) => d.revenuePct), xStep);
  const areaPath    = `${orderPath} L 100,100 L 0,100 Z`;

  // ── Animated line draw ──
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 100); return () => clearTimeout(t); }, []);

  // ── Tooltip ──
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: string; orders: number; revenue: number } | null>(null);

  const stats = isFarmer
    ? [
        { label: "Active Listings",  value: animProducts, suffix: "",    icon: "eco",            color: "text-green-700",  bg: "bg-green-50",  trend: "+2 this week" },
        { label: "Total Orders",     value: animOrders,   suffix: "",    icon: "local_shipping", color: "text-blue-600",   bg: "bg-blue-50",   trend: `${pendingOrders} pending` },
        { label: "Total Revenue",    value: animRevenue,  suffix: "Rs.", icon: "payments",       color: "text-emerald-600",bg: "bg-emerald-50",trend: `${completedOrders} delivered` },
        { label: "Pending Orders",   value: animPending,  suffix: "",    icon: "pending",        color: "text-orange-600", bg: "bg-orange-50", trend: "Needs attention" },
      ]
    : [
        { label: "Available Crops",  value: marketProducts.length, suffix: "", icon: "storefront",     color: "text-green-700",  bg: "bg-green-50",  trend: "Live market" },
        { label: "My Orders",        value: animOrders,            suffix: "", icon: "shopping_basket",color: "text-blue-600",   bg: "bg-blue-50",   trend: `${pendingOrders} pending` },
        { label: "Total Spent",      value: animRevenue,           suffix: "Rs.", icon: "payments",    color: "text-emerald-600",bg: "bg-emerald-50",trend: "All time" },
        { label: "Delivered",        value: completedOrders,       suffix: "", icon: "check_circle",   color: "text-teal-600",   bg: "bg-teal-50",   trend: "Completed" },
      ];

  return (
    <div className="space-y-5 fade-in">
      {/* ── Live stat cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <span className={`material-symbols-outlined text-base ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 font-[var(--font-poppins)]">
              {s.suffix && <span className="text-sm font-semibold text-gray-500 mr-0.5">{s.suffix}</span>}
              {s.value.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-green-600">trending_up</span>
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      {/* ── Live animated chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Crop Performance Analytics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Orders & revenue — last 7 days (live)</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-700">LIVE</span>
            </div>
          </div>

          {/* SVG Chart */}
          <div
            className="relative h-52 w-full rounded-xl bg-gradient-to-b from-green-50/60 to-white border border-gray-100 overflow-hidden"
            onMouseLeave={() => setTooltip(null)}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.3" />
              ))}
              {/* Area fill */}
              <path d={areaPath} fill="url(#areaGrad)"
                style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.8s ease" }} />
              {/* Orders line */}
              <path d={orderPath} fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: drawn ? 0 : 200,
                  transition: "stroke-dashoffset 1.2s ease",
                }} />
              {/* Revenue line */}
              <path d={revenuePath} fill="none" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"
                style={{
                  strokeDasharray: drawn ? "2 2" : "200",
                  strokeDashoffset: drawn ? 0 : 200,
                  transition: "stroke-dashoffset 1.4s ease",
                }} />
              {/* Data points + hover zones */}
              {chartData.map((d, i) => (
                <g key={i}>
                  <circle cx={i * xStep} cy={d.orderPct} r="1.5" fill="#16a34a"
                    style={{ opacity: drawn ? 1 : 0, transition: `opacity 0.3s ease ${0.8 + i * 0.1}s` }} />
                  <rect
                    x={i * xStep - 5} y={0} width={10} height={100}
                    fill="transparent"
                    onMouseEnter={() => setTooltip({ x: i * xStep, y: d.orderPct, day: d.day, orders: d.orders, revenue: d.revenue })}
                  />
                </g>
              ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs"
                style={{ left: `${Math.min(tooltip.x, 80)}%`, top: `${Math.max(tooltip.y - 20, 5)}%`, transform: "translateX(-50%)" }}
              >
                <p className="font-bold text-gray-700">{tooltip.day}</p>
                <p className="text-green-700">Orders: <span className="font-bold">{tooltip.orders}</span></p>
                <p className="text-emerald-600">Revenue: <span className="font-bold">Rs. {tooltip.revenue.toLocaleString("en-IN")}</span></p>
              </div>
            )}

            {/* X-axis labels */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2">
              {chartData.map((d, i) => (
                <span key={i} className="text-[8px] text-gray-400">{d.day}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-5 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              <span className="text-xs text-gray-600">Orders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <span className="text-xs text-gray-600">Revenue trend</span>
            </div>
            <span className="ml-auto text-[10px] text-gray-400">Updates every 30s</span>
          </div>
        </div>

        {/* Recent orders panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-3">
            {isFarmer ? "Recent Sales Orders" : "My Recent Orders"}
          </h3>
          {farmerOrders.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-3xl text-gray-300">inbox</span>
              <p className="mt-2 text-xs text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto max-h-52">
              {farmerOrders.slice(0, 8).map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {order.items?.[0]?.productName ?? "Order"}
                    </p>
                    <p className="text-[10px] text-gray-400">#{order._id.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-green-700">Rs. {(order.totalAmount ?? 0).toLocaleString("en-IN")}</p>
                    <span className={`text-[9px] font-bold uppercase ${
                      order.status === "delivered" ? "text-green-600" :
                      order.status === "pending"   ? "text-orange-500" :
                      order.status === "cancelled" ? "text-red-500" : "text-blue-600"
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{farmerOrders.length}</p>
              <p className="text-[9px] text-gray-400 uppercase">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-500">{pendingOrders}</p>
              <p className="text-[9px] text-gray-400 uppercase">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{completedOrders}</p>
              <p className="text-[9px] text-gray-400 uppercase">Done</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Schemes & Insurance Section
// ─────────────────────────────────────────────
const GOVT_SCHEMES = [
  {
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    description: "Direct income support of ₹6,000/year in 3 installments to all eligible farmer families across India.",
    benefits: ["₹6,000/year direct bank transfer", "3 installments of ₹2,000 each", "Covers all small & marginal farmers"],
    eligibility: "All landholding farmer families with cultivable land",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    url: "https://pmkisan.gov.in",
    color: "from-green-500 to-emerald-600",
    icon: "payments",
    tag: "Income Support",
  },
  {
    name: "PMFBY",
    fullName: "PM Fasal Bima Yojana",
    description: "Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events.",
    benefits: ["Low premium: 2% for Kharif, 1.5% for Rabi", "Full sum insured coverage", "Post-harvest loss coverage", "Localized calamity coverage"],
    eligibility: "All farmers growing notified crops in notified areas",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    url: "https://pmfby.gov.in",
    color: "from-blue-500 to-blue-700",
    icon: "shield",
    tag: "Crop Insurance",
  },
  {
    name: "KCC",
    fullName: "Kisan Credit Card Scheme",
    description: "Provides farmers with affordable short-term credit for agricultural and allied activities. Covers crop production, post-harvest expenses, and maintenance needs.",
    benefits: ["Credit up to ₹3 lakh at 4% interest", "Flexible repayment", "Covers ancillary activities", "ATM-enabled RuPay card"],
    eligibility: "Farmers, tenant farmers, sharecroppers, SHG/JLG members",
    ministry: "Ministry of Finance / NABARD",
    url: "https://www.nabard.org/content1.aspx?id=572",
    color: "from-purple-500 to-violet-700",
    icon: "credit_card",
    tag: "Credit",
  },
  {
    name: "PMKSY",
    fullName: "PM Krishi Sinchayee Yojana",
    description: "Ensures water access to every farm and improves water use efficiency — 'Har Khet Ko Pani, More Crop Per Drop'.",
    benefits: ["Drip & sprinkler irrigation subsidy up to 55%", "Watershed development", "Command area development", "Groundwater development"],
    eligibility: "All farmers; SC/ST/small/marginal get higher subsidy",
    ministry: "Ministry of Jal Shakti",
    url: "https://pmksy.gov.in",
    color: "from-cyan-500 to-teal-600",
    icon: "water_drop",
    tag: "Irrigation",
  },
  {
    name: "eNAM",
    fullName: "National Agriculture Market",
    description: "Pan-India electronic trading portal for agricultural commodities linking APMCs to create a unified national market.",
    benefits: ["Online bidding for best price", "Real-time price transparency", "Direct payment to farmers", "585+ markets connected"],
    eligibility: "All farmers registered with local APMC",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    url: "https://enam.gov.in",
    color: "from-orange-500 to-amber-600",
    icon: "storefront",
    tag: "Market Access",
  },
  {
    name: "RKVY",
    fullName: "Rashtriya Krishi Vikas Yojana",
    description: "Provides flexibility and autonomy to states to plan & execute schemes for farmers based on local agri-climate conditions and state priorities.",
    benefits: ["Infrastructure support", "Crop diversification grants", "Value chain development", "Agri-entrepreneur support"],
    eligibility: "State governments / farmer groups as per state plans",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    url: "https://rkvy.nic.in",
    color: "from-rose-500 to-pink-600",
    icon: "agriculture",
    tag: "Development",
  },
];

const INSURANCE_PLANS = [
  {
    name: "PMFBY – Kharif",
    provider: "Government of India",
    premium: "2% of Sum Insured",
    coverage: "Crop failure due to drought, flood, pest, disease",
    sumInsured: "Up to district-level threshold yield × MSP",
    claimProcess: "Auto-triggered by satellite/yield data",
    url: "https://pmfby.gov.in",
    color: "border-blue-300 bg-blue-50",
    tag: "Kharif Season",
  },
  {
    name: "PMFBY – Rabi",
    provider: "Government of India",
    premium: "1.5% of Sum Insured",
    coverage: "Winter crop loss including unseasonal rainfall",
    sumInsured: "Based on scale of finance × area",
    claimProcess: "Crop Cutting Experiments (CCE) + satellite",
    url: "https://pmfby.gov.in",
    color: "border-indigo-300 bg-indigo-50",
    tag: "Rabi Season",
  },
  {
    name: "RWBCIS",
    provider: "Government + Insurance Companies",
    premium: "2% Kharif / 1.5% Rabi",
    coverage: "Adverse weather: rainfall, temperature, humidity",
    sumInsured: "Based on crop type & district",
    claimProcess: "Triggered by IMD weather station data automatically",
    url: "https://pmfby.gov.in/rbwcis",
    color: "border-cyan-300 bg-cyan-50",
    tag: "Weather Based",
  },
  {
    name: "LIC Jeevan Shanthi (Farmer Plan)",
    provider: "Life Insurance Corporation of India",
    premium: "Variable – based on age & sum",
    coverage: "Life cover + annuity for farmer family security",
    sumInsured: "₹1 lakh to ₹unlimited",
    claimProcess: "Online / branch claim submission",
    url: "https://licindia.in",
    color: "border-purple-300 bg-purple-50",
    tag: "Life Cover",
  },
  {
    name: "AIC Varsha Bima",
    provider: "Agriculture Insurance Company of India",
    premium: "Actuary-determined per district",
    coverage: "Rainfall deficit / excess rainfall index-based",
    sumInsured: "District-level sum insured",
    claimProcess: "IMD rainfall data triggers automatic payout",
    url: "https://www.aicofindia.com",
    color: "border-teal-300 bg-teal-50",
    tag: "Rainfall Index",
  },
  {
    name: "NIA Krishi Raksha",
    provider: "National Insurance Company",
    premium: "0.5% – 3% based on crop & risk",
    coverage: "Fire, flood, hailstorm, landslide, pest damage",
    sumInsured: "Up to ₹50 lakh per crop",
    claimProcess: "Survey + documents + bank credit in 30 days",
    url: "https://www.nationalinsurance.nic.co.in",
    color: "border-orange-300 bg-orange-50",
    tag: "Comprehensive",
  },
];

function SchemesInsuranceSection({ authHeaders }: { authHeaders: () => HeadersInit }) {
  const [schemeMessages, setSchemeMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "🌾 **NexGro Schemes & Insurance AI** ready!\n\nI can help you with:\n• **Government Schemes** – PM-KISAN, PMFBY, KCC, PMKSY, eNAM, RKVY\n• **Crop Insurance** – Kharif/Rabi plans, weather-based insurance, LIC plans\n• **Eligibility & Application** – How to apply, documents needed\n• **Claim Process** – Step-by-step claim guidance\n\nAsk me anything about farmer schemes or insurance!"
    }
  ]);
  const [schemeInput, setSchemeInput] = useState("");
  const [isSchemeAiThinking, setIsSchemeAiThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<"schemes" | "insurance">("schemes");

  async function sendSchemeMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!schemeInput.trim() || isSchemeAiThinking) return;

    const userText = schemeInput;
    const updatedMessages = [...schemeMessages, { sender: "user" as const, text: userText }];
    setSchemeMessages(updatedMessages);
    setSchemeInput("");
    setIsSchemeAiThinking(true);

    try {
      const response = await fetch("/api/ai/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("AI API failed");
      const result = await response.json();
      if (result.success && result.text) {
        setSchemeMessages(prev => [...prev, { sender: "ai", text: result.text }]);
      } else {
        throw new Error("Empty response");
      }
    } catch {
      // Fallback: answer from built-in knowledge
      const fallback = generateSchemeFallback(userText);
      setSchemeMessages(prev => [...prev, { sender: "ai", text: fallback }]);
    } finally {
      setIsSchemeAiThinking(false);
    }
  }

  function generateSchemeFallback(question: string): string {
    const q = question.toLowerCase();

    if (q.includes("pm-kisan") || q.includes("pmkisan") || q.includes("kisan samman")) {
      return `**PM-KISAN – Pradhan Mantri Kisan Samman Nidhi**\n\n**Benefit:** ₹6,000/year in 3 installments of ₹2,000 each, directly to bank account.\n\n**Eligibility:**\n• All landholding farmer families\n• Must have cultivable land in their name\n• Institutional landholders excluded\n\n**How to Apply:**\n1. Visit pmkisan.gov.in\n2. Click "New Farmer Registration"\n3. Enter Aadhaar, bank details, land records\n4. Village Patwari / Agriculture officer verifies\n\n**Documents:** Aadhaar card, land records (Khasra/Khatauni), bank passbook\n\n🔗 Official Website: https://pmkisan.gov.in`;
    }

    if (q.includes("pmfby") || q.includes("fasal bima") || q.includes("crop insurance")) {
      return `**PMFBY – Pradhan Mantri Fasal Bima Yojana**\n\n**Premium Rates:**\n• Kharif crops: **2%** of sum insured\n• Rabi crops: **1.5%** of sum insured\n• Horticulture/Commercial: **5%** of sum insured\n\n**Coverage:**\n• Natural fire, lightning, storm, hailstorm, flood\n• Pest, disease, drought, dry spells\n• Post-harvest losses (up to 14 days)\n• Localized calamities (landslide, inundation)\n\n**How to Apply:**\n1. Visit pmfby.gov.in or nearest CSC/bank\n2. Enroll before cut-off date (varies by crop)\n3. Submit: Aadhaar, bank details, land records, crop sowing certificate\n\n**Claim:** Auto-triggered by satellite data or Crop Cutting Experiments (CCE)\n\n🔗 Official Website: https://pmfby.gov.in`;
    }

    if (q.includes("kcc") || q.includes("kisan credit")) {
      return `**KCC – Kisan Credit Card Scheme**\n\n**Benefits:**\n• Credit up to **₹3 lakh at 4% interest** (after 3% government subsidy)\n• Covers crop production, post-harvest, maintenance\n• Flexible withdrawal & repayment\n• RuPay ATM-enabled card issued\n\n**Eligibility:**\n• All farmers (owner/tenant/sharecropper)\n• Fishermen & animal husbandry farmers also eligible\n• SHG/JLG members\n\n**How to Apply:**\n1. Visit nearest bank branch (SBI, cooperative banks, regional rural banks)\n2. Fill KCC application form\n3. Submit land records, identity proof, passport photo\n4. Bank assesses credit limit based on land area & crops\n\n🔗 More Info: https://www.nabard.org`;
    }

    if (q.includes("pmksy") || q.includes("irrigation") || q.includes("drip") || q.includes("sinchayee")) {
      return `**PMKSY – Pradhan Mantri Krishi Sinchayee Yojana**\n\n**Mission:** "Har Khet Ko Pani, More Crop Per Drop"\n\n**Key Benefits:**\n• **55% subsidy** on drip/sprinkler irrigation for general\n• **SC/ST/Small farmers** get up to **65% subsidy**\n• Watershed development support\n• Groundwater recharge schemes\n\n**Components:**\n• AIBP – Accelerated Irrigation Benefits Programme\n• HAR KHET KO PANI – Field level water access\n• PER DROP MORE CROP – Micro-irrigation\n• WATERSHED DEVELOPMENT – Soil-water conservation\n\n**How to Apply:**\n• Contact District Agriculture Officer\n• Visit pmksy.gov.in for state-wise portals\n\n🔗 Official Website: https://pmksy.gov.in`;
    }

    if (q.includes("enam") || q.includes("national agriculture market") || q.includes("mandi")) {
      return `**eNAM – National Agriculture Market**\n\n**What it is:** Pan-India electronic trading portal connecting 585+ mandis for transparent price discovery.\n\n**Benefits for Farmers:**\n• Online bidding → best possible price\n• No middlemen pressure\n• Direct payment to bank account within 24 hours\n• Real-time price data for 150+ commodities\n\n**How to Register:**\n1. Visit enam.gov.in\n2. Register with APMC Mandi where your land is located\n3. Get login credentials\n4. List your produce online\n\n**Documents:** Aadhaar, bank account, land record, APMC license\n\n🔗 Official Portal: https://enam.gov.in`;
    }

    if (q.includes("rkvy") || q.includes("rashtriya krishi")) {
      return `**RKVY – Rashtriya Krishi Vikas Yojana**\n\n**Purpose:** Empower states to boost agricultural investment & infrastructure based on local needs.\n\n**Key Focus Areas:**\n• Crop diversification & area expansion\n• Agri-infrastructure (storage, cold chain)\n• Value chain development\n• Farmer producer organizations (FPOs)\n• Agri-entrepreneurship & startups\n\n**Who Benefits:**\n• Individual farmers via state schemes\n• Farmer groups & cooperatives\n• Agri startups (RAFTAAR programme)\n\n**RAFTAAR Programme:** ₹25 lakh grant for agri-startups under RKVY\n\n🔗 Official Website: https://rkvy.nic.in`;
    }

    if (q.includes("insurance") || q.includes("bima") || q.includes("claim")) {
      return `**Farmer Insurance Options in India**\n\n**1. PMFBY (Government)**\n• Kharif: 2% premium | Rabi: 1.5% premium\n• Covers natural calamities, pest, disease\n• 🔗 https://pmfby.gov.in\n\n**2. RWBCIS – Weather Based**\n• Triggered by IMD weather station data\n• No need to prove crop damage\n• 🔗 https://pmfby.gov.in/rbwcis\n\n**3. AIC Varsha Bima**\n• Rainfall index-based automatic payout\n• 🔗 https://www.aicofindia.com\n\n**4. NIA Krishi Raksha**\n• Covers fire, flood, hailstorm, pest\n• Up to ₹50 lakh per crop\n• 🔗 https://www.nationalinsurance.nic.co.in\n\n**5. LIC Jeevan Shanthi**\n• Life cover + pension for farmer family\n• 🔗 https://licindia.in\n\n**To Claim Insurance:**\n1. Inform bank/insurance company within 72 hours of damage\n2. Take photos/videos of crop damage\n3. Submit claim form + Aadhaar + land records\n4. Survey by insurance company\n5. Amount credited to bank in 30-45 days`;
    }

    if (q.includes("apply") || q.includes("eligibility") || q.includes("document")) {
      return `**General Eligibility & Application Guide for Farmer Schemes**\n\n**Common Documents Required:**\n• Aadhaar Card (mandatory for all schemes)\n• Bank Passbook / Account Details\n• Land Records (Khasra/Khatauni/Patta)\n• Caste Certificate (for SC/ST benefits)\n• Mobile number linked to Aadhaar\n\n**Where to Apply:**\n• **Online:** Official scheme portals (pmkisan.gov.in, pmfby.gov.in)\n• **CSC (Jan Seva Kendra):** Common Service Centres in your village\n• **Bank Branch:** For KCC, insurance enrollments\n• **Agriculture Department Office:** District/Block level\n• **Gram Panchayat / Village Level Entrepreneur (VLE)**\n\n**Helpline Numbers:**\n• PM-KISAN Helpline: **155261 / 011-23381092**\n• PMFBY Helpline: **1800-180-1551** (Toll Free)\n• General Kisan Call Centre: **1800-180-1551**`;
    }

    return `🌾 **NexGro Schemes & Insurance Assistant**\n\nI can provide detailed information about:\n\n**Government Schemes:**\n• PM-KISAN – ₹6,000/year income support\n• PMFBY – Crop insurance at low premium\n• KCC – Kisan Credit Card at 4% interest\n• PMKSY – Irrigation subsidy up to 65%\n• eNAM – National Agriculture Market\n• RKVY – State agricultural development\n\n**Insurance Plans:**\n• PMFBY Kharif/Rabi crop insurance\n• Weather-based (RWBCIS) insurance\n• AIC Varsha Bima (rainfall index)\n• NIA Krishi Raksha (comprehensive)\n• LIC life cover for farmers\n\nAsk me: "How to apply for PM-KISAN?" or "What does PMFBY cover?" or "How to claim crop insurance?"`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Farmer Schemes & Insurance</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Government welfare schemes, crop insurance plans & official portals — all in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("schemes")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "schemes" ? "bg-green-700 text-white shadow" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <span className="material-symbols-outlined text-xs mr-1" style={{ verticalAlign: "middle" }}>volunteer_activism</span>
              Govt Schemes
            </button>
            <button
              onClick={() => setActiveTab("insurance")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "insurance" ? "bg-blue-700 text-white shadow" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <span className="material-symbols-outlined text-xs mr-1" style={{ verticalAlign: "middle" }}>shield</span>
              Insurance Plans
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: Scheme / Insurance Cards */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === "schemes" && (
            <>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-1">
                🇮🇳 Government Welfare Schemes
              </h3>
              {GOVT_SCHEMES.map((scheme) => (
                <div key={scheme.name} className="glass-card rounded-xl border border-gray-200 hover:border-green-300 transition-all overflow-hidden">
                  {/* Coloured top bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${scheme.color}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${scheme.color} shadow-sm shrink-0`}>
                          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{scheme.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900">{scheme.name}</h4>
                            <span className="text-[9px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase">{scheme.tag}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{scheme.fullName}</p>
                        </div>
                      </div>
                      <a
                        href={scheme.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 text-[10px] font-bold text-green-700 transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        Official Site
                      </a>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{scheme.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Key Benefits</p>
                        <ul className="space-y-1">
                          {scheme.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-700">
                              <span className="material-symbols-outlined text-green-600 text-xs mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400 mb-1">Eligibility</p>
                          <p className="text-[10px] text-blue-800">{scheme.eligibility}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ministry</p>
                          <p className="text-[10px] text-gray-700">{scheme.ministry}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "insurance" && (
            <>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-1">
                🛡️ Crop & Farmer Insurance Plans
              </h3>
              {INSURANCE_PLANS.map((plan) => (
                <div key={plan.name} className={`rounded-xl border-2 ${plan.color} p-5 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900">{plan.name}</h4>
                        <span className="text-[9px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">{plan.tag}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{plan.provider}</p>
                    </div>
                    <a
                      href={plan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Apply / Know More
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Premium", value: plan.premium, icon: "percent" },
                      { label: "Sum Insured", value: plan.sumInsured, icon: "account_balance_wallet" },
                      { label: "Coverage", value: plan.coverage, icon: "verified_user" },
                      { label: "Claim Process", value: plan.claimProcess, icon: "assignment_turned_in" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-white/70 border border-white p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-gray-400 text-xs">{item.icon}</span>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                        </div>
                        <p className="text-[10px] text-gray-800 leading-snug">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Helpline box */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-amber-600">call</span>
                  <h4 className="text-sm font-bold text-amber-800">Insurance & Scheme Helplines</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900">
                  <div>📞 PM-KISAN Helpline: <strong>155261</strong></div>
                  <div>📞 PMFBY Helpline: <strong>1800-180-1551</strong></div>
                  <div>📞 Kisan Call Centre: <strong>1800-180-1551</strong></div>
                  <div>📞 NABARD: <strong>022-26539895</strong></div>
                  <div>📞 AIC of India: <strong>1800-116-515</strong></div>
                  <div>📞 LIC Farmer Plans: <strong>022-68276827</strong></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: AI Assistant */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-xl border border-gray-200 flex flex-col h-[650px] sticky top-20">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-100 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 shadow">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">NexGro Schemes AI</p>
                <p className="text-[10px] text-green-600">● Online — Ask about schemes & insurance</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {schemeMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-green-700 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSchemeAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {["PM-KISAN details", "PMFBY claim process", "KCC eligibility", "Insurance plans"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setSchemeInput(prompt)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendSchemeMessage} className="border-t border-gray-100 p-3 flex gap-2">
              <input
                value={schemeInput}
                onChange={(e) => setSchemeInput(e.target.value)}
                placeholder="Ask about any scheme or insurance..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 transition-all"
              />
              <button
                type="submit"
                disabled={!schemeInput.trim() || isSchemeAiThinking}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

