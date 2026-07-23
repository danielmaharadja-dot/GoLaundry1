import jwt from "jsonwebtoken";

// Memastikan request punya token JWT yang valid
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan. Silakan login." });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

// Memastikan user yang login adalah admin
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya admin yang diizinkan." });
  }
  next();
}
