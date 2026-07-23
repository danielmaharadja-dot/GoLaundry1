import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = Router();

// Generate kode order unik, misal: GL-20260720-0001
async function generateOrderCode(conn) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS count FROM orders WHERE order_code LIKE ?",
    [`GL-${datePart}-%`]
  );
  const seq = String(Number(rows[0].count) + 1).padStart(4, "0");
  return `GL-${datePart}-${seq}`;
}

// POST /api/orders - customer membuat pesanan baru (atau admin membuat pesanan offline)
// body: { address_id, pickup_schedule, notes, items: [{ service_id, quantity }], delivery_type, service_type, user_id, outlet_name, distance_km, shipping_fee }
router.post("/", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { address_id, pickup_schedule, notes, items, delivery_type, service_type, user_id, outlet_name, distance_km, shipping_fee } = req.body;

    let targetUserId = req.user.id;
    if (req.user.role === "admin" && user_id) {
      targetUserId = Number(user_id);
    }

    if (!Array.isArray(items) || items.length === 0) {
      conn.release();
      return res.status(400).json({ error: "Pesanan harus memiliki minimal satu layanan." });
    }

    const validServiceTypes = ["reguler", "express"];
    const speed = validServiceTypes.includes(service_type) ? service_type : "reguler";

    await conn.beginTransaction();

    const orderCode = await generateOrderCode(conn);

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_code, user_id, address_id, pickup_schedule, notes, total_amount, delivery_type, service_type, outlet_name, distance_km, shipping_fee)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [orderCode, targetUserId, address_id || null, pickup_schedule || null, notes || null, delivery_type || 'pickup_delivery', speed, outlet_name || null, Number(distance_km || 0), Number(shipping_fee || 0)]
    );
    const orderId = orderResult.insertId;

    let total = 0;
    const itemsWithServices = [];

    for (const item of items) {
      const [serviceRows] = await conn.query(
        "SELECT * FROM services WHERE id = ? AND is_active = TRUE",
        [item.service_id]
      );
      const service = serviceRows[0];
      if (!service) {
        throw new Error(`Layanan dengan id ${item.service_id} tidak ditemukan.`);
      }
      const quantity = Number(item.quantity);
      const unitPrice = Number(speed === "express" ? service.price_express : service.price);
      const subtotal = unitPrice * quantity;
      total += subtotal;

      itemsWithServices.push({ service, quantity });

      await conn.query(
        `INSERT INTO order_items (order_id, service_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, service.id, quantity, unitPrice, subtotal]
      );
    }

    // 1. Ambil pengaturan diskon dari database
    const [settingRows] = await conn.query("SELECT * FROM settings");
    const settings = {};
    settingRows.forEach(s => {
      settings[s.key_name] = s.value;
    });

    const loyaltyCount = parseInt(settings.loyalty_order_count || "10");
    const loyaltyPercent = parseInt(settings.loyalty_discount_percent || "20");
    const promoPercent = parseInt(settings.promo_discount_percent || "10");

    // 2. Cek jumlah pesanan Selesai (delivered)
    const [completedRows] = await conn.query(
      "SELECT COUNT(*) AS count FROM orders WHERE user_id = ? AND status = 'delivered'",
      [targetUserId]
    );
    const completedCount = completedRows[0].count;

    // 3. Cek jumlah diskon loyalitas terpakai
    const [usedRows] = await conn.query(
      "SELECT COUNT(*) AS count FROM orders WHERE user_id = ? AND discount_type = 'loyalty'",
      [targetUserId]
    );
    const usedLoyaltyCount = usedRows[0].count;

    // 4. Hitung diskon yang layak diterapkan
    const eligibleLoyalty = Math.floor(completedCount / loyaltyCount) - usedLoyaltyCount;

    let discountType = null;
    let discountPercent = 0;

    if (eligibleLoyalty > 0) {
      discountType = "loyalty";
      discountPercent = loyaltyPercent;
    } else if (promoPercent > 0) {
      discountType = "promo";
      discountPercent = promoPercent;
    }

    const discountAmount = total * (discountPercent / 100);
    const shipping = Number(shipping_fee || 0);
    const netTotal = (total - discountAmount) + shipping;

    await conn.query(
      "UPDATE orders SET total_amount = ?, discount_amount = ?, discount_type = ?, shipping_fee = ?, distance_km = ?, outlet_name = ? WHERE id = ?",
      [netTotal, discountAmount, discountType, shipping, Number(distance_km || 0), outlet_name || null, orderId]
    );

    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note) VALUES (?, 'pending', 'Pesanan dibuat')`,
      [orderId]
    );

    await conn.commit();

    res.status(201).json({
      message: "Pesanan berhasil dibuat.",
      order_id: orderId,
      order_code: orderCode,
      total_amount: netTotal,
      original_amount: total,
      discount_amount: discountAmount,
      discount_type: discountType
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message || "Gagal membuat pesanan." });
  } finally {
    conn.release();
  }
});

