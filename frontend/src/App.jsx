import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import CustomerHome from "./pages/CustomerHome.jsx";
import OrderForm from "./pages/OrderForm.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Account from "./pages/Account.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminCustomers from "./pages/AdminCustomers.jsx";
import AdminServices from "./pages/AdminServices.jsx";
import CustomerReviews from "./pages/CustomerReviews.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import AdminDiscounts from "./pages/AdminDiscounts.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/app") : "/login"} replace />} />
      <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/app"} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/app" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/app" /> : <ResetPassword />} />

      {/* Customer */}
      <Route path="/app" element={<ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>} />
      <Route path="/app/order" element={<ProtectedRoute role="customer"><OrderForm /></ProtectedRoute>} />
      <Route path="/app/riwayat" element={<ProtectedRoute role="customer"><OrderHistory /></ProtectedRoute>} />
      <Route path="/app/pesanan/:id" element={<ProtectedRoute role="customer"><OrderDetail /></ProtectedRoute>} />
      <Route path="/app/akun" element={<ProtectedRoute role="customer"><Account /></ProtectedRoute>} />
      <Route path="/app/ulasan" element={<ProtectedRoute role="customer"><CustomerReviews /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/pesanan" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/pelanggan" element={<ProtectedRoute role="admin"><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/layanan" element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/ulasan" element={<ProtectedRoute role="admin"><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/diskon" element={<ProtectedRoute role="admin"><AdminDiscounts /></ProtectedRoute>} />
      <Route path="/admin/stok" element={<ProtectedRoute role="admin"><AdminInventory /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
