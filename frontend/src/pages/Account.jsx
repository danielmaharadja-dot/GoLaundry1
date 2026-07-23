import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Account() {
  const { user, updateUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  
  // State untuk form edit
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State untuk form edit alamat
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [isEditCustomLabel, setIsEditCustomLabel] = useState(false);
  const [editFullAddress, setEditFullAddress] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");

  // State untuk pilihan wilayah berseri (cascading dropdown) di edit alamat
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const [changeRegion, setChangeRegion] = useState(false);

  useEffect(() => {
    api.getAddresses().then((data) => setAddresses(data.addresses));
  }, []);

  function handleStartEdit() {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setCurrentPassword("");
    setNewPassword("");
    setShowPasswordFields(false);
    setError("");
    setSuccess("");
    setIsEditing(true);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = { name, phone };
      if (showPasswordFields && newPassword) {
        if (!currentPassword) {
          throw new Error("Password saat ini wajib diisi untuk mengubah password.");
        }
        if (newPassword.length < 6) {
          throw new Error("Password baru minimal 6 karakter.");
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.updateProfile(payload);
      updateUser(res.user);
      setSuccess(res.message || "Profil berhasil diperbarui.");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  }

  // Fungsi untuk manajemen edit alamat
  function handleStartEditAddress(addr) {
    setEditingAddressId(addr.id);
    setEditLabel(addr.label || "");
    setEditFullAddress(addr.full_address || "");
    setEditProvince(addr.province || "");
    setEditCity(addr.city || "");
    setEditDistrict(addr.district || "");
    setEditVillage(addr.village || "");
    setEditPostalCode(addr.postal_code || "");
    setEditMapsLink(addr.maps_link || "");
    setEditIsDefault(!!addr.is_default);

    const isPreset = ["Rumah", "Kost", "Kantor"].includes(addr.label);
    setIsEditCustomLabel(!isPreset && addr.label !== "");

    setChangeRegion(false);
    setSelectedProvinceId("");
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setAddressError("");
  }

  function handleCancelEditAddress() {
    setEditingAddressId(null);
    setAddressError("");
  }

  function handleStartChangeRegion() {
    setChangeRegion(true);
    if (provinces.length === 0) {
      api.getProvinces()
        .then((data) => setProvinces(data))
        .catch((err) => console.error("Gagal memuat provinsi:", err));
    }
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
    setEditProvince(provObj ? provObj.name : "");
    setEditCity("");
    setEditDistrict("");
    setEditVillage("");

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
    setEditCity(regObj ? regObj.name : "");
    setEditDistrict("");
    setEditVillage("");

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
    setEditDistrict(distObj ? distObj.name : "");
    setEditVillage("");

    if (districtId) {
      api.getVillages(districtId)
        .then(setVillages)
        .catch(err => console.error(err));
    }
  }

  function handleVillageChange(villageId) {
    setSelectedVillageId(villageId);
    const vilObj = villages.find(v => v.id === villageId);
    setEditVillage(vilObj ? vilObj.name : "");
  }

  async function handleUpdateAddress(e, id) {
    e.preventDefault();
    setAddressError("");
    setAddressLoading(true);

    try {
      if (!editLabel || !editFullAddress || !editProvince || !editCity || !editDistrict || !editVillage || !editPostalCode || !editMapsLink) {
        throw new Error("Semua kolom alamat termasuk Provinsi, Kota, Kecamatan, Kelurahan, Kode Pos, dan Link Google Maps wajib diisi.");
      }

      const res = await api.updateAddress(id, {
        label: editLabel,
        full_address: editFullAddress,
        province: editProvince,
        city: editCity,
        district: editDistrict,
        village: editVillage,
        postal_code: editPostalCode,
        maps_link: editMapsLink,
        is_default: editIsDefault
      });

      // Update local state
      setAddresses((prev) => {
        let updated = prev.map((addr) => (addr.id === id ? res.address : addr));
        if (editIsDefault) {
          updated = updated.map((addr) => (addr.id !== id ? { ...addr, is_default: false } : addr));
        }
        return updated.sort((a, b) => b.is_default - a.is_default);
      });

      setEditingAddressId(null);
      setSuccess("Alamat berhasil diperbarui.");
    } catch (err) {
      setAddressError(err.message || "Gagal memperbarui alamat.");
    } finally {
      setAddressLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
      return;
    }
    try {
      await api.deleteAddress(id);
      setAddresses((a) => a.filter((addr) => addr.id !== id));
      setSuccess("Alamat berhasil dihapus.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "Gagal menghapus alamat.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-blue-950">Akun Saya</h1>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-950 rounded-xl text-sm flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold">Sukses</p>
            <p className="text-emerald-900/80 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="card space-y-4">
          <h3 className="font-display font-semibold text-blue-950 text-base">Edit Informasi Profil</h3>
          
          <div>
            <label className="label" htmlFor="edit-name">Nama Lengkap</label>
            <input
              id="edit-name"
              type="text"
              required
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="edit-phone">Nomor Telepon</label>
            <input
              id="edit-phone"
              type="tel"
              className="input"
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordFields(!showPasswordFields);
                setCurrentPassword("");
                setNewPassword("");
              }}
              className="text-sm font-semibold text-blue-900 hover:text-blue-950 hover:underline flex items-center gap-1"
            >
              {showPasswordFields ? "🔒 Batal Ubah Password" : "🔑 Ubah Password (Opsional)"}
            </button>
          </div>

          {showPasswordFields && (
            <div className="space-y-3 p-3 bg-blue-100/50 rounded-xl border border-blue-900/10">
              <div>
                <label className="label" htmlFor="current-password">Password Saat Ini</label>
                <input
                  id="current-password"
                  type="password"
                  required={showPasswordFields}
                  placeholder="••••••••"
                  className="input bg-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="new-password">Password Baru</label>
                <input
                  id="new-password"
                  type="password"
                  required={showPasswordFields}
                  placeholder="Minimal 6 karakter"
                  className="input bg-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-coral-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <div className="card flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-blue-950 text-lg">{user?.name}</p>
            <p className="text-sm text-ink/60">{user?.email}</p>
            <p className="text-sm text-ink/60">{user?.phone || "Nomor telepon belum diatur"}</p>
          </div>
          <button
            onClick={handleStartEdit}
            className="text-blue-900 hover:text-blue-950 text-sm font-semibold border border-blue-900/30 rounded-xl px-4 py-2 hover:bg-blue-100 transition-colors"
          >
            Edit Profil
          </button>
        </div>
      )}

      <div>
        <h2 className="font-display font-semibold text-lg text-blue-950 mb-3">Alamat Tersimpan</h2>
        {addresses.length === 0 ? (
          <p className="text-ink/50 text-sm">Belum ada alamat tersimpan. Tambahkan lewat halaman pesan.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="card">
                {editingAddressId === addr.id ? (
                  <form onSubmit={(e) => handleUpdateAddress(e, addr.id)} className="space-y-4">
                    <h4 className="font-display font-semibold text-sm text-blue-950">Edit Alamat</h4>
                    
                    <div>
                      <label className="label text-[11px] text-blue-950 font-medium mb-1.5 block">Tipe Alamat *</label>
                      <div className="flex gap-2 mb-2">
                        {["Rumah", "Kost", "Kantor"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setEditLabel(t);
                              setIsEditCustomLabel(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              editLabel === t && !isEditCustomLabel
                                ? "border-blue-700 bg-blue-100 text-blue-950 shadow-sm"
                                : "border-blue-900/10 hover:bg-blue-50 text-ink/70"
                            }`}
                          >
                            {t === "Rumah" ? "🏠 Rumah" : t === "Kost" ? "🏢 Kost" : "💼 Kantor"}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEditLabel("");
                            setIsEditCustomLabel(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isEditCustomLabel
                              ? "border-blue-700 bg-blue-100 text-blue-950 shadow-sm"
                              : "border-blue-900/10 hover:bg-blue-50 text-ink/70"
                          }`}
                        >
                          📍 Lainnya
                        </button>
                      </div>
                      {isEditCustomLabel && (
                        <input
                          type="text"
                          required
                          className="input text-sm py-2 bg-blue-100/10 mt-1"
                          placeholder="Nama label kustom (misal: Apartemen) *"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                        />
                      )}
                    </div>

                    <div>
                      <label className="label text-xs" htmlFor={`edit-full-addr-${addr.id}`}>Alamat Lengkap (Jalan, No. Rumah, RT/RW, Blok) *</label>
                      <textarea
                        id={`edit-full-addr-${addr.id}`}
                        required
                        rows={2}
                        className="input text-sm py-2 bg-blue-100/10"
                        placeholder="Alamat lengkap (nama jalan, no rumah, patokan, RT/RW) *"
                        value={editFullAddress}
                        onChange={(e) => setEditFullAddress(e.target.value)}
                      />
                    </div>

                    {!changeRegion ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-ink/70">
                          <p><strong>Provinsi:</strong> {editProvince || "-"}</p>
                          <p><strong>Kota/Kab:</strong> {editCity || "-"}</p>
                          <p><strong>Kecamatan:</strong> {editDistrict || "-"}</p>
                          <p><strong>Kelurahan:</strong> {editVillage || "-"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartChangeRegion}
                          className="btn-secondary py-1 text-[10px] w-max font-bold border-blue-900/30 text-blue-950 hover:bg-blue-50"
                        >
                          🔄 Ubah Wilayah (Dropdown)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 border border-blue-900/10 p-3 rounded-xl bg-blue-50/20">
                        <h5 className="font-semibold text-blue-950 text-xs">Pilih Wilayah Baru</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="label text-[10px]">Provinsi *</label>
                            <select
                              className="input py-1.5 text-xs bg-white border border-blue-900/10"
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
                            <label className="label text-[10px]">Kota / Kabupaten *</label>
                            <select
                              className="input py-1.5 text-xs bg-white border border-blue-900/10"
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
                            <label className="label text-[10px]">Kecamatan *</label>
                            <select
                              className="input py-1.5 text-xs bg-white border border-blue-900/10"
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
                            <label className="label text-[10px]">Kelurahan *</label>
                            <select
                              className="input py-1.5 text-xs bg-white border border-blue-900/10"
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
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs" htmlFor={`edit-zip-${addr.id}`}>Kode Pos</label>
                        <input
                          id={`edit-zip-${addr.id}`}
                          type="text"
                          required
                          className="input text-sm py-2 bg-blue-100/10"
                          value={editPostalCode}
                          onChange={(e) => setEditPostalCode(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label text-xs" htmlFor={`edit-maps-${addr.id}`}>Link Google Maps (WAJIB)</label>
                        <input
                          id={`edit-maps-${addr.id}`}
                          type="text"
                          required
                          className="input text-sm py-2 bg-blue-100/10 border-blue-500 focus:border-blue-700"
                          placeholder="https://maps.app.goo.gl/..."
                          value={editMapsLink}
                          onChange={(e) => setEditMapsLink(e.target.value)}
                        />
                      </div>
                    </div>

                    {!addr.is_default && (
                      <label className="flex items-center gap-2 text-xs text-ink/80 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={editIsDefault}
                          onChange={(e) => setEditIsDefault(e.target.checked)}
                        />
                        <span>Jadikan Alamat Utama</span>
                      </label>
                    )}

                    {addressError && <p className="text-xs text-coral-600">{addressError}</p>}

                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={addressLoading} className="btn-primary py-2 text-xs flex-1">
                        {addressLoading ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        disabled={addressLoading}
                        onClick={handleCancelEditAddress}
                        className="btn-secondary py-2 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-ink">
                        {addr.label}{" "}
                        {addr.is_default && <span className="text-xs text-blue-700 font-normal">(Utama)</span>}
                      </p>
                      <p className="text-sm text-ink/60 mt-0.5">
                        {addr.full_address}
                        {addr.maps_link && (
                          <a
                            href={addr.maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-xs text-blue-900 hover:text-blue-950 font-semibold ml-2 underline"
                          >
                            📍 Lihat Peta
                          </a>
                        )}
                      </p>
                      {addr.city && (
                        <p className="text-xs text-ink/40 mt-1">
                          {addr.village ? `${addr.village}, ` : ""}{addr.district}, {addr.city}, {addr.province ? `${addr.province}, ` : ""}{addr.postal_code}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartEditAddress(addr)}
                        className="text-blue-900 hover:text-blue-950 text-sm font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="text-coral-600 hover:text-coral-700 text-sm font-semibold hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
