import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Layout Components
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import BusinessPage from './pages/admin/BusinessPage';
import CustomersPage from './pages/admin/CustomersPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import UsersPage from './pages/admin/UsersPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

// Context
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Paradise Bakes & Cafe - Pure Vegetarian Delights</title>
        <meta name="description" content="Experience the finest pure vegetarian cakes, pastries, pizzas, burgers, and sandwiches in Pimple Gurav, Pune." />
        <meta name="keywords" content="vegetarian cafe, cakes, pastries, pizza, burger, sandwich, pune, pimple gurav, pure veg, bakery" />
        <link rel="canonical" href="https://paradisebakescafe.com" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={<LoginPage />} />
          {isAuthenticated && (
            <>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="business" element={<BusinessPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              {user?.role === 'admin' && (
                <Route path="users" element={<UsersPage />} />
              )}
            </>
          )}
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
