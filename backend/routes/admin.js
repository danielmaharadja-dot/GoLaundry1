import { Router } from "express";
import pool from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = Router();

// Semua route di sini memerlukan autentikasi admin
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats - Statistik dashboard & omset dengan filter terpisah untuk bulan & tahun
router.get("/stats", async (req, res) => {
  try {
    const { month, year } = req.query;
    let hasFilter = false;
    let filterParams = [];
    let conditions = [];

    // Filter Tahun
    if (year && year !== "all" && /^\d{4}$/.test(year)) {
      conditions.push("YEAR(created_at) = ?");
      filterParams.push(Number(year));
    }

    // Filter Bulan
    if (month && month !== "all" && /^\d{1,2}$/.test(month)) {
      conditions.push("MONTH(created_at) = ?");
      filterParams.push(Number(month));
    }

    let filterQuery = "";
    if (conditions.length > 0) {
      hasFilter = true;
      filterQuery = " AND " + conditions.join(" AND ");
    }

    // 1. Hitung total pelanggan (baru terdaftar jika difilter, atau total all-time)
    const customerQuery = `
      SELECT COUNT(*) AS count FROM users 
      WHERE role = 'customer' ${hasFilter ? " AND " + conditions.join(" AND ") : ""}
    `;
    const [[{ count: totalCustomers }]] = await pool.query(customerQuery, filterParams);

    // 2. Hitung total pesanan
    const ordersQuery = `
      SELECT COUNT(*) AS count FROM orders 
      WHERE 1=1 ${hasFilter ? filterQuery : ""}
    `;
    const [[{ count: totalOrders }]] = await pool.query(ordersQuery, filterParams);

    // 3. Hitung pesanan selesai
    const completedQuery = `
      SELECT COUNT(*) AS count FROM orders 
      WHERE status = 'delivered' ${hasFilter ? filterQuery : ""}
    `;
    const [[{ count: completedOrders }]] = await pool.query(completedQuery, filterParams);

    // 4. Hitung pesanan batal
    const cancelledQuery = `
      SELECT COUNT(*) AS count FROM orders 
      WHERE status = 'cancelled' ${hasFilter ? filterQuery : ""}
    `;
    const [[{ count: cancelledOrders }]] = await pool.query(cancelledQuery, filterParams);

    // 5. Hitung total omset lunas
    const omsetQuery = `
      SELECT COALESCE(SUM(total_amount), 0) AS amount FROM orders 
      WHERE payment_status = 'paid' ${hasFilter ? filterQuery : ""}
    `;
    const [[{ amount: totalOmset }]] = await pool.query(omsetQuery, filterParams);

    // 6. Hitung omset pending
    const unpaidQuery = `
      SELECT COALESCE(SUM(total_amount), 0) AS amount FROM orders 
      WHERE payment_status = 'unpaid' AND status != 'cancelled' ${hasFilter ? filterQuery : ""}
    `;
    const [[{ amount: unpaidOmset }]] = await pool.query(unpaidQuery, filterParams);

    // 7. Ambil daftar TAHUN yang tersedia di database untuk pilihan dropdown
    const [availableYearsRows] = await pool.query(`
      SELECT DISTINCT YEAR(created_at) AS year 
      FROM orders 
      ORDER BY year DESC
    `);
    const availableYears = availableYearsRows.map(row => row.year).filter(Boolean);

    // 8. Selalu ambil trend omset bulanan 6 bulan terakhir untuk grafik
    const [monthlyOmset] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_amount,
             COALESCE(SUM(CASE WHEN payment_status = 'unpaid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS unpaid_amount
      FROM orders
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);

    // 9. Ambil 3 layanan terpopuler (berdasarkan jumlah item yang dipesan)
    const [popularServices] = await pool.query(`
      SELECT s.name, COUNT(oi.id) AS count, COALESCE(SUM(oi.subtotal), 0) AS revenue
      FROM order_items oi
      JOIN services s ON s.id = oi.service_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' ${hasFilter ? " AND " + conditions.map(c => c.replace("created_at", "o.created_at")).join(" AND ") : ""}
      GROUP BY s.id, s.name
      ORDER BY count DESC
      LIMIT 3
    `, filterParams);

    // 10. Ambil 5 pesanan terbaru
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.order_code, u.name AS customer_name, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // 11. Ambil statistik pendapatan & pelanggan per cabang outlet
    const [outletStatsRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(o.outlet_name), ''), 'GoLaundry Outlet Dago (Coblong)') AS outlet_name,
        COUNT(o.id) AS total_orders,
        COUNT(DISTINCT o.user_id) AS total_customers,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS paid_revenue,
        COALESCE(SUM(CASE WHEN o.payment_status = 'unpaid' AND o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS unpaid_revenue,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_revenue
      FROM orders o
      WHERE 1=1 ${hasFilter ? " AND " + conditions.map(c => c.replace("created_at", "o.created_at")).join(" AND ") : ""}
      GROUP BY COALESCE(NULLIF(TRIM(o.outlet_name), ''), 'GoLaundry Outlet Dago (Coblong)')
      ORDER BY paid_revenue DESC, total_orders DESC
    `, filterParams);

    const KNOWN_OUTLETS = [
      "GoLaundry Outlet Dago (Coblong)",
      "GoLaundry Outlet Buah Batu (Lengkong)",
      "GoLaundry Outlet Sukajadi (PVJ)",
      "GoLaundry Outlet Alun-Alun (Sumur Bandung)",
      "GoLaundry Outlet Antapani",
      "GoLaundry Outlet Pasteur (Cicendo)",
    ];

    const outletMap = {};
    outletStatsRows.forEach(row => {
      outletMap[row.outlet_name] = {
        outlet_name: row.outlet_name,
        total_orders: Number(row.total_orders),
        total_customers: Number(row.total_customers),
        paid_revenue: Number(row.paid_revenue),
        unpaid_revenue: Number(row.unpaid_revenue),
        total_revenue: Number(row.total_revenue),
      };
    });

    // Gabungkan list outlet agar outlet yang belum ada transaksi tetap muncul dengan nilai 0
    const outletStats = KNOWN_OUTLETS.map(name => {
      if (outletMap[name]) {
        const item = outletMap[name];
        delete outletMap[name];
        return item;
      }
      return {
        outlet_name: name,
        total_orders: 0,
        total_customers: 0,
        paid_revenue: 0,
        unpaid_revenue: 0,
        total_revenue: 0,
      };
    });

    // Tambahkan outlet lain jika ada yang tidak terdaftar di KNOWN_OUTLETS
    Object.values(outletMap).forEach(item => outletStats.push(item));

    res.json({
      stats: {
        total_customers: Number(totalCustomers),
        total_orders: Number(totalOrders),
        completed_orders: Number(completedOrders),
        cancelled_orders: Number(cancelledOrders),
        total_omset: Number(totalOmset),
        unpaid_omset: Number(unpaidOmset),
        available_years: availableYears.map(Number),
        monthly_omset: monthlyOmset.map(item => ({
          month: item.month,
          paid_amount: Number(item.paid_amount),
          unpaid_amount: Number(item.unpaid_amount),
        })).reverse(),
        popular_services: popularServices.map(item => ({
          name: item.name,
          count: Number(item.count),
          revenue: Number(item.revenue),
        })),
        recent_orders: recentOrders.map(item => ({
          id: item.id,
          order_code: item.order_code,
          customer_name: item.customer_name,
          total_amount: Number(item.total_amount),
          status: item.status,
          created_at: item.created_at,
        })),
        outlet_stats: outletStats,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat statistik admin." });
  }
});

// GET /api/admin/customers - Daftar semua pelanggan beserta total order dan belanja
router.get("/customers", async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             COUNT(o.id) AS total_orders,
             COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spending
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json({ customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat data pelanggan." });
  }
});

// GET /api/admin/customers/:id/orders - Riwayat pesanan milik pelanggan tertentu
router.get("/customers/:id/orders", async (req, res) => {
  try {
    const customerId = req.params.id;
    const [orders] = await pool.query(`
      SELECT o.*, a.full_address, a.label AS address_label, a.maps_link
      FROM orders o
      LEFT JOIN addresses a ON a.id = o.address_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [customerId]);

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat pesanan pelanggan." });
  }
});

// POST /api/admin/customers - Admin mendaftarkan customer baru secara langsung
router.post("/customers", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama pelanggan wajib diisi." });
    }

    let finalEmail = email;
    if (!finalEmail) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      finalEmail = `${cleanName || "pelanggan"}_${randomSuffix}@golaundry.com`;
    }

    // Check email uniqueness
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [finalEmail]);
    if (existing.length > 0) {
      // If it exists, append timestamp to make it unique
      finalEmail = `${finalEmail.split("@")[0]}_${Date.now()}@golaundry.com`;
    }

    // Hashing a random password for direct walk-in customers
    const tempPassword = Math.random().toString(36).slice(-8) + "Direct!";
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, finalEmail, phone || null, passwordHash]
    );

    res.status(201).json({
      message: "Customer berhasil ditambahkan.",
      customer: {
        id: result.insertId,
        name,
        email: finalEmail,
        phone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menambahkan customer." });
  }
});

export default router;
