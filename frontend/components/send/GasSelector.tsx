interface GasOption {
  id: string;
  title: string;
  time: string;
  fee: string;
}

interface GasSelectorProps {
  options: GasOption[];
  selectedOption: string;
  onSelect: (option: string) => void;
}

export default function GasSelector({ options, selectedOption, onSelect }: GasSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`p-4 border-2 rounded-xl text-left transition-all ${
            selectedOption === option.id
              ? 'border-cyan bg-cyan/10'
              : 'border-cyan/20 hover:border-cyan'
          }`}
        >
          <div className="font-semibold text-text-primary mb-1">{option.title}</div>
          <div className="text-sm text-text-secondary mb-2">{option.time}</div>
          <div className="font-semibold text-cyan">{option.fee}</div>
        </button>
      ))}
    </div>
  );
}