// GET /api/orders/mine - daftar pesanan milik customer yang login
router.get("/mine", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, a.full_address, a.label AS address_label, a.maps_link, r.rating AS review_rating
     FROM orders o
     LEFT JOIN addresses a ON a.id = o.address_id
     LEFT JOIN reviews r ON r.order_id = o.id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
});

// GET /api/orders - semua pesanan (admin), bisa filter ?status=
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  const params = [];
  let query = `
    SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, a.full_address, a.maps_link, r.rating AS review_rating
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN addresses a ON a.id = o.address_id
    LEFT JOIN reviews r ON r.order_id = o.id
  `;
  if (status) {
    params.push(status);
    query += ` WHERE o.status = ?`;
  }
  query += " ORDER BY o.created_at DESC";

  const [rows] = await pool.query(query, params);

  if (rows.length > 0) {
    const orderIds = rows.map((r) => r.id);
    const [items] = await pool.query(
      `SELECT oi.*, s.name AS service_name, s.unit
       FROM order_items oi
       JOIN services s ON s.id = oi.service_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    const itemsMap = {};
    items.forEach((item) => {
      if (!itemsMap[item.order_id]) {
        itemsMap[item.order_id] = [];
      }
      itemsMap[item.order_id].push(item);
    });

    rows.forEach((order) => {
      order.items = itemsMap[order.id] || [];
    });
  } else {
    rows.forEach((order) => {
      order.items = [];
    });
  }

  res.json({ orders: rows });
});

// GET /api/orders/:id - detail pesanan (item + histori status)
// Customer hanya boleh lihat pesanan miliknya; admin boleh lihat semua.
router.get("/:id", requireAuth, async (req, res) => {
  const [orderRows] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, a.full_address, a.label AS address_label, a.maps_link
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.address_id
     WHERE o.id = ?`,
    [req.params.id]
  );
  const order = orderRows[0];
  if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  if (req.user.role !== "admin" && order.user_id !== req.user.id) {
    return res.status(403).json({ error: "Anda tidak memiliki akses ke pesanan ini." });
  }

  const [items] = await pool.query(
    `SELECT oi.*, s.name AS service_name, s.unit
     FROM order_items oi JOIN services s ON s.id = oi.service_id
     WHERE oi.order_id = ?`,
    [req.params.id]
  );

  const [history] = await pool.query(
    `SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC`,
    [req.params.id]
  );

  res.json({ order, items, history });
});

