import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTexts, setReplyTexts] = useState({});
  const [submittingIds, setSubmittingIds] = useState({});

  function load() {
    api.getReviews()
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const handleReplyChange = (id, text) => {
    setReplyTexts((prev) => ({ ...prev, [id]: text }));
  };

  const handleSendReply = async (e, id) => {
    e.preventDefault();
    const text = replyTexts[id];
    if (!text || !text.trim()) return;

    setSubmittingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await api.submitReviewReply(id, { reply: text });
      alert("Balasan ulasan berhasil dikirim!");
      handleReplyChange(id, "");
      load();
    } catch (err) {
      alert(err.message || "Gagal mengirim balasan.");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <p className="text-ink/50 text-sm">Memuat ulasan...</p>;
  if (error) return <p className="text-coral-600 text-sm">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-blue-950">Kelola Ulasan</h1>
        <p className="text-ink/60 mt-1">Pantau dan beri tanggapan pada ulasan yang dikirim pelanggan.</p>
      </div>

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
                <p className="text-sm text-ink/80 bg-sky-50/20 p-3 rounded-xl border border-sky-100">
                  "{rev.comment}"
                </p>
              )}

              {/* Box Balasan */}
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
                <form onSubmit={(e) => handleSendReply(e, rev.id)} className="space-y-2 pt-1">
                  <label className="label text-[11px] text-blue-950 font-bold block">Tulis Balasan:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Terima kasih atas ulasan Anda..."
                      value={replyTexts[rev.id] || ""}
                      onChange={(e) => handleReplyChange(rev.id, e.target.value)}
                      className="input text-xs py-2 bg-sky-50/50 border border-sky-200/60 focus:border-sky-500 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={submittingIds[rev.id]}
                      className="btn-primary py-2 px-4 text-xs font-semibold"
                    >
                      {submittingIds[rev.id] ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
