import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import TicketList from './pages/TicketList';
import DigitalPass from './pages/DigitalPass';
import QrScanner from './pages/QrScanner';
import Login from './pages/Login';
import Settings from './pages/Settings';
import PassGallery from './pages/PassGallery';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-950 text-slate-100 selection:bg-purple-600 selection:text-white flex flex-col">
          <Navbar />
          <main className="flex-1 pb-16 lg:pb-0">
            <Routes>
              {/* Event Day default entry: Pass Scanner */}
              <Route path="/" element={<Navigate to="/scanner" replace />} />
              <Route path="/login" element={<Navigate to="/scanner" replace />} />

              {/* Direct Access Routes (No Login Required) */}
              <Route path="/scanner" element={<QrScanner />} />
              <Route path="/passes" element={<PassGallery />} />
              <Route path="/qr-codes" element={<PassGallery />} />
              <Route path="/attendance" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/ticket/:ticketId" element={<DigitalPass />} />
              <Route path="/verify/:ticketId" element={<DigitalPass />} />
              <Route path="/settings" element={<Settings />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/scanner" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
