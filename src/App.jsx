import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_SERVICES, DEFAULT_SETTINGS } from './utils/constants';
import { exportJSON, importJSON } from './utils/helpers';
import Swal from 'sweetalert2';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TransaksiBaru from './pages/TransaksiBaru';
import RiwayatTransaksi from './pages/RiwayatTransaksi';
import DataPelanggan from './pages/DataPelanggan';
import Pengaturan from './pages/Pengaturan';
import Laporan from './pages/Laporan';

export default function App() {
  const [transactions, setTransactions] = useLocalStorage('pos_transactions', []);
  const [customers, setCustomers] = useLocalStorage('pos_customers', []);
  const [services, setServices] = useLocalStorage('pos_services', DEFAULT_SERVICES);
  const [settings, setSettings] = useLocalStorage('pos_settings', DEFAULT_SETTINGS);
  const [darkMode, setDarkMode] = useLocalStorage('pos_dark_mode', false);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Backup & Restore functions
  const handleBackup = () => {
    const data = {
      pos_transactions: transactions,
      pos_customers: customers,
      pos_services: services,
      pos_settings: settings,
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
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil direstore!' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'File tidak valid! Pastikan file JSON yang diekspor dari sistem ini.' });
    }
    e.target.value = '';
  };

  return (
    <BrowserRouter>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                transactions={transactions}
                setTransactions={setTransactions}
                services={services}
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
                settings={settings}
              />
            }
          />
          <Route
            path="/riwayat"
            element={
              <RiwayatTransaksi
                transactions={transactions}
                setTransactions={setTransactions}
                services={services}
                settings={settings}
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
            path="/pengaturan"
            element={
              <Pengaturan
                services={services}
                setServices={setServices}
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
    </BrowserRouter>
  );
}
