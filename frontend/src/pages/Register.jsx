import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(form);
      login(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] bg-white/95 rounded-full blur-[0.5px]" />
            <div className="absolute top-[10%] left-[12%] w-[15%] h-[15%] bg-white rounded-full shadow-sm" />
          </div>
        ))}

      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-white/80 backdrop-blur-md shadow-md border border-white/60 mb-3 animate-bounce">
            <span className="text-4xl">🧺</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Buat akun <span className="text-blue-600">Go</span>Laundry</h1>
        </div>

        <form onSubmit={handleSubmit} className="card bg-white/85 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-900/10 space-y-4">
          <div>
            <label className="label" htmlFor="name">Nama lengkap</label>
            <input id="name" required className="input bg-white/90 focus:bg-white" placeholder="Nama Anda"
              value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input bg-white/90 focus:bg-white" placeholder="nama@email.com"
              value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="phone">Nomor HP</label>
            <input id="phone" className="input bg-white/90 focus:bg-white" placeholder="08xxxxxxxxxx"
              value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} className="input bg-white/90 focus:bg-white" placeholder="Minimal 6 karakter"
              value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-blue-600/25">
            {loading ? "Memproses..." : "Daftar"}
          </button>

          <p className="text-sm text-center text-ink/60">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Masuk</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

