import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const statusLabel = {
  pending: "Menunggu",
  picked_up: "Dijemput",
  in_process: "Diproses",
  ready: "Siap Antar",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const statusColor = {
  pending: "bg-amber-100 text-amber-800",
  picked_up: "bg-blue-100 text-blue-800",
  in_process: "bg-indigo-100 text-indigo-800",
  ready: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

// Pilihan tahun dari 2025 hingga 2035
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.getAdminStats(selectedMonth, selectedYear)
      .then((data) => {
        setStats(data.stats);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Gagal memuat data statistik.");
      })
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear]);

  // Format nama bulan tren grafis, misal: 2026-07 -> Jul 2026
  function formatMonthName(monthStr) {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTH_NAMES[monthIndex]?.slice(0, 3)} ${year}`;
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
        <span className="ml-3 text-ink/60 font-medium">Memuat data dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border border-coral-500/20 bg-coral-100/10 p-6 text-center">
        <span className="text-2xl">⚠️</span>
        <h3 className="font-semibold text-coral-600 mt-2">Terjadi Kesalahan</h3>
        <p className="text-sm text-ink/70 mt-1">{error}</p>
        <button
          onClick={() => { 
            setError(null); 
            setSelectedMonth("all"); 
            setSelectedYear("all");
          }}
          className="btn-primary mt-4 text-sm py-2 px-4"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Cari nilai omset bulanan terbesar untuk penskalaan grafik
  const maxMonthVal = stats ? Math.max(
    ...stats.monthly_omset.map(m => m.paid_amount + m.unpaid_amount), 10000
  ) : 10000;

  return (
    <div className="space-y-6">
      {/* Header Halaman & Dropdown Pemilih Bulan & Tahun */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Dashboard Admin & Omset</h1>
          <p className="text-ink/60 mt-1">Pantau perkembangan bisnis dan pendapatan GoLaundry Anda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Pemilih Bulan */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="monthFilter" className="text-xs font-semibold text-ink/70 shrink-0">Bulan:</label>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input text-sm py-2 px-3 pr-8 w-36 font-medium"
              disabled={loading}
            >
              <option value="all">Semua Bulan</option>
              {MONTH_NAMES.map((m, index) => (
                <option key={index + 1} value={index + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Pemilih Tahun */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="yearFilter" className="text-xs font-semibold text-ink/70 shrink-0">Tahun:</label>
            <select
              id="yearFilter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input text-sm py-2 px-3 pr-8 w-32 font-medium"
              disabled={loading}
            >
              <option value="all">Semua Tahun</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-900 ml-1"></div>
          )}
        </div>
      </div>

      {/* Main Grid Layout - Split: Main (2 Cols) & Sidebar (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ================= KIRI / TENGAH: STATS UTAMA, GRAFIK, DAN TABEL ================= */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Grid Kartu Statistik Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Omset Lunas */}
            <div className="card flex items-center gap-4 bg-white border-l-4 border-blue-900">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-900 text-2xl">
                💰
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Omset (Lunas)</p>
                <p className="text-lg font-bold text-blue-950 mt-0.5">
                  Rp{stats.total_omset.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Omset Pending */}
            <div className="card flex items-center gap-4 bg-white border-l-4 border-amber-500">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-500 text-2xl">
                🕒
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Belum Bayar</p>
                <p className="text-lg font-bold text-blue-950 mt-0.5">
                  Rp{stats.unpaid_omset.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Total Pelanggan / Pelanggan Baru */}
            <div className="card flex items-center gap-4 bg-white border-l-4 border-indigo-500">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500 text-2xl">
                👥
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider">
                  {selectedMonth === "all" && selectedYear === "all" ? "Total Pelanggan" : "Pelanggan Baru"}
                </p>
                <p className="text-lg font-bold text-blue-950 mt-0.5">
                  {stats.total_customers} Orang
                </p>
              </div>
            </div>

            {/* Total Pesanan */}
            <div className="card flex items-center gap-4 bg-white border-l-4 border-coral-500">
              <div className="p-3 rounded-xl bg-coral-100 text-coral-600 text-2xl">
                🧺
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Total Pesanan</p>
                <p className="text-lg font-bold text-blue-950 mt-0.5">
                  {stats.total_orders} Pesanan
                </p>
              </div>
            </div>
          </div>

          {/* Card Rincian Performa & Pendapatan per Cabang Outlet */}
          <div className="card space-y-5 border-l-4 border-sky-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-blue-950/5">
              <div>
                <h3 className="font-display font-bold text-lg text-blue-950 flex items-center gap-2">
                  <span>🏪</span> Pendapatan & Pelanggan per Cabang Outlet
                </h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  Rincian omset lunas, omset pending, serta jumlah pelanggan unik di setiap lokasi cabang.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-200 self-start sm:self-auto">
                {stats.outlet_stats ? stats.outlet_stats.length : 0} Cabang Outlet
              </span>
            </div>

            {/* List / Table Cabang Outlet */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-blue-950/10 text-ink/50 text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Cabang Outlet</th>
                    <th className="py-2.5 px-3 text-center">Pelanggan</th>
                    <th className="py-2.5 px-3 text-center">Pesanan</th>
                    <th className="py-2.5 px-3 text-right">Omset Lunas</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-right">Kontribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/5">
                  {!stats.outlet_stats || stats.outlet_stats.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-ink/40">
                        Belum ada data per cabang outlet.
                      </td>
                    </tr>
                  ) : (
                    stats.outlet_stats.map((outlet, idx) => {
                      const sharePct = stats.total_omset > 0 
                        ? ((outlet.paid_revenue / stats.total_omset) * 100).toFixed(1) 
                        : 0;

                      return (
                        <tr key={outlet.outlet_name || idx} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-xs shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-blue-950 text-sm leading-snug">
                                  {outlet.outlet_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-full text-xs">
                              👥 {outlet.total_customers} Orang
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-950 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                              🧺 {outlet.total_orders}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-blue-950">
                            Rp{outlet.paid_revenue.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-3 text-right font-semibold text-amber-600">
                            {outlet.unpaid_revenue > 0 ? `Rp${outlet.unpaid_revenue.toLocaleString("id-ID")}` : "-"}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                                <div
                                  style={{ width: `${Math.min(sharePct, 100)}%` }}
                                  className="bg-blue-900 h-2 rounded-full"
                                ></div>
                              </div>
                              <span className="font-bold text-xs text-blue-900 min-w-[36px]">
                                {sharePct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grafik Visual Omset Bulanan */}
          <div className="card space-y-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-blue-950">Visualisasi Omset 6 Bulan Terakhir</h3>
              <p className="text-xs text-ink/50">Grafik omset berdasar status pembayaran pesanan.</p>
            </div>

            <div className="relative h-64 flex items-end justify-around border-b border-blue-950/10 pb-2 pt-6">
              {stats.monthly_omset.length === 0 ? (
                <p className="text-ink/40 text-sm absolute inset-0 flex items-center justify-center">
                  Belum ada data transaksi bulanan.
                </p>
              ) : (
                stats.monthly_omset.map((item) => {
                  const total = item.paid_amount + item.unpaid_amount;
                  const paidHeight = total > 0 ? (item.paid_amount / maxMonthVal) * 100 : 0;
                  const unpaidHeight = total > 0 ? (item.unpaid_amount / maxMonthVal) * 100 : 0;

                  return (
                    <div key={item.month} className="flex flex-col items-center group w-1/6 max-w-[80px]">
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 bg-blue-950 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 text-center w-36">
                        <p className="font-bold border-b border-white/20 pb-0.5 mb-1">{formatMonthName(item.month)}</p>
                        <p className="text-teal-300">Lunas: Rp{item.paid_amount.toLocaleString("id-ID")}</p>
                        <p className="text-coral-300">Pending: Rp{item.unpaid_amount.toLocaleString("id-ID")}</p>
                        <p className="font-semibold text-white mt-0.5 pt-0.5 border-t border-white/10">Total: Rp{total.toLocaleString("id-ID")}</p>
                      </div>

                      {/* Bar Container */}
                      <div className="w-8 sm:w-12 bg-blue-100/50 rounded-t-md overflow-hidden flex flex-col justify-end h-44 shadow-inner">
                        {/* Bar Unpaid/Pending */}
                        <div
                          style={{ height: `${unpaidHeight}%` }}
                          className="bg-amber-400 transition-all duration-500 ease-out"
                        ></div>
                        {/* Bar Paid */}
                        <div
                          style={{ height: `${paidHeight}%` }}
                          className="bg-blue-900 transition-all duration-500 ease-out"
                        ></div>
                      </div>

                      <span className="text-[10px] sm:text-xs font-medium text-ink/70 mt-2 truncate max-w-full text-center">
                        {formatMonthName(item.month).split(" ")[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Legenda Grafik */}
            <div className="flex gap-4 text-xs justify-center pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-blue-900 rounded"></span>
                <span className="text-ink/70">Omset Lunas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-amber-400 rounded"></span>
                <span className="text-ink/70">Pending (Belum Bayar)</span>
              </div>
            </div>
          </div>

          {/* Tabel Detail Rincian Omset Bulanan */}
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-lg text-blue-950">Detail Rincian Omset</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-blue-950/10 text-ink/50">
                    <th className="py-3 px-2">Bulan</th>
                    <th className="py-3 px-2 text-right">Omset Lunas</th>
                    <th className="py-3 px-2 text-right">Pending</th>
                    <th className="py-3 px-2 text-right">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/5">
                  {stats.monthly_omset.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-ink/40">
                        Tidak ada data rincian bulanan.
                      </td>
                    </tr>
                  ) : (
                    [...stats.monthly_omset].reverse().map((item) => {
                      const total = item.paid_amount + item.unpaid_amount;
                      return (
                        <tr key={item.month} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-3 px-2 font-medium text-blue-950">
                            {formatMonthName(item.month)}
                          </td>
                          <td className="py-3 px-2 text-right text-blue-900 font-semibold">
                            Rp{item.paid_amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-2 text-right text-amber-500">
                            Rp{item.unpaid_amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-2 text-right text-blue-950 font-bold">
                            Rp{total.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ================= KANAN: SIDEBAR WIDGETS (MENGISI RUANG KOSONG) ================= */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Widget 1: Status & Tingkat Penyelesaian Pesanan */}
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-lg text-blue-950">Penyelesaian Pesanan</h3>
            
            <div className="space-y-4">
              {/* Status Sukses Rate */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink/70 font-medium">Tingkat Penyelesaian</span>
                  <span className="font-bold text-blue-900">
                    {stats.total_orders > 0 
                      ? Math.round((stats.completed_orders / stats.total_orders) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2.5">
                  <div
                    style={{ 
                      width: `${stats.total_orders > 0 
                        ? (stats.completed_orders / stats.total_orders) * 100 
                        : 0}%` 
                    }}
                    className="bg-blue-900 h-2.5 rounded-full"
                  ></div>
                </div>
              </div>

              {/* List Detail Angka */}
              <div className="divide-y divide-blue-950/5 text-sm pt-1">
                <div className="flex justify-between py-2">
                  <span className="text-ink/60">Pesanan Selesai</span>
                  <span className="font-semibold text-blue-950">{stats.completed_orders}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-ink/60">Pesanan Dibatalkan</span>
                  <span className="font-semibold text-coral-600">{stats.cancelled_orders}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-ink/60">Dalam Proses / Aktif</span>
                  <span className="font-semibold text-amber-500">
                    {stats.total_orders - stats.completed_orders - stats.cancelled_orders}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Layanan Terpopuler */}
          <div className="card space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-blue-950">🏆 Layanan Terpopuler</h3>
              <p className="text-xs text-ink/50">Layanan yang paling sering dipesan oleh pelanggan.</p>
            </div>

            <div className="space-y-3">
              {!stats.popular_services || stats.popular_services.length === 0 ? (
                <p className="text-xs text-ink/40 py-3 text-center">Belum ada data pesanan.</p>
              ) : (
                stats.popular_services.map((item, idx) => {
                  const medalColors = ["bg-amber-100 text-amber-600", "bg-slate-100 text-slate-500", "bg-orange-50 text-orange-600"];
                  const medals = ["🥇", "🥈", "🥉"];

                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/40 hover:bg-blue-50/80 transition-colors border border-blue-950/5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${medalColors[idx] || "bg-blue-100 text-blue-900"}`}>
                          {medals[idx] || (idx + 1)}
                        </span>
                        <div>
                          <p className="font-semibold text-blue-950 text-sm leading-tight">{item.name}</p>
                          <p className="text-xs text-ink/50 mt-0.5">{item.count} Kali dipesan</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-950 text-xs">Rp{item.revenue.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Widget 3: Aktivitas Pesanan Terbaru */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-blue-950">🔔 Pesanan Terbaru</h3>
              <Link to="/admin/pesanan" className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="divide-y divide-blue-950/5">
              {!stats.recent_orders || stats.recent_orders.length === 0 ? (
                <p className="text-xs text-ink/40 py-6 text-center">Belum ada pesanan terbaru.</p>
              ) : (
                stats.recent_orders.map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-950">{order.order_code}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColor[order.status] || "bg-blue-50 text-blue-900"}`}>
                          {statusLabel[order.status]}
                        </span>
                      </div>
                      <p className="text-ink/60 truncate max-w-[150px]">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-950">Rp{order.total_amount.toLocaleString("id-ID")}</p>
                      <p className="text-[10px] text-ink/40 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
