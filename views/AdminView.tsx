import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Lock, ArrowLeft, FileText, LayoutDashboard } from 'lucide-react';

interface AdminViewProps {
  onBack: () => void;
  isAuthenticated: boolean;
  onAuthenticated: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack, isAuthenticated, onAuthenticated }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const correctPattern = [0, 1, 2, 5, 8]; 

  const handleDot = (idx: number) => {
    if (pattern.includes(idx)) return;
    const newPattern = [...pattern, idx];
    setPattern(newPattern);
    
    if (newPattern.length === correctPattern.length) {
      if (newPattern.every((v, i) => v === correctPattern[i])) {
        onAuthenticated();
      } else {
        setTimeout(() => setPattern([]), 500);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout onNavigateConfig={onBack} currentView="admin">
        <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <div className="glass-card p-20 text-center space-y-12 max-w-xl">
            <Lock className="mx-auto text-blue-400 animate-pulse" size={80} />
            <div>
              <h2 className="text-3xl font-black uppercase tracking-[0.4em] text-white mb-4">ADMIN AUTH</h2>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Geben Sie das Sicherheitsmuster ein</p>
            </div>
            
            <div className="grid grid-cols-3 gap-8 mx-auto w-fit p-10 bg-black/40 rounded-[2.5rem] border border-white/10 shadow-inner">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <button 
                  key={i} 
                  onMouseDown={() => handleDot(i)} 
                  onMouseEnter={(e) => e.buttons === 1 && handleDot(i)}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    pattern.includes(i) ? 'bg-blue-500 border-white shadow-[0_0_20px_rgba(0,178,255,1)]' : 'bg-white/5 border-white/20 hover:border-blue-500/50'
                  }`} 
                />
              ))}
            </div>
            
            <button 
              onClick={onBack} 
              className="text-slate-600 uppercase font-black text-xs hover:text-white transition-colors tracking-[0.2em]">
              ABBRECHEN
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isAdminMode={true} currentView="admin" onNavigateConfig={onBack}>
      <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="glass-card p-20 text-center space-y-10 min-h-[60vh] flex flex-col justify-center">
          <div className="space-y-6">
            <h2 className="text-6xl font-light tracking-[0.4em] text-white uppercase filter drop-shadow-[0_0_20px_rgba(0,178,255,0.4)]">
              Serviceprotokolle
            </h2>
            <div className="w-32 h-1 bg-blue-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-20 px-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-black/40 p-16 rounded-[3rem] border border-white/5 text-slate-500 flex flex-col items-center justify-center gap-10 hover:border-blue-500/20 transition-all group">
                <div className="p-8 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                  <FileText size={64} className="opacity-20 group-hover:opacity-40 transition-opacity" />
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-[0.3em] opacity-30 group-hover:opacity-60">Modul {i}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-20">In Vorbereitung</p>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={onBack} 
            className="led-button px-20 py-8 rounded-[2rem] text-sm tracking-[0.5em] mx-auto uppercase transition-all">
            ZURÜCK ZUM CONFIGURATOR
          </button>
        </div>
      </div>
    </Layout>
  );
};