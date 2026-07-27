import { useState, useEffect, useCallback } from 'react';
import bluetoothPrinter from '../utils/bluetoothPrinter';

/**
 * React hook for managing Bluetooth printer state
 */
export function useBluetoothPrinter() {
  const [state, setState] = useState(() => bluetoothPrinter.getState());
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  // Auto reconnect saat komponen mount (refresh halaman)
  useEffect(() => {
    const saved = bluetoothPrinter.getSavedPrinter();
    if (saved && !state.isConnected) {
      setIsReconnecting(true);
      bluetoothPrinter.autoReconnect()
        .then((result) => {
          if (result && result.isConnected) {
            console.log('Auto-reconnect berhasil:', result.deviceName);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsReconnecting(false);
        });
    }
  }, []); // hanya sekali saat mount

  const scan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    try {
      await bluetoothPrinter.scanAndConnect();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    bluetoothPrinter.disconnect();
    setError(null);
  }, []);

  const forget = useCallback(() => {
    bluetoothPrinter.disconnect();
    bluetoothPrinter.clearSavedPrinter();
    setError(null);
  }, []);

  const reconnect = useCallback(async () => {
    setError(null);
    try {
      await bluetoothPrinter.reconnect();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const printReceipt = useCallback(async (transaction, settings) => {
    setError(null);
    try {
      await bluetoothPrinter.printReceipt(transaction, settings);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    ...state,
    isScanning,
    isReconnecting,
    error,
    scan,
    disconnect,
    forget,
    reconnect,
    printReceipt,
    savedPrinter: bluetoothPrinter.getSavedPrinter(),
  };
}