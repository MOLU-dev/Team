/**
 * Centralized chain & asset registry for BitSilo.
 *
 * Every component should import from here instead of maintaining its own
 * inline SVG or switch statements.  This keeps things DRY and makes it
 * trivial to add new chains / tokens in one place.
 */
import React from 'react';

// ────────────────────────────────────────────────────────────────────────────
// Chain definitions
// ────────────────────────────────────────────────────────────────────────────

export interface ChainInfo {
  id: string;          // backend chain id (e.g. "ethereum", "bitcoin")
  name: string;        // human name
  badge: string;       // short label (ERC20, BEP20 …)
  nativeSymbol: string;
  nativeDecimals: number;
  addressPrefix: string; // placeholder hint for inputs
  explorerTx?: string;   // e.g. "https://etherscan.io/tx/"
  explorerTestnetTx?: string; // e.g. "https://sepolia.etherscan.io/tx/"
  color: string;         // primary brand hex
  icon: React.ReactNode;
}

// ── SVG Icons (inline, zero deps) ────────────────────────────────────────

const EthIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 784.37 1277.39" xmlns="http://www.w3.org/2000/svg" className={className} fillRule="evenodd" clipRule="evenodd" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality">
    <polygon fill="#343434" points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54 " />
    <polygon fill="#8C8C8C" points="392.07,0 -0,650.54 392.07,882.29 392.07,472.33 " />
    <polygon fill="#3C3C3B" points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89 " />
    <polygon fill="#8C8C8C" points="392.07,1277.38 392.07,956.52 -0,724.89 " />
    <polygon fill="#141414" points="392.07,882.29 784.13,650.54 392.07,472.33 " />
    <polygon fill="#393939" points="0,650.54 392.07,882.29 392.07,472.33 " />
  </svg>
);



const BscIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 2496 2496" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g>
      <path fill="#F0B90B" d="M1248,0c689.3,0,1248,558.7,1248,1248s-558.7,1248-1248,1248S0,1937.3,0,1248S558.7,0,1248,0L1248,0z" />
      <path fill="#FFFFFF" d="M685.9,1248l0.9,330l280.4,165v193.2l-444.5-260.7v-524L685.9,1248L685.9,1248z M685.9,918v192.3l-163.3-96.6V821.4l163.3-96.6l164.1,96.6L685.9,918L685.9,918z M1084.3,821.4l163.3-96.6l164.1,96.6L1247.6,918L1084.3,821.4L1084.3,821.4z" />
      <path fill="#FFFFFF" d="M803.9,1509.6v-193.2l163.3,96.6v192.3L803.9,1509.6L803.9,1509.6z M1084.3,1812.2l163.3,96.6l164.1-96.6v192.3l-164.1,96.6l-163.3-96.6V1812.2L1084.3,1812.2z M1645.9,821.4l163.3-96.6l164.1,96.6v192.3l-164.1,96.6V918L1645.9,821.4z M1809.2,1578l0.9-330l163.3-96.6v524l-444.5,260.7v-193.2L1809.2,1578z" />
      <polygon fill="#FFFFFF" points="1692.1,1509.6 1528.8,1605.3 1528.8,1413 1692.1,1316.4 1692.1,1509.6" />
      <path fill="#FFFFFF" d="M1692.1,986.4l0.9,193.2l-281.2,165v330.8l-163.3,95.7l-163.3-95.7v-330.8l-281.2-165V986.4L968,889.8l279.5,165.8l281.2-165.8l164.1,96.6H1692.1L1692.1,986.4z M803.9,656.5l443.7-261.6l444.5,261.6l-163.3,96.6l-281.2-165.8L967.2,753.1L803.9,656.5L803.9,656.5z" />
    </g>
  </svg>
);



const TronIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className}>
    <title>tron</title>
    <path fill="#FF060A" d="M61.55,19.28c-3-2.77-7.15-7-10.53-10l-.2-.14a3.82,3.82,0,0,0-1.11-.62l0,0C41.56,7,3.63-.09,2.89,0a1.4,1.4,0,0,0-.58.22L2.12.37a2.23,2.23,0,0,0-.52.84l-.05.13v.71l0,.11C5.82,14.05,22.68,53,26,62.14c.2.62.58,1.8,1.29,1.86h.16c.38,0,2-2.14,2-2.14S58.41,26.74,61.34,23a9.46,9.46,0,0,0,1-1.48A2.41,2.41,0,0,0,61.55,19.28ZM36.88,23.37,49.24,13.12l7.25,6.68Zm-4.8-.67L10.8,5.26l34.43,6.35ZM34,27.27l21.78-3.51-24.9,30ZM7.91,7,30.3,26,27.06,53.78Z" />
  </svg>
);



const SolanaIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg" className={className}>
    <linearGradient id="sol_g1" gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
      <stop offset="0" stopColor="#00FFA3" />
      <stop offset="1" stopColor="#DC1FFF" />
    </linearGradient>
    <path fill="url(#sol_g1)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
    <linearGradient id="sol_g2" gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
      <stop offset="0" stopColor="#00FFA3" />
      <stop offset="1" stopColor="#DC1FFF" />
    </linearGradient>
    <path fill="url(#sol_g2)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
    <linearGradient id="sol_g3" gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
      <stop offset="0" stopColor="#00FFA3" />
      <stop offset="1" stopColor="#DC1FFF" />
    </linearGradient>
    <path fill="url(#sol_g3)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
  </svg>
);



const BitcoinIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 4091.27 4091.73" xmlns="http://www.w3.org/2000/svg" className={className} fillRule="evenodd" clipRule="evenodd" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality">
    <path fill="#F7931A" d="M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z" />
    <path fill="white" d="M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z" />
  </svg>
);



const LitecoinIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 82.6 82.6" xmlns="http://www.w3.org/2000/svg" className={className}>
    <title>litecoin-ltc-logo</title>
    <circle cx="41.3" cy="41.3" r="36.83" fill="#fff" />
    <path d="M41.3,0A41.3,41.3,0,1,0,82.6,41.3h0A41.18,41.18,0,0,0,41.54,0ZM42,42.7,37.7,57.2h23a1.16,1.16,0,0,1,1.2,1.12v.38l-2,6.9a1.49,1.49,0,0,1-1.5,1.1H23.2l5.9-20.1-6.6,2L24,44l6.6-2,8.3-28.2a1.51,1.51,0,0,1,1.5-1.1h8.9a1.16,1.16,0,0,1,1.2,1.12v.38L43.5,38l6.6-2-1.4,4.8Z" fill="#345d9d" />
  </svg>
);



const DogecoinIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M12.288 7.908h-1.715v3.38h2.697v1.415h-2.697v3.38h1.799c.462 0 3.794.052 3.789-3.933-.005-3.984-3.232-4.242-3.873-4.242zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.472 18.481H8.126v-5.778H6.594v-1.415h1.532V5.511h3.73c.882 0 6.727-.183 6.727 6.594-.001 6.888-6.111 6.376-6.111 6.376z" />
  </svg>
);



const DashIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 513.4 416.8" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fill="#008de4" d="M336.25,0H149.35l-15.5,86.6,168.7.2c83.1,0,107.6,30.2,106.9,80.2-.4,25.6-11.5,69-16.3,83.1-12.8,37.5-39.1,80.2-137.7,80.1l-164-.1L76,416.8h186.5c65.8,0,93.7-7.7,123.4-21.3,65.7-30.5,104.8-95.3,120.5-179.9C529.65,89.6,500.65,0,336.25,0" />
    <path fill="#008de4" d="M68.7,164.9c-49,0-56,31.9-60.6,51.2C2,241.3,0,251.6,0,251.6H191.4c49,0,56-31.9,60.6-51.2,6.1-25.2,8.1-35.5,8.1-35.5Z" />
  </svg>
);


const BchIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 788 788" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle fill="#0AC18E" cx="394" cy="394" r="394"/>
    <path fill="#FFFFFF" d="M516.9,261.7c-19.8-44.9-65.3-54.5-121-45.2L378,147.1L335.8,158l17.6,69.2c-11.1,2.8-22.5,5.2-33.8,8.4L302,166.8l-42.2,10.9l17.9,69.4c-9.1,2.6-85.2,22.1-85.2,22.1l11.6,45.2c0,0,31-8.7,30.7-8c17.2-4.5,25.3,4.1,29.1,12.2l49.2,190.2c0.6,5.5-0.4,14.9-12.2,18.1c0.7,0.4-30.7,7.9-30.7,7.9l4.6,52.7c0,0,75.4-19.3,85.3-21.8l18.1,70.2l42.2-10.9l-18.1-70.7c11.6-2.7,22.9-5.5,33.9-8.4l18,70.3l42.2-10.9l-18.1-70.1c65-15.8,110.9-56.8,101.5-119.5c-6-37.8-47.3-68.8-81.6-72.3C519.3,324.7,530,297.4,516.9,261.7L516.9,261.7z M496.6,427.2c8.4,62.1-77.9,69.7-106.4,77.2l-24.8-92.9C394,404,482.4,372.5,496.6,427.2z M444.6,300.7c8.9,55.2-64.9,61.6-88.7,67.7l-22.6-84.3C357.2,278.2,426.5,249.6,444.6,300.7z"/>
  </svg>
);



const XrpIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 512 424" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
    <path d="M437,0h74L357,152.48c-55.77,55.19-146.19,55.19-202,0L.94,0H75L192,115.83a91.11,91.11,0,0,0,127.91,0Z"/>
    <path d="M74.05,424H0L155,270.58c55.77-55.19,146.19-55.19,202,0L512,424H438L320,307.23a91.11,91.11,0,0,0-127.91,0Z"/>
  </svg>
);



// ── Fiat icons ────────────────────────────────────────────────────────────

const NgnIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#008751"/>
    <g transform="translate(7, 7) scale(0.036)">
      <path d="M477.832,274.28h-67.743v-65.106h67.743c10.179,0,18.43-8.243,18.43-18.424c0-10.182-8.251-18.43-18.43-18.43h-67.743
        V81.982c0-13.187-2.606-22.866-7.743-28.762c-4.882-5.609-11.301-8.219-20.19-8.219c-8.482,0-14.659,2.592-19.447,8.166
        c-5.077,5.902-7.654,15.599-7.654,28.821v90.343H227.627l-54.181-81.988c-4.637-7.317-8.997-14.171-13.231-20.75
        c-3.812-5.925-7.53-10.749-11.042-14.351c-3.109-3.189-6.652-5.657-10.796-7.554c-3.91-1.785-8.881-2.681-14.762-2.681
        c-7.501,0-14.31,2.055-20.83,6.277c-6.452,4.176-10.912,9.339-13.636,15.785c-2.391,6.126-3.656,15.513-3.656,27.63v77.626h-67.07
        C8.246,172.326,0,180.574,0,190.755c0,10.181,8.246,18.424,18.424,18.424h67.07v65.113h-67.07C8.246,274.292,0,282.538,0,292.722
        C0,302.9,8.246,311.14,18.424,311.14h67.07v103.143c0,12.797,2.689,22.378,8.015,28.466c5.065,5.805,11.487,8.5,20.208,8.5
        c8.414,0,14.786-2.707,20.07-8.523c5.411-5.958,8.148-15.533,8.148-28.442V311.14h115.308l62.399,95.683
        c4.339,6.325,8.819,12.709,13.287,18.969c4.031,5.621,8.429,10.574,13.069,14.711c4.179,3.742,8.659,6.484,13.316,8.157
        c4.794,1.726,10.397,2.601,16.615,2.601c16.875,0,34.158-5.166,34.158-43.479V311.14h67.743c10.179,0,18.43-8.252,18.43-18.43
        C496.262,282.532,488.011,274.28,477.832,274.28z M355.054,209.173v65.106h-60.041l-43.021-65.106H355.054z M141.936,134.364
        l24.76,37.956h-24.76V134.364z M141.936,274.28v-65.106h48.802l42.466,65.106H141.936z M355.054,365.153l-35.683-54.013h35.683
        V365.153z" fill="#fff"/>
    </g>
  </svg>
);


const UsdIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 468 468" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="234" cy="234" r="234" fill="#2E7D32"/>
    <g transform="translate(0 468) scale(.078 -.078)" fill="white">
      <path d="m2568 5643l-3-258-27-3c-16-2-28-7-28-11s-45-16-100-26-100-22-100-27c0-4-7-8-17-8-20 0-126-32-133-40-3-4-32-15-65-25s-62-21-65-24c-3-4-25-15-50-26s-51-25-58-32-19-13-26-13-21-8-32-18c-10-10-34-27-53-38-19-10-53-38-76-61-23-24-46-43-51-43s-31-26-59-56c-27-31-64-71-82-89-17-19-34-43-38-55-4-11-17-32-31-47-13-14-24-34-24-44 0-11-4-19-8-19-5 0-17-25-27-55-11-30-22-55-25-55-4 0-15-26-26-57-10-32-22-61-27-64-9-7-37-134-37-171 0-16-4-28-9-28-15 0-27-260-17-407 5-79 13-143 17-143s16-36 25-80c10-44 21-80 25-80s10-12 13-27c10-40 30-83 38-83 4 0 14-16 22-35s19-35 23-35c5 0 17-17 28-37 11-21 28-44 37-51 10-7 18-19 18-27s9-19 20-25 20-16 20-22c0-14 72-88 85-88 6 0 16-9 23-20s19-20 27-20 19-9 25-20 17-20 25-20 20-8 27-17c15-20 44-41 71-49 9-4 17-10 17-15 0-4 16-16 35-25s35-20 35-24c0-5 20-16 45-26 25-9 45-20 45-23 0-4 20-15 45-26s45-23 45-26c0-4 23-15 50-25 28-10 50-21 50-25s23-15 50-25c28-10 50-21 50-25 0-3 21-14 47-24 27-10 53-24 59-30 7-6 37-17 68-24s56-17 56-22 7-9 15-9c13 0 15-103 15-865v-866l-62 7c-35 4-65 10-68 14s-30 10-60 14c-74 9-150 28-150 38 0 4-13 8-28 8-29 0-123 28-132 40-3 3-25 12-49 20s-49 19-55 25-32 20-59 30c-26 10-47 22-47 26 0 5-6 9-12 9-15 0-98 82-98 96 0 5-9 15-20 22s-20 19-20 27-6 15-14 15c-13 0-34 38-24 44 1 1 30 7 62 14 34 7 67 20 78 32 10 11 24 20 31 20 16 0 117 107 117 124 0 7 8 21 18 32 29 30 42 103 42 226 0 111-12 188-30 188-5 0-14 17-21 37-13 40-96 129-141 152-16 8-28 18-28 23 0 4-6 8-14 8-7 0-27 7-42 15-16 8-48 15-71 15-24 0-43 5-43 10 0 6-25 10-55 10s-55-4-55-8-34-16-74-25c-86-20-119-44-211-151-16-19-37-43-46-53s-23-36-30-58c-8-22-16-42-19-45-19-18-30-72-30-142 0-77 18-207 29-218 4-3 15-31 25-62 11-32 22-58 26-58s15-16 26-35c10-19 22-35 26-35s14-16 22-35 19-35 25-35c5 0 12-8 15-18 9-27 119-152 135-152 4 0 19-13 33-29 15-16 42-34 62-41 20-6 36-15 36-20s17-17 38-27c20-9 43-25 50-35s22-18 32-18 25-6 33-14 39-23 68-32c30-10 56-21 59-25s32-15 65-24c33-10 62-21 65-24 3-4 34-16 70-26s67-22 70-26c6-8 148-39 179-39 11 0 21-4 23-10 2-5 57-16 123-22l120-13 3-273 2-272h270v520h320v-520h270v546l132 12c72 6 134 15 137 20 3 4 53 15 111 25 57 9 106 21 110 25 3 4 39 16 80 26 41 11 77 22 80 25 3 4 31 15 63 24 31 10 57 22 57 26s18 14 40 21c23 8 44 18 48 24s23 20 42 30c19 11 44 28 54 38 11 10 26 18 33 18s17 9 23 20 16 20 23 20c17 0 173 162 181 188 4 12 11 22 16 22s17 16 26 35 20 35 24 35c5 0 16 20 26 45 9 25 20 45 24 45 8 0 40 94 40 116 0 8 4 14 9 14s17 35 26 78c10 42 21 80 27 83 38 24 36 799-3 799-4 0-13 25-20 56s-18 61-24 68c-6 6-20 32-30 59-10 26-21 47-24 47-4 0-15 17-26 38-11 20-28 43-37 50-10 7-18 18-18 23 0 6-36 46-79 90-44 43-84 79-90 79-5 0-16 8-23 18-7 9-29 26-48 36-19 11-44 28-54 38-11 10-25 18-32 18s-17 6-21 13-25 21-45 32c-21 11-38 23-38 26 0 4-22 15-50 25-27 10-50 21-50 25s-22 15-50 25c-27 10-50 21-50 25s-22 15-50 25c-27 10-50 21-50 25 0 3-27 14-60 23s-60 21-60 25-28 16-62 27c-35 10-68 23-74 29-7 6-37 17-68 25-31 7-56 16-56 20 0 3-22 14-50 24-27 10-50 22-50 27s-9 9-20 9c-20 0-20 7-20 810v810h50c28 0 50-4 50-10 0-5 17-10 37-10 43 0 196-31 203-41 3-3 31-14 63-23 31-9 57-21 57-26 0-6 8-10 19-10 10 0 24-7 31-15s16-15 21-15c4 0 19-10 33-22 13-13 31-29 40-36s16-28 16-47c0-31-3-35-35-41-19-3-35-10-35-15s-7-9-15-9c-9 0-29-7-46-15-42-22-139-117-139-136 0-9-9-26-20-39-18-21-40-79-40-107 0-7-4-13-10-13s-10-42-10-105c0-58 3-105 8-105 4 0 16-27 26-60 11-33 23-60 27-60s10-8 14-19c9-28 88-106 124-122 17-8 31-17 31-21 0-8 59-38 76-38 7 0 14-6 16-12 6-17 266-18 276-1 4 6 21 13 37 17 17 4 44 18 59 31 16 14 32 25 36 25 11 0 70 62 70 73 0 5 11 18 25 29s25 25 25 33c0 7 6 15 14 18s20 32 26 64c22 105-2 473-31 473-4 0-15 20-25 45-9 25-20 45-23 45-4 0-13 17-20 37-9 25-53 76-130 151-134 131-136 133-176 152-16 8-32 18-35 21s-22 14-42 24c-21 9-38 21-38 25 0 3-26 15-57 26-32 10-60 22-63 25-3 4-33 15-67 24-35 10-63 21-63 25 0 9-88 28-167 36-35 4-63 10-63 15 0 4-36 11-80 15l-80 7v507h-270v-490h-102c-57 0-120-3-140-6l-38-7v503h-310l-2-257zm592-1243c0-461-4-760-9-760s-16 7-25 15c-8 8-19 15-25 15-16 0-105 32-111 39-3 4-27 15-55 26-27 10-56 24-62 31-10 10-13 162-13 693v680l33 6c29 5 60 6 220 13l47 2v-760zm-590 95c0-571-1-604-17-598-10 4-24 13-31 20s-20 13-27 13c-8 0-20 8-27 18-13 17-39 36-68 49-8 4-21 15-28 25s-18 18-23 18c-18 0-165 157-179 191-7 19-18 39-25 44-19 16-32 47-40 95-4 25-12 48-18 52-13 8-11 162 3 166 5 2 10 17 10 33 0 33 30 151 41 159 3 3 9 14 13 25 3 11 19 36 36 55s33 43 36 53c3 9 9 17 14 17s16 13 24 29c8 15 30 34 48 42 18 7 42 21 52 31 11 10 25 18 32 18s19 6 27 14c14 14 81 33 125 35l22 1v-605zm365-2038c11-14 147-47 195-47h30v-1590h-73c-41 0-108-3-150-6l-77-7v1682l33-10c17-5 37-15 42-22zm542-199c15-7 37-21 47-30 11-10 26-18 33-18s17-9 23-20 17-20 25-20 20-8 27-18 20-21 28-25c53-24 166-139 180-183 7-19 15-34 19-34s14-19 21-41c8-23 20-48 27-55 22-21 33-108 33-251 0-129-15-273-29-283-4-3-15-27-26-55-10-27-29-58-42-68s-23-25-23-33-4-14-8-14c-5 0-14-11-20-25-7-14-20-28-29-32-10-4-34-23-54-43-19-20-49-42-67-49-17-7-41-21-52-31s-41-24-65-31c-25-7-45-16-45-20s-11-9-25-11l-25-5v703c0 440 4 704 10 704 5 0 22-6 37-12z" />
    </g>
  </svg>
);

const EurIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#003399"/>
    <path fill="#FFD700" d="M8 18.84h2.126c.674 5.806 4.508 9.16 10.554 9.16 1.244 0 2.334-.136 3.318-.37v2.6c-.968.238-2.09.34-3.318.34-5.856 0-9.64-3.138-10.488-8.6h8.034v-1.856h-8.2c0-.33.012-.658.016-.658.004-.32.016-.658.016-.658h8.156v-1.854h-8.156c.776-3.796 3.438-5.97 7.446-5.97 1.228 0 2.35.1 3.318.354V4.388a13.2 13.2 0 0 0-3.32-.388c-5.856 0-9.64 3.138-10.488 8.6H8v1.856h2.02v2.53H8v1.856z" transform="scale(0.5) translate(8, 2)"/>
  </svg>
);


const GbpIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#BC3FE0"/>
    <path d="M11.087 14.815v-2.332c0-3.676 2.219-5.983 6.075-5.983 2.932 0 4.57 1.242 5.838 2.84l-2.483 1.9c-.951-1.165-1.85-1.85-3.328-1.85-1.77 0-2.827 1.217-2.827 3.17v2.255h6.578v2.637h-6.578v4.335h8.585V24.5H9v-1.977l2.087-.609v-4.462H9v-2.637z" fill="#ffffff" />
  </svg>
);

const KesIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#AD1457"/>
    <text x="16" y="21" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">K</text>
  </svg>
);

const GhsIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#F9A825"/>
    <text x="16" y="21" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">₵</text>
  </svg>
);

const ZarIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#2E7D32"/>
    <text x="16" y="21" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">R</text>
  </svg>
);



// ── Token icons ──────────────────────────────────────────────────────────

const UsdtIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
    </g>
  </svg>
);


const UsdcIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 2000 2000" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775CA"/>
    <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="#FFFFFF"/>
    <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="#FFFFFF"/>
  </svg>
);

const BusdIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336.41 337.42" className={className}>
    <title>Asset 1</title>
    <g id="Layer_2" data-name="Layer 2">
      <g id="Layer_1-2" data-name="Layer 1">
        <path fill="#f0b90b" stroke="#f0b90b" d="M168.2.71l41.5,42.5L105.2,147.71l-41.5-41.5Z"/>
        <path fill="#f0b90b" stroke="#f0b90b" d="M231.2,63.71l41.5,42.5L105.2,273.71l-41.5-41.5Z"/>
        <path fill="#f0b90b" stroke="#f0b90b" d="M42.2,126.71l41.5,42.5-41.5,41.5L.7,169.21Z"/>
        <path fill="#f0b90b" stroke="#f0b90b" d="M294.2,126.71l41.5,42.5L168.2,336.71l-41.5-41.5Z"/>
      </g>
    </g>
  </svg>
);



const EurcIcon = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 2000 2000" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#1B4F8F"/>
    <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="#FFFFFF"/>
    <g transform="translate(680, 550) scale(40)">
      <path fill="#FFFFFF" d="M1 10.84h2.126c.674 5.806 4.508 9.16 10.554 9.16 1.244 0 2.334-.136 3.318-.37v2.6c-.968.238-2.09.34-3.318.34-5.856 0-9.64-3.138-10.488-8.6h8.034v-1.856h-8.2c0-.33.012-.658.016-.658.004-.32.016-.658.016-.658h8.156v-1.854h-8.156c.776-3.796 3.438-5.97 7.446-5.97 1.228 0 2.35.1 3.318.354V4.388a13.2 13.2 0 0 0-3.32-.388c-5.856 0-9.64 3.138-10.488 8.6H1v1.856h2.02v2.53H1v1.856z" />
    </g>
  </svg>
);



// ────────────────────────────────────────────────────────────────────────
// Registry
// ────────────────────────────────────────────────────────────────────────

export const CHAINS: Record<string, ChainInfo> = {
  ethereum: {
    id: 'ethereum', name: 'Ethereum', badge: 'ERC20', nativeSymbol: 'ETH', nativeDecimals: 18,
    addressPrefix: '0x...', explorerTx: 'https://etherscan.io/tx/',
    explorerTestnetTx: 'https://sepolia.etherscan.io/tx/',
    color: '#627EEA', icon: <EthIcon />,
  },
  bsc: {
    id: 'bsc', name: 'BNB Smart Chain', badge: 'BEP20', nativeSymbol: 'BNB', nativeDecimals: 18,
    addressPrefix: '0x...', explorerTx: 'https://bscscan.com/tx/',
    explorerTestnetTx: 'https://testnet.bscscan.com/tx/',
    color: '#F3BA2F', icon: <BscIcon />,
  },
  tron: {
    id: 'tron', name: 'Tron', badge: 'TRC20', nativeSymbol: 'TRX', nativeDecimals: 6,
    addressPrefix: 'T...', explorerTx: 'https://tronscan.org/#/transaction/',
    explorerTestnetTx: 'https://shasta.tronscan.org/#/transaction/',
    color: '#EF0027', icon: <TronIcon />,
  },
  solana: {
    id: 'solana', name: 'Solana', badge: 'SPL', nativeSymbol: 'SOL', nativeDecimals: 9,
    addressPrefix: '...', explorerTx: 'https://solscan.io/tx/',
    explorerTestnetTx: 'https://solscan.io/tx/?cluster=devnet',
    color: '#9945FF', icon: <SolanaIcon />,
  },
  bitcoin: {
    id: 'bitcoin', name: 'Bitcoin', badge: 'BTC', nativeSymbol: 'BTC', nativeDecimals: 8,
    addressPrefix: 'bc1...', explorerTx: 'https://mempool.space/tx/',
    explorerTestnetTx: 'https://mempool.space/testnet/tx/',
    color: '#F7931A', icon: <BitcoinIcon />,
  },
  litecoin: {
    id: 'litecoin', name: 'Litecoin', badge: 'LTC', nativeSymbol: 'LTC', nativeDecimals: 8,
    addressPrefix: 'ltc1...', explorerTx: 'https://blockchair.com/litecoin/transaction/',
    explorerTestnetTx: 'https://blockchair.com/litecoin/testnet/transaction/',
    color: '#345D9D', icon: <LitecoinIcon />,
  },
  dogecoin: {
    id: 'dogecoin', name: 'Dogecoin', badge: 'DOGE', nativeSymbol: 'DOGE', nativeDecimals: 8,
    addressPrefix: 'D...', explorerTx: 'https://dogechain.info/tx/',
    explorerTestnetTx: 'https://blockexplorer.one/dogecoin/testnet/tx/',
    color: '#C2A633', icon: <DogecoinIcon />,
  },
  dash: {
    id: 'dash', name: 'Dash', badge: 'DASH', nativeSymbol: 'DASH', nativeDecimals: 8,
    addressPrefix: 'X...', explorerTx: 'https://explorer.dash.org/insight/tx/',
    explorerTestnetTx: 'https://testnet-explorer.dash.org/insight/tx/',
    color: '#008CE7', icon: <DashIcon />,
  },
  bitcoincash: {
    id: 'bitcoincash', name: 'Bitcoin Cash', badge: 'BCH', nativeSymbol: 'BCH', nativeDecimals: 8,
    addressPrefix: 'bitcoincash:q...', explorerTx: 'https://blockchair.com/bitcoin-cash/transaction/',
    explorerTestnetTx: 'https://blockchair.com/bitcoin-cash/testnet/transaction/',
    color: '#0AC18E', icon: <BchIcon />,
  },
  ripple: {
    id: 'ripple', name: 'XRP Ledger', badge: 'XRP', nativeSymbol: 'XRP', nativeDecimals: 6,
    addressPrefix: 'r...', explorerTx: 'https://xrpscan.com/tx/',
    explorerTestnetTx: 'https://testnet.xrpl.org/transactions/',
    color: '#23292F', icon: <XrpIcon />,
  },
};

