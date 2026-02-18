import React, { useMemo } from 'react';
import { HelpCircle, Lock, LayoutDashboard, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateHelp?: () => void;
  onNavigateAdmin?: () => void;
  onNavigateConfig?: () => void;
  isAdminMode?: boolean;
  currentView?: 'main' | 'admin' | 'help';
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onNavigateHelp, 
  onNavigateAdmin, 
  onNavigateConfig,
  isAdminMode = false,
  currentView = 'main'
}) => {
  const stars = useMemo(() => {
    return Array.from({ length: 800 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.3,
      color: Math.random() > 0.85 ? (Math.random() > 0.5 ? '#9bb0ff' : '#ffcc33') : '#ffffff',
      twinkle: Math.random() > 0.4,
      dur: `${Math.random() * 8 + 4}s`
    }));
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateConfig) onNavigateConfig();
  };

  return (
    <div className="min-h-screen relative flex flex-col text-slate-100">
      {/* Background Layer */}
      <div className="fixed inset-0 z-[-10] bg-[#00040D] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, #000c29 0%, #00040D 100%) opacity-100"></div>
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-[-25deg] filter blur-[140px] opacity-20 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, rgba(0, 178, 255, 0.4) 0%, transparent 60%)' }}></div>
        <div className="absolute inset-0">
          {stars.map(s => (
            <div 
              key={s.id} 
              className={`absolute rounded-full ${s.twinkle ? 'twinkle' : ''}`}
              style={{ 
                top: s.top, 
                left: s.left, 
                width: `${s.size}px`, 
                height: `${s.size}px`, 
                backgroundColor: s.color, 
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                '--dur': s.dur 
              } as any}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-[5000] h-[100px] lg:h-[130px] bg-[#00040D] border-b-2 border-white/10 flex items-center justify-between px-4 lg:px-16 shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-4 lg:gap-14">
          <div 
            onClick={handleLogoClick}
            className="bg-white p-2 lg:p-3 rounded-xl lg:rounded-2xl border-2 border-white/50 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform cursor-pointer"
          >
            <img 
              src="https://www.thorlux.de/assets/images/schahlled-logo-colour-c4e9ae384335c5a599815fb347bd845a.svg" 
              className="h-[40px] lg:h-[80px] w-auto" 
              alt="SchahlLED" 
            />
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <img 
              src="https://www.schahlled-control-center.de/build/img/schahlled/brand-logo.b4d1183a.svg" 
              className="h-6 lg:h-10 opacity-90 cursor-pointer" 
              alt="Control Center"
              onClick={handleLogoClick}
            />
            {isAdminMode && currentView !== 'help' && (
              <div className="hidden lg:flex bg-white/5 p-1 rounded-xl border border-white/10 ml-10">
                <button 
                  onClick={onNavigateConfig}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentView === 'main' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  <LayoutDashboard size={14}/> Config
                </button>
                <button 
                  onClick={onNavigateAdmin}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentView === 'admin' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  <FileText size={14}/> Service
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-12">
          <button 
            onClick={onNavigateAdmin}
            className={`text-[10px] lg:text-[13px] font-black flex items-center gap-2 lg:gap-3 tracking-[0.2em] lg:tracking-[0.5em] uppercase hover:text-white transition-all transform hover:scale-105 ${isAdminMode ? 'text-blue-400' : 'text-slate-500'}`}>
            <Lock size={18} className="lg:w-[22px] lg:h-[22px]"/> ADMIN
          </button>
          <button 
            onClick={onNavigateHelp}
            className="text-[10px] lg:text-[13px] font-black text-blue-400 flex items-center gap-2 lg:gap-3 tracking-[0.2em] lg:tracking-[0.5em] uppercase hover:text-white transition-all transform hover:scale-105">
            <HelpCircle size={18} className="lg:w-[26px] lg:h-[26px]"/> HILFE
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 z-10 p-4 lg:p-14 flex flex-col items-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-10 lg:py-20 opacity-30 border-t border-white/5 bg-black/80 z-10">
        <p className="text-[8px] lg:text-[10px] font-black tracking-[1em] lg:tracking-[3em] text-slate-600 uppercase lg:ml-[3em]">SchahlLED GmbH • Map-Configurator v7.1</p>
      </footer>
    </div>
  );
};