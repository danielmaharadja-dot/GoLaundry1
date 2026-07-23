import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.forgotPassword({ email });
      setSuccess(data.message || "Link reset password telah dikirim ke email Anda.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Gagal mengirim link reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧺</div>
          <h1 className="font-display font-bold text-2xl"><span className="text-blue-600">Go</span><span className="text-blue-950">Laundry</span></h1>
          <p className="text-ink/60 text-sm mt-1">Laundry antar jemput, tinggal duduk manis.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-display font-semibold text-lg text-blue-950">Lupa Password</h2>
          
          <p className="text-sm text-ink/70">
            Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan email berisi link untuk mengatur ulang password Anda.
          </p>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
            />
          </div>

          {error && <p className="text-sm text-coral-600">{error}</p>}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-950 rounded-xl text-sm flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold">Tautan Reset Terkirim</p>
                <p className="text-emerald-900/80 mt-0.5">{success}</p>
              </div>
            </div>
          )}

          {!success ? (
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          ) : null}

          <div className="text-center pt-2">
            <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Kembali ke Halaman Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
