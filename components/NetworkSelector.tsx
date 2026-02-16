import React from 'react';

interface NetworkSelectorProps {
  value: string; // e.g. "A02"
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ value, onChange, disabled }) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const numbers = Array.from({ length: 16 }, (_, i) => i + 1);

  const currentLetter = value.charAt(0).toUpperCase();
  const currentNumber = parseInt(value.substring(1), 10) || 1;

  const handleChange = (newL: string, newN: number) => {
    const numStr = newN < 10 ? `0${newN}` : `${newN}`;
    onChange(`${newL}${numStr}`);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Group</label>
        <div className="grid grid-cols-4 gap-1">
          {letters.map(l => (
            <button
              key={l}
              disabled={disabled}
              onClick={() => handleChange(l, currentNumber)}
              className={`py-2 rounded-lg text-xs font-bold border transition-all ${currentLetter === l ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID (01-16)</label>
        <select
          disabled={disabled}
          value={currentNumber}
          onChange={(e) => handleChange(currentLetter, Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none h-[72px]"
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