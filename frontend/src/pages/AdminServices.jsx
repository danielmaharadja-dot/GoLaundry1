import { useEffect, useState } from "react";
import { api } from "../api.js";

const emptyForm = { name: "", description: "", unit: "kg", price: "", price_express: "", eta_hours: 24, eta_hours_express: 12 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.getAllServices().then((data) => setServices(data.services));
  }
  useEffect(load, []);

  function startEdit(service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      unit: service.unit,
      price: service.price,
      price_express: service.price_express || "",
      eta_hours: service.eta_hours,
      eta_hours_express: service.eta_hours_express || 12,
    });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateService(editingId, form);
      } else {
        await api.createService(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(service) {
    if (service.is_active) {
      await api.deactivateService(service.id);
    } else {
      await api.updateService(service.id, { is_active: true });
    }
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-blue-950">Kelola Layanan</h1>
          <p className="text-ink/60 mt-1">Atur jenis layanan dan harga laundry.</p>
        </div>
        <button onClick={startNew} className="btn-coral text-sm py-2.5 px-4 shrink-0">
          + Layanan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-display font-semibold text-blue-950">
            {editingId ? "Edit Layanan" : "Layanan Baru"}
          </h2>
          <input required className="input" placeholder="Nama layanan"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <textarea className="input" placeholder="Deskripsi (opsional)" rows={2}
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="label text-[10px] uppercase font-bold text-blue-950 mb-1">Satuan</label>
              <select className="input text-sm py-2 bg-blue-100/5" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                <option value="kg">kg</option>
                <option value="pcs">pcs</option>
                <option value="set">set</option>
              </select>
            </div>
            <div>
              <label className="label text-[10px] uppercase font-bold text-blue-950 mb-1">Harga Reguler</label>
              <input required type="number" min="0" className="input text-sm py-2 bg-blue-100/5" placeholder="Harga Reguler"
                value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="label text-[10px] uppercase font-bold text-blue-950 mb-1">Harga Express</label>
              <input required type="number" min="0" className="input text-sm py-2 bg-blue-100/5" placeholder="Harga Express"
                value={form.price_express} onChange={(e) => setForm((f) => ({ ...f, price_express: e.target.value }))} />
            </div>
            <div>
              <label className="label text-[10px] uppercase font-bold text-blue-950 mb-1">Est. Reguler (jam)</label>
              <input required type="number" min="1" className="input text-sm py-2 bg-blue-100/5" placeholder="Est. Reguler (jam)"
                value={form.eta_hours} onChange={(e) => setForm((f) => ({ ...f, eta_hours: e.target.value }))} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label text-[10px] uppercase font-bold text-blue-950 mb-1">Est. Express (jam)</label>
              <input required type="number" min="1" className="input text-sm py-2 bg-blue-100/5" placeholder="Est. Express (jam)"
                value={form.eta_hours_express} onChange={(e) => setForm((f) => ({ ...f, eta_hours_express: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-coral-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 text-sm py-2.5">Simpan</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ink/50 px-3">Batal</button>
          </div>
        </form>
      )}
 
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="card flex items-center justify-between gap-3">
            <div className={!service.is_active ? "opacity-40" : ""}>
              <p className="font-medium text-blue-950">{service.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60 mt-1">
                <span>🕒 Reguler: <span className="font-semibold text-blue-900">Rp{Number(service.price).toLocaleString("id-ID")}</span>/{service.unit} ({service.eta_hours} jam)</span>
                <span>⚡ Express: <span className="font-semibold text-amber-600">Rp{Number(service.price_express).toLocaleString("id-ID")}</span>/{service.unit} ({service.eta_hours_express || 12} jam)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => startEdit(service)} className="text-blue-900 text-sm font-medium">Edit</button>
              <button onClick={() => toggleActive(service)} className="text-sm font-medium text-ink/50">
                {service.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
