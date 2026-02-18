
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, HelpCircle, Monitor, RefreshCw, MousePointerClick, Wifi, 
  Usb, AlertTriangle, User, Headphones, Activity, Zap, CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface HelpViewProps {
  onBack: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onBack }) => {
  const [activeTopic, setActiveTopic] = useState<'fixtures' | 'reset'>('fixtures');

  return (
    <Layout currentView="help" onNavigateConfig={onBack}>
      <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-5 duration-500">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 lg:mb-12 gap-6">
          <button 
            onClick={onBack}
            className="group flex items-center gap-4 text-slate-500 hover:text-white transition-colors self-start sm:self-center">
            <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all">
              <ArrowLeft size={24} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">Zurück</span>
          </button>
          <div className="flex items-center gap-4 lg:gap-6">
            <HelpCircle className="text-blue-400 w-8 h-8 lg:w-[44px] lg:h-[44px]" />
            <h2 className="text-xl lg:text-3xl font-black text-white uppercase tracking-widest">Technischer Leitfaden</h2>
          </div>
        </div>

        {/* Content Glass Card */}
        <div className="glass-card overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,178,255,0.1)] min-h-[60vh] lg:min-h-0">
          
          {/* Tabs */}
          <div className="flex bg-black/60 border-b border-white/10 flex-col sm:flex-row">
            <button 
              onClick={() => setActiveTopic('fixtures')}
              className={`flex-1 py-6 lg:py-10 text-[10px] lg:text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 border-b sm:border-b-0 sm:border-r border-white/5 ${activeTopic === 'fixtures' ? 'text-blue-400 bg-blue-500/10 border-b-4 border-blue-500' : 'text-slate-500 hover:text-slate-200'}`}>
              <Zap size={18}/> Leuchten finden & zuweisen
            </button>
            <button 
              onClick={() => setActiveTopic('reset')}
              className={`flex-1 py-6 lg:py-10 text-[10px] lg:text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 ${activeTopic === 'reset' ? 'text-blue-400 bg-blue-500/10 border-b-4 border-blue-500' : 'text-slate-500 hover:text-slate-200'}`}>
              <Usb size={18}/> Leuchten Reset (USB)
            </button>
          </div>

          <div className="p-6 lg:p-16 help-scroll flex-1 overflow-y-auto">
            {activeTopic === 'fixtures' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="space-y-10 lg:space-y-12">
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><Monitor size={24} className="text-blue-400"/> 1. Add Fixtures Wizard</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Öffnen Sie <b>"Add Fixtures"</b>. Wählen Sie im Wizard den Punkt: <br/>
                      <span className="text-blue-300 font-bold italic mt-2 block">"discovering them using a USB Wireless Adapter"</span><br/>
                      Klicken Sie auf <b>Next</b>.
                    </p>
                  </div>
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><RefreshCw size={24} className="text-blue-400"/> 2. Netzwerk & Discover</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Wählen Sie das gewünschte Netzwerk (Default / A1 / A2 etc.) und klicken Sie auf <b>Discover</b>. <br/><br/>
                      <span className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-xl block text-blue-200 font-bold uppercase tracking-tight text-xs">
                        ⭐ 3-MAL-REGEL: Insgesamt 3-mal hintereinander auf Discover klicken! Warten Sie nach jedem Klick 15-20 Sek.
                      </span><br/>
                      Wenn nichts gefunden: anderes Netzwerk wählen oder <b>"Scan for Networks"</b> nutzen.
                    </p>
                  </div>
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><MousePointerClick size={24} className="text-blue-400"/> 3. Edit Fixture (Zuweisung)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Rechtsklick oder Doppelklick auf die Leuchte im Plan → <b>"Edit Fixture"</b>. <br/><br/>
                      <span className="text-amber-400 font-black flex items-center gap-2 uppercase text-xs">
                        ⚠️ Wichtig: Das (+)-Symbol befindet sich UNTEN LINKS.
                      </span><br/>
                      Wählen Sie unter <b>"Current Network"</b> das korrekte Netzwerk aus und bestätigen Sie mit <b>OK</b>.
                    </p>
                  </div>
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><Wifi size={24} className="text-blue-400"/> 4. Synchronisation (Sync Map)</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Leuchte im Plan ausgewählt lassen → oben auf <b>"Sync Map"</b> klicken. <br/>
                      Wählen Sie den Reiter <b>"Use Wireless Adapter only"</b> → <b>Next</b>.<br/><br/>
                      <span className="text-blue-400 font-bold flex items-center gap-2">
                        <CheckCircle2 size={16}/> Hinweis: Falls ein Fehler auftritt, bis zu 3x auf "Retry" drücken.
                      </span>
                    </p>
                  </div>
                </div>
                <SupportPanel />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="space-y-10 lg:space-y-12">
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><Usb size={24} className="text-blue-400"/> 1. Hardware Verbindung</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Verbinden Sie die Leuchte per USB (TTL oder Micro-USB) mit Ihrem PC.
                    </p>
                  </div>
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><MousePointerClick size={24} className="text-blue-400"/> 2. Advanced Menü</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Im Commissioner: Rechtsklick auf die Leuchte → <b>Advanced</b> → <b>Reset Items</b>.
                    </p>
                  </div>
                  <div className="step-path">
                    <h4 className="text-white font-black text-base lg:text-lg uppercase mb-4 flex items-center gap-4"><RefreshCw size={24} className="text-blue-400"/> 3. Reset ausführen</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Wählen Sie <b>"Reset to Factory Default Network"</b> und klicken Sie auf <b>"Reset via USB"</b>.
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-6 lg:p-8 rounded-3xl flex gap-6">
                    <AlertTriangle className="text-amber-500 shrink-0" size={32} />
                    <p className="text-sm text-slate-300 font-bold uppercase italic tracking-tight">
                      Wichtig: Nach jedem Hardware-Reset muss die Leuchte wieder über "Sync Map" mit dem Server synchronisiert werden!
                    </p>
                  </div>
                </div>
                <SupportPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const SupportPanel = () => (
  <div className="space-y-8 lg:space-y-10">
    <div className="support-card space-y-6 lg:space-y-8">
      <h4 className="text-white font-black text-sm lg:text-base uppercase flex items-center gap-4"><Headphones size={24} className="text-blue-400"/> Technischer Support</h4>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center gap-4 lg:gap-6 bg-black/40 p-4 lg:p-6 rounded-2xl border border-white/5 shadow-inner">
          <User size={28} className="text-blue-400"/>
          <div>
            <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black">Patrick Hartmann (Service)</p>
            <p className="text-white font-bold text-base lg:text-lg">Handy: -36</p>
            <p className="text-white/60 text-[10px]">0176 80536466</p>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:gap-6 bg-black/40 p-4 lg:p-6 rounded-2xl border border-white/5 shadow-inner">
          {/* Fixed: Added ShieldCheck to imports above */}
          <ShieldCheck size={28} className="text-blue-400"/>
          <div>
            <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black">Daniel Seehaus (Techn. Leiter)</p>
            <p className="text-white font-bold text-base lg:text-lg">Zentrale: -20</p>
            <p className="text-white/60 text-[10px]">089 9011982-20</p>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:gap-6 bg-black/40 p-4 lg:p-6 rounded-2xl border border-white/5 shadow-inner">
          <Activity size={28} className="text-blue-400"/>
          <div>
            <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black">Zentrale SchahlLED</p>
            <p className="text-white font-bold text-base lg:text-lg">089 9011982-0</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
