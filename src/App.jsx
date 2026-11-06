import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PesanTabungan from './pages/PesanTabungan';
import TabunganDetail from './pages/TabunganDetail';
import ScanTag from './pages/ScanTag';
import Riwayat from './pages/Riwayat';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PesananList from './pages/admin/PesananList';
import TabunganList from './pages/admin/TabunganList';
import TulisTag from './pages/admin/TulisTag';
import TransaksiList from './pages/admin/TransaksiList';
import MemberList from './pages/admin/MemberList';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/daftar" element={<Register />} />

          {/* Protected Routes inside Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default Root Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Member Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pesan" element={<PesanTabungan />} />
            <Route path="/t/:token" element={<TabunganDetail />} />
            <Route path="/scan" element={<ScanTag />} />
            <Route path="/riwayat" element={<Riwayat />} />

            {/* Admin Routes (memerlukan role: 'admin') */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pesanan"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <PesananList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tabungan"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <TabunganList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tulis-tag/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <TulisTag />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transaksi"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <TransaksiList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/member"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <MemberList />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

