import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-midnight">
      <div className="fixed inset-0 z-0 opacity-30">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-drift"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(0, 255, 204, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(204, 255, 0, 0.08) 0%, transparent 50%)
            `
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan to-electric-blue clip-hexagon animate-rotate"></div>
            <h1 className="font-orbitron text-4xl font-black tracking-tight bg-gradient-to-br from-cyan to-electric-blue bg-clip-text text-transparent">
              BitSilo
            </h1>
          </div>
          <p className="text-text-secondary">Your Gateway to Multi-Chain Trading</p>
        </div>

        <div className="bg-gradient-to-br from-deep-navy/80 to-slate/60 border border-cyan/20 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="font-orbitron text-2xl font-black mb-2">{title}</h2>
            {subtitle && <p className="text-text-secondary">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