export const CHAIN_LIST = Object.values(CHAINS);

// ────────────────────────────────────────────────────────────────────────
// Asset / token definitions
// ────────────────────────────────────────────────────────────────────────

export interface AssetInfo {
  symbol: string;
  name: string;
  decimals: number;
  type: 'native' | 'token' | 'fiat';
  /** Which chains this asset lives on */
  chains: string[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  darkTextColor: string;
  icon: React.ReactNode;
}

export const ASSETS: Record<string, AssetInfo> = {
  ETH:  { symbol: 'ETH',  name: 'Ethereum',       decimals: 18, type: 'native', chains: ['ethereum'],            color: '#627EEA', gradientFrom: 'from-indigo-500/10', gradientTo: 'to-purple-500/10', textColor: 'text-indigo-600', darkTextColor: 'dark:text-indigo-400', icon: <EthIcon /> },
  BNB:  { symbol: 'BNB',  name: 'BNB',             decimals: 18, type: 'native', chains: ['bsc'],                 color: '#F3BA2F', gradientFrom: 'from-yellow-400/10', gradientTo: 'to-amber-500/10', textColor: 'text-yellow-600', darkTextColor: 'dark:text-yellow-400', icon: <BscIcon /> },
  TRX:  { symbol: 'TRX',  name: 'Tron',            decimals: 6,  type: 'native', chains: ['tron'],                color: '#EF0027', gradientFrom: 'from-red-500/10',    gradientTo: 'to-rose-600/10',   textColor: 'text-red-600',    darkTextColor: 'dark:text-red-400',    icon: <TronIcon /> },
  SOL:  { symbol: 'SOL',  name: 'Solana',          decimals: 9,  type: 'native', chains: ['solana'],              color: '#9945FF', gradientFrom: 'from-purple-500/10', gradientTo: 'to-fuchsia-500/10', textColor: 'text-purple-600', darkTextColor: 'dark:text-purple-400', icon: <SolanaIcon /> },
  BTC:  { symbol: 'BTC',  name: 'Bitcoin',         decimals: 8,  type: 'native', chains: ['bitcoin'],             color: '#F7931A', gradientFrom: 'from-orange-400/10', gradientTo: 'to-amber-500/10', textColor: 'text-orange-600', darkTextColor: 'dark:text-orange-400', icon: <BitcoinIcon /> },
  LTC:  { symbol: 'LTC',  name: 'Litecoin',        decimals: 8,  type: 'native', chains: ['litecoin'],            color: '#345D9D', gradientFrom: 'from-blue-500/10',   gradientTo: 'to-sky-500/10',    textColor: 'text-blue-600',   darkTextColor: 'dark:text-blue-400',   icon: <LitecoinIcon /> },
  DOGE: { symbol: 'DOGE', name: 'Dogecoin',        decimals: 8,  type: 'native', chains: ['dogecoin'],            color: '#C2A633', gradientFrom: 'from-yellow-500/10', gradientTo: 'to-amber-400/10', textColor: 'text-yellow-600', darkTextColor: 'dark:text-amber-400',  icon: <DogecoinIcon /> },
  DASH: { symbol: 'DASH', name: 'Dash',            decimals: 8,  type: 'native', chains: ['dash'],                color: '#008CE7', gradientFrom: 'from-sky-500/10',    gradientTo: 'to-blue-500/10',   textColor: 'text-sky-600',    darkTextColor: 'dark:text-sky-400',    icon: <DashIcon /> },
  BCH:  { symbol: 'BCH',  name: 'Bitcoin Cash',    decimals: 8,  type: 'native', chains: ['bitcoincash'],         color: '#0AC18E', gradientFrom: 'from-emerald-500/10', gradientTo: 'to-green-500/10', textColor: 'text-emerald-600', darkTextColor: 'dark:text-emerald-400', icon: <BchIcon /> },
  XRP:  { symbol: 'XRP',  name: 'XRP',             decimals: 6,  type: 'native', chains: ['ripple'],              color: '#23292F', gradientFrom: 'from-slate-500/10',  gradientTo: 'to-gray-500/10',   textColor: 'text-slate-600',  darkTextColor: 'dark:text-slate-300',  icon: <XrpIcon /> },
  USDT: { symbol: 'USDT', name: 'Tether USD',      decimals: 6,  type: 'token',  chains: ['ethereum','bsc','tron','solana'], color: '#26A17B', gradientFrom: 'from-emerald-500/10', gradientTo: 'to-teal-500/10', textColor: 'text-emerald-700', darkTextColor: 'dark:text-emerald-400', icon: <UsdtIcon /> },
  USDC: { symbol: 'USDC', name: 'USD Coin',        decimals: 6,  type: 'token',  chains: ['ethereum','bsc','solana'],        color: '#2775CA', gradientFrom: 'from-blue-500/10', gradientTo: 'to-cyan-500/10', textColor: 'text-blue-700', darkTextColor: 'dark:text-blue-400', icon: <UsdcIcon /> },
  EURC: { symbol: 'EURC', name: 'Euro Coin',       decimals: 6,  type: 'token',  chains: ['ethereum','solana'],              color: '#1B4F8F', gradientFrom: 'from-blue-400/10',   gradientTo: 'to-indigo-400/10', textColor: 'text-indigo-600', darkTextColor: 'dark:text-indigo-300', icon: <EurcIcon /> },
  BUSD: { symbol: 'BUSD', name: 'BUSD',            decimals: 18, type: 'token',  chains: ['bsc'],                            color: '#F3BA2F', gradientFrom: 'from-yellow-400/10', gradientTo: 'to-amber-500/10', textColor: 'text-yellow-600', darkTextColor: 'dark:text-yellow-400', icon: <BusdIcon /> },
  // Fiat
  NGN:  { symbol: 'NGN',  name: 'Nigerian Naira',  decimals: 2,  type: 'fiat',   chains: [],                      color: '#008751', gradientFrom: 'from-green-600/10',  gradientTo: 'to-green-800/10',  textColor: 'text-green-700',  darkTextColor: 'dark:text-green-400',  icon: <NgnIcon /> },
  USD:  { symbol: 'USD',  name: 'US Dollar',       decimals: 2,  type: 'fiat',   chains: [],                      color: '#2E7D32', gradientFrom: 'from-green-500/10',  gradientTo: 'to-emerald-600/10', textColor: 'text-green-700',  darkTextColor: 'dark:text-green-400',  icon: <UsdIcon /> },
  EUR:  { symbol: 'EUR',  name: 'Euro',            decimals: 2,  type: 'fiat',   chains: [],                      color: '#003399', gradientFrom: 'from-blue-600/10',   gradientTo: 'to-blue-800/10',   textColor: 'text-blue-700',   darkTextColor: 'dark:text-blue-400',   icon: <EurIcon /> },
  GBP:  { symbol: 'GBP',  name: 'British Pound',   decimals: 2,  type: 'fiat',   chains: [],                      color: '#1A237E', gradientFrom: 'from-indigo-600/10', gradientTo: 'to-indigo-800/10', textColor: 'text-indigo-700', darkTextColor: 'dark:text-indigo-400', icon: <GbpIcon /> },
  KES:  { symbol: 'KES',  name: 'Kenyan Shilling', decimals: 2,  type: 'fiat',   chains: [],                      color: '#AD1457', gradientFrom: 'from-pink-500/10',    gradientTo: 'to-rose-600/10',   textColor: 'text-pink-600',   darkTextColor: 'dark:text-pink-400',   icon: <KesIcon /> },
  GHS:  { symbol: 'GHS',  name: 'Ghanaian Cedi',   decimals: 2,  type: 'fiat',   chains: [],                      color: '#F9A825', gradientFrom: 'from-yellow-600/10', gradientTo: 'to-orange-600/10', textColor: 'text-yellow-700', darkTextColor: 'dark:text-yellow-400', icon: <GhsIcon /> },
  ZAR:  { symbol: 'ZAR',  name: 'South African Rand', decimals: 2, type: 'fiat',  chains: [],                      color: '#2E7D32', gradientFrom: 'from-green-600/10',   gradientTo: 'to-emerald-700/10', textColor: 'text-green-600',  darkTextColor: 'dark:text-green-400',  icon: <ZarIcon /> },
};

// Alias: EUROC is the same coin as EURC (Circle Euro Coin). Routes like /asset/EUROC resolve here.
(ASSETS as any).EUROC = ASSETS.EURC;

export const ASSET_LIST    = Object.values(ASSETS);
export const CRYPTO_ASSETS = ASSET_LIST.filter(a => a.type !== 'fiat');
export const FIAT_ASSETS   = ASSET_LIST.filter(a => a.type === 'fiat');
export const NATIVE_ASSETS = ASSET_LIST.filter(a => a.type === 'native');
export const TOKEN_ASSETS  = ASSET_LIST.filter(a => a.type === 'token');

// ────────────────────────────────────────────────────────────────────────
// Helper functions (replace the old AssetUtils)
// ────────────────────────────────────────────────────────────────────────

/** Returns the decimal precision for an asset on a given network. */
export function getAssetDecimals(symbol: string, chainId?: string): number {
  const normSymbol = (symbol || '').toUpperCase();
  const normChain = (chainId || '').toLowerCase();
  if ((normChain === 'bsc' || normChain === 'bsctestnet') && (normSymbol === 'USDT' || normSymbol === 'USDC' || normSymbol === 'BUSD')) {
    return 18;
  }
  const a = ASSETS[normSymbol];
  return a ? a.decimals : 18;
}

/** Returns Tailwind gradient classes for an asset's card background. */
export function getAssetColor(symbol: string): string {
  const a = ASSETS[symbol];
  if (!a) return 'from-cyan/10 to-blue-500/10 dark:from-cyan/20 dark:to-blue-500/20 border-cyan/20 dark:border-cyan/30';
  return `${a.gradientFrom} ${a.gradientTo} dark:${a.gradientFrom.replace('/10','/20')} dark:${a.gradientTo.replace('/10','/20')} border-${a.textColor.replace('text-','')}/20 dark:border-${a.darkTextColor.replace('dark:text-','')}/30`;
}

/** Returns Tailwind text colour classes for an asset icon. */
export function getAssetTextColor(symbol: string): string {
  const a = ASSETS[symbol];
  if (!a) return 'text-cyan-700 dark:text-cyan';
  return `${a.textColor} ${a.darkTextColor}`;
}

/** Returns the React SVG icon element for an asset. Falls back to a letter badge. */
export function getAssetIcon(symbol: string): React.ReactNode {
  const a = ASSETS[symbol];
  if (a) return a.icon;
  
  const displaySymbol = symbol ? String(symbol).substring(0, 2).toUpperCase() : '??';
  
  return (
    <div className="w-full h-full bg-cyan/20 rounded-full flex items-center justify-center text-cyan font-bold text-xs">
      {displaySymbol}
    </div>
  );
}

/** Returns the asset icon with an optional chain badge overlaid in the bottom-left. */
export function getAssetIconWithChain(symbol: string, chainId?: string): React.ReactNode {
  const assetIcon = getAssetIcon(symbol);
  
  // No chain provided, or it's fiat/native -> no badge
  if (!chainId || !CHAINS[chainId] || ASSETS[symbol]?.type === 'fiat' || ASSETS[symbol]?.type === 'native') {
    return assetIcon;
  }

  const chainIcon = getChainIcon(chainId);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center">
        {assetIcon}
      </div>
      <div className="absolute -bottom-1 -right-1 w-[50%] h-[50%] bg-midnight rounded-full p-1 shadow-xl flex items-center justify-center z-10 overflow-hidden">
        <div className="w-full h-full rounded-full overflow-hidden scale-110">
          {chainIcon}
        </div>
      </div>
    </div>
  );
}

