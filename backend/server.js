import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/services.js";
import orderRoutes from "./routes/orders.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";
import regionsRouter from "./routes/regions.js";
import reviewsRouter from "./routes/reviews.js";
import settingsRouter from "./routes/settings.js";
import inventoryRouter from "./routes/inventory.js";
import fs from "fs";

dotenv.config();

// Pastikan folder uploads ada
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Inisialisasi database
async function initDb() {
  try {
    // Migrasi kolom reset_token pada users
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'reset_token'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL");
      await pool.query("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL");
      console.log("Database schema updated: Added reset_token and reset_token_expires columns to users table.");
    }

    // Migrasi kolom maps_link pada addresses
    const [addrColumns] = await pool.query("SHOW COLUMNS FROM addresses LIKE 'maps_link'");
    if (addrColumns.length === 0) {
      await pool.query("ALTER TABLE addresses ADD COLUMN maps_link VARCHAR(255) NULL");
      console.log("Database schema updated: Added maps_link column to addresses table.");
    }

    // Migrasi kolom tambahan detail alamat pada addresses
    const [cityColumns] = await pool.query("SHOW COLUMNS FROM addresses LIKE 'city'");
    if (cityColumns.length === 0) {
      await pool.query("ALTER TABLE addresses ADD COLUMN city VARCHAR(100) NULL");
      await pool.query("ALTER TABLE addresses ADD COLUMN district VARCHAR(120) NULL");
      await pool.query("ALTER TABLE addresses ADD COLUMN postal_code VARCHAR(10) NULL");
      console.log("Database schema updated: Added city, district, and postal_code columns to addresses table.");
    }

    // Migrasi kolom province dan village pada addresses
    const [provColumns] = await pool.query("SHOW COLUMNS FROM addresses LIKE 'province'");
    if (provColumns.length === 0) {
      await pool.query("ALTER TABLE addresses ADD COLUMN province VARCHAR(100) NULL");
      await pool.query("ALTER TABLE addresses ADD COLUMN village VARCHAR(120) NULL");
      console.log("Database schema updated: Added province and village columns to addresses table.");
    }

    // Migrasi kolom is_deleted pada addresses
    const [delColumns] = await pool.query("SHOW COLUMNS FROM addresses LIKE 'is_deleted'");
    if (delColumns.length === 0) {
      await pool.query("ALTER TABLE addresses ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE");
      console.log("Database schema updated: Added is_deleted column to addresses table.");
    }

    // Migrasi kolom eta_hours_express pada services
    const [etaExpColumns] = await pool.query("SHOW COLUMNS FROM services LIKE 'eta_hours_express'");
    if (etaExpColumns.length === 0) {
      await pool.query("ALTER TABLE services ADD COLUMN eta_hours_express INT DEFAULT 12");
      console.log("Database schema updated: Added eta_hours_express column to services table.");
    }

    // Migrasi kolom price_express pada services
    const [priceExpColumns] = await pool.query("SHOW COLUMNS FROM services LIKE 'price_express'");
    if (priceExpColumns.length === 0) {
      await pool.query("ALTER TABLE services ADD COLUMN price_express DECIMAL(10,2) NULL");
      await pool.query("UPDATE services SET price_express = price * 1.5 WHERE price_express IS NULL");
      console.log("Database schema updated: Added price_express column to services table.");
    }

    // Inisialisasi tabel reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL UNIQUE,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT NULL,
        reply TEXT NULL,
        replied_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Database schema initialized: reviews table created/verified.");

    // Migrasi kolom discount_amount dan discount_type pada orders
    const [discColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'discount_amount'");
    if (discColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00");
      await pool.query("ALTER TABLE orders ADD COLUMN discount_type VARCHAR(50) NULL");
      console.log("Database schema updated: Added discount columns to orders table.");
    }

    // Migrasi kolom outlet_name, distance_km, dan shipping_fee pada orders
    const [outletColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'outlet_name'");
    if (outletColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN outlet_name VARCHAR(150) NULL");
      await pool.query("ALTER TABLE orders ADD COLUMN distance_km DECIMAL(5,2) DEFAULT 0.00");
      await pool.query("ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) DEFAULT 0.00");
      console.log("Database schema updated: Added outlet_name, distance_km, and shipping_fee columns to orders table.");
    }

    // Migrasi kolom cancel_reason pada orders
    const [cancelColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'cancel_reason'");
    if (cancelColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN cancel_reason TEXT NULL");
      console.log("Database schema updated: Added cancel_reason column to orders table.");
    }

    // Migrasi kolom delivery_type dan service_type pada orders
    const [delTypeColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'delivery_type'");
    if (delTypeColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(50) DEFAULT 'pickup_delivery'");
      await pool.query("ALTER TABLE orders ADD COLUMN service_type VARCHAR(50) DEFAULT 'reguler'");
      console.log("Database schema updated: Added delivery_type and service_type columns to orders table.");
    }

    // Migrasi kolom payment_method dan payment_proof pada orders
    const [payMethodColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_method'");
    if (payMethodColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL");
      await pool.query("ALTER TABLE orders ADD COLUMN payment_proof VARCHAR(255) NULL");
      console.log("Database schema updated: Added payment_method and payment_proof columns to orders table.");
    }

    // Inisialisasi tabel settings untuk konfigurasi diskon
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL
      )
    `);
    console.log("Database schema initialized: settings table created/verified.");

    // Masukkan default settings jika belum ada
    const defaultSettings = [
      { key: "loyalty_order_count", val: "10" },
      { key: "loyalty_discount_percent", val: "20" },
      { key: "promo_discount_percent", val: "10" },
      { key: "promo_banner_text", val: "Promo Hemat! Diskon 10% untuk pesanan reguler minggu ini." }
    ];

    for (const item of defaultSettings) {
      await pool.query(
        "INSERT IGNORE INTO settings (key_name, value) VALUES (?, ?)",
        [item.key, item.val]
      );
    }

    // Inisialisasi tabel inventory dan inventory_logs (Gudang Stok)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        min_stock DECIMAL(10,2) NOT NULL DEFAULT 10.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT NOT NULL,
        order_id INT NULL,
        change_amount DECIMAL(10,2) NOT NULL,
        previous_stock DECIMAL(10,2) NOT NULL,
        new_stock DECIMAL(10,2) NOT NULL,
        type ENUM('deduction_order', 'restock', 'manual_adjustment') NOT NULL,
        note VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
      )
    `);

    const defaultInventory = [
      { key: "sabun_pakaian", name: "Sabun Cuci Pakaian", category: "pakaian", unit: "pcs", stock: 200, min_stock: 20 },
      { key: "pewangi_pakaian", name: "Pewangi Cuci Pakaian", category: "pakaian", unit: "pcs", stock: 200, min_stock: 20 },
      { key: "pewangi_setrika_pakaian", name: "Pewangi Setrika Pakaian", category: "pakaian", unit: "liter", stock: 100, min_stock: 10 },
      { key: "sabun_sepatu", name: "Sabun Cuci Sepatu", category: "sepatu", unit: "pcs", stock: 100, min_stock: 10 },
      { key: "pewangi_sepatu", name: "Pewangi Cuci Sepatu", category: "sepatu", unit: "pcs", stock: 100, min_stock: 10 },
      { key: "sabun_selimut", name: "Sabun Cuci Selimut / Bedcover", category: "selimut", unit: "pcs", stock: 100, min_stock: 10 },
      { key: "pewangi_selimut", name: "Pewangi Cuci Selimut / Bedcover", category: "selimut", unit: "pcs", stock: 100, min_stock: 10 },
      { key: "pewangi_setrika_selimut", name: "Pewangi Setrika Selimut / Bedcover", category: "selimut", unit: "liter", stock: 50, min_stock: 5 },
    ];

    for (const item of defaultInventory) {
      await pool.query(
        `INSERT INTO inventory (item_key, name, category, unit, stock, min_stock)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), unit=VALUES(unit)`,
        [item.key, item.name, item.category, item.unit, item.stock, item.min_stock]
      );
    }
  } catch (err) {
    console.error("Failed to run database initialization:", err);
  }
}
initDb();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "golaundry-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/regions", regionsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/inventory", inventoryRouter);

// Penanganan route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

// Penanganan error umum
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GoLaundry backend berjalan di http://localhost:${PORT}`);
});
