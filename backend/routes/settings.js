import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/settings - Ambil semua konfigurasi settings (Public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings");
    const settings = {};
    rows.forEach(r => {
      settings[r.key_name] = r.value;
    });
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat konfigurasi settings." });
  }
});

// PUT /api/settings - Update konfigurasi settings (Admin)
router.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { loyalty_order_count, loyalty_discount_percent, promo_discount_percent, promo_banner_text } = req.body;

    const updates = {
      loyalty_order_count,
      loyalty_discount_percent,
      promo_discount_percent,
      promo_banner_text
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await pool.query(
          "INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
          [key, String(value), String(value)]
        );
      }
    }

    res.json({ message: "Konfigurasi diskon berhasil disimpan." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui konfigurasi settings." });
  }
});

// GET /api/settings/customer-status - Ambil status loyalitas dan diskon (Customer)
router.get("/customer-status", requireAuth, async (req, res) => {
  try {
    // 1. Ambil setting diskon
    const [settingRows] = await pool.query("SELECT * FROM settings");
    const settings = {};
    settingRows.forEach(s => {
      settings[s.key_name] = s.value;
    });

    const loyaltyCount = parseInt(settings.loyalty_order_count || "10");
    const loyaltyPercent = parseInt(settings.loyalty_discount_percent || "20");
    const promoPercent = parseInt(settings.promo_discount_percent || "10");
    const promoBanner = settings.promo_banner_text || "";

    // 2. Hitung jumlah pesanan berstatus Selesai (delivered)
    const [completedRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM orders WHERE user_id = ? AND status = 'delivered'",
      [req.user.id]
    );
    const completedOrders = completedRows[0].count;

    // 3. Hitung jumlah diskon loyalitas yang sudah pernah terpakai
    const [usedRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM orders WHERE user_id = ? AND discount_type = 'loyalty'",
      [req.user.id]
    );
    const usedLoyaltyDiscounts = usedRows[0].count;

    // 4. Hitung kelayakan diskon loyalitas saat ini
    const eligibleCount = Math.floor(completedOrders / loyaltyCount) - usedLoyaltyDiscounts;
    const hasLoyaltyDiscount = eligibleCount > 0;

    // 5. Hitung progress ke diskon berikutnya
    const progressCount = completedOrders % loyaltyCount;

    res.json({
      completed_orders: completedOrders,
      loyalty_threshold: loyaltyCount,
      loyalty_discount_percent: loyaltyPercent,
      promo_discount_percent: promoPercent,
      promo_banner_text: promoBanner,
      has_loyalty_discount: hasLoyaltyDiscount,
      progress_count: progressCount,
      used_loyalty_discounts: usedLoyaltyDiscounts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat status diskon pelanggan." });
  }
});

export default router;
