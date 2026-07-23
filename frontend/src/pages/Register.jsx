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

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧺</div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Buat akun <span className="text-blue-600">Go</span>Laundry</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="name">Nama lengkap</label>
            <input id="name" required className="input" placeholder="Nama Anda"
              value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" placeholder="nama@email.com"
              value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="phone">Nomor HP</label>
            <input id="phone" className="input" placeholder="08xxxxxxxxxx"
              value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} className="input" placeholder="Minimal 6 karakter"
              value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
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
