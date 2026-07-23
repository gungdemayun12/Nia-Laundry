import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Receipt from './Receipt';

export default function PrintReceipt({ transaction, settings }) {
  useEffect(() => {
    if (!document.getElementById('receipt-portal')) {
      const div = document.createElement('div');
      div.id = 'receipt-portal';
      document.body.appendChild(div);
    }
  }, []);

  const portal = document.getElementById('receipt-portal');
  if (!portal || !transaction) return null;

  return createPortal(
    <Receipt transaction={transaction} settings={settings} id="receipt-capture" />,
    portal
  );
}

export function ReceiptPreview({ transaction, settings, receiptId }) {
  if (!transaction) return null;
  return <Receipt transaction={transaction} settings={settings} id={receiptId || "receipt-capture"} />;
}