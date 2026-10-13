const feeCurrency = (import.meta.env.VITE_CURRENCY || 'USD').toUpperCase();

export const formatFeeAmount = (amount) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: feeCurrency,
}).format(Number(amount) || 0);