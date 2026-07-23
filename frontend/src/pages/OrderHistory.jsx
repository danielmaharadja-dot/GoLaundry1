import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const statusLabel = {
  pending: "Menunggu konfirmasi",
  picked_up: "Sudah dijemput",
  in_process: "Sedang dicuci",
  ready: "Siap diantar",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const statusColor = {
  pending: "bg-amber-100 text-amber-500",
  picked_up: "bg-sky-100 text-sky-700",
  in_process: "bg-sky-100 text-sky-700",
  ready: "bg-blue-100 text-blue-900",
  delivered: "bg-blue-900/10 text-blue-950",
  cancelled: "bg-coral-100 text-coral-600",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrders().then((data) => setOrders(data.orders)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-2xl text-blue-950">Riwayat Pesanan</h1>

      {loading ? (
        <p className="text-ink/50 text-sm">Memuat...</p>
      ) : orders.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-ink/50">Belum ada riwayat pesanan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              to={`/app/pesanan/${order.id}`}
              key={order.id}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-blue-950">{order.order_code}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    order.service_type === "express" ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-800"
                  }`}>
                    {order.service_type === "express" ? "⚡ Express" : "🕒 Reguler"}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status]}`}>
                  {statusLabel[order.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-ink/60">
                <span>{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="font-medium text-blue-950">Rp{Number(order.total_amount).toLocaleString("id-ID")}</span>
              </div>
              {order.status === "cancelled" && order.cancel_reason && (
                <div className="mt-2 pt-2 border-t border-coral-200/50 text-xs text-coral-600 font-medium italic">
                  Alasan pembatalan: "{order.cancel_reason}"
                </div>
              )}
              {order.status === "delivered" && (
                <div className="mt-3 pt-2.5 border-t border-blue-950/5 flex items-center justify-between text-xs">
                  {order.review_rating ? (
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <span>{"★".repeat(order.review_rating) + "☆".repeat(5 - order.review_rating)}</span>
                      <span className="text-ink/40 text-[10px] font-normal">(Sudah Diulas)</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                      ⭐ Beri Bintang & Ulasan
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
