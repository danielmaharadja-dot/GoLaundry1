// Jalankan dengan: npm run seed
// Membuat akun admin default: admin@golaundry.com / admin123

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

async function seedAdmin() {
  const email = "admin@golaundry.com";
  const password = "bosdaniel123";

  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  
  if (existing.length > 0) {
    await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [passwordHash, email]);
    console.log(`Password akun admin (${email}) berhasil diperbarui menjadi: ${password}`);
    process.exit(0);
  }

  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, 'admin')`,
    ["Admin GoLaundry", email, "081234567890", passwordHash]
  );

  console.log("Akun admin berhasil dibuat:");
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Gagal membuat akun admin:", err);
  process.exit(1);
});
