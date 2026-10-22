import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cloudSync } from './services/cloudSync';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import TicketList from './pages/TicketList';
import DigitalPass from './pages/DigitalPass';
import QrScanner from './pages/QrScanner';
import Login from './pages/Login';
import Settings from './pages/Settings';
import PassGallery from './pages/PassGallery';
import StudentFeedback from './pages/StudentFeedback';

function AppContent() {
  const location = useLocation();
  const isStudentOnlyView = 
    location.pathname.startsWith('/ticket/') || 
    location.pathname.startsWith('/verify/') || 
    location.pathname.startsWith('/feedback') || 
    location.pathname.startsWith('/rate') || 
    location.pathname.startsWith('/review');

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 selection:bg-purple-600 selection:text-white flex flex-col">
      {!isStudentOnlyView && <Navbar />}
      <main className={`flex-1 ${isStudentOnlyView ? 'pb-8' : 'pb-24 sm:pb-28 lg:pb-10'}`}>
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
          
          {/* Dedicated Student Feedback Portal */}
          <Route path="/feedback" element={<StudentFeedback />} />
          <Route path="/feedback/:ticketId" element={<StudentFeedback />} />
          <Route path="/rate" element={<StudentFeedback />} />
          <Route path="/review" element={<StudentFeedback />} />
          
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/scanner" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    cloudSync.init();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
