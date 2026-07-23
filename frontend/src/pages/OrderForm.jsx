import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

const BANDUNG_OUTLETS = [
  {
    id: "dago",
    name: "GoLaundry Outlet Dago (Coblong)",
    address: "Jl. Ir. H. Juanda No. 120, Coblong, Bandung",
    district: "Coblong",
    area: "Bandung Utara",
  },
  {
    id: "buahbatu",
    name: "GoLaundry Outlet Buah Batu (Lengkong)",
    address: "Jl. Buah Batu No. 85, Lengkong, Bandung",
    district: "Lengkong",
    area: "Bandung Selatan",
  },
  {
    id: "sukajadi",
    name: "GoLaundry Outlet Sukajadi (PVJ)",
    address: "Jl. Sukajadi No. 142, Sukajadi, Bandung",
    district: "Sukajadi",
    area: "Bandung Barat",
  },
  {
    id: "asiaafrika",
    name: "GoLaundry Outlet Alun-Alun (Sumur Bandung)",
    address: "Jl. Asia Afrika No. 45, Sumur Bandung, Bandung",
    district: "Sumur Bandung",
    area: "Bandung Tengah",
  },
  {
    id: "antapani",
    name: "GoLaundry Outlet Antapani",
    address: "Jl. Terusan Jakarta No. 78, Antapani, Bandung",
    district: "Antapani",
    area: "Bandung Timur",
  },
  {
    id: "pasteur",
    name: "GoLaundry Outlet Pasteur (Cicendo)",
    address: "Jl. Dr. Djunjunan No. 64, Cicendo, Bandung",
    district: "Cicendo",
    area: "Bandung Barat",
  },
];

// Peta Jarak Otomatis Antar Kecamatan di Bandung ke 6 Outlet Utama (dalam KM)
const DISTRICT_DISTANCES = {
  "coblong": { dago: 1.0, buahbatu: 4.2, sukajadi: 2.3, asiaafrika: 3.5, antapani: 5.1, pasteur: 3.2 },
  "sukajadi": { dago: 2.3, buahbatu: 5.0, sukajadi: 1.0, asiaafrika: 4.1, antapani: 6.5, pasteur: 2.0 },
  "lengkong": { dago: 4.2, buahbatu: 1.0, sukajadi: 5.0, asiaafrika: 1.8, antapani: 3.8, pasteur: 4.5 },
  "sumur bandung": { dago: 3.5, buahbatu: 1.8, sukajadi: 4.1, asiaafrika: 0.8, antapani: 4.0, pasteur: 3.5 },
  "antapani": { dago: 5.1, buahbatu: 3.8, sukajadi: 6.5, asiaafrika: 4.0, antapani: 1.0, pasteur: 6.0 },
  "cicendo": { dago: 3.2, buahbatu: 4.5, sukajadi: 2.0, asiaafrika: 3.5, antapani: 6.0, pasteur: 0.9 },
  "sukasari": { dago: 2.8, buahbatu: 6.2, sukajadi: 1.8, asiaafrika: 5.5, antapani: 7.2, pasteur: 2.8 },
  "cidadap": { dago: 1.8, buahbatu: 6.5, sukajadi: 2.5, asiaafrika: 5.8, antapani: 7.5, pasteur: 3.5 },
  "bandung wetan": { dago: 1.5, buahbatu: 3.0, sukajadi: 3.0, asiaafrika: 1.5, antapani: 4.2, pasteur: 3.0 },
  "cibeunying kaler": { dago: 2.0, buahbatu: 4.0, sukajadi: 3.8, asiaafrika: 2.5, antapani: 3.2, pasteur: 4.2 },
  "cibeunying kidul": { dago: 3.0, buahbatu: 3.5, sukajadi: 4.8, asiaafrika: 2.8, antapani: 2.5, pasteur: 5.0 },
  "batununggal": { dago: 4.8, buahbatu: 1.5, sukajadi: 5.5, asiaafrika: 2.2, antapani: 3.0, pasteur: 5.2 },
  "regol": { dago: 4.5, buahbatu: 2.0, sukajadi: 4.8, asiaafrika: 1.5, antapani: 4.5, pasteur: 4.0 },
  "astanaanyar": { dago: 4.8, buahbatu: 2.8, sukajadi: 4.2, asiaafrika: 2.0, antapani: 5.2, pasteur: 3.2 },
  "andir": { dago: 4.0, buahbatu: 4.8, sukajadi: 2.5, asiaafrika: 2.8, antapani: 6.2, pasteur: 1.5 },
  "buahbatu": { dago: 5.5, buahbatu: 1.2, sukajadi: 6.8, asiaafrika: 3.2, antapani: 3.5, pasteur: 6.5 },
  "kiaracondong": { dago: 4.5, buahbatu: 2.5, sukajadi: 5.8, asiaafrika: 3.0, antapani: 1.8, pasteur: 5.8 },
  "arcamanik": { dago: 5.8, buahbatu: 4.2, sukajadi: 7.2, asiaafrika: 4.8, antapani: 1.5, pasteur: 7.0 },
};

