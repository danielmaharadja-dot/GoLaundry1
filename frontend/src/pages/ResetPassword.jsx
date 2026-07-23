import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !email) {
      setError("Token atau email tidak valid. Silakan minta tautan baru.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.resetPassword({ token, email, password });
      setSuccess(data.message || "Password Anda telah berhasil diubah.");
    } catch (err) {
      setError(err.message || "Gagal mengatur ulang password.");
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
          <h2 className="font-display font-semibold text-lg text-blue-950">Reset Password</h2>

          {(!token || !email) ? (
            <div className="space-y-4">
              <p className="text-sm text-coral-600">
                Tautan reset password tidak valid atau tidak lengkap.
              </p>
              <div className="text-center">
                <Link to="/forgot-password" className="btn-primary inline-block w-full text-center">
                  Minta Tautan Baru
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink/70">
                Masukkan password baru untuk akun Anda (<strong>{email}</strong>).
              </p>

              <div>
                <label className="label" htmlFor="password">Password Baru</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className="label" htmlFor="confirm-password">Konfirmasi Password Baru</label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                />
              </div>

              {error && <p className="text-sm text-coral-600">{error}</p>}
              {success && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-950 rounded-xl text-sm flex items-start gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="font-semibold">Password Berhasil Diperbarui</p>
                      <p className="text-emerald-900/80 mt-0.5">{success}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="btn-primary w-full"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )}

              {!success && (
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Memperbarui..." : "Perbarui Password"}
                </button>
              )}
            </>
          )}

          {!success && (
            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Kembali ke Halaman Login
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
