'use client';

import { useState, useEffect } from 'react';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong' | 'empty'>('empty');

  useEffect(() => {
    if (!password) {
      setStrength('empty');
      return;
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Determine strength
    if (score <= 2) setStrength('weak');
    else if (score <= 4) setStrength('medium');
    else setStrength('strong');
  }, [password]);

  if (strength === 'empty') return null;

  const strengthConfig = {
    weak: {
      label: 'Weak',
      color: 'bg-danger',
      width: '33%',
      textColor: 'text-danger'
    },
    medium: {
      label: 'Medium',
      color: 'bg-warning',
      width: '66%',
      textColor: 'text-warning'
    },
    strong: {
      label: 'Strong',
      color: 'bg-success',
      width: '100%',
      textColor: 'text-success'
    }
  };

  const config = strengthConfig[strength];

  return (
    <div className="mt-3 space-y-2 animate-fade-in">
      <div className="h-1.5 bg-cyan/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${config.color} transition-all duration-300`}
          style={{ width: config.width }}
        />
      </div>
      <div className={`text-xs font-medium ${config.textColor}`}>
        Password strength: {config.label}
      </div>
    </div>
  );
}
