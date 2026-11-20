'use client';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
        enabled
          ? 'bg-gradient-to-br from-cyan to-electric-blue'
          : 'bg-text-secondary/20 border border-text-secondary/30'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
