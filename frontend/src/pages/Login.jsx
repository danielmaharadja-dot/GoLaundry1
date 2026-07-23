import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      setError(err.message);
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
          <h2 className="font-display font-semibold text-lg text-blue-950">Masuk ke akun</h2>

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
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Lupa password?
              </Link>
            </div>
          </div>

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <p className="text-sm text-center text-ink/60">
            Belum punya akun?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Daftar sekarang
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
