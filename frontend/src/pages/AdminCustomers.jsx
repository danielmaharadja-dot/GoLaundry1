import { useEffect, useState } from "react";
import { api } from "../api.js";

const statusLabel = {
  pending: "Menunggu",
  picked_up: "Dijemput",
  in_process: "Diproses",
  ready: "Siap Antar",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const statusColor = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  picked_up: "bg-blue-100 text-blue-800 border-blue-200",
  in_process: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ready: "bg-blue-100 text-blue-800 border-blue-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // State untuk modal histori pesanan pelanggan
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  function loadCustomers() {
    setLoading(true);
    api.getCustomers()
      .then((data) => {
        setCustomers(data.customers || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Gagal memuat data pelanggan.");
      })
      .finally(() => setLoading(false));
  }

  function getWaLink(phone) {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  }

  function handleViewOrders(customer) {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    api.getCustomerOrders(customer.id)
      .then((data) => {
        setCustomerOrders(data.orders || []);
      })
      .catch((err) => {
        console.error(err);
        alert("Gagal memuat riwayat pesanan pelanggan.");
      })
      .finally(() => setLoadingOrders(false));
  }

  function handleCloseModal() {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  }

  // Filter pelanggan berdasarkan nama/email
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Kelola Pelanggan</h1>
          <p className="text-ink/60 mt-1">Daftar pelanggan terdaftar dan histori transaksi mereka.</p>
        </div>
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-sm py-2 px-3 pl-9"
          />
          <span className="absolute left-3 top-2.5 text-ink/40 text-sm">🔍</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="card text-center p-6 bg-coral-100/10 border border-coral-500/20">
          <p className="text-coral-600 font-semibold">{error}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card text-center py-12 text-ink/50">
          Tidak ada data pelanggan yang cocok.
        </div>
      ) : (
        <div className="overflow-x-auto card p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-blue-950/10 text-ink/50 bg-blue-50/50">
                <th className="py-4 px-4 font-semibold">Pelanggan</th>
                <th className="py-4 px-4 font-semibold">No. Telepon</th>
                <th className="py-4 px-4 font-semibold text-center">Total Order</th>
                <th className="py-4 px-4 font-semibold text-right">Total Belanja</th>
                <th className="py-4 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-950/5">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-blue-950 text-base">{customer.name}</p>
                      <p className="text-xs text-ink/50 mt-0.5">{customer.email}</p>
                      <p className="text-[10px] text-ink/40 mt-1">
                        Terdaftar: {new Date(customer.created_at).toLocaleDateString("id-ID", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-blue-950 font-medium">
                    {customer.phone || <span className="text-ink/30 italic text-xs">Tidak ada</span>}
                  </td>
                  <td className="py-4 px-4 text-center text-blue-900 font-semibold">
                    {customer.total_orders}x
                  </td>
                  <td className="py-4 px-4 text-right text-blue-950 font-bold">
                    Rp{Number(customer.total_spending).toLocaleString("id-ID")}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {customer.phone && (
                        <a
                          href={getWaLink(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 transition-colors"
                          title="Hubungi lewat WhatsApp"
                        >
                          💬 WA
                        </a>
                      )}
                      <button
                        onClick={() => handleViewOrders(customer)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 transition-colors"
                      >
                        📋 Pesanan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Histori Pesanan (Inputan) Pelanggan */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-blue-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg">Histori Pesanan</h3>
                <p className="text-xs text-blue-100/70 mt-0.5">{selectedCustomer.name} · {selectedCustomer.email}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white text-xl p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900"></div>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-10 text-ink/50">
                  Pelanggan ini belum pernah membuat pesanan.
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="border border-blue-950/10 rounded-xl p-4 bg-blue-50/20 hover:border-blue-900/30 transition-colors space-y-3"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-blue-950 text-base">{order.order_code}</p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              order.delivery_type === "self_service" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {order.delivery_type === "self_service" ? "Walk-in (Langsung)" : "Online (Antar Jemput)"}
                            </span>
                          </div>
                          <p className="text-xs text-ink/50 mt-0.5">
                            Tanggal: {new Date(order.created_at).toLocaleString("id-ID", {
                              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <p className="font-bold text-blue-950 text-base">
                          Rp{Number(order.total_amount).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {/* Detail Alamat & Catatan */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink/75 pt-1">
                        <div>
                          <span className="font-bold text-ink/40 block">Alamat Pengiriman:</span>
                          <span className="mt-0.5 block">
                            {order.delivery_type === "self_service" ? (
                              "Kirim & Ambil Langsung di Outlet"
                            ) : (
                              <>
                                {order.address_label || "Lainnya"}: {order.full_address || "Tidak ditentukan"}
                                {order.maps_link && (
                                  <a
                                    href={order.maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-900 hover:text-blue-950 font-bold ml-1.5 underline"
                                  >
                                    📍 Lihat Peta
                                  </a>
                                )}
                              </>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-ink/40 block">Jadwal & Catatan:</span>
                          <span className="mt-0.5 block">
                            {order.delivery_type === "self_service" 
                              ? "Diserahkan langsung ke outlet" 
                              : (order.pickup_schedule 
                                  ? new Date(order.pickup_schedule).toLocaleString("id-ID", {
                                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                    }) 
                                  : "Segera")}
                            {order.notes && ` · "${order.notes}"`}
                          </span>
                        </div>
                      </div>

                      {/* Status Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-950/5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor[order.status]}`}>
                          {statusLabel[order.status]}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          order.payment_status === "paid" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {order.payment_status === "paid" ? "Lunas" : "Belum Lunas"}
                        </span>
                        {order.payment_method && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-950 border-blue-900/10">
                            💳 {order.payment_method === "cash" ? "Tunai" : "Transfer"}
                          </span>
                        )}
                        {order.payment_proof && (
                          <a
                            href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:4000"}/uploads/${order.payment_proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-700 bg-blue-100/50 hover:bg-blue-100 hover:text-blue-900 px-2.5 py-1 rounded-full border border-blue-900/5 transition-all flex items-center gap-1"
                          >
                            👁️ Lihat Bukti
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-950/5 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="btn-primary text-xs py-2 px-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
