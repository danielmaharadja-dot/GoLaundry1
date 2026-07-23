-- ============================================
-- GoLaundry Database Schema (MySQL 8+)
-- ============================================

CREATE DATABASE IF NOT EXISTS golaundry
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE golaundry;

-- ---------- Users ----------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Addresses (jemput/antar) ----------
CREATE TABLE addresses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  label        VARCHAR(60) NOT NULL,          -- "Rumah", "Kos", dst
  full_address TEXT NOT NULL,
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Services (jenis layanan laundry) ----------
CREATE TABLE services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,          -- "Cuci Kering", "Cuci Setrika", "Setrika Saja"
  description TEXT,
  unit        VARCHAR(20) NOT NULL DEFAULT 'kg',  -- kg / pcs / set
  price       DECIMAL(10,2) NOT NULL,
  eta_hours   INT NOT NULL DEFAULT 24,        -- estimasi waktu pengerjaan
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Orders ----------
CREATE TABLE orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_code      VARCHAR(20) UNIQUE NOT NULL,   -- "GL-20260720-0001"
  user_id         INT NOT NULL,
  address_id      INT,
  status          ENUM('pending','picked_up','in_process','ready','delivered','cancelled')
                    NOT NULL DEFAULT 'pending',
  payment_status  ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  pickup_schedule DATETIME,
  notes           TEXT,
  cancel_reason   TEXT,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (address_id) REFERENCES addresses(id)
) ENGINE=InnoDB;

-- ---------- Order items (detail layanan per order) ----------
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  service_id  INT NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL,      -- jumlah kg/pcs
  unit_price  DECIMAL(10,2) NOT NULL,      -- harga saat order dibuat (snapshot)
  subtotal    DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB;

-- ---------- Order status history (untuk tracking) ----------
CREATE TABLE order_status_history (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  status     ENUM('pending','picked_up','in_process','ready','delivered','cancelled') NOT NULL,
  note       VARCHAR(255),
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Seed data: layanan default
INSERT INTO services (name, description, unit, price, eta_hours) VALUES
('Cuci Kering', 'Cuci dan pengeringan tanpa setrika', 'kg', 7000, 24),
('Cuci Setrika', 'Cuci, kering, dan setrika rapi', 'kg', 10000, 48),
('Setrika Saja', 'Hanya setrika pakaian yang sudah bersih', 'kg', 6000, 24),
('Cuci Sepatu', 'Cuci sepatu deep clean', 'pcs', 25000, 48),
('Cuci Selimut/Bed Cover', 'Cuci item besar seperti selimut & bed cover', 'pcs', 35000, 48);

-- Seed data admin default dibuat lewat backend/seed.js (password di-hash dengan bcrypt)
