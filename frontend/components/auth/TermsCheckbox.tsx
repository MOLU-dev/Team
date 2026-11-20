'use client';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export default function TermsCheckbox({ checked, onChange, error }: TermsCheckboxProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-cyan/20 bg-midnight/80 text-cyan focus:ring-cyan/50 focus:ring-2"
        />
        <label htmlFor="terms" className="text-sm text-text-secondary leading-tight">
          I agree to the{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-cyan hover:text-electric-blue transition-colors font-medium">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-cyan hover:text-electric-blue transition-colors font-medium">
            Privacy Policy
          </a>
        </label>
      </div>
      
      {error && (
        <div className="text-xs text-danger animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
