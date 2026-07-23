import { useEffect, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = [
  { value: "all", label: "Semua Bahan Baku" },
  { value: "pakaian", label: "👕 Pakaian" },
  { value: "sepatu", label: "👟 Sepatu" },
  { value: "selimut", label: "🛋️ Selimut / Bedcover" },
];

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [restockAmount, setRestockAmount] = useState("");
  const [restockNote, setRestockNote] = useState("");
  const [submittingRestock, setSubmittingRestock] = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([api.getInventory(), api.getInventoryLogs()])
      .then(([invData, logData]) => {
        setInventory(invData.inventory || []);
        setLogs(logData.logs || []);
      })
      .catch((err) => console.error("Gagal memuat data stok:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = inventory.filter((item) => Number(item.stock) <= Number(item.min_stock));
  const filteredInventory = inventory.filter((item) => {
    if (categoryFilter === "all") return true;
    return item.category === categoryFilter;
  });

  const openRestockModal = (itemId = "") => {
    setSelectedItemId(itemId || (inventory[0]?.id ? String(inventory[0].id) : ""));
    setRestockAmount("");
    setRestockNote("");
    setShowRestockModal(true);
  };

  const closeRestockModal = () => {
    setShowRestockModal(false);
    setSelectedItemId("");
    setRestockAmount("");
    setRestockNote("");
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !restockAmount || Number(restockAmount) <= 0) {
      alert("Pilih barang dan masukkan jumlah restock yang valid (> 0)!");
      return;
    }

    setSubmittingRestock(true);
    try {
      await api.restockInventory({
        inventory_id: Number(selectedItemId),
        amount: Number(restockAmount),
        note: restockNote || "Restock manual dari admin",
      });
      alert("Stok berhasil ditambahkan!");
      closeRestockModal();
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal menambah stok.");
    } finally {
      setSubmittingRestock(false);
    }
  };

  const getItemIcon = (key) => {
    if (key.includes("sabun")) return "🧼";
    if (key.includes("pewangi_setrika")) return "💨";
    if (key.includes("pewangi")) return "🌸";
    return "📦";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">📦 Gudang Stok Bahan Baku</h1>
          <p className="text-ink/60 mt-1">Pantau stok sabun & pewangi secara otomatis dari setiap pesanan.</p>
        </div>
        <button
          onClick={() => openRestockModal("")}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm shrink-0 self-start sm:self-auto bg-blue-900 hover:bg-blue-950"
        >
          ➕ Restock Bahan Baku
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-blue-600">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
            📦
          </div>
          <div>
            <p className="text-xs text-ink/60 font-semibold uppercase tracking-wider">Total Jenis Barang</p>
            <p className="text-2xl font-display font-bold text-blue-950">{inventory.length} Item</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">
            🧪
          </div>
          <div>
            <p className="text-xs text-ink/60 font-semibold uppercase tracking-wider">Total Stok Tersedia</p>
            <p className="text-2xl font-display font-bold text-blue-950">
              {inventory.reduce((sum, item) => sum + Number(item.stock), 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className={`card flex items-center gap-4 border-l-4 ${lowStockItems.length > 0 ? "border-rose-500 bg-rose-50/40" : "border-slate-300"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${lowStockItems.length > 0 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-400"}`}>
            ⚠️
          </div>
          <div>
            <p className="text-xs text-ink/60 font-semibold uppercase tracking-wider">Stok Menipis</p>
            <p className={`text-2xl font-display font-bold ${lowStockItems.length > 0 ? "text-rose-600" : "text-blue-950"}`}>
              {lowStockItems.length} Item
            </p>
          </div>
        </div>
      </div>

      {/* Box Panduan Rumus Pengurangan Stok */}
      <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-bold text-sm text-sky-950 flex items-center gap-2">
          <span>📐</span> Rumus Pengurangan Stok Otomatis Per Pesanan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-sky-200/60 space-y-1">
            <p className="font-bold text-sky-950 flex items-center gap-1">
              <span>👕</span> Pakaian (1 kg)
            </p>
            <p className="text-ink/70">• 2 pcs Sabun Cuci Pakaian</p>
            <p className="text-ink/70">• 2 pcs Pewangi Cuci Pakaian</p>
            <p className="text-ink/70">• 1 Liter Pewangi Setrika Pakaian</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-sky-200/60 space-y-1">
            <p className="font-bold text-sky-950 flex items-center gap-1">
              <span>👟</span> Sepatu (1 pasang)
            </p>
            <p className="text-ink/70">• 1 pcs Sabun Cuci Sepatu</p>
            <p className="text-ink/70">• 1 pcs Pewangi Cuci Sepatu</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-sky-200/60 space-y-1">
            <p className="font-bold text-sky-950 flex items-center gap-1">
              <span>🛋️</span> Selimut / Bedcover (1 pcs)
            </p>
            <p className="text-ink/70">• 2 pcs Sabun Cuci Selimut</p>
            <p className="text-ink/70">• 2 pcs Pewangi Cuci Selimut</p>
            <p className="text-ink/70">• 1 Liter Pewangi Setrika Selimut</p>
          </div>
        </div>
      </div>

      {/* Tabs Filter Kategori */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              categoryFilter === cat.value
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white text-ink/70 border border-blue-900/10 hover:bg-blue-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Stok Bahan Baku */}
      {loading ? (
        <p className="text-ink/50 text-sm p-4">Memuat data stok gudang...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const isLow = Number(item.stock) <= Number(item.min_stock);
            return (
              <div
                key={item.id}
                className={`card relative flex flex-col justify-between border transition-all ${
                  isLow ? "border-rose-400 bg-rose-50/30" : "border-blue-950/5 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{getItemIcon(item.item_key)}</span>
                      <div>
                        <h3 className="font-bold text-sm text-blue-950">{item.name}</h3>
                        <span className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">
                          Kategori: {item.category}
                        </span>
                      </div>
                    </div>
                    {isLow ? (
                      <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        ⚠️ Menipis
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        ✅ Cukup
                      </span>
                    )}
                  </div>

                  {/* Stock Progress & Value */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-ink/60">Jumlah Stok Saat Ini:</span>
                      <span className="font-mono font-bold text-lg text-blue-950">
                        {Number(item.stock).toLocaleString("id-ID")} <span className="text-xs font-normal text-ink/60">{item.unit}</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isLow ? "bg-rose-500" : "bg-blue-600"}`}
                        style={{ width: `${Math.min(100, (Number(item.stock) / (Number(item.min_stock) * 3)) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-ink/50">
                      <span>Batas Min: {item.min_stock} {item.unit}</span>
                      <span>Target Ideal: {item.min_stock * 3} {item.unit}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openRestockModal(String(item.id))}
                  className="w-full mt-3 py-2 px-3 bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>➕</span> Tambah Stok ({item.name})
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabel Histori Pengurangan & Restock */}
      <div className="card space-y-4">
        <h2 className="font-display font-semibold text-blue-950 flex items-center gap-2">
          <span>📋</span> Histori Transaksi Stok (50 Terakhir)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-blue-950/10 text-ink/60 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Nama Barang</th>
                <th className="py-2.5 px-3">Jenis Transaksi</th>
                <th className="py-2.5 px-3">Jumlah</th>
                <th className="py-2.5 px-3">Stok (Lama ➔ Baru)</th>
                <th className="py-2.5 px-3">Catatan / No. Pesanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-950/5">
              {logs.map((log) => {
                const isRestock = log.type === "restock";
                return (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink/60">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-950 whitespace-nowrap">
                      {log.item_name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isRestock ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          📦 Restock Manual
                        </span>
                      ) : (
                        <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          🧺 Dipotong Pesanan
                        </span>
                      )}
                    </td>
                    <td className={`py-2.5 px-3 font-mono font-bold whitespace-nowrap ${isRestock ? "text-emerald-600" : "text-rose-600"}`}>
                      {isRestock ? `+${log.change_amount}` : log.change_amount} {log.unit}
                    </td>
                    <td className="py-2.5 px-3 text-ink/70 font-mono whitespace-nowrap">
                      {Number(log.previous_stock)} ➔ <strong className="text-blue-950">{Number(log.new_stock)}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-ink/70">
                      {log.order_code ? (
                        <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.order_code}
                        </span>
                      ) : (
                        log.note || "-"
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-ink/40">
                    Belum ada riwayat transaksi stok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Restock Barang */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-950/5 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-blue-950/5">
              <h2 className="font-display font-bold text-xl text-blue-950">Restock Bahan Baku</h2>
              <button
                type="button"
                onClick={closeRestockModal}
                className="text-ink/40 hover:text-ink/65 font-bold text-xl px-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-blue-950 block mb-1">Pilih Barang Stok *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="input text-xs py-2.5"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stok: {item.stock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-blue-950 block mb-1">Jumlah Tambahan Restock *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="Misal: 50"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="input text-xs py-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-950 block mb-1">Catatan Restock (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Pembelian dari Indogrosir"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="input text-xs py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRestockModal}
                  className="btn-secondary py-2.5 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  className="btn-primary py-2.5 text-xs font-bold bg-blue-900 hover:bg-blue-950"
                >
                  {submittingRestock ? "Memproses..." : "Simpan Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
