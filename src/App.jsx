import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LedgerView from './components/LedgerView';
import PendingEntries from './components/PendingEntries';
import CloseRequests from './components/CloseRequests';
import Navbar from './components/Navbar';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Axios default config
axios.defaults.baseURL = 'http://localhost:3000/api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ledger/:id" element={<LedgerView />} />
          <Route path="/pending" element={<PendingEntries />} />
          <Route path="/close-requests" element={<CloseRequests />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;