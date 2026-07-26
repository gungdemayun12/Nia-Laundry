import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_SERVICES, DEFAULT_SETTINGS } from './utils/constants';
import { exportJSON, importJSON } from './utils/helpers';
import Swal from 'sweetalert2';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TransaksiBaru from './pages/TransaksiBaru';
import Pesanan from './pages/Pesanan';
import RiwayatPesanan from './pages/RiwayatPesanan';
import DataPelanggan from './pages/DataPelanggan';
import Layanan from './pages/Layanan';
import Pengaturan from './pages/Pengaturan';
import Laporan from './pages/Laporan';
import ReceiptPage from './pages/ReceiptPage';
import LoginPage from './pages/LoginPage';
import TutupKasir from './pages/TutupKasir';

function RouteTracker() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = window.localStorage.getItem('pos_last_route');
    const isInitialLoad = !window.sessionStorage.getItem('pos_app_loaded');

    if (isInitialLoad) {
      window.sessionStorage.setItem('pos_app_loaded', 'true');
      if (saved && saved !== '/' && location.pathname === '/') {
        navigate(saved, { replace: true });
        return;
      }
    }

    if (location.pathname) {
      window.localStorage.setItem('pos_last_route', location.pathname);
    }
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  const [transactions, setTransactions] = useLocalStorage('pos_transactions', []);
  const [customers, setCustomers] = useLocalStorage('pos_customers', []);
  const [services, setServices] = useLocalStorage('pos_services', DEFAULT_SERVICES);
  const [settings, setSettings] = useLocalStorage('pos_settings', DEFAULT_SETTINGS);
  const [darkMode, setDarkMode] = useLocalStorage('pos_dark_mode', false);
  const [dailyClosings, setDailyClosings] = useLocalStorage('pos_daily_closings', []);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pos_auth_logged_in') === 'true';
  });

  const authUsername = localStorage.getItem('pos_auth_username');

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('pos_auth_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pos_auth_logged_in');
    localStorage.removeItem('pos_last_route');
    if (window.location.hash && window.location.hash !== '#/') {
      window.location.hash = '#/';
    }
  };

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Keep-alive: touch localStorage every 5 minutes to keep session active ──
  useEffect(() => {
    const keepAlive = setInterval(() => {
      try {
        const timestamp = new Date().toISOString();
        window.localStorage.setItem('pos_last_active', timestamp);
        const keys = ['pos_transactions', 'pos_customers', 'pos_services', 'pos_settings', 'pos_daily_closings'];
        keys.forEach((key) => {
          const data = window.localStorage.getItem(key);
          if (data) {
            window.localStorage.setItem(key, data);
          }
        });
      } catch (e) {
        console.warn('Keep-alive localStorage touch failed:', e);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);

  // ── Prevent accidental page close / refresh losing state ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        window.localStorage.setItem('pos_last_active', new Date().toISOString());
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Error recovery: catch unhandled errors ──
  useEffect(() => {
    const handleError = (event) => {
      console.error('Unhandled error:', event.error);
      event.preventDefault();
    };
    const handleRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Backup & Restore functions
  const handleBackup = () => {
    const data = {
      pos_transactions: transactions,
      pos_customers: customers,
      pos_services: services,
      pos_settings: settings,
      pos_daily_closings: dailyClosings,
      exportDate: new Date().toISOString(),
    };
    exportJSON(data, `backup-pos-laundry-${new Date().toISOString().split('T')[0]}.json`);
  };

  const fileInputRef = useRef(null);
  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importJSON(file);
      if (data.pos_transactions) setTransactions(data.pos_transactions);
      if (data.pos_customers) setCustomers(data.pos_customers);
      if (data.pos_services) setServices(data.pos_services);
      if (data.pos_settings) setSettings(data.pos_settings);
      if (data.pos_daily_closings) setDailyClosings(data.pos_daily_closings);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil direstore!', showCloseButton: true });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'File tidak valid! Pastikan file JSON yang diekspor dari sistem ini.', showCloseButton: true });
    }
    e.target.value = '';
  };

  // ── Auth check (after all hooks) ──
  if (authUsername && !isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <RouteTracker />
      <Layout darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                transactions={transactions}
                setTransactions={setTransactions}
              />
            }
          />
          <Route
            path="/transaksi-baru"
            element={
              <TransaksiBaru
                transactions={transactions}
                setTransactions={setTransactions}
                customers={customers}
                setCustomers={setCustomers}
                services={services}
              />
            }
          />
          <Route
            path="/pesanan"
            element={
              <Pesanan
                transactions={transactions}
                setTransactions={setTransactions}
                services={services}
              />
            }
          />
          <Route
            path="/riwayat-pesanan"
            element={
              <RiwayatPesanan
                transactions={transactions}
                setTransactions={setTransactions}
                services={services}
              />
            }
          />
          <Route
            path="/pelanggan"
            element={
              <DataPelanggan
                customers={customers}
                transactions={transactions}
              />
            }
          />
          <Route
            path="/layanan"
            element={
              <Layanan
                services={services}
                setServices={setServices}
              />
            }
          />
          <Route
            path="/pengaturan"
            element={
              <Pengaturan
                settings={settings}
                setSettings={setSettings}
                onBackup={handleBackup}
                onRestore={handleRestore}
                fileInputRef={fileInputRef}
              />
            }
          />
          <Route
            path="/laporan"
            element={
              <Laporan
                transactions={transactions}
                services={services}
              />
            }
          />
          <Route
            path="/tutup-kasir"
            element={
              <TutupKasir
                transactions={transactions}
                dailyClosings={dailyClosings}
                setDailyClosings={setDailyClosings}
              />
            }
          />
          <Route
            path="/struk/:id"
            element={<ReceiptPage />}
          />
        </Routes>
      </Layout>

      {/* Hidden file input for restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleRestore}
      />
    </HashRouter>
  );
}