'use client';

import { useState } from 'react';
import { validatePassword } from '@/utils/passwordValidation';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  showRequirements?: boolean;
}

export default function PasswordInput({ value, onChange, showRequirements = false }: PasswordInputProps) {
  const [focused, setFocused] = useState(false);
  const validation = validatePassword(value);

  return (
    <div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      {showRequirements && focused && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Password must contain:</p>
          <ul className="list-disc pl-5">
            <li className={value.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
              At least 8 characters
            </li>
            <li className={/[A-Z]/.test(value) ? 'text-green-600' : 'text-gray-600'}>
              One uppercase letter
            </li>
            <li className={/[a-z]/.test(value) ? 'text-green-600' : 'text-gray-600'}>
              One lowercase letter
            </li>
            <li className={/[0-9]/.test(value) ? 'text-green-600' : 'text-gray-600'}>
              One number
            </li>
            <li className={/[!@#$%^&*]/.test(value) ? 'text-green-600' : 'text-gray-600'}>
              One special character (!@#$%^&*)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 