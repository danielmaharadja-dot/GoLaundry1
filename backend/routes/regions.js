import { Router } from "express";

const router = Router();

// GET /api/regions/provinces
router.get("/provinces", async (req, res) => {
  try {
    const response = await fetch("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json");
    if (!response.ok) throw new Error("Gagal mengambil data dari API Wilayah");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil provinsi:", err);
    res.status(500).json({ error: "Gagal mengambil data provinsi." });
  }
});

// GET /api/regions/regencies/:provinceId
router.get("/regencies/:provinceId", async (req, res) => {
  try {
    const response = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${req.params.provinceId}.json`);
    if (!response.ok) throw new Error("Gagal mengambil data dari API Wilayah");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil kabupaten/kota:", err);
    res.status(500).json({ error: "Gagal mengambil data kabupaten/kota." });
  }
});

// GET /api/regions/districts/:regencyId
router.get("/districts/:regencyId", async (req, res) => {
  try {
    const response = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${req.params.regencyId}.json`);
    if (!response.ok) throw new Error("Gagal mengambil data dari API Wilayah");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil kecamatan:", err);
    res.status(500).json({ error: "Gagal mengambil data kecamatan." });
  }
});

// GET /api/regions/villages/:districtId
router.get("/villages/:districtId", async (req, res) => {
  try {
    const response = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/villages/${req.params.districtId}.json`);
    if (!response.ok) throw new Error("Gagal mengambil data dari API Wilayah");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil kelurahan:", err);
    res.status(500).json({ error: "Gagal mengambil data kelurahan." });
  }
});

export default router;
