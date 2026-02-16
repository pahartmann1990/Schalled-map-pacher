import React from 'react';

interface NetworkSelectorProps {
  value: string; // e.g. "H16"
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ value, onChange, disabled }) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const numbers = Array.from({ length: 16 }, (_, i) => i + 1);

  // Parse current value
  const currentLetter = value.charAt(0).toUpperCase();
  const currentNumPart = value.substring(1);
  const currentNumber = parseInt(currentNumPart, 10);

  // Safe defaults
  const safeLetter = letters.includes(currentLetter) ? currentLetter : 'A';
  const safeNumber = !isNaN(currentNumber) && currentNumber >= 1 && currentNumber <= 16 ? currentNumber : 1;

  const handleChange = (type: 'letter' | 'number', val: string | number) => {
    let newL = type === 'letter' ? val : safeLetter;
    let newN = type === 'number' ? Number(val) : safeNumber;
    
    // Always pad with zero: 1 -> "01", 16 -> "16"
    const numStr = newN < 10 ? `0${newN}` : `${newN}`;
    onChange(`${newL}${numStr}`);
  };

  return (
    <div className="flex space-x-2">
      <div className="flex-1">
        <label className="text-xs text-slate-500 mb-1 block">Group</label>
        <select
          disabled={disabled}
          value={safeLetter}
          onChange={(e) => handleChange('letter', e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
        >
          {letters.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <label className="text-xs text-slate-500 mb-1 block">ID</label>
        <select
          disabled={disabled}
          value={safeNumber}
          onChange={(e) => handleChange('number', e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50 font-mono"
        >
          {numbers.map(n => (
            <option key={n} value={n}>
              {n < 10 ? `0${n}` : n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};