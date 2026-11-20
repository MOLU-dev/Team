export interface Bank {
  id?: number | string;
  name: string;
  code: string;
  slug?: string;
  logo?: string;
}

export const DEFAULT_NIGERIAN_BANKS: Bank[] = [
  { name: 'Access Bank', code: '044', slug: 'access-bank' },
  { name: 'Access Bank (Diamond)', code: '063', slug: 'access-bank' },
  { name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria' },
  { name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
  { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
  { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
  { name: 'First City Monument Bank (FCMB)', code: '214', slug: 'first-city-monument-bank' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'guaranty-trust-bank' },
  { name: 'Heritage Bank', code: '030', slug: 'heritage-bank' },
  { name: 'Jaiz Bank', code: '301', slug: 'jaiz-bank' },
  { name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
  { name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
  { name: 'Moniepoint Microfinance Bank', code: '50515', slug: 'moniepoint-mfb-ng' },
  { name: 'OPay Digital Services', code: '999992', slug: 'paycom' },
  { name: 'PalmPay', code: '999991', slug: 'palmpay' },
  { name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
  { name: 'Providus Bank', code: '101', slug: 'providus-bank' },
  { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
  { name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank' },
  { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
  { name: 'Suntrust Bank', code: '100', slug: 'suntrust-bank' },
  { name: 'Taj Bank', code: '302', slug: 'taj-bank' },
  { name: 'Titan Trust Bank', code: '102', slug: 'titan-trust-bank' },
  { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
  { name: 'United Bank for Africa (UBA)', code: '033', slug: 'united-bank-for-africa' },
  { name: 'Unity Bank', code: '215', slug: 'unity-bank' },
  { name: 'Wema Bank', code: '035', slug: 'wema-bank' },
  { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
];

export const POPULAR_BANK_CODES = ['058', '044', '057', '011', '033', '50211', '999992', '999991', '50515', '221'];

// Slugs mapping for high-res logo CDN
export const BANK_SLUGS: Record<string, string> = {
  '044': 'access-bank',
  '063': 'access-bank',
  '023': 'citibank-nigeria',
  '050': 'ecobank-nigeria',
  '070': 'fidelity-bank',
  '011': 'first-bank-of-nigeria',
  '214': 'first-city-monument-bank',
  '058': 'guaranty-trust-bank',
  '030': 'heritage-bank',
  '301': 'jaiz-bank',
  '082': 'keystone-bank',
  '50211': 'kuda-bank',
  '50515': 'moniepoint-mfb-ng',
  '999992': 'paycom',
  '999991': 'palmpay',
  '076': 'polaris-bank',
  '101': 'providus-bank',
  '221': 'stanbic-ibtc-bank',
  '068': 'standard-chartered-bank',
  '232': 'sterling-bank',
  '100': 'suntrust-bank',
  '302': 'taj-bank',
  '102': 'titan-trust-bank',
  '032': 'union-bank-of-nigeria',
  '033': 'united-bank-for-africa',
  '215': 'unity-bank',
  '035': 'wema-bank',
  '057': 'zenith-bank',
};

// Brand colors and styled monograms for guaranteed reliable fallback
export const BANK_BRAND_COLORS: Record<string, { bg: string; text: string; initials: string }> = {
  '058': { bg: 'bg-[#E65300]', text: 'text-white', initials: 'GTB' },
  '044': { bg: 'bg-[#002E6E]', text: 'text-white', initials: 'ACC' },
  '057': { bg: 'bg-[#C4121A]', text: 'text-white', initials: 'ZEN' },
  '011': { bg: 'bg-[#001C44]', text: 'text-[#D4AF37]', initials: 'FBN' },
  '033': { bg: 'bg-[#D71920]', text: 'text-white', initials: 'UBA' },
  '50211': { bg: 'bg-[#40196D]', text: 'text-white', initials: 'KUDA' },
  '999992': { bg: 'bg-[#00B875]', text: 'text-white', initials: 'OPay' },
  '999991': { bg: 'bg-[#5D30E3]', text: 'text-white', initials: 'PALM' },
  '50515': { bg: 'bg-[#0336FF]', text: 'text-white', initials: 'MON' },
  '221': { bg: 'bg-[#0033A0]', text: 'text-white', initials: 'IBTC' },
  '214': { bg: 'bg-[#5C068C]', text: 'text-[#FBB03B]', initials: 'FCMB' },
  '232': { bg: 'bg-[#1C1C1C]', text: 'text-[#E4002B]', initials: 'STER' },
  '035': { bg: 'bg-[#8A1538]', text: 'text-white', initials: 'WEMA' },
  '050': { bg: 'bg-[#005B94]', text: 'text-white', initials: 'ECO' },
  '070': { bg: 'bg-[#0B3558]', text: 'text-white', initials: 'FID' },
};

export function getBankLogoUrl(bank: { code?: string; slug?: string; logo?: string; name?: string }): string | null {
  if (bank.logo && bank.logo.startsWith('http')) return bank.logo;
  if (bank.code && BANK_SLUGS[bank.code]) {
    return `https://nigerianbanks.xyz/logo/${BANK_SLUGS[bank.code]}.png`;
  }
  if (bank.slug) {
    return `https://nigerianbanks.xyz/logo/${bank.slug}.png`;
  }
  // Try by bank name keywords
  if (bank.name) {
    const n = bank.name.toLowerCase();
    if (n.includes('guaranty') || n.includes('gtbank')) return 'https://nigerianbanks.xyz/logo/guaranty-trust-bank.png';
    if (n.includes('access')) return 'https://nigerianbanks.xyz/logo/access-bank.png';
    if (n.includes('zenith')) return 'https://nigerianbanks.xyz/logo/zenith-bank.png';
    if (n.includes('first bank')) return 'https://nigerianbanks.xyz/logo/first-bank-of-nigeria.png';
    if (n.includes('united bank') || n.includes('uba')) return 'https://nigerianbanks.xyz/logo/united-bank-for-africa.png';
    if (n.includes('kuda')) return 'https://nigerianbanks.xyz/logo/kuda-bank.png';
    if (n.includes('opay') || n.includes('paycom')) return 'https://nigerianbanks.xyz/logo/paycom.png';
    if (n.includes('palmpay')) return 'https://nigerianbanks.xyz/logo/palmpay.png';
    if (n.includes('moniepoint')) return 'https://nigerianbanks.xyz/logo/moniepoint-mfb-ng.png';
    if (n.includes('stanbic')) return 'https://nigerianbanks.xyz/logo/stanbic-ibtc-bank.png';
    if (n.includes('fcmb')) return 'https://nigerianbanks.xyz/logo/first-city-monument-bank.png';
    if (n.includes('wema')) return 'https://nigerianbanks.xyz/logo/wema-bank.png';
    if (n.includes('sterling')) return 'https://nigerianbanks.xyz/logo/sterling-bank.png';
    if (n.includes('fidelity')) return 'https://nigerianbanks.xyz/logo/fidelity-bank.png';
    if (n.includes('ecobank')) return 'https://nigerianbanks.xyz/logo/ecobank-nigeria.png';
  }
  return null;
}
