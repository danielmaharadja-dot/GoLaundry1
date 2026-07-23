import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/reviews - Ambil semua ulasan untuk dibaca publik/pelanggan lain
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*, 
        u.name AS customer_name, 
        o.order_code
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN orders o ON r.order_id = o.id
      ORDER BY r.created_at DESC
    `);
    res.json({ reviews: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat ulasan." });
  }
});

// GET /api/reviews/order/:orderId - Ambil ulasan spesifik untuk satu order (dipakai di OrderDetail)
router.get("/order/:orderId", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM reviews WHERE order_id = ?",
      [req.params.orderId]
    );
    res.json({ review: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat ulasan pesanan." });
  }
});

// POST /api/reviews - Kirim ulasan baru (untuk pelanggan)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    if (!order_id || !rating) {
      return res.status(400).json({ error: "Order ID dan Rating bintang wajib diisi." });
    }

    const ratingVal = parseInt(rating);
    if (ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: "Rating bintang harus bernilai antara 1 s/d 5." });
    }

    // Pastikan pesanan ada, milik user tersebut, dan statusnya sudah 'delivered'
    const [orders] = await pool.query(
      "SELECT id, user_id, status FROM orders WHERE id = ?",
      [order_id]
    );
    const order = orders[0];

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Anda tidak memiliki akses ke pesanan ini." });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Ulasan hanya dapat diberikan untuk pesanan yang telah selesai." });
    }

    // Simpan ulasan ke database
    await pool.query(
      `INSERT INTO reviews (order_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [order_id, req.user.id, ratingVal, comment || null]
    );

    // Ambil ulasan yang baru disimpan untuk dikembalikan
    const [newReview] = await pool.query(
      "SELECT * FROM reviews WHERE order_id = ?",
      [order_id]
    );

    res.status(201).json({ message: "Ulasan berhasil dikirim.", review: newReview[0] });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Ulasan untuk pesanan ini sudah pernah dikirim." });
    }
    console.error(err);
    res.status(500).json({ error: "Gagal mengirimkan ulasan." });
  }
});

// POST /api/reviews/:id/reply - Kirim balasan ulasan (untuk admin)
router.post("/:id/reply", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: "Isi balasan tidak boleh kosong." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM reviews WHERE id = ?",
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Ulasan tidak ditemukan." });
    }

    await pool.query(
      "UPDATE reviews SET reply = ?, replied_at = NOW() WHERE id = ?",
      [reply, req.params.id]
    );

    res.json({ message: "Balasan ulasan berhasil dikirim." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses balasan ulasan." });
  }
});

export default router;
