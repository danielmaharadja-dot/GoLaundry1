import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReviews()
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  if (loading) return <p className="text-ink/50 text-sm">Memuat ulasan...</p>;
  if (error) return <p className="text-coral-600 text-sm">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Ulasan Pelanggan</h1>
          <p className="text-ink/60 mt-1">Ulasan jujur dari komunitas pelanggan GoLaundry.</p>
        </div>
      </div>

      {/* Petunjuk Beri Ulasan */}
      <div className="bg-white border border-blue-900/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-semibold text-blue-950 text-sm">Ingin membagikan ulasan Anda?</h3>
          <p className="text-xs text-ink/50 mt-0.5">Ulasan hanya bisa ditulis melalui halaman Rincian Pesanan setelah pesanan Anda Selesai.</p>
        </div>
        <Link to="/app/riwayat" className="btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap">
          Tulis Ulasan di Riwayat
        </Link>
      </div>

      {reviews.length > 0 && (
        <div className="card bg-sky-50 border border-sky-200/60 flex flex-col sm:flex-row items-center gap-4 py-5 px-6">
          <div className="text-center sm:text-left">
            <p className="text-3xl font-display font-bold text-blue-950">{calculateAverage()} / 5.0</p>
            <div className="text-amber-500 text-xl font-bold tracking-wide mt-1">
              {renderStars(Math.round(Number(calculateAverage())))}
            </div>
            <p className="text-xs text-ink/50 mt-1">Berdasarkan {reviews.length} ulasan pelanggan</p>
          </div>
          <div className="hidden sm:block border-l border-sky-200/60 h-16 mx-4"></div>
          <div className="text-xs text-ink/70 leading-relaxed text-center sm:text-left flex-1">
            Kami sangat menghargai setiap masukan Anda. Ulasan membantu kami terus meningkatkan kualitas pencucian dan kecepatan layanan kurir GoLaundry.
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-3xl">⭐</span>
          <p className="text-ink/50 mt-2 text-sm">Belum ada ulasan dari pelanggan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-950">{rev.customer_name}</p>
                  <p className="text-[10px] text-ink/40 mt-0.5">Kode Pesanan: {rev.order_code}</p>
                </div>
                <div className="text-right">
                  <div className="text-amber-500 font-bold tracking-wide text-sm">
                    {renderStars(rev.rating)}
                  </div>
                  <p className="text-[10px] text-ink/40 mt-1">
                    {new Date(rev.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              {rev.comment && (
                <p className="text-sm text-ink/80 leading-relaxed bg-sky-50/20 p-3 rounded-xl border border-sky-100">
                  "{rev.comment}"
                </p>
              )}

              {/* Balasan Admin */}
              {rev.reply ? (
                <div className="bg-sky-50 border-l-2 border-sky-500 rounded-r-xl px-4 py-3 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-950">Balasan Admin GoLaundry 👤</span>
                    <span className="text-[10px] text-ink/40">
                      {new Date(rev.replied_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <p className="text-ink/75 leading-relaxed italic">"{rev.reply}"</p>
                </div>
              ) : (
                <p className="text-[10px] text-ink/40 italic">Belum ada tanggapan dari Admin.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
