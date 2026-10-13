import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Loader2, QrCode, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const formatRupees = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(Number(amount) || 0);

const UpiPaymentModal = ({ fee, onClose, onSubmitted }) => {
  const [payment, setPayment] = useState(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    axiosInstance.post('/fees/payment/upi/order', { feeId: fee._id })
      .then((response) => {
        if (active) setPayment(response.data.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to prepare UPI payment.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fee._id]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(payment.upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Unable to copy UPI ID. Select and copy it manually.');
    }
  };

  const submitReference = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/fees/payment/upi/submit', {
        feeId: fee._id,
        upiReference: reference.trim(),
      });
      onSubmitted();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit payment reference.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="upi-payment-title" className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 id="upi-payment-title" className="font-bold text-slate-900">Pay with UPI</h2>
            <p className="mt-1 text-xs text-slate-500">Google Pay, PhonePe, Paytm and other UPI apps</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close UPI payment" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{fee.title}</span>
            <strong className="shrink-0 text-slate-900">{formatRupees(fee.amount)}</strong>
          </div>
          {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-700" /></div>}
          {!loading && payment && (
            <>
              <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <QRCodeSVG value={payment.upiUri} size={208} level="M" includeMargin />
                <p className="text-xs text-slate-500">Scan using any UPI payment app</p>
                <div className="flex w-full items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="truncate font-medium text-slate-800">{payment.upiId}</span>
                  <button type="button" onClick={copyUpiId} aria-label="Copy UPI ID" title="Copy UPI ID" className="rounded p-1.5 text-slate-600 hover:bg-slate-200">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <a href={payment.upiUri} className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                  <QrCode className="h-4 w-4" /> Open UPI app
                </a>
              </div>
              <form onSubmit={submitReference} className="space-y-3 border-t border-slate-200 pt-4">
                <label className="block text-xs font-semibold text-slate-700">
                  UPI transaction reference / UTR
                  <input
                    required
                    minLength={6}
                    maxLength={80}
                    value={reference}
                    onChange={(event) => setReference(event.target.value.replace(/[^a-z\d-]/gi, ''))}
                    placeholder="Enter reference shown in your payment app"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-700"
                  />
                </label>
                <button type="submit" disabled={submitting || reference.trim().length < 6} className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'I have paid'}
                </button>
                <p className="text-xs leading-5 text-slate-500">Your invoice remains pending until the school confirms the payment.</p>
              </form>
            </>
          )}
          {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>
      </section>
    </div>
  );
};

export default UpiPaymentModal;