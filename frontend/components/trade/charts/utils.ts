export const formatPrice = (p: number) =>
  p >= 1
    ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
    : p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
