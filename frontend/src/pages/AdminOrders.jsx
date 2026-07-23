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

const nextStatusOptions = {
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_process", "cancelled"],
  in_process: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

const walkInStatusLabel = {
  pending: "Menunggu",
  picked_up: "-",
  in_process: "Diproses",
  ready: "Siap Diambil",
  delivered: "Selesai (Diambil)",
  cancelled: "Dibatalkan",
};

const walkInNextStatusOptions = {
  pending: ["in_process", "cancelled"],
  in_process: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "picked_up", label: "Dijemput" },
  { value: "in_process", label: "Diproses" },
  { value: "ready", label: "Siap Antar" },
  { value: "delivered", label: "Selesai" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter sumber pesanan (online vs walk-in)
  const [sourceFilter, setSourceFilter] = useState("all");

  // State untuk modal input pesanan langsung
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [quantities, setQuantities] = useState({}); // { serviceId: qty }
  const [serviceType, setServiceType] = useState("reguler");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" atau "transfer"
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  
  // State untuk mendaftarkan pelanggan baru langsung dari modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // State untuk modal pembatalan pesanan
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const filteredOrders = orders.filter((order) => {
    // 1. Filter pencarian
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = order.customer_name ? order.customer_name.toLowerCase().includes(query) : false;
    const codeMatch = order.order_code ? order.order_code.toLowerCase().includes(query) : false;
    const matchesSearch = !query || nameMatch || codeMatch;

    // 2. Filter sumber (online vs langsung/offline)
    let matchesSource = true;
    if (sourceFilter === "online") {
      matchesSource = order.delivery_type === "pickup_delivery";
    } else if (sourceFilter === "direct") {
      matchesSource = order.delivery_type === "self_service";
    }

    return matchesSearch && matchesSource;
  });

  function load(status, showLoading = true) {
    if (showLoading) setLoading(true);
    api.getAllOrders(status).then((data) => {
      setOrders(data.orders);
      window.dispatchEvent(new Event("orderStatusUpdated"));
    }).finally(() => {
      if (showLoading) setLoading(false);
    });
  }

  useEffect(() => { load(filter); }, [filter]);

  // Fungsi membuka modal dan mengambil data terbaru
  const openModal = async () => {
    setShowAddModal(true);
    try {
      const custData = await api.getCustomers();
      setCustomers(custData.customers || []);
      const servData = await api.getServices();
      setServices(servData.services || []);
    } catch (err) {
      console.error("Gagal memuat data modal:", err);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setQuantities({});
    setServiceType("reguler");
    setNotes("");
    setShowAddCustomer(false);
    setNewCustomer({ name: "", email: "", phone: "" });
    setPaymentMethod("cash");
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
  };

  const setQty = (serviceId, qty) => {
    setQuantities(prev => ({ ...prev, [serviceId]: qty }));
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) {
      alert("Nama wajib diisi untuk mendaftarkan pelanggan baru!");
      return;
    }
    try {
      const res = await api.createCustomer(newCustomer);
      alert("Pelanggan baru berhasil didaftarkan!");
      setCustomers(prev => [res.customer, ...prev]);
      setSelectedCustomerId(res.customer.id);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", email: "", phone: "" });
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal mendaftarkan pelanggan baru.");
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomerId) {
      alert("Pilih pelanggan terlebih dahulu!");
      return;
    }
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ service_id: Number(id), quantity: qty }));

    if (items.length === 0) {
      alert("Pilih minimal satu layanan dengan jumlah lebih dari 0!");
      return;
    }

    if (paymentMethod === "transfer" && !paymentProofFile) {
      alert("Harap upload foto bukti transfer terlebih dahulu!");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await api.createOrder({
        user_id: Number(selectedCustomerId),
        items,
        delivery_type: "self_service", // Direct walk-in order
        service_type: serviceType,
        notes: notes || null,
        address_id: null,
        pickup_schedule: null,
      });

      if (res && res.order_id) {
        const formData = new FormData();
        formData.append("payment_method", paymentMethod);
        if (paymentMethod === "transfer" && paymentProofFile) {
          formData.append("payment_proof", paymentProofFile);
        }
        await api.submitPayment(res.order_id, formData);
      }

      alert("Pesanan langsung (walk-in) berhasil dibuat & pembayaran dicatat!");
      closeModal();
      load(filter, false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal membuat pesanan.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  async function updateStatus(order, status) {
    if (status === "cancelled") {
      setCancelModalOrder(order);
      setCancelReasonInput("");
      return;
    }

    const oldStatus = order.status;
    // Optimistically update status in UI to prevent lag or jumpiness
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    window.dispatchEvent(new Event("orderStatusUpdated"));

    try {
      await api.updateOrderStatus(order.id, { status });
      load(filter, false);

      if (status === "delivered") {
        const phone = order.customer_phone || "";
        const formattedPhone = phone.startsWith("0") 
          ? "62" + phone.slice(1) 
          : phone.replace(/\D/g, "");

        const itemsList = order.items
          ? order.items.map((item) => `- ${item.service_name}: ${item.quantity} ${item.unit}`).join("\n")
          : "-";

        const payStatus = order.payment_status === "paid" ? "Lunas" : "Belum Lunas";
        const serviceTypeLabel = order.service_type === "express" ? "Express" : "Reguler";
        const message = `Halo Kak *${order.customer_name}*,\n\n` +
          `Pesanan laundry Anda dengan Kode: *${order.order_code}* telah *SELESAI* diproses oleh GoLaundry! 🎉\n\n` +
          `*Rincian Layanan & Jumlah:*\n${itemsList}\n\n` +
          `Tipe Layanan: *${serviceTypeLabel}*\n` +
          `Total Tagihan: *Rp ${Number(order.total_amount).toLocaleString("id-ID")}*\n` +
          `Status Pembayaran: *${payStatus}*\n\n` +
          `Terima kasih banyak telah memercayakan pakaian Anda pada GoLaundry! 🙏`;

        const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? { ...o, status: oldStatus } : o))
      );
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    if (!cancelReasonInput.trim()) {
      alert("Harap masukkan atau pilih alasan pembatalan pesanan!");
      return;
    }

    setSubmittingCancel(true);
    const targetId = cancelModalOrder.id;
    const reasonText = cancelReasonInput.trim();

    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === targetId ? { ...o, status: "cancelled", cancel_reason: reasonText } : o))
    );
    window.dispatchEvent(new Event("orderStatusUpdated"));

    try {
      await api.updateOrderStatus(targetId, {
        status: "cancelled",
        cancel_reason: reasonText,
        note: reasonText
      });
      setCancelModalOrder(null);
      setCancelReasonInput("");
      load(filter, false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal membatalkan pesanan.");
      load(filter, false);
    } finally {
      setSubmittingCancel(false);
    }
  };

  async function togglePayment(orderId, current) {
    const nextStatus = current === "paid" ? "unpaid" : "paid";
    // Optimistically update payment status in UI
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId ? { ...o, payment_status: nextStatus } : o
      )
    );

    try {
      await api.updateOrderPayment(orderId, { payment_status: nextStatus });
      load(filter, false);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, payment_status: current } : o
        )
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Kelola Pesanan</h1>
          <p className="text-ink/60 mt-1">Pantau dan perbarui status pesanan pelanggan.</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm shrink-0 self-start sm:self-auto"
        >
          ➕ Input Pesanan Langsung
        </button>
      </div>

      {/* Filter Status Pesanan */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const pendingCountInTab = f.value === "pending"
            ? orders.filter(o => o.delivery_type === "pickup_delivery" && o.status === "pending").length
            : 0;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.value ? "bg-blue-900 text-white" : "bg-white text-ink/60 border border-blue-900/10"
              }`}
            >
              <span>{f.label}</span>
              {pendingCountInTab > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingCountInTab}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cari & Filter Sumber */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-white border border-blue-900/10 rounded-xl px-3.5 py-2.5 shadow-sm">
          <span className="text-blue-900/60 text-sm">🔍</span>
          <input
            type="text"
            className="bg-transparent border-0 outline-none w-full text-sm text-ink placeholder-ink/40"
            placeholder="Cari nama pelanggan atau kode pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-ink/40 hover:text-ink/65 font-bold px-1.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Segmented Filter Sumber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Sumber:</span>
          <div className="flex gap-1 bg-blue-950/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSourceFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === "all" ? "bg-white text-blue-950 shadow-sm" : "text-ink/60 hover:text-ink"
              }`}
            >
              🌐 Semua ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("online")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === "online" ? "bg-white text-blue-950 shadow-sm" : "text-ink/60 hover:text-ink"
              }`}
            >
              📱 Online ({orders.filter(o => o.delivery_type === "pickup_delivery").length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("direct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sourceFilter === "direct" ? "bg-white text-blue-950 shadow-sm" : "text-ink/60 hover:text-ink"
              }`}
            >
              🏪 Langsung ({orders.filter(o => o.delivery_type === "self_service").length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm">Memuat...</p>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-ink/50">
            {searchQuery ? "Tidak ada pesanan yang cocok dengan pencarian Anda." : "Tidak ada pesanan untuk filter ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-blue-950">{order.order_code}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      order.delivery_type === "self_service" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {order.delivery_type === "self_service" ? "🏪 Walk-in (Langsung)" : "📱 Online (Antar Jemput)"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      order.service_type === "express" ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-800"
                    }`}>
                      {order.service_type === "express" ? "⚡ Express" : "🕒 Reguler"}
                    </span>
                    <span className="text-[11px] text-ink/40">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/70 font-medium mt-1">{order.customer_name} · {order.customer_phone}</p>
                  <p className="text-xs text-ink/40 mt-0.5">
                    {order.delivery_type === "self_service" ? (
                      "Kirim & Ambil Langsung di Outlet"
                    ) : (
                      <>
                        {order.full_address}
                        {order.maps_link && (
                          <a
                            href={order.maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-blue-900 hover:text-blue-950 font-bold ml-2 underline"
                          >
                            📍 Lihat Peta
                          </a>
                        )}
                      </>
                    )}
                  </p>
                  {order.delivery_type !== "self_service" && order.pickup_schedule && (
                    <p className="text-xs text-amber-800 mt-1 flex items-center gap-1 bg-amber-50 border border-amber-200/50 rounded-lg px-2.5 py-1 w-max">
                      <span>📅 Jadwal Jemput:</span>
                      <span className="font-bold">{formatDate(order.pickup_schedule)}</span>
                    </p>
                  )}
                </div>
                <span className="font-semibold text-blue-950">
                  Rp{Number(order.total_amount).toLocaleString("id-ID")}
                </span>
              </div>

              {/* Rincian Layanan & Detail (Lengkap) */}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-blue-950/5 pt-2.5 mt-1">
                  <p className="text-[11px] font-semibold text-blue-950/70 mb-1.5 uppercase tracking-wider">Detail Layanan & Jumlah:</p>
                  <div className="space-y-1 bg-blue-50/40 rounded-xl p-3 border border-blue-950/5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-ink/80">
                        <span className="font-medium text-blue-950">
                          {item.service_name}
                        </span>
                        <span className="text-ink/60 font-mono">
                          {item.quantity} {item.unit} · Rp{Number(item.subtotal).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Pelanggan */}
              {order.notes && (
                <div className="bg-blue-50/30 border-l-2 border-blue-800/40 px-3 py-1.5 text-xs text-ink/75">
                  <span className="font-semibold text-blue-950 block text-[10px] uppercase tracking-wider mb-0.5">Catatan:</span>
                  <p className="italic">"{order.notes}"</p>
                </div>
              )}

              {/* Outlet & Ongkir Info */}
              {order.outlet_name && (
                <div className="text-xs text-sky-900 bg-sky-50/80 border border-sky-200/80 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-1">
                  <span>🏪 Outlet: <strong className="text-sky-950">{order.outlet_name}</strong></span>
                  {Number(order.distance_km) > 0 && (
                    <span className="text-[11px] font-semibold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200">
                      🚗 Jarak: {Number(order.distance_km)} km {Number(order.shipping_fee) > 0 ? `(Ongkir +Rp${Number(order.shipping_fee).toLocaleString("id-ID")})` : "(Gratis Ongkir)"}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full">
                  {order.delivery_type === "self_service" ? walkInStatusLabel[order.status] : statusLabel[order.status]}
                </span>
                <button
                  onClick={() => togglePayment(order.id, order.payment_status)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.payment_status === "paid" ? "bg-blue-900/10 text-blue-950" : "bg-coral-100 text-coral-600"
                  }`}
                >
                  {order.payment_status === "paid" ? "Lunas" : "Belum Bayar · tandai lunas"}
                </button>
                {order.payment_method && (
                  <span className="text-xs font-medium bg-blue-50 text-blue-950 px-2.5 py-1 rounded-full border border-blue-900/10">
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

              {order.review_rating && (
                <div className="bg-amber-50 border border-amber-200/50 rounded-xl px-3 py-2 text-xs flex items-center gap-2 mt-1 w-max">
                  <span className="font-bold text-amber-800">⭐ Rating Pelanggan:</span>
                  <span className="text-amber-500 font-bold tracking-wide text-sm">
                    {"★".repeat(order.review_rating) + "☆".repeat(5 - order.review_rating)}
                  </span>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="bg-coral-50 border border-coral-200 rounded-xl p-3 text-xs text-coral-800 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-coral-700">
                    🚫 Pesanan Dibatalkan
                  </span>
                  {order.cancel_reason ? (
                    <p className="text-ink/80 italic">Alasan: "{order.cancel_reason}"</p>
                  ) : (
                    <p className="text-ink/50 italic">Tidak ada catatan alasan pembatalan.</p>
                  )}
                </div>
              )}

              {(order.delivery_type === "self_service" ? walkInNextStatusOptions[order.status] : nextStatusOptions[order.status])?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(order.delivery_type === "self_service" ? walkInNextStatusOptions[order.status] : nextStatusOptions[order.status]).map((s) => {
                    let transitionLabel = statusLabel[s];
                    if (order.delivery_type === "self_service") {
                      if (s === "ready") transitionLabel = "Siap Diambil";
                      if (s === "delivered") transitionLabel = "Sudah Diambil";
                    }
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(order, s)}
                        className="btn-secondary text-sm py-2 px-3.5"
                      >
                        Ubah ke: {transitionLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Input Pesanan Langsung (Walk-in) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-950/5 max-w-lg w-full max-h-[90vh] flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-blue-950/5">
              <h2 className="font-display font-bold text-xl text-blue-950">Input Pesanan Langsung</h2>
              <button 
                type="button"
                onClick={closeModal} 
                className="text-ink/40 hover:text-ink/65 font-bold text-xl px-1.5"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-left">
              {/* Customer Select */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-blue-950">Pelanggan</label>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCustomer(!showAddCustomer)} 
                    className="text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors"
                  >
                    {showAddCustomer ? "← Pilih dari Daftar" : "➕ Pelanggan Baru"}
                  </button>
                </div>

                {showAddCustomer ? (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-900/10 space-y-3">
                    <p className="text-[10px] font-bold text-blue-900/70 uppercase tracking-wider">Daftar Akun Pelanggan Baru</p>
                    <input 
                      type="text" 
                      placeholder="Nama Lengkap" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                      className="input text-xs py-2 px-3"
                    />
                    <input 
                      type="tel" 
                      placeholder="No. Telepon (WhatsApp)" 
                      value={newCustomer.phone} 
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                      className="input text-xs py-2 px-3"
                    />
                    <button 
                      type="button" 
                      onClick={handleCreateCustomer} 
                      className="w-full bg-blue-900 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-950 transition-colors"
                    >
                      Simpan & Pilih Pelanggan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomerId ? (
                      (() => {
                        const selected = customers.find(c => String(c.id) === String(selectedCustomerId));
                        return (
                          <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-3 rounded-xl">
                            <div>
                              <p className="text-xs font-bold text-blue-950">{selected?.name}</p>
                              <p className="text-[11px] text-ink/60">{selected?.phone ? `📱 ${selected.phone}` : selected?.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId("")}
                              className="text-xs text-blue-700 font-bold hover:text-blue-900 px-2.5 py-1 bg-white rounded-lg border border-blue-200 transition-colors shadow-sm"
                            >
                              Ganti Pelanggan 🔄
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-white border border-blue-900/15 rounded-xl px-3 py-2">
                          <span className="text-xs text-ink/40">🔍</span>
                          <input
                            type="text"
                            placeholder="Cari nama, no. whatsapp, atau email..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full text-xs outline-none bg-transparent text-ink placeholder:text-ink/40"
                          />
                          {customerSearch && (
                            <button
                              type="button"
                              onClick={() => setCustomerSearch("")}
                              className="text-xs text-ink/40 hover:text-ink/65 font-bold px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Daftar Hasil Pencarian */}
                        <div className="max-h-36 overflow-y-auto border border-blue-950/10 rounded-xl divide-y divide-blue-950/5 bg-white shadow-inner">
                          {customers
                            .filter((c) => {
                              const q = customerSearch.toLowerCase().trim();
                              if (!q) return true;
                              const n = c.name ? c.name.toLowerCase().includes(q) : false;
                              const p = c.phone ? c.phone.includes(q) : false;
                              const e = c.email ? c.email.toLowerCase().includes(q) : false;
                              return n || p || e;
                            })
                            .slice(0, 15)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCustomerId(String(c.id));
                                  setCustomerSearch("");
                                }}
                                className="w-full text-left p-2.5 hover:bg-blue-50/60 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-xs font-bold text-blue-950">{c.name}</p>
                                  <p className="text-[10px] text-ink/50">{c.phone || c.email}</p>
                                </div>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-full">
                                  Pilih →
                                </span>
                              </button>
                            ))}
                          {customers.filter((c) => {
                            const q = customerSearch.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              (c.name && c.name.toLowerCase().includes(q)) ||
                              (c.phone && c.phone.includes(q)) ||
                              (c.email && c.email.toLowerCase().includes(q))
                            );
                          }).length === 0 && (
                            <p className="text-xs text-ink/40 p-3 text-center">
                              Tidak ada pelanggan yang cocok dengan pencarian.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="text-sm font-semibold text-blue-950 block mb-2">Pilih Layanan & Jumlah</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {services.map(s => {
                    const qty = quantities[s.id] || 0;
                    return (
                      <div key={s.id} className="flex justify-between items-center bg-blue-50/30 border border-blue-950/5 p-3 rounded-xl hover:bg-blue-50/60 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-blue-950">{s.name}</p>
                          <p className="text-[10px] text-ink/50 mt-0.5">
                            Rp{s.price.toLocaleString("id-ID")}/{s.unit} (⚡ Express: Rp{s.price_express.toLocaleString("id-ID")})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => setQty(s.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 bg-white text-blue-900 font-bold border border-blue-900/10 rounded-full hover:bg-blue-50 transition-colors flex items-center justify-center text-sm shadow-sm"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold w-6 text-center">{qty}</span>
                          <button 
                            type="button" 
                            onClick={() => setQty(s.id, qty + 1)}
                            className="w-7 h-7 bg-white text-blue-900 font-bold border border-blue-900/10 rounded-full hover:bg-blue-50 transition-colors flex items-center justify-center text-sm shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kecepatan */}
              <div>
                <label className="text-sm font-semibold text-blue-950 block mb-2">Kecepatan Layanan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType("reguler")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      serviceType === "reguler"
                        ? "bg-sky-100/70 border-sky-600 text-sky-950 shadow-sm"
                        : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
                    }`}
                  >
                    🕒 Reguler
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType("express")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      serviceType === "express"
                        ? "bg-sky-100/70 border-sky-600 text-sky-950 shadow-sm"
                        : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
                    }`}
                  >
                    ⚡ Express
                  </button>
                </div>
              </div>

              {/* Opsi Pembayaran (Cash / Transfer) */}
              <div className="space-y-2.5 pt-2 border-t border-blue-950/5">
                <label className="text-sm font-semibold text-blue-950 block">Metode Pembayaran Kasir</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setPaymentProofFile(null);
                      setPaymentProofPreview(null);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === "cash"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-ink/75 border-blue-900/15 hover:bg-blue-50/50"
                    }`}
                  >
                    <span>💵</span> Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === "transfer"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-ink/75 border-blue-900/15 hover:bg-blue-50/50"
                    }`}
                  >
                    <span>💳</span> Transfer Bank / E-Wallet
                  </button>
                </div>

                {/* Upload Bukti Transfer jika memilih Transfer */}
                {paymentMethod === "transfer" && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2 mt-2">
                    <label className="text-xs font-bold text-blue-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">📷 Upload Foto Bukti Transfer</span>
                      <span className="text-[10px] text-coral-600 font-bold bg-coral-50 px-2 py-0.5 rounded border border-coral-200">* Wajib File Foto</span>
                    </label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="block w-full text-xs text-ink/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-950 cursor-pointer"
                    />

                    {paymentProofPreview && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-blue-300 max-h-40 bg-white p-1">
                        <img
                          src={paymentProofPreview}
                          alt="Bukti Transfer"
                          className="w-full h-36 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofFile(null);
                            setPaymentProofPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-rose-600 text-white rounded-full h-6 w-6 text-xs font-bold flex items-center justify-center shadow-md hover:bg-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-blue-950 block mb-1.5">Catatan (Opsional)</label>
                <textarea 
                  placeholder="Misal: jangan pakai pewangi, setrika licin..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="input text-xs py-2 px-3 h-16 resize-none"
                />
              </div>
            </div>

            {/* Footer Summary & Buttons */}
            <div className="pt-4 border-t border-blue-950/5 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-blue-950">
                <span>Total Estimasi Tagihan:</span>
                <span className="text-lg">
                  Rp{Object.entries(quantities).reduce((sum, [id, qty]) => {
                    const s = services.find(serv => serv.id === Number(id));
                    if (!s) return sum;
                    const price = serviceType === "express" ? s.price_express : s.price;
                    return sum + (price * qty);
                  }, 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submittingOrder}
                  onClick={handleCreateOrder}
                  className="btn-primary py-2 px-4 text-xs font-bold bg-blue-900 hover:bg-blue-950"
                >
                  {submittingOrder ? "Memproses..." : "Buat Pesanan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembatalan Pesanan */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-950/5 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-blue-950/5">
              <h3 className="font-display font-bold text-lg text-coral-600 flex items-center gap-2">
                <span>🚫</span> Batalkan Pesanan
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="text-ink/40 hover:text-ink/65 font-bold text-xl px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-ink/80">
              <p>
                Anda akan membatalkan pesanan <strong>{cancelModalOrder.order_code}</strong> milik <strong>{cancelModalOrder.customer_name}</strong>.
              </p>
              <div>
                <label className="label text-xs font-bold text-blue-950 block mb-1">
                  Pilih atau Tulis Alasan Pembatalan:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    "Alamat di luar area jangkauan",
                    "Pakaian berisiko rusak / tidak dapat diproses",
                    "Stok bahan baku laundry sedang habis",
                    "Permintaan pembatalan dari pelanggan"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCancelReasonInput(chip)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all text-left ${
                        cancelReasonInput === chip
                          ? "bg-coral-50 border-coral-500 text-coral-700 font-semibold shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  className="input text-sm py-2"
                  rows={3}
                  placeholder="Tuliskan alasan pembatalan agar diketahui oleh pelanggan..."
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-950/5">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="btn-secondary py-2 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingCancel || !cancelReasonInput.trim()}
                onClick={handleConfirmCancel}
                className="btn-primary py-2 text-xs font-bold bg-coral-600 hover:bg-coral-700 disabled:opacity-50"
              >
                {submittingCancel ? "Membatalkan..." : "Konfirmasi Pembatalan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
