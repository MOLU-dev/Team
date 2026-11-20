interface AddressDisplayProps {
  address: string;
}

export default function AddressDisplay({ address }: AddressDisplayProps) {
  return (
    <div className="p-5 bg-midnight/80 border border-cyan/20 rounded-xl">
      <div className="text-xs uppercase tracking-widest text-text-secondary mb-3">
        Your Wallet Address
      </div>
      <div className="font-mono text-sm text-text-primary break-all">
        {address}
      </div>
    </div>
  );
}
