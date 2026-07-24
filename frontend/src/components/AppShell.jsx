import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const customerNav = [
  { to: "/app", label: "Beranda", icon: "🏠" },
  { to: "/app/order", label: "Pesan", icon: "🧺" },
  { to: "/app/riwayat", label: "Riwayat", icon: "📋" },
  { to: "/app/ulasan", label: "Ulasan", icon: "⭐" },
  { to: "/app/akun", label: "Akun", icon: "👤" },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/pesanan", label: "Pesanan", icon: "📦" },
  { to: "/admin/pelanggan", label: "Pelanggan", icon: "👥" },
  { to: "/admin/layanan", label: "Layanan", icon: "🧴" },
  { to: "/admin/stok", label: "Gudang Stok", icon: "🧪" },
  { to: "/admin/ulasan", label: "Ulasan", icon: "⭐" },
  { to: "/admin/diskon", label: "Diskon", icon: "🎁" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : customerNav;
  const [pendingOnlineCount, setPendingOnlineCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;

    function fetchPendingCount() {
      api.getAllOrders("pending")
        .then((data) => {
          if (data && data.orders) {
            // Count online orders (delivery_type === "pickup_delivery") in pending status
            const count = data.orders.filter(
              (o) => o.delivery_type === "pickup_delivery" && o.status === "pending"
            ).length;
            setPendingOnlineCount(count);
          }
        })
        .catch((err) => console.error(err));
    }

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 8000);
    window.addEventListener("orderStatusUpdated", fetchPendingCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("orderStatusUpdated", fetchPendingCount);
    };
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar untuk tablet & desktop */}
      <aside className="hidden md:flex md:w-60 lg:w-72 md:flex-col md:fixed md:inset-y-0 bg-blue-950 text-white px-5 py-6">
        <div className="flex items-center gap-2 mb-10 px-1">
          <span className="text-2xl">🧺</span>
          <span className="font-display font-bold text-lg"><span className="text-blue-400">Go</span><span className="text-white">Laundry</span></span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app" || item.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl2 font-medium transition-colors ${
                  isActive ? "bg-blue-900 text-white" : "text-blue-100/70 hover:bg-blue-900/50"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.to === "/admin/pesanan" && pendingOnlineCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                  {pendingOnlineCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-blue-100/60 px-4 mb-2 truncate">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl2 text-blue-100/80 hover:bg-blue-900/50 transition-colors text-sm font-medium"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-4 bg-blue-950 text-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧺</span>
          <span className="font-display font-bold"><span className="text-blue-400">Go</span><span className="text-white">Laundry</span></span>
        </div>
        <button onClick={handleLogout} className="text-sm text-blue-100/80 font-medium">
          Keluar
        </button>
      </header>

      {/* Konten utama */}
      <main className="flex-1 md:ml-60 lg:ml-72 pb-20 md:pb-8 px-4 py-5 md:px-8 md:py-8 max-w-[1400px] w-full mx-auto min-w-0 overflow-x-auto break-words">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-blue-950/10 flex items-center overflow-x-auto no-scrollbar scroll-touch justify-start sm:justify-around gap-1 px-2 py-2 z-20 shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app" || item.to === "/admin"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 min-w-[64px] ${
                isActive ? "text-blue-600 font-semibold bg-blue-50/80" : "text-ink/50 hover:text-ink/80"
              }`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              {item.to === "/admin/pesanan" && pendingOnlineCount > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-rose-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {pendingOnlineCount}
                </span>
              )}
            </div>
            <span className="truncate max-w-[72px] text-center">{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