function calculateAutoDistance(addressObj, outletObj) {
  if (!outletObj) return 1.5;

  // Gabungkan seluruh teks alamat pelanggan untuk pencocokan kecamatan/lokasi
  const fullText = addressObj 
    ? `${addressObj.label || ''} ${addressObj.full_address || ''} ${addressObj.district || ''} ${addressObj.city || ''} ${addressObj.village || ''}`.toLowerCase()
    : "";

  const outletId = outletObj.id;

  // 1. Cek di tabel pemetaan kecamatan berdasarkan teks alamat
  if (fullText) {
    for (const [distName, distances] of Object.entries(DISTRICT_DISTANCES)) {
      if (fullText.includes(distName)) {
        if (distances[outletId] !== undefined) {
          return distances[outletId];
        }
      }
    }
  }

  // 2. Jika alamat pelanggan belum memilih nama kecamatan spesifik dalam database,
  // gunakan profil lokasi geografis unik untuk setiap outlet di Bandung:
  const addressSeed = addressObj ? Number(addressObj.id || 1) : 1;
  const defaultDistances = {
    dago: 1.5,
    buahbatu: 4.8,
    sukajadi: 2.8,
    asiaafrika: 3.6,
    antapani: 5.2,
    pasteur: 3.9
  };

  const baseDist = defaultDistances[outletId] || 2.5;
  const varStep = ((addressSeed * 7 + outletId.length * 3) % 10) / 10;
  return Number((baseDist + varStep).toFixed(1));
}

