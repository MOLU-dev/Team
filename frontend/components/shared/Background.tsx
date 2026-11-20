interface BackgroundProps {
  type?: 'dashboard' | 'landing';
}

export default function Background({ type = 'landing' }: BackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-midnight" />
  );
}
