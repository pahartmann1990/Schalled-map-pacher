import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { SerialMatch } from '../types';

interface SearchableSelectProps {
  options: SerialMatch[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Filter options
  const filteredOptions = options.filter(opt => 
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 
          flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : 'hover:border-slate-600'}
        `}
      >
        <span className={!selectedOption ? 'text-slate-500' : 'font-mono'}>
          {selectedOption ? (
            <span className="flex items-center">
              {selectedOption.value}
              <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                x{selectedOption.count}
              </span>
              {selectedOption.networkId && (
                <span className="ml-2 text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  {selectedOption.networkId}
                </span>
              )}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Search Input */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search last digits..."
                className="w-full bg-slate-950 text-slate-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No matches found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`
                    px-4 py-3 flex items-center justify-between cursor-pointer text-sm font-mono transition-colors
                    ${value === opt.value ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'}
                  `}
                >
                  <div className="flex items-center">
                    <span>{opt.value}</span>
                    {opt.networkId && (
                       <span className="ml-2 text-xs text-slate-500 border border-slate-700 px-1 rounded">
                         {opt.networkId}
                       </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-600">
                      {opt.count} instance{opt.count !== 1 && 's'}
                    </span>
                    {value === opt.value && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};