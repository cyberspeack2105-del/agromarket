"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch, getSessionUser, type SessionUser } from "@/lib/client-auth";

type Product = {
  _id: string;
  farmerId: string;
  name: string;
  category: string;
  unit: string;
  quantityAvailable: number;
  pricePerUnit: number;
  region: string;
};

type ProductsResponse = { success: boolean; message?: string; data?: Product[] };
type OrderResponse    = { success: boolean; message?: string };

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [buyer]   = useState<SessionUser | null>(() => getSessionUser());
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = query ? `?q=${encodeURIComponent(query)}` : "";
        const res    = await fetch(`/api/products${params}`);
        const result = (await res.json()) as ProductsResponse;
        if (res.ok && result.success && result.data) setProducts(result.data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [query]);

  async function placeOrder(product: Product) {
    if (!buyer) { setFeedback("Please login first to place an order."); return; }
    const res = await authFetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmerId: product.farmerId,
        buyerId:  buyer.id,
        paymentMode: "cod",
        items: [{ productId: product._id, productName: product.name, quantity: 1, unitPrice: product.pricePerUnit }],
      }),
    });
    const result = (await res.json()) as OrderResponse;
    setFeedback(res.ok && result.success ? `Order placed for ${product.name}.` : (result.message ?? "Unable to place order."));
  }

  return (
    <main className="min-h-screen w-full bg-white px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NexGro Marketplace</h1>
            <p className="mt-0.5 text-sm text-gray-500">Fresh produce directly from verified farmers</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Dashboard
            </Link>
            <Link href="/farmer/products/new" className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
              Add Product
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crops, category, region…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
            {feedback}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="skeleton h-5 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300">storefront</span>
            <p className="mt-3 text-base font-semibold text-gray-700">No products found</p>
            <p className="mt-1 text-sm text-gray-400">Try a different search term</p>
          </div>
        )}

        {/* Products grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-semibold text-gray-900">{product.name}</h2>
                  <span className="badge badge-green">{product.category}</span>
                </div>
                <p className="mt-1.5 text-sm text-gray-500">{product.region}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Available: <span className="font-medium text-gray-700">{product.quantityAvailable} {product.unit}</span>
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-green-700">
                    Rs. {product.pricePerUnit}<span className="text-xs font-normal text-gray-500">/{product.unit}</span>
                  </p>
                  <button
                    onClick={() => placeOrder(product)}
                    className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-800"
                  >
                    Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