/** Returns the human readable name. */
export function getAssetName(symbol: string): string {
  return ASSETS[symbol]?.name || symbol;
}

/** Returns the chain info icon for a given backend chain id. */
export function getChainIcon(chainId: string): React.ReactNode {
  return CHAINS[chainId]?.icon || null;
}

/** Derive the display chain detail from a backend chain id. */
export function getChainDetails(chain: string): { type: string; network: string } {
  if (!chain) return { type: 'Unknown', network: 'Unknown Network' };
  const c = CHAINS[chain];
  if (!c) return { type: chain, network: chain };
  return { type: c.badge.toLowerCase(), network: c.name };
}

/** Get the list of chains an asset can live on. */
export function getChainsForAsset(symbol: string): ChainInfo[] {
  const asset = ASSETS[symbol];
  if (!asset) return [];
  return asset.chains.map(cid => CHAINS[cid]).filter(Boolean);
}

/** Returns the native gas symbol for a chain. */
export function getNativeSymbol(chainId: string): string {
  return CHAINS[chainId]?.nativeSymbol || 'ETH';
}

/** Returns native decimals for a chain. */
export function getNativeDecimals(chainId: string): number {
  return CHAINS[chainId]?.nativeDecimals || 18;
}

/** Returns true if the transaction hash is an actual on-chain broadcast hash rather than an internal/pending tracking ID. */
export function isBroadCastTxHash(txHash?: string | null): boolean {
  if (!txHash) return false;
  const lower = txHash.trim().toLowerCase();
  if (
    lower.startsWith('approved-') ||
    lower.startsWith('pending-') ||
    lower.startsWith('internal-') ||
    lower.startsWith('swap-') ||
    lower.startsWith('temp-') ||
    lower === 'n/a'
  ) {
    return false;
  }
  return true;
}

/** Build an explorer URL for a transaction hash. Returns null if pending or not broadcasted yet. */
export function getExplorerTxUrl(chainId: string, txHash: string, isTestnet: boolean = false): string | null {
  if (!isBroadCastTxHash(txHash)) return null;
  const chain = CHAINS[chainId];
  if (!chain) return null;
  
  const base = isTestnet ? (chain.explorerTestnetTx || chain.explorerTx) : chain.explorerTx;
  if (!base) return null;
  
  return `${base}${txHash.trim()}`;
}
/** Returns the currency symbol for a given fiat symbol. */
export function getCurrencySymbol(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case 'NGN': return '₦';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'KES': return 'KSh';
    case 'GHS': return 'GH₵';
    case 'ZAR': return 'R';
    default: return symbol;
  }
}

/** 
 * Normalizes an asset symbol by converting to uppercase and handling known aliases.
 * e.g. "ripple" -> "XRP"
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  const s = symbol.toUpperCase();
  if (s === 'RIPPLE') return 'XRP';
  if (s === 'EUROC') return 'EURC';
  return s;
}

