"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser, getToken } from "@/lib/client-auth";

/* ── Types ── */
type User = {
  _id: string; fullName: string; phone?: string; role: string;
  location?: string; isVerified?: boolean; createdAt?: string;
};
type Product = {
  _id: string; name: string; category: string; pricePerUnit: number;
  quantityAvailable: number; unit: string; status: string; region: string;
  farmerId?: { _id: string; fullName: string; phone?: string; isVerified?: boolean } | string;
  createdAt?: string;
};
type Order = {
  _id: string; totalAmount: number; status: string; paymentMode: string;
  buyerId?: string; farmerId?: string; createdAt?: string;
  items?: Array<{ productName: string; quantity: number; unitPrice: number }>;
};

type Tab = "overview" | "users" | "products" | "orders";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [users,    setUsers]    = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [feedback, setFeedback] = useState("");
  const [userFilter,    setUserFilter]    = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "admin") { router.replace("/dashboard"); return; }
    void loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    try {
      const [uRes, pRes, oRes] = await Promise.all([
        fetch("/api/admin/users",    { headers: authHeaders() }),
        fetch("/api/admin/products", { headers: authHeaders() }),
        fetch("/api/admin/orders",   { headers: authHeaders() }),
      ]);
      const [uData, pData, oData] = await Promise.all([uRes.json(), pRes.json(), oRes.json()]);
      if (uData.success) setUsers(uData.data);
      if (pData.success) setProducts(pData.data);
      if (oData.success) setOrders(oData.data);
    } finally {
      setLoading(false);
    }
  }

  async function verifyFarmer(id: string, verify: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isVerified: verify }),
    });
    const data = await res.json();
    if (data.success) {
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isVerified: verify } : u));
      setFeedback(verify ? "Farmer verified ✓" : "Verification removed");
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  async function updateProductStatus(id: string, status: "active" | "archived") {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setProducts((prev) => prev.map((p) => p._id === id ? { ...p, status } : p));
      setFeedback(status === "active" ? "Product approved ✓" : "Product rejected");
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  /* ── Derived stats ── */
  const farmers   = users.filter((u) => u.role === "farmer");
  const buyers    = users.filter((u) => u.role === "buyer");
  const verified  = farmers.filter((u) => u.isVerified);
  const pending   = products.filter((p) => p.status === "pending_approval");
  const revenue   = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const filteredUsers = users
    .filter((u) => userFilter === "all" || u.role === userFilter)
    .filter((u) => !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || (u.phone ?? "").includes(search));

  const filteredProducts = products
    .filter((p) => productFilter === "all" || p.status === productFilter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "overview",  icon: "dashboard",      label: "Overview"  },
    { id: "users",     icon: "group",          label: "Users"     },
    { id: "products",  icon: "inventory_2",    label: "Products"  },
    { id: "orders",    icon: "local_shipping", label: "Orders"    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings:"'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">NexGro Admin</h1>
              <p className="text-[10px] text-gray-400">Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {feedback && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">{feedback}</span>
            )}
            <button onClick={() => void loadAll()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-sm">refresh</span>Refresh
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {/* Tab bar */}
        <div className="mb-5 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${tab===t.id ? "bg-green-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <span className="material-symbols-outlined text-sm" style={tab===t.id ? { fontVariationSettings:"'FILL' 1" } : {}}>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {t.id === "products" && pending.length > 0 && (
                <span className="ml-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-700" />
          </div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === "overview" && (
              <div className="space-y-5 fade-in">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label:"Total Users",    value:users.length,    icon:"group",          color:"text-blue-600",   bg:"bg-blue-50"   },
                    { label:"Farmers",        value:farmers.length,  icon:"agriculture",    color:"text-green-700",  bg:"bg-green-50"  },
                    { label:"Verified",       value:verified.length, icon:"verified",       color:"text-emerald-600",bg:"bg-emerald-50"},
                    { label:"Buyers",         value:buyers.length,   icon:"shopping_basket",color:"text-purple-600", bg:"bg-purple-50" },
                    { label:"Products",       value:products.length, icon:"inventory_2",    color:"text-orange-600", bg:"bg-orange-50" },
                    { label:"Pending Approval",value:pending.length, icon:"pending",        color:"text-red-600",    bg:"bg-red-50"    },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-center">
                      <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                        <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Revenue Overview</h3>
                    <p className="text-3xl font-bold text-green-700">Rs. {revenue.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-400 mt-1">Total from {orders.length} orders</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                      {[
                        { label:"Pending",   count:orders.filter(o=>o.status==="pending").length,   color:"text-orange-500" },
                        { label:"Delivered", count:orders.filter(o=>o.status==="delivered").length, color:"text-green-600"  },
                        { label:"Cancelled", count:orders.filter(o=>o.status==="cancelled").length, color:"text-red-500"    },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                          <p className="text-[9px] text-gray-400 uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-orange-600" style={{ fontVariationSettings:"'FILL' 1" }}>pending</span>
                      Pending Approvals
                    </h3>
                    {pending.length === 0 ? (
                      <p className="text-xs text-orange-600">All products approved ✓</p>
                    ) : (
                      <div className="space-y-2">
                        {pending.slice(0, 4).map((p) => (
                          <div key={p._id} className="flex items-center justify-between rounded-xl bg-white border border-orange-100 px-3 py-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.category} · Rs. {p.pricePerUnit}/{p.unit}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => updateProductStatus(p._id, "active")}
                                className="rounded-lg bg-green-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-800 transition-colors">Approve</button>
                              <button onClick={() => updateProductStatus(p._id, "archived")}
                                className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors">Reject</button>
                            </div>
                          </div>
                        ))}
                        {pending.length > 4 && <p className="text-xs text-orange-600 text-center">+{pending.length - 4} more — go to Products tab</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Users ── */}
            {tab === "users" && (
              <div className="space-y-4 fade-in">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…"
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-sm" />
                  <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    {["all","farmer","buyer","admin"].map((f) => (
                      <button key={f} onClick={() => setUserFilter(f)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${userFilter===f ? "bg-green-700 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {["Name","Role","Location","Joined","Status","Action"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{u.fullName}</p>
                                <p className="text-[10px] text-gray-400">{u.phone ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge text-[10px] ${u.role==="farmer" ? "badge-green" : u.role==="admin" ? "badge-blue" : "badge-gray"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{u.location ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          <td className="px-4 py-3">
                            {u.role === "farmer" ? (
                              <span className={`badge text-[10px] ${u.isVerified ? "badge-green" : "badge-yellow"}`}>
                                {u.isVerified ? "✓ Verified" : "Unverified"}
                              </span>
                            ) : (
                              <span className="badge badge-gray text-[10px]">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === "farmer" && (
                              <button
                                onClick={() => verifyFarmer(u._id, !u.isVerified)}
                                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors ${
                                  u.isVerified
                                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                    : "bg-green-700 text-white hover:bg-green-800"
                                }`}
                              >
                                {u.isVerified ? "Unverify" : "Verify"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">No users found</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Products ── */}
            {tab === "products" && (
              <div className="space-y-4 fade-in">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-sm" />
                  <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    {["all","pending_approval","active","archived"].map((f) => (
                      <button key={f} onClick={() => setProductFilter(f)}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold capitalize transition-all ${productFilter===f ? "bg-green-700 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                        {f.replace("_"," ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {["Product","Category","Farmer","Price","Stock","Status","Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((p) => {
                        const farmer = typeof p.farmerId === "object" ? p.farmerId : null;
                        return (
                          <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.region}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">{p.category}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-700">{farmer?.fullName ?? "—"}</p>
                              {farmer && (
                                <span className={`text-[9px] font-bold ${farmer.isVerified ? "text-green-600" : "text-orange-500"}`}>
                                  {farmer.isVerified ? "✓ Verified" : "Unverified"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-green-700">Rs. {p.pricePerUnit}/{p.unit}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{p.quantityAvailable} {p.unit}</td>
                            <td className="px-4 py-3">
                              <span className={`badge text-[10px] ${
                                p.status==="active"           ? "badge-green"  :
                                p.status==="pending_approval" ? "badge-yellow" :
                                p.status==="archived"         ? "badge-red"    : "badge-gray"
                              }`}>{p.status.replace("_"," ")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                {p.status !== "active" && (
                                  <button onClick={() => updateProductStatus(p._id, "active")}
                                    className="rounded-lg bg-green-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-800 transition-colors">Approve</button>
                                )}
                                {p.status !== "archived" && (
                                  <button onClick={() => updateProductStatus(p._id, "archived")}
                                    className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors">Reject</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">No products found</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {tab === "orders" && (
              <div className="space-y-4 fade-in">
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {["Order ID","Items","Amount","Payment","Status","Date"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map((o) => (
                        <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">#{o._id.slice(-6)}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {o.items?.map((i) => i.productName).join(", ") ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-green-700">Rs. {(o.totalAmount ?? 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <span className="badge badge-gray text-[10px] uppercase">{o.paymentMode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge text-[10px] ${
                              o.status==="delivered" ? "badge-green"  :
                              o.status==="pending"   ? "badge-yellow" :
                              o.status==="cancelled" ? "badge-red"    : "badge-blue"
                            }`}>{o.status}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">No orders yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
