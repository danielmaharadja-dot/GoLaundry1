import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const statusLabel = {
  pending: "Menunggu konfirmasi",
  picked_up: "Sudah dijemput",
  in_process: "Sedang dicuci",
  ready: "Siap diantar",
  delivered: "Selesai diantar",
  cancelled: "Dibatalkan",
};

const slides = [
  {
    url: "/images/laundry_interior.png",
    title: "Outlet Modern & Bersih",
    desc: "Nikmati kenyamanan mencuci dengan mesin canggih berstandar tinggi."
  },
  {
    url: "/images/laundry_folded.png",
    title: "Pakaian Rapi & Harum",
    desc: "Menggunakan detergen ramah lingkungan dan parfum tahan lama premium."
  },
  {
    url: "/images/laundry_delivery.png",
    title: "Layanan Antar Jemput Kurir",
    desc: "Pakaian kotor dijemput, pakaian bersih diantar kembali langsung ke pintu Anda."
  }
];

export default function CustomerHome() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [discountStatus, setDiscountStatus] = useState(null);

  useEffect(() => {
    api.getMyOrders().then((data) => setOrders(data.orders)).finally(() => setLoading(false));
    api.getCustomerDiscountStatus().then((data) => setDiscountStatus(data)).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-blue-950">
          Halo, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-ink/60 mt-1">Mau cuci apa hari ini?</p>
      </div>

      {/* Image Slider */}
      <div className="relative overflow-hidden rounded-2xl h-48 sm:h-60 shadow-sm bg-blue-900 group">
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((s, idx) => (
            <div key={idx} className="w-full h-full shrink-0 relative">
              <img 
                src={s.url} 
                alt={s.title} 
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/90 to-transparent p-4 text-white">
                <h3 className="font-display font-bold text-sm sm:text-base">{s.title}</h3>
                <p className="text-[10px] sm:text-xs text-blue-100/90 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Left Arrow */}
        <button 
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 font-bold text-lg select-none"
        >
          ‹
        </button>

        {/* Right Arrow */}
        <button 
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 font-bold text-lg select-none"
        >
          ›
        </button>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                currentSlide === idx ? "bg-white w-3.5" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Program Diskon / Loyalitas Pelanggan */}
      {discountStatus && (
        <div className="space-y-3">
          {/* Banner Promo Tambahan dari Admin */}
          {discountStatus.promo_banner_text && (
            <div className="bg-amber-50 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <span className="text-xl">📢</span>
              <div className="flex-1 text-xs sm:text-sm text-amber-900 font-medium">
                {discountStatus.promo_banner_text}
                {discountStatus.promo_discount_percent > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Potongan {discountStatus.promo_discount_percent}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Kartu Progres Diskon Loyalitas (10x order) */}
          <div className="card bg-gradient-to-br from-blue-900 to-blue-950 text-white border-0 shadow-md p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg flex items-center gap-1.5">
                  <span>🎁</span> Program Loyalitas GoLaundry
                </h2>
                <p className="text-[10px] sm:text-xs text-blue-100/70 mt-0.5">
                  Kumpulkan pesanan Selesai untuk meraih keuntungan diskon khusus.
                </p>
              </div>
              <span className="text-2xl">✨</span>
            </div>

            {discountStatus.has_loyalty_discount ? (
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-xs sm:text-sm space-y-1">
                <p className="font-bold text-amber-400">🎉 Selamat! Diskon Loyalitas Anda Aktif!</p>
                <p className="text-blue-50">
                  Anda mendapatkan diskon **{discountStatus.loyalty_discount_percent}%** pada pesanan berikutnya karena telah menyelesaikan {discountStatus.completed_orders} pesanan. Potongan otomatis diterapkan di halaman pembayaran.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-blue-100/90">Progres Diskon ({discountStatus.loyalty_discount_percent}%)</span>
                  <span className="text-amber-400">{discountStatus.progress_count} / {discountStatus.loyalty_threshold} Pesanan</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${(discountStatus.progress_count / discountStatus.loyalty_threshold) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-100/60 leading-relaxed italic">
                  Selesaikan {discountStatus.loyalty_threshold - discountStatus.progress_count} pesanan lagi untuk mendapatkan diskon loyalitas sebesar {discountStatus.loyalty_discount_percent}% di pesanan berikutnya!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Link
        to="/app/order"
        className="card flex items-center justify-between bg-blue-900 text-white hover:bg-blue-950 transition-colors"
      >
        <div>
          <p className="font-display font-semibold text-lg">Buat Pesanan Baru</p>
          <p className="text-blue-100/80 text-sm mt-0.5">Jadwalkan penjemputan laundry Anda</p>
        </div>
        <span className="text-2xl">🧺</span>
      </Link>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg text-blue-950">Pesanan Aktif</h2>
          <Link to="/app/riwayat" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat semua</Link>
        </div>

        {loading ? (
          <p className="text-ink/50 text-sm">Memuat...</p>
        ) : active.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-ink/50">Belum ada pesanan aktif.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((order) => (
              <Link
                to={`/app/pesanan/${order.id}`}
                key={order.id}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-blue-950">{order.order_code}</p>
                  <p className="text-sm text-ink/60 mt-0.5">{statusLabel[order.status]}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-950">
                    Rp{Number(order.total_amount).toLocaleString("id-ID")}
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 font-medium">Lihat detail →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Visi Misi Section */}
      <div className="card space-y-4 border border-sky-200 bg-sky-50/30 shadow-sm">
        <div>
          <h2 className="font-display font-bold text-blue-950 text-base flex items-center gap-1.5">
            <span>🌟</span> Visi & Misi GoLaundry
          </h2>
          <p className="text-xs text-ink/50 mt-0.5">Komitmen kami untuk memberikan pelayanan terbaik bagi pakaian Anda.</p>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-sm">
            <h3 className="font-semibold text-blue-950 text-xs flex items-center gap-1.5">
              <span>🎯</span> Visi Kami
            </h3>
            <p className="text-xs text-ink/75 mt-1 leading-relaxed">
              Menjadi penyedia layanan laundry terpercaya nomor satu di Indonesia yang memberikan kemudahan, kecepatan, dan hasil cucian premium yang ramah lingkungan.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-sm">
            <h3 className="font-semibold text-blue-950 text-xs flex items-center gap-1.5">
              <span>🚀</span> Misi Kami
            </h3>
            <ul className="text-xs text-ink/75 mt-1.5 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <strong className="text-blue-950">Pelayanan Terbaik:</strong> Menjamin kebersihan, kerapian, dan keharuman pakaian secara konsisten menggunakan mesin laundry berteknologi modern.
              </li>
              <li>
                <strong className="text-blue-950">Kemudahan Maksimal:</strong> Memberikan kepuasan akses lewat sistem antar-jemput kurir profesional agar menghemat waktu pelanggan.
              </li>
              <li>
                <strong className="text-blue-950">Transparansi Proses:</strong> Menyediakan pelacakan status pesanan real-time yang dapat diakses pelanggan kapan saja.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
