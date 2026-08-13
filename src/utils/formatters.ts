// Centralized Currency & Metric Formatters for Enerji Pro

export const FX_RATES = {
  USD: 39.5, // 1 USD = ~39.5 TL
  EUR: 43.2, // 1 EUR = ~43.2 TL
};

export const formatTL = (amount: number): string => {
  return Math.round(amount).toLocaleString('ru-RU');
};

export const formatUSD = (tlAmount: number): string => {
  const usd = tlAmount / FX_RATES.USD;
  return `$${Math.round(usd).toLocaleString('ru-RU')}`;
};

export const formatEUR = (tlAmount: number): string => {
  const eur = tlAmount / FX_RATES.EUR;
  return `€${Math.round(eur).toLocaleString('ru-RU')}`;
};

export const formatCurrencyPair = (tlAmount: number): string => {
  return `${formatTL(tlAmount)} TL (≈ ${formatUSD(tlAmount)} / ${formatEUR(tlAmount)})`;
};

export const formatKWh = (kwh: number): string => {
  return `${Number(kwh.toFixed(1)).toLocaleString('ru-RU')} кВт·ч`;
};
