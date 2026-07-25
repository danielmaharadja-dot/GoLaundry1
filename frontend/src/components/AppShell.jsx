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
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-blue-950 text-white sticky top-0 z-30 shadow-md border-b border-blue-900/40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧺</span>
          <span className="font-display font-bold text-lg tracking-tight"><span className="text-blue-400">Go</span><span className="text-white">Laundry</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-200/80 bg-blue-900/60 px-2.5 py-1 rounded-full font-medium">
            {user?.name?.split(" ")[0]}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-300 hover:text-white font-semibold bg-blue-900/40 hover:bg-blue-900 px-2.5 py-1 rounded-lg transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Konten utama */}
      <main className="flex-1 md:ml-60 lg:ml-72 pb-24 md:pb-8 px-4 py-5 md:px-8 md:py-8 max-w-[1400px] w-full mx-auto min-w-0">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-blue-950/10 flex items-center justify-between px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app" || item.to === "/admin"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 flex-1 min-w-0 ${
                isActive ? "text-blue-600 font-semibold bg-blue-50/90" : "text-ink/50 hover:text-ink/80"
              }`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
              {item.to === "/admin/pesanan" && pendingOnlineCount > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[9px] font-bold h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {pendingOnlineCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
