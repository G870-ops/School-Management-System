import axiosInstance from '../api/axiosInstance';

export const payFeeWithStripe = async (feeId) => {
  const response = await axiosInstance.post('/fees/payment/order', { feeId });
  const checkoutUrl = response.data.data?.checkoutUrl;
  if (!checkoutUrl) throw new Error('Unable to start secure payment checkout.');
  window.location.assign(checkoutUrl);
};

export const verifyStripeReturn = async () => {
  const returnUrl = new URL(window.location.href);
  const sessionId = returnUrl.searchParams.get('stripe_session_id');
  const cancelled = returnUrl.searchParams.get('stripe_payment_cancelled') === '1';
  if (!sessionId && !cancelled) return null;

  returnUrl.searchParams.delete('stripe_payment_cancelled');
  if (cancelled) {
    returnUrl.searchParams.delete('stripe_session_id');
    window.history.replaceState({}, '', returnUrl.toString());
    return { cancelled: true };
  }

  const response = await axiosInstance.post('/fees/payment/verify', { sessionId });
  returnUrl.searchParams.delete('stripe_session_id');
  window.history.replaceState({}, '', returnUrl.toString());
  return { cancelled: false, data: response.data };
};