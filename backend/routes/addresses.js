import { Router } from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/addresses - alamat milik user yang login
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM addresses WHERE user_id = ? AND (is_deleted IS NOT TRUE) ORDER BY is_default DESC, created_at DESC",
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat daftar alamat." });
  }
});

// POST /api/addresses - tambah alamat baru
router.post("/", requireAuth, async (req, res) => {
  try {
    const { label, full_address, province, city, district, village, postal_code, maps_link, is_default } = req.body;
    if (!label || !full_address || !province || !city || !district || !village || !postal_code || !maps_link) {
      return res.status(400).json({ error: "Semua kolom alamat (Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan, Kode Pos, Detail Alamat, dan Link Maps) wajib diisi." });
    }

    if (is_default) {
      await pool.query("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [req.user.id]);
    }

    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, label, full_address, province, city, district, village, postal_code, maps_link, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, label, full_address, province, city, district, village, postal_code, maps_link, !!is_default]
    );

    const [rows] = await pool.query("SELECT * FROM addresses WHERE id = ?", [result.insertId]);
    res.status(201).json({ address: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menambahkan alamat baru." });
  }
});

// DELETE /api/addresses/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // Cek apakah alamat ini digunakan oleh order manapun
    const [orderCheck] = await pool.query(
      "SELECT id FROM orders WHERE address_id = ?",
      [req.params.id]
    );

    if (orderCheck.length > 0) {
      // Jika digunakan, soft-delete saja agar history pesanan tetap aman
      const [result] = await pool.query(
        "UPDATE addresses SET is_deleted = TRUE, is_default = FALSE WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alamat tidak ditemukan." });
      }
      res.json({ message: "Alamat berhasil dihapus." });
    } else {
      // Jika tidak digunakan oleh pesanan manapun, bisa hard-delete langsung
      const [result] = await pool.query(
        "DELETE FROM addresses WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alamat tidak ditemukan." });
      }
      res.json({ message: "Alamat berhasil dihapus." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus alamat." });
  }
});

// PUT /api/addresses/:id - edit alamat
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { label, full_address, province, city, district, village, postal_code, maps_link, is_default } = req.body;
    if (!label || !full_address || !province || !city || !district || !village || !postal_code || !maps_link) {
      return res.status(400).json({ error: "Semua kolom alamat (Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan, Kode Pos, Detail Alamat, dan Link Maps) wajib diisi." });
    }

    const addressId = req.params.id;
    const userId = req.user.id;

    // Cek jika alamat tersebut ada dan milik user
    const [existing] = await pool.query(
      "SELECT id FROM addresses WHERE id = ? AND user_id = ?",
      [addressId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Alamat tidak ditemukan." });
    }

    if (is_default) {
      await pool.query("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [userId]);
    }

    await pool.query(
      `UPDATE addresses SET label = ?, full_address = ?, province = ?, city = ?, district = ?, village = ?, postal_code = ?, maps_link = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [label, full_address, province, city, district, village, postal_code, maps_link, !!is_default, addressId, userId]
    );

    const [rows] = await pool.query("SELECT * FROM addresses WHERE id = ?", [addressId]);
    res.json({ message: "Alamat berhasil diperbarui.", address: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui alamat." });
  }
});

export default router;
