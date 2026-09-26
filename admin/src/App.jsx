import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import PromoCodes from "./pages/PromoCodes";
import Offers from "./pages/Offers";
import Tables from "./pages/Tables";
import Settings from "./pages/Settings";
import { api, BASE_URL } from "./api";
import { nameBase } from "./apiBase";

function Layout() {
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setBusinessName(s.businessName);
        // Lets the switcher list this backend by the shop's name rather
        // than by its hostname next time.
        nameBase(BASE_URL, s.businessName);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Sidebar businessName={businessName} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/promo-codes" element={<PromoCodes />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/settings" element={<Settings onBusinessNameChange={setBusinessName} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Gate() {
  const { admin, loading } = useAuth();

  if (loading) return <div className="loading-screen">Yuklanmoqda...</div>;
  if (!admin) return <Login />;
  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
