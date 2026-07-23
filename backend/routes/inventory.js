import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/inventory - ambil semua item stok gudang
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT *, (stock <= min_stock) AS is_low_stock FROM inventory ORDER BY category ASC, id ASC"
    );
    res.json({ inventory: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data stok gudang." });
  }
});

// GET /api/inventory/logs - ambil 50 riwayat transaksi stok terakhir
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, i.name AS item_name, i.unit, o.order_code
       FROM inventory_logs l
       JOIN inventory i ON i.id = l.inventory_id
       LEFT JOIN orders o ON o.id = l.order_id
       ORDER BY l.created_at DESC
       LIMIT 50`
    );
    res.json({ logs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil riwayat transaksi stok." });
  }
});

// POST /api/inventory/restock - tambah stok barang (restock)
router.post("/restock", requireAuth, requireAdmin, async (req, res) => {
  const { inventory_id, amount, note } = req.body;
  const restockAmount = Number(amount);

  if (!inventory_id || isNaN(restockAmount) || restockAmount <= 0) {
    return res.status(400).json({ error: "Jumlah restock harus angka lebih besar dari 0." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [itemRows] = await conn.query("SELECT * FROM inventory WHERE id = ?", [inventory_id]);
    const item = itemRows[0];
    if (!item) {
      conn.release();
      return res.status(404).json({ error: "Barang stok tidak ditemukan." });
    }

    const previousStock = Number(item.stock);
    const newStock = previousStock + restockAmount;

    await conn.query("UPDATE inventory SET stock = ? WHERE id = ?", [newStock, inventory_id]);

    await conn.query(
      `INSERT INTO inventory_logs (inventory_id, order_id, change_amount, previous_stock, new_stock, type, note)
       VALUES (?, NULL, ?, ?, ?, 'restock', ?)`,
      [inventory_id, restockAmount, previousStock, newStock, note || "Restock barang oleh admin"]
    );

    await conn.commit();
    res.json({ message: "Stok berhasil ditambahkan.", new_stock: newStock });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui stok." });
  } finally {
    conn.release();
  }
});

// PUT /api/inventory/:id - perbarui min_stock atau penyesuaian manual
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { min_stock, stock } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM inventory WHERE id = ?", [req.params.id]);
    const item = rows[0];
    if (!item) return res.status(404).json({ error: "Barang stok tidak ditemukan." });

    const newMin = min_stock !== undefined ? Number(min_stock) : Number(item.min_stock);
    const newStock = stock !== undefined ? Number(stock) : Number(item.stock);

    await pool.query("UPDATE inventory SET min_stock = ?, stock = ? WHERE id = ?", [newMin, newStock, req.params.id]);
    res.json({ message: "Data stok diperbarui." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui data stok." });
  }
});

export default router;
