import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import StatusTracker from "../components/StatusTracker.jsx";

const paymentMethodLabel = {
  cash: "Tunai (Cash)",
  transfer: "Transfer Bank",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk form pembayaran
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // State untuk review & rating
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  function load() {
    api.getOrderDetail(id)
      .then((res) => {
        setData(res);
        if (res.order && res.order.delivery_type === "pickup_delivery") {
          setPaymentMethod("transfer");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    api.getOrderReview(id)
      .then((res) => setReview(res.review))
      .catch((err) => console.error("Gagal memuat ulasan:", err));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSendPayment(e) {
    e.preventDefault();
    setPaymentError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("payment_method", paymentMethod);
      if (paymentMethod === "transfer") {
        if (!paymentProofFile) {
          throw new Error("Silakan pilih file bukti transfer terlebih dahulu.");
        }
        formData.append("payment_proof", paymentProofFile);
      }

      await api.submitPayment(id, formData);
      alert("Bukti pembayaran berhasil dikirim!");
      load(); // Refresh data order
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || "Gagal mengirim konfirmasi pembayaran.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReview(e) {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const res = await api.submitReview({
        order_id: id,
        rating,
        comment: comment.trim() || null
      });
      alert("Terima kasih atas ulasan Anda!");
      setReview(res.review);
    } catch (err) {
      alert(err.message || "Gagal mengirimkan ulasan.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) return <p className="text-ink/50 text-sm">Memuat...</p>;
  if (error) return <p className="text-coral-600 text-sm">{error}</p>;
  if (!data) return null;

  const { order, items } = data;

  // Base URL untuk bukti transfer statis
  const uploadBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace("/api", "") 
    : "http://localhost:4000";

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link to="/app/riwayat" className="text-sm text-blue-900 font-medium">← Kembali</Link>
        <h1 className="font-display font-bold text-2xl text-blue-950 mt-2">{order.order_code}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-900 text-white">
            {order.delivery_type === "self_service" ? "🏪 Kirim & Ambil Sendiri" : "🚀 Antar Jemput Kurir"}
          </span>
          {order.outlet_name && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-sky-100 text-sky-950 border border-sky-300">
              🏪 {order.outlet_name} {Number(order.distance_km) > 0 ? `(${Number(order.distance_km)} km)` : ""}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded ${
            order.service_type === "express" ? "bg-amber-500 text-white animate-pulse" : "bg-slate-100 text-slate-800"
          }`}>
            {order.service_type === "express" ? "⚡ Express (8-12 jam)" : "🕒 Reguler (2-3 hari)"}
          </span>
          <span className="text-sm text-ink/60">
            {order.delivery_type === "self_service" ? (
              "Drop-off & Pickup di Outlet GoLaundry"
            ) : (
              <>
                {order.full_address}
                {order.maps_link && (
                  <a
                    href={order.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-blue-900 hover:text-blue-950 font-semibold ml-2 underline"
                  >
                    📍 Lihat Peta
                  </a>
                )}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="card">
        <StatusTracker status={order.status} />
      </div>

      {order.status === "cancelled" && (
        <div className="bg-coral-50 border border-coral-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-coral-700 font-bold text-base">
            <span className="text-xl">🚫</span>
            <span>Pesanan Ini Telah Dibatalkan</span>
          </div>
          {order.cancel_reason ? (
            <div className="bg-white/80 border border-coral-200/50 rounded-xl p-3 text-sm text-coral-950">
              <span className="font-semibold text-coral-800 block text-xs mb-0.5">Alasan Pembatalan dari Admin:</span>
              <p className="italic leading-relaxed">"{order.cancel_reason}"</p>
            </div>
          ) : (
            <p className="text-xs text-coral-900/80">
              Pesanan telah dibatalkan oleh pihak GoLaundry. Silakan hubungi admin jika Anda membutuhkan bantuan lebih lanjut.
            </p>
          )}
        </div>
      )}

      {/* Rincian Pesanan */}
      <div className="card space-y-3">
        <h2 className="font-display font-semibold text-blue-950">Detail Layanan</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-blue-900/5 last:border-0">
            <span className="text-ink">{item.service_name} × {item.quantity} {item.unit}</span>
            <span className="font-medium text-blue-950">Rp{Number(item.subtotal).toLocaleString("id-ID")}</span>
          </div>
        ))}

        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>{order.discount_type === "loyalty" ? "Diskon Loyalitas" : "Diskon Promo"}</span>
            <span>-Rp{Number(order.discount_amount).toLocaleString("id-ID")}</span>
          </div>
        )}

        {order.delivery_type === "pickup_delivery" && (
          <div className="flex justify-between text-sm text-ink/60">
            <span>
              Ongkir {Number(order.distance_km) > 0 ? `(${Number(order.distance_km)} km)` : ""}
            </span>
            <span className="font-medium text-blue-950">
              {Number(order.shipping_fee) > 0 
                ? `+Rp${Number(order.shipping_fee).toLocaleString("id-ID")}` 
                : "Gratis (≤2km)"}
            </span>
          </div>
        )}

        <div className="flex justify-between pt-2 font-semibold border-t border-blue-950/5">
          <span className="text-blue-950">Total Tagihan</span>
          <span className="text-blue-950 text-lg">Rp{Number(order.total_amount).toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Section Pembayaran */}
      <div className="card space-y-4">
        <h2 className="font-display font-semibold text-blue-950">Informasi Pembayaran</h2>
        
        {/* Kasus 1: Sudah Lunas */}
        {order.payment_status === "paid" ? (
          <div className="bg-sky-50 border border-sky-200/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink/60">Status:</span>
              <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full text-xs">Lunas</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-ink/60">Metode:</span>
              <span className="font-semibold text-blue-950">{paymentMethodLabel[order.payment_method] || "-"}</span>
            </div>
            {order.payment_proof && (
              <div className="pt-2">
                <span className="text-xs text-ink/40 block mb-1">Bukti Transfer:</span>
                <a 
                  href={`${uploadBaseUrl}/uploads/${order.payment_proof}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img 
                    src={`${uploadBaseUrl}/uploads/${order.payment_proof}`} 
                    alt="Bukti Transfer" 
                    className="h-32 rounded border border-sky-200/50 hover:opacity-85 transition-opacity"
                  />
                </a>
              </div>
            )}
          </div>
        ) : order.payment_method ? (
          /* Kasus 2: Menunggu Konfirmasi Admin */
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink/60">Status:</span>
              <span className="font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full text-xs">Menunggu Konfirmasi</span>
            </div>
            <p className="text-xs text-ink/70">
              Konfirmasi pembayaran Anda sedang diperiksa oleh Admin. Mohon tunggu proses validasi.
            </p>
            <div className="divide-y divide-amber-900/5 text-sm pt-1">
              <div className="flex justify-between py-2">
                <span className="text-ink/60">Metode Terpilih:</span>
                <span className="font-semibold text-blue-950">{paymentMethodLabel[order.payment_method]}</span>
              </div>
              {order.payment_proof && (
                <div className="py-2.5">
                  <span className="text-xs text-ink/40 block mb-1.5">Bukti Transfer yang Dikirim:</span>
                  <a 
                    href={`${uploadBaseUrl}/uploads/${order.payment_proof}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src={`${uploadBaseUrl}/uploads/${order.payment_proof}`} 
                      alt="Bukti Transfer" 
                      className="h-32 rounded border border-amber-900/10 hover:opacity-85 transition-opacity"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Kasus 3: Belum Bayar dan Belum Upload */
          <form onSubmit={handleSendPayment} className="space-y-4">
            <div className="flex justify-between items-center text-sm pb-1">
              <span className="text-ink/60">Status Tagihan:</span>
              <span className="font-bold text-coral-600 bg-coral-100 px-2.5 py-1 rounded-full text-xs">Belum Bayar</span>
            </div>

            {/* Pemilihan Metode */}
            <div>
              <span className="label">Metode Pembayaran:</span>
              {order.delivery_type === "pickup_delivery" ? (
                <div className="bg-sky-50 border border-sky-200/60 rounded-xl p-3.5 mb-2">
                  <p className="text-xs text-sky-950 font-bold flex items-center gap-1.5">
                    <span>💳 Transfer Bank (Wajib)</span>
                  </p>
                  <p className="text-[11px] text-ink/60 mt-1">
                    Metode antar jemput kurir mewajibkan pembayaran via Transfer Bank sebelum pakaian selesai diproses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-3 rounded-xl border font-semibold text-sm text-center transition-all ${
                      paymentMethod === "transfer"
                        ? "bg-sky-100/70 border-sky-600 text-sky-950 shadow-sm"
                        : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
                    }`}
                  >
                    💳 Transfer Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-xl border font-semibold text-sm text-center transition-all ${
                      paymentMethod === "cash"
                        ? "bg-sky-100/70 border-sky-600 text-sky-950 shadow-sm"
                        : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
                    }`}
                  >
                    💵 Tunai (Cash)
                  </button>
                </div>
              )}
            </div>

            {/* Area instruksi transfer */}
            {paymentMethod === "transfer" ? (
              <div className="space-y-3">
                <div className="bg-sky-50 p-4 rounded-xl text-xs space-y-2 text-ink/80 border border-sky-100">
                  <p className="font-bold text-sky-950 text-sm">Info Rekening Pembayaran:</p>
                  <div>
                    <p className="font-semibold text-blue-950">🏦 Bank BCA</p>
                    <p>No. Rekening: <span className="font-mono font-bold">028-112-9840</span></p>
                    <p>a/n: GoLaundry Indonesia</p>
                  </div>
                  <div className="pt-1.5 border-t border-sky-100">
                    <p className="font-semibold text-blue-950">🏦 Bank Mandiri</p>
                    <p>No. Rekening: <span className="font-mono font-bold">137-00-29103-90</span></p>
                    <p>a/n: GoLaundry Indonesia</p>
                  </div>
                </div>

                {/* Upload Bukti */}
                <div>
                  <label htmlFor="proofUpload" className="label">Upload Bukti Transfer (Gambar/Foto):</label>
                  <input
                    id="proofUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProofFile(e.target.files[0])}
                    className="w-full text-sm text-ink/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-900 hover:file:bg-sky-200 cursor-pointer"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="bg-sky-50 p-4 rounded-xl text-xs text-ink/85 border border-sky-100">
                <p className="font-bold text-sky-950 text-sm mb-1">🏦 Catatan Pembayaran Tunai (Cash):</p>
                <p>
                  Pembayaran dilakukan secara tunai langsung kepada kurir kami saat pakaian Anda dijemput (pickup) atau diantar kembali (delivered).
                </p>
              </div>
            )}

            {paymentError && <p className="text-xs text-coral-600 font-medium">{paymentError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {submitting ? "Mengirim..." : "Kirim Konfirmasi Pembayaran"}
            </button>
          </form>
        )}
      </div>

      {order.notes && (
        <div className="card">
          <h2 className="font-display font-semibold text-blue-950 mb-1">Catatan Pesanan</h2>
          <p className="text-sm text-ink/70">{order.notes}</p>
        </div>
      )}

      {/* Seksi Ulasan & Rating Pelanggan (Hanya jika order selesai / 'delivered') */}
      {order.status === "delivered" && (
        <div className="card space-y-4 border border-sky-200">
          <div>
            <h2 className="font-display font-semibold text-blue-950 mb-0.5">Ulasan & Rating Anda</h2>
            <p className="text-xs text-ink/50">Bagikan pengalaman Anda menggunakan jasa GoLaundry.</p>
          </div>

          {review ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-amber-500 font-bold tracking-wide text-lg">
                  {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                </div>
                <span className="text-[10px] text-ink/40">
                  {new Date(review.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-ink/75 italic bg-sky-50/20 p-3 rounded-xl border border-sky-100">
                  "{review.comment}"
                </p>
              )}

              {/* Balasan Admin */}
              {review.reply ? (
                <div className="bg-sky-50 border-l-2 border-sky-500 rounded-r-xl px-4 py-3 text-xs space-y-1 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-950">Balasan Admin GoLaundry 👤</span>
                    <span className="text-[10px] text-ink/40">
                      {new Date(review.replied_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <p className="text-ink/75 leading-relaxed italic">"{review.reply}"</p>
                </div>
              ) : (
                <p className="text-[10px] text-ink/40 italic">Menunggu tanggapan dari Admin.</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendReview} className="space-y-3 pt-1">
              <div>
                <label className="label text-[11px] text-blue-950 font-bold block mb-1">Pilih Bintang:</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-colors ${
                        rating >= star ? "text-amber-500" : "text-ink/20"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label text-[11px] text-blue-950 font-bold block mb-1" htmlFor="comment">Komentar / Ulasan (Opsional):</label>
                <textarea
                  id="comment"
                  className="input text-sm py-2"
                  rows={3}
                  placeholder="Ceritakan kepuasan Anda tentang hasil cucian kami..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="btn-primary w-full py-2 text-xs font-semibold"
              >
                {reviewSubmitting ? "Mengirim..." : "Kirim Ulasan & Rating"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