// Helper fungsi pengurangan stok saat status diubah ke 'in_process' (Dicuci)
async function deductInventoryForOrder(conn, orderId, orderCode) {
  const [existingLogs] = await conn.query(
    "SELECT id FROM inventory_logs WHERE order_id = ? AND type = 'deduction_order'",
    [orderId]
  );
  if (existingLogs.length > 0) return; // Sudah pernah dipotong sebelumnya

  const [items] = await conn.query(
    `SELECT oi.quantity, s.name AS service_name
     FROM order_items oi
     JOIN services s ON s.id = oi.service_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  for (const item of items) {
    const sName = item.service_name.toLowerCase();
    const qty = Number(item.quantity);
    if (qty <= 0) continue;

    const deductions = [];

    if (sName.includes("sepatu")) {
      deductions.push({ key: "sabun_sepatu", amount: qty * 1 });
      deductions.push({ key: "pewangi_sepatu", amount: qty * 1 });
    } else if (sName.includes("selimut") || sName.includes("bed cover") || sName.includes("bedcover")) {
      deductions.push({ key: "sabun_selimut", amount: qty * 2 });
      deductions.push({ key: "pewangi_selimut", amount: qty * 2 });
      deductions.push({ key: "pewangi_setrika_selimut", amount: qty * 1 });
    } else {
      // Pakaian
      if (sName.includes("cuci") || sName.includes("kering")) {
        deductions.push({ key: "sabun_pakaian", amount: qty * 2 });
        deductions.push({ key: "pewangi_pakaian", amount: qty * 2 });
      }
      if (sName.includes("setrika")) {
        deductions.push({ key: "pewangi_setrika_pakaian", amount: qty * 1 });
      }
    }

    for (const d of deductions) {
      const [invRows] = await conn.query("SELECT * FROM inventory WHERE item_key = ?", [d.key]);
      const invItem = invRows[0];
      if (invItem) {
        const prevStock = Number(invItem.stock);
        const newStock = Math.max(0, prevStock - d.amount);
        await conn.query("UPDATE inventory SET stock = ? WHERE id = ?", [newStock, invItem.id]);
        await conn.query(
          `INSERT INTO inventory_logs (inventory_id, order_id, change_amount, previous_stock, new_stock, type, note)
           VALUES (?, ?, ?, ?, ?, 'deduction_order', ?)`,
          [invItem.id, orderId, -d.amount, prevStock, newStock, `Pengurangan otomatis saat diubah ke Dicuci (${orderCode} - ${item.service_name} x${qty})`]
        );
      }
    }
  }
}

// Helper fungsi pengembalian stok jika pesanan dibatalkan
async function restoreInventoryForOrder(conn, orderId, orderCode) {
  const [deductionLogs] = await conn.query(
    "SELECT * FROM inventory_logs WHERE order_id = ? AND type = 'deduction_order'",
    [orderId]
  );
  if (deductionLogs.length === 0) return;

  const [refundLogs] = await conn.query(
    "SELECT id FROM inventory_logs WHERE order_id = ? AND type = 'restock' AND note LIKE '%dibatalkan%'",
    [orderId]
  );
  if (refundLogs.length > 0) return;

  for (const log of deductionLogs) {
    const amountToRestore = Math.abs(Number(log.change_amount));
    const [invRows] = await conn.query("SELECT * FROM inventory WHERE id = ?", [log.inventory_id]);
    const invItem = invRows[0];
    if (invItem) {
      const prevStock = Number(invItem.stock);
      const newStock = prevStock + amountToRestore;
      await conn.query("UPDATE inventory SET stock = ? WHERE id = ?", [newStock, invItem.id]);
      await conn.query(
        `INSERT INTO inventory_logs (inventory_id, order_id, change_amount, previous_stock, new_stock, type, note)
         VALUES (?, ?, ?, ?, ?, 'restock', ?)`,
        [invItem.id, orderId, amountToRestore, prevStock, newStock, `Pengembalian stok pesanan dibatalkan (${orderCode})`]
      );
    }
  }
}

// PATCH /api/orders/:id/status - admin mengubah status pesanan
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status, note, cancel_reason } = req.body;
  const validStatuses = ["pending", "picked_up", "in_process", "ready", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    const order = orderRows[0];
    if (!order) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    const cancelReasonText = status === "cancelled" ? (cancel_reason || note || null) : null;

    if (status === "cancelled") {
      await conn.query(
        "UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?",
        [status, cancelReasonText, req.params.id]
      );
    } else {
      await conn.query(
        "UPDATE orders SET status = ?, cancel_reason = NULL WHERE id = ?",
        [status, req.params.id]
      );
    }

    await conn.query(
      "INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)",
      [req.params.id, status, cancelReasonText || note || null]
    );

    // Pengurangan stok HANYA saat status diubah ke 'in_process' (Dicuci / Dalam Proses)
    if (status === "in_process") {
      await deductInventoryForOrder(conn, order.id, order.order_code);
    } else if (status === "cancelled") {
      await restoreInventoryForOrder(conn, order.id, order.order_code);
    }

    await conn.commit();

    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    res.json({ message: "Status pesanan diperbarui.", order: rows[0] });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui status pesanan." });
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/payment - admin menandai pembayaran
router.patch("/:id/payment", requireAuth, requireAdmin, async (req, res) => {
  const { payment_status } = req.body;
  if (!["paid", "unpaid"].includes(payment_status)) {
    return res.status(400).json({ error: "Status pembayaran tidak valid." });
  }
  const [result] = await pool.query(
    "UPDATE orders SET payment_status = ? WHERE id = ?",
    [payment_status, req.params.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  }
  const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  res.json({ message: "Status pembayaran diperbarui.", order: rows[0] });
});

// POST /api/orders/:id/submit-payment - customer mengirimkan konfirmasi pembayaran (upload bukti transfer / tunai)
router.post("/:id/submit-payment", requireAuth, upload.single("payment_proof"), async (req, res) => {
  try {
    const { payment_method } = req.body;
    if (!["cash", "transfer"].includes(payment_method)) {
      return res.status(400).json({ error: "Metode pembayaran tidak valid." });
    }

    // Pastikan order milik customer yang login
    const [orderRows] = await pool.query(
      "SELECT id, user_id, payment_status, delivery_type FROM orders WHERE id = ?",
      [req.params.id]
    );
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Anda tidak memiliki akses ke pesanan ini." });
    }
    if (order.payment_status === "paid" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Pesanan ini sudah lunas." });
    }
    if (order.delivery_type === "pickup_delivery" && payment_method === "cash" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Layanan Antar Jemput Kurir hanya mendukung metode pembayaran Transfer Bank." });
    }

    let proofFileName = null;
    if (payment_method === "transfer") {
      if (!req.file) {
        return res.status(400).json({ error: "Bukti pembayaran wajib diunggah untuk metode transfer." });
      }
      proofFileName = req.file.filename;
    }

    await pool.query(
      "UPDATE orders SET payment_method = ?, payment_proof = ?, payment_status = 'paid' WHERE id = ?",
      [payment_method, proofFileName, req.params.id]
    );

    res.json({ 
      message: "Bukti pembayaran berhasil dikirim.",
      payment_method,
      payment_proof: proofFileName 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses pembayaran pesanan." });
  }
});

export default router;
