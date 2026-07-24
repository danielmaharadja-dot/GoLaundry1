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

  // Data konfigurasi busa sabun animasi
  const bubbles = [
    { size: "w-16 h-16 sm:w-24 sm:h-24", left: "left-[5%]", duration: "12s", delay: "0s" },
    { size: "w-24 h-24 sm:w-36 sm:h-36", left: "left-[18%]", duration: "16s", delay: "2s" },
    { size: "w-12 h-12 sm:w-16 sm:h-16", left: "left-[32%]", duration: "10s", delay: "4s" },
    { size: "w-28 h-28 sm:w-40 sm:h-40", left: "left-[45%]", duration: "18s", delay: "1s" },
    { size: "w-16 h-16 sm:w-20 sm:h-20", left: "left-[60%]", duration: "14s", delay: "5s" },
    { size: "w-20 h-20 sm:w-32 sm:h-32", left: "left-[75%]", duration: "15s", delay: "3s" },
    { size: "w-14 h-14 sm:w-24 sm:h-24", left: "left-[88%]", duration: "11s", delay: "6s" },
    { size: "w-10 h-10 sm:w-14 sm:h-14", left: "left-[12%]", duration: "9s", delay: "7s" },
    { size: "w-20 h-20 sm:w-28 sm:h-28", left: "left-[52%]", duration: "17s", delay: "8s" },
    { size: "w-12 h-12 sm:w-18 sm:h-18", left: "left-[82%]", duration: "13s", delay: "2.5s" },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 px-4 py-10 overflow-hidden">
      {/* Background Busa Sabun Bergerak */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {bubbles.map((b, index) => (
          <div
            key={index}
            className={`absolute bottom-0 rounded-full bg-gradient-to-tr from-cyan-400/35 via-blue-300/45 to-white/90 border-2 border-white/90 shadow-lg shadow-cyan-300/40 backdrop-blur-[1px] animate-bubble ${b.size} ${b.left}`}
            style={{
              animationDuration: b.duration,
              animationDelay: b.delay,
            }}
          >
            {/* Pantulan Cahaya Kilau Busa */}
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] bg-white/95 rounded-full blur-[0.5px]" />
            <div className="absolute top-[10%] left-[12%] w-[15%] h-[15%] bg-white rounded-full shadow-sm" />
          </div>
        ))}

      </div>

      {/* Konten Form Login */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-white/80 backdrop-blur-md shadow-md border border-white/60 mb-3 animate-bounce">
            <span className="text-4xl">🧺</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            <span className="text-blue-600">Go</span>
            <span className="text-blue-950">Laundry</span>
          </h1>
          <p className="text-ink/70 text-sm mt-1.5 font-medium">Laundry antar jemput, tinggal duduk manis.</p>
        </div>

        <form onSubmit={handleSubmit} className="card bg-white/85 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-900/10 space-y-4">
          <h2 className="font-display font-semibold text-lg text-blue-950">Masuk ke akun</h2>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input bg-white/90 focus:bg-white"
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
              className="input bg-white/90 focus:bg-white"
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

          <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-blue-600/25">
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

