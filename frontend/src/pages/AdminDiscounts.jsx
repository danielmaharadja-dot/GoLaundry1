import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminDiscounts() {
  const [settings, setSettings] = useState({
    loyalty_order_count: "10",
    loyalty_discount_percent: "20",
    promo_discount_percent: "10",
    promo_banner_text: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings
          }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await api.updateSettings(settings);
      setMessage("Pengaturan diskon berhasil diperbarui!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Gagal memperbarui pengaturan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-ink/50 text-sm">Memuat pengaturan...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-blue-950">Kelola Diskon & Promo</h1>
        <p className="text-ink/60 mt-1">Atur program loyalitas dan diskon promo yang ditawarkan kepada pelanggan.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-950 rounded-xl text-sm flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold">Sukses</p>
            <p className="text-emerald-900/80 mt-0.5">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-coral-50 border border-coral-500/20 text-coral-950 rounded-xl text-sm flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="font-semibold">Kesalahan</p>
            <p className="text-coral-900/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="font-display font-semibold text-blue-950 text-base border-b border-blue-950/5 pb-2">
          🎁 Program Diskon Loyalitas Pelanggan
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="loyalty-threshold">
              Jumlah Batas Pesanan (Threshold)
            </label>
            <input
              id="loyalty-threshold"
              type="number"
              min="1"
              required
              className="input bg-blue-100/5"
              placeholder="10"
              value={settings.loyalty_order_count}
              onChange={(e) => setSettings((s) => ({ ...s, loyalty_order_count: e.target.value }))}
            />
            <span className="text-[10px] text-ink/40 mt-1 block">
              Jumlah pesanan berstatus "Selesai" yang harus dipenuhi pelanggan untuk berhak mendapat diskon.
            </span>
          </div>

          <div>
            <label className="label" htmlFor="loyalty-percent">
              Persentase Potongan (%)
            </label>
            <input
              id="loyalty-percent"
              type="number"
              min="0"
              max="100"
              required
              className="input bg-blue-100/5"
              placeholder="20"
              value={settings.loyalty_discount_percent}
              onChange={(e) => setSettings((s) => ({ ...s, loyalty_discount_percent: e.target.value }))}
            />
            <span className="text-[10px] text-ink/40 mt-1 block">
              Persentase diskon yang diberikan ke pelanggan pada pesanan berikutnya setelah mencapai batas pesanan.
            </span>
          </div>
        </div>

        <h3 className="font-display font-semibold text-blue-950 text-base border-b border-blue-950/5 pb-2 pt-4">
          📢 Pengaturan Banner Promo Umum
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-1">
            <label className="label" htmlFor="promo-percent">
              Diskon Promo (%)
            </label>
            <input
              id="promo-percent"
              type="number"
              min="0"
              max="100"
              required
              className="input bg-blue-100/5"
              placeholder="10"
              value={settings.promo_discount_percent}
              onChange={(e) => setSettings((s) => ({ ...s, promo_discount_percent: e.target.value }))}
            />
            <span className="text-[10px] text-ink/40 mt-1 block">
              Diskon dasar untuk semua pesanan (set 0 untuk menonaktifkan).
            </span>
          </div>

          <div className="sm:col-span-3">
            <label className="label" htmlFor="promo-text">
              Teks Pengumuman Promo
            </label>
            <input
              id="promo-text"
              type="text"
              className="input bg-blue-100/5"
              placeholder="Masukkan teks promosi yang menarik..."
              value={settings.promo_banner_text}
              onChange={(e) => setSettings((s) => ({ ...s, promo_banner_text: e.target.value }))}
            />
            <span className="text-[10px] text-ink/40 mt-1 block">
              Kalimat promosi ini akan tampil di bagian atas Beranda Pelanggan untuk memikat minat mereka.
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-sm font-semibold mt-6"
        >
          {submitting ? "Menyimpan Perubahan..." : "Simpan Pengaturan Diskon"}
        </button>
      </form>
    </div>
  );
}
