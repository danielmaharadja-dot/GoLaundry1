import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../utils/mailer.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, email, phone || null, passwordHash]
    );

    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
      [result.insertId]
    );
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mendaftarkan akun." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal login." });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
    [req.user.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  }
  res.json({ user: rows[0] });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi." });
    }

    const [rows] = await pool.query("SELECT id, email FROM users WHERE email = ?", [email]);
    const user = rows[0];

    // Kembalikan pesan sukses yang sama untuk keamanan jika email tidak ditemukan (prevent user enumeration)
    if (!user) {
      return res.json({ message: "Jika email terdaftar, link reset password akan dikirim ke email Anda." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    // Berlaku 1 jam
    const expires = new Date(Date.now() + 3600 * 1000);

    await pool.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const resetLink = `${clientOrigin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendResetPasswordEmail(email, resetLink);

    res.json({ message: "Link reset password telah dikirim ke email Anda." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses permintaan reset password." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ error: "Token, email, dan password baru wajib diisi." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const [rows] = await pool.query(
      "SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?",
      [email]
    );
    const user = rows[0];

    if (!user || user.reset_token !== token || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: "Token reset password tidak valid atau sudah kedaluwarsa." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [passwordHash, user.id]
    );

    res.json({ message: "Password berhasil diubah. Silakan login kembali dengan password baru." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mereset password." });
  }
});

// PUT /api/auth/profile
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama wajib diisi." });
    }

    const userId = req.user.id;

    // Ambil data user saat ini dari DB
    const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    let passwordHash = user.password_hash;

    // Jika user menginput password baru untuk diubah
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Password saat ini wajib diisi untuk mengubah password." });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password baru minimal 6 karakter." });
      }

      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: "Password saat ini tidak cocok." });
      }

      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update profil di DB
    await pool.query(
      "UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?",
      [name, phone || null, passwordHash, userId]
    );

    // Ambil data user yang sudah diupdate
    const [updatedRows] = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
      [userId]
    );
    
    res.json({
      message: "Profil Anda berhasil diperbarui.",
      user: updatedRows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui profil." });
  }
});

export default router;
