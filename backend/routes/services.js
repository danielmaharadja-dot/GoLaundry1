import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/services - daftar layanan aktif (semua orang bisa lihat)
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM services WHERE is_active = TRUE ORDER BY name ASC"
  );
  res.json({ services: rows });
});

// GET /api/services/all - semua layanan termasuk nonaktif (khusus admin)
router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM services ORDER BY id ASC");
  res.json({ services: rows });
});

// POST /api/services - tambah layanan baru (admin)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, unit, price, eta_hours, price_express, eta_hours_express } = req.body;
    if (!name || !unit || !price) {
      return res.status(400).json({ error: "Nama, satuan, dan harga wajib diisi." });
    }
    const expressPrice = price_express ? Number(price_express) : Number(price) * 1.5;
    const [result] = await pool.query(
      `INSERT INTO services (name, description, unit, price, eta_hours, price_express, eta_hours_express)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, unit, price, eta_hours || 24, expressPrice, eta_hours_express || 12]
    );
    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [result.insertId]);
    res.status(201).json({ service: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menambahkan layanan." });
  }
});

// PUT /api/services/:id - edit layanan (admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, unit, price, eta_hours, is_active, price_express, eta_hours_express } = req.body;

    const [existingRows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: "Layanan tidak ditemukan." });
    }

    await pool.query(
      `UPDATE services SET
         name = ?, description = ?, unit = ?, price = ?, eta_hours = ?, is_active = ?, price_express = ?, eta_hours_express = ?
       WHERE id = ?`,
      [
        name ?? existing.name,
        description ?? existing.description,
        unit ?? existing.unit,
        price ?? existing.price,
        eta_hours ?? existing.eta_hours,
        is_active ?? existing.is_active,
        price_express ?? existing.price_express,
        eta_hours_express ?? existing.eta_hours_express,
        req.params.id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    res.json({ service: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui layanan." });
  }
});

// DELETE /api/services/:id - nonaktifkan layanan (admin, soft delete)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const [result] = await pool.query(
    "UPDATE services SET is_active = FALSE WHERE id = ?",
    [req.params.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Layanan tidak ditemukan." });
  }
  const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
  res.json({ message: "Layanan dinonaktifkan.", service: rows[0] });
});

export default router;