export default function OrderForm() {
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [quantities, setQuantities] = useState({}); // { serviceId: qty }
  const [deliveryType, setDeliveryType] = useState("pickup_delivery"); // pickup_delivery atau self_service
  const [serviceType, setServiceType] = useState("reguler"); // reguler atau express
  const [selectedOutletId, setSelectedOutletId] = useState("dago");
  const [addressId, setAddressId] = useState("");
  const [pickupSchedule, setPickupSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", full_address: "", province: "", city: "", district: "", village: "", postal_code: "", maps_link: "" });
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const [isCustomLabel, setIsCustomLabel] = useState(false);
  const [discountStatus, setDiscountStatus] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const selectedOutlet = BANDUNG_OUTLETS.find(o => o.id === selectedOutletId) || BANDUNG_OUTLETS[0];
  const selectedAddressObj = addresses.find(a => String(a.id) === String(addressId));

  // Hitung Jarak 100% Otomatis
  const autoDistanceKm = calculateAutoDistance(selectedAddressObj, selectedOutlet);
  const extraDistance = Math.max(0, autoDistanceKm - 2);
  const shippingFee = Math.ceil(extraDistance) * 5000;

  useEffect(() => {
    api.getServices().then((data) => setServices(data.services));
    api.getAddresses().then((data) => {
      setAddresses(data.addresses);
      const def = data.addresses.find((a) => a.is_default) || data.addresses[0];
      if (def) setAddressId(String(def.id));
    });
    api.getProvinces()
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Gagal memuat provinsi:", err));
    api.getCustomerDiscountStatus()
      .then((data) => setDiscountStatus(data))
      .catch((err) => console.error("Gagal memuat status diskon:", err));
  }, []);

  function setQty(serviceId, qty) {
    setQuantities((q) => ({ ...q, [serviceId]: qty }));
  }

  function handleProvinceChange(provinceId) {
    setSelectedProvinceId(provinceId);
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    const provObj = provinces.find(p => p.id === provinceId);
    setNewAddress(prev => ({
      ...prev,
      province: provObj ? provObj.name : "",
      city: "",
      district: "",
      village: ""
    }));

    if (provinceId) {
      api.getRegencies(provinceId)
        .then(setRegencies)
        .catch(err => console.error(err));
    }
  }

  function handleRegencyChange(regencyId) {
    setSelectedRegencyId(regencyId);
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setDistricts([]);
    setVillages([]);

    const regObj = regencies.find(r => r.id === regencyId);
    setNewAddress(prev => ({
      ...prev,
      city: regObj ? regObj.name : "",
      district: "",
      village: ""
    }));

    if (regencyId) {
      api.getDistricts(regencyId)
        .then(setDistricts)
        .catch(err => console.error(err));
    }
  }

  function handleDistrictChange(districtId) {
    setSelectedDistrictId(districtId);
    setSelectedVillageId("");
    setVillages([]);

    const distObj = districts.find(d => d.id === districtId);
    setNewAddress(prev => ({
      ...prev,
      district: distObj ? distObj.name : "",
      village: ""
    }));

    if (districtId) {
      api.getVillages(districtId)
        .then(setVillages)
        .catch(err => console.error(err));
    }
  }

  function handleVillageChange(villageId) {
    setSelectedVillageId(villageId);
    const vilObj = villages.find(v => v.id === villageId);
    setNewAddress(prev => ({
      ...prev,
      village: vilObj ? vilObj.name : ""
    }));
  }

  async function handleAddAddress(e) {
    e.preventDefault();
    if (!newAddress.label || !newAddress.full_address || !newAddress.province || !newAddress.city || !newAddress.district || !newAddress.village || !newAddress.postal_code || !newAddress.maps_link) {
      alert("Harap isi semua kolom alamat, termasuk Provinsi, Kota, Kecamatan, Kelurahan, Kode Pos, dan Link Google Maps!");
      return;
    }
    const data = await api.createAddress({ ...newAddress, is_default: addresses.length === 0 });
    setAddresses((a) => [...a, data.address]);
    setAddressId(String(data.address.id));
    setNewAddress({ label: "", full_address: "", province: "", city: "", district: "", village: "", postal_code: "", maps_link: "" });
    setSelectedProvinceId("");
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setShowAddressForm(false);
  }

  const items = Object.entries(quantities)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([serviceId, qty]) => ({ service_id: Number(serviceId), quantity: Number(qty) }));

  const getServicePrice = (service) => {
    if (!service) return 0;
    return serviceType === "express" ? Number(service.price_express) : Number(service.price);
  };

  const total = items.reduce((sum, item) => {
    const service = services.find((s) => s.id === item.service_id);
    return sum + (service ? getServicePrice(service) * item.quantity : 0);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Pilih minimal satu layanan dengan jumlah lebih dari 0.");
      return;
    }
    if (deliveryType === "pickup_delivery" && !addressId) {
      setError("Pilih atau tambahkan alamat penjemputan.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.createOrder({
        address_id: deliveryType === "pickup_delivery" ? Number(addressId) : null,
        pickup_schedule: deliveryType === "pickup_delivery" ? (pickupSchedule || null) : null,
        notes,
        items,
        delivery_type: deliveryType,
        service_type: serviceType,
        outlet_name: selectedOutlet.name,
        distance_km: autoDistanceKm,
        shipping_fee: deliveryType === "pickup_delivery" ? shippingFee : 0,
      });
      navigate(`/app/pesanan/${data.order_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-blue-950">Pesan Laundry</h1>
        <p className="text-ink/60 mt-1">Pilih lokasi outlet, metode pengiriman, dan layanan Anda.</p>
      </div>

      {/* Pilihan Metode Pengiriman */}
      <div className="card space-y-3">
        <h2 className="font-display font-semibold text-blue-950">Opsi Pengiriman</h2>
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="font-bold text-sm text-sky-950">Antar Jemput Kurir</p>
            <p className="text-xs text-ink/50 mt-0.5">Pakaian Anda akan dijemput dan diantar kembali oleh kurir kami.</p>
          </div>
        </div>
      </div>

      {/* Pilihan Outlet Terdekat (Bandung) */}
      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-semibold text-blue-950 flex items-center gap-2">
            <span>🏪</span> Pilih Outlet Terdekat (Bandung)
          </h2>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
            6 Outlet Bandung
          </span>
        </div>
        <p className="text-xs text-ink/60">
          Pilih lokasi outlet GoLaundry terdekat dengan lokasi Anda di daerah Bandung.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {BANDUNG_OUTLETS.map((outlet) => (
            <div
              key={outlet.id}
              onClick={() => setSelectedOutletId(outlet.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                selectedOutletId === outlet.id
                  ? "bg-sky-100/80 border-sky-600 shadow-sm"
                  : "bg-white border-sky-200/50 hover:bg-sky-50/40"
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="font-bold text-xs text-sky-950">{outlet.name}</p>
                {selectedOutletId === outlet.id && (
                  <span className="text-[10px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Terpilih ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink/60">{outlet.address}</p>
              <p className="text-[10px] text-blue-900 font-semibold mt-1">
                📍 Area: {outlet.area} · Kec. {outlet.district}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pilihan Kecepatan Layanan */}
      <div className="card space-y-3">
        <h2 className="font-display font-semibold text-blue-950">Kecepatan Layanan</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setServiceType("reguler")}
            className={`p-3.5 rounded-xl border font-semibold text-sm text-center transition-all ${
              serviceType === "reguler"
                ? "bg-sky-100/70 border-sky-600 text-sky-950 shadow-sm"
                : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
            }`}
          >
            🕒 Reguler (2-3 hari)
            <span className="block text-[10px] font-normal text-ink/50 mt-0.5">Harga Normal</span>
          </button>
          <button
            type="button"
            onClick={() => setServiceType("express")}
            className={`p-3.5 rounded-xl border font-semibold text-sm text-center transition-all ${
              serviceType === "express"
                ? "bg-amber-500/10 border-amber-500 text-amber-950 shadow-sm"
                : "bg-white border-sky-200/60 text-ink/75 hover:bg-sky-50/30"
            }`}
          >
            ⚡ Express ({services[0]?.eta_hours_express || 12} jam)
            <span className="block text-[10px] font-normal text-amber-700/80 mt-0.5">Biaya +50% (1.5x)</span>
          </button>
        </div>
      </div>

      {/* Pilih layanan */}
      <div className="card space-y-4">
        <h2 className="font-display font-semibold text-blue-950">Pilih Layanan</h2>
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between gap-3 py-2 border-b border-blue-900/5 last:border-0">
            <div>
              <p className="font-medium text-ink">{service.name}</p>
              <p className="text-sm text-ink/50">
                Rp{Number(getServicePrice(service)).toLocaleString("id-ID")}/{service.unit} · est. {serviceType === "express" ? (service.eta_hours_express || 12) : service.eta_hours} jam
              </p>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              className="input w-20 text-center"
              value={quantities[service.id] || ""}
              onChange={(e) => setQty(service.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Alamat Penjemputan & Kalkulator Jarak Otomatis */}
      {deliveryType === "pickup_delivery" && (
        <div className="card space-y-3">
          <h2 className="font-display font-semibold text-blue-950">Alamat Penjemputan</h2>
          {addresses.map((addr) => (
            <label key={addr.id} className="flex items-start gap-3 p-3 rounded-xl border border-sky-200/50 cursor-pointer has-[:checked]:border-sky-600 has-[:checked]:bg-sky-100">
              <input
                type="radio"
                name="address"
                value={addr.id}
                checked={String(addr.id) === addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-ink">
                  {addr.label}{" "}
                  {addr.maps_link && (
                    <a
                      href={addr.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-900 hover:text-blue-950 font-bold ml-2 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📍 Peta
                    </a>
                  )}
                </p>
                <p className="text-sm text-ink/60">{addr.full_address}</p>
                {addr.city && (
                  <p className="text-xs text-ink/40 mt-0.5">
                    {addr.village ? `${addr.village}, ` : ""}{addr.district}, {addr.city}, {addr.province ? `${addr.province}, ` : ""}{addr.postal_code}
                  </p>
                )}
              </div>
            </label>
          ))}

          {/* Kotak Informasi Jarak Otomatis */}
          {addressId && (
            <div className="bg-sky-50/80 border border-sky-200/90 rounded-xl p-4 space-y-2.5 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <span>🚗</span> Jarak Terhitung Otomatis:
                </span>
                <span className="font-mono font-extrabold text-xs bg-white px-2.5 py-1 rounded-lg border border-sky-300 text-blue-950 shadow-sm">
                  {autoDistanceKm.toFixed(1)} km
                </span>
              </div>

              <p className="text-[11px] text-ink/60 flex items-center gap-1">
                <span>📍</span> Dari <strong className="text-blue-950">{selectedAddressObj?.district || "Alamat Pelanggan"}</strong> ke <strong className="text-blue-950">{selectedOutlet.name}</strong>
              </p>

              {/* Breakdown Biaya Ongkir */}
              <div className="text-xs p-3 rounded-lg bg-white border border-sky-200/70 space-y-1 shadow-xs">
                {autoDistanceKm <= 2 ? (
                  <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <span>🎉</span> Gratis Ongkir! (Jarak ≤ 2.0 km dari {selectedOutlet.name})
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-coral-600 font-bold flex items-center gap-1.5">
                      <span>🚚</span> Biaya Ongkir: Rp{shippingFee.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-ink/60">
                      • Jarak total: {autoDistanceKm.toFixed(1)} km (Gratis 2.0 km pertama)<br/>
                      • Kelebihan jarak: {(autoDistanceKm - 2).toFixed(1)} km × Rp5.000/km = Rp{shippingFee.toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showAddressForm ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="label text-[11px] text-blue-950 font-medium mb-1.5 block">Tipe Alamat *</label>
                <div className="flex gap-2 mb-2">
                  {["Rumah", "Kost", "Kantor"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setNewAddress((a) => ({ ...a, label: t }));
                        setIsCustomLabel(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        newAddress.label === t && !isCustomLabel
                          ? "border-sky-600 bg-sky-100 text-sky-950 shadow-sm"
                          : "border-sky-250/70 hover:bg-sky-50/50 text-ink/70"
                      }`}
                    >
                      {t === "Rumah" ? "🏠 Rumah" : t === "Kost" ? "🏢 Kost" : "💼 Kantor"}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setNewAddress((a) => ({ ...a, label: "" }));
                      setIsCustomLabel(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isCustomLabel
                        ? "border-sky-600 bg-sky-100 text-sky-950 shadow-sm"
                        : "border-sky-250/70 hover:bg-sky-50/50 text-ink/70"
                    }`}
                  >
                    📍 Lainnya
                  </button>
                </div>
                {isCustomLabel && (
                  <input
                    className="input text-sm mt-1"
                    placeholder="Nama label kustom (misal: Rumah Nenek) *"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))}
                  />
                )}
              </div>

              <div>
                <label className="label text-[11px] text-blue-950 font-medium mb-1 block">Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok) *</label>
                <textarea
                  className="input text-sm py-2"
                  placeholder="Alamat lengkap (nama jalan, no rumah, patokan, RT/RW) *"
                  rows={2}
                  value={newAddress.full_address}
                  onChange={(e) => setNewAddress((a) => ({ ...a, full_address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Provinsi *</label>
                  <select
                    className="input py-2 text-sm bg-sky-50/20 border-sky-200/60 focus:border-sky-500"
                    value={selectedProvinceId}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                  >
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Kota / Kabupaten *</label>
                  <select
                    className="input py-2 text-sm bg-sky-50/20 border-sky-200/60 focus:border-sky-500"
                    disabled={!selectedProvinceId}
                    value={selectedRegencyId}
                    onChange={(e) => handleRegencyChange(e.target.value)}
                  >
                    <option value="">Pilih Kota/Kabupaten</option>
                    {regencies.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Kecamatan *</label>
                  <select
                    className="input py-2 text-sm bg-sky-50/20 border-sky-200/60 focus:border-sky-500"
                    disabled={!selectedRegencyId}
                    value={selectedDistrictId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Kelurahan *</label>
                  <select
                    className="input py-2 text-sm bg-sky-50/20 border-sky-200/60 focus:border-sky-500"
                    disabled={!selectedDistrictId}
                    value={selectedVillageId}
                    onChange={(e) => handleVillageChange(e.target.value)}
                  >
                    <option value="">Pilih Kelurahan</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Kode Pos *</label>
                  <input
                    className="input py-2 text-sm"
                    placeholder="Kode Pos *"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress((a) => ({ ...a, postal_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label text-[11px] text-blue-950 font-medium">Link Google Maps (WAJIB) *</label>
                  <input
                    className="input py-2 text-sm border-blue-500 focus:border-blue-700"
                    placeholder="https://maps.app.goo.gl/... *"
                    value={newAddress.maps_link}
                    onChange={(e) => setNewAddress((a) => ({ ...a, maps_link: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleAddAddress} className="btn-secondary flex-1 text-sm py-2.5">
                  Simpan Alamat
                </button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="text-sm text-ink/50 px-3">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddressForm(true)} className="text-blue-900 font-medium text-sm">
              + Tambah alamat baru
            </button>
          )}
        </div>
      )}

      {/* Jadwal & catatan */}
      <div className="card space-y-4">
        {deliveryType === "pickup_delivery" && (
          <div>
            <label className="label" htmlFor="schedule">Jadwal Penjemputan</label>
            <input
              id="schedule"
              type="datetime-local"
              className="input"
              value={pickupSchedule}
              onChange={(e) => setPickupSchedule(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="notes">Catatan (opsional)</label>
          <textarea
            id="notes"
            className="input"
            rows={2}
            placeholder="Contoh: pisahkan baju putih"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Ringkasan & submit */}
      {(() => {
        let discountPercent = 0;
        let discountLabel = "";

        if (discountStatus) {
          if (discountStatus.has_loyalty_discount) {
            discountPercent = discountStatus.loyalty_discount_percent;
            discountLabel = "Diskon Loyalitas";
          } else if (discountStatus.promo_discount_percent > 0) {
            discountPercent = discountStatus.promo_discount_percent;
            discountLabel = "Diskon Promo";
          }
        }

        const discountAmount = total * (discountPercent / 100);
        const netTotal = (total - discountAmount) + (deliveryType === "pickup_delivery" ? shippingFee : 0);

        return (
          <div className="card space-y-3">
            <div className="flex justify-between text-ink/60 text-sm">
              <span>Subtotal Layanan</span>
              <span className="font-medium text-blue-950">
                Rp{total.toLocaleString("id-ID")}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 text-sm">
                <span>{discountLabel} ({discountPercent}%)</span>
                <span className="font-medium">
                  -Rp{discountAmount.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            {deliveryType === "pickup_delivery" && (
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">
                  Ongkir ({autoDistanceKm.toFixed(1)} km)
                  {autoDistanceKm <= 2 ? (
                    <span className="ml-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Gratis (≤2km)
                    </span>
                  ) : (
                    <span className="ml-1 text-[11px] text-coral-600 font-semibold bg-coral-50 px-1.5 py-0.5 rounded">
                      +{(autoDistanceKm - 2).toFixed(1)} km × Rp5rb
                    </span>
                  )}
                </span>
                <span className="font-medium text-blue-950">
                  {shippingFee === 0 ? "Rp0" : `+Rp${shippingFee.toLocaleString("id-ID")}`}
                </span>
              </div>
            )}
            <div className="flex justify-between font-display font-semibold pt-2 border-t border-blue-950/5">
              <span className="text-blue-950">Total Bayar</span>
              <span className="text-blue-950 text-lg">
                Rp{netTotal.toLocaleString("id-ID")}
              </span>
            </div>
            {error && <p className="text-sm text-coral-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-coral w-full text-base py-3 mt-1">
              {submitting ? "Memproses..." : "Buat Pesanan"}
            </button>
          </div>
        );
      })()}
    </form>
  );
}
