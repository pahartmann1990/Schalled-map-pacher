
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Upload, Download, Search, ChevronDown, Settings, ArrowRight, Trash2, HelpCircle, 
  Info, X, Wifi, RefreshCw, Monitor, Usb, MousePointerClick, AlertTriangle, 
  User, Headphones, Activity, ListChecks, ShieldCheck, Lock, Check, Zap, 
  Sun, LayoutDashboard, FileText, ArrowLeft, CheckCircle2
} from 'lucide-react';

// --- TYPES ---
interface SerialMatch {
  value: string;
  count: number;
  isPmu: boolean;
  networkId?: string;
  attributes: Record<string, string>;
}

// --- COMPONENTS ---

const SkyBackground = () => {
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

  return (
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
  );
};

const Layout = ({ children, onNavigateHelp, onNavigateAdmin, onNavigateConfig, isAdminMode, currentView }) => (
  <div className="min-h-screen relative flex flex-col text-slate-100">
    <SkyBackground />
    <header className="sticky top-0 z-[5000] h-[100px] lg:h-[130px] bg-[#00040D] border-b-2 border-white/10 flex items-center justify-between px-4 lg:px-16 shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-4 lg:gap-14">
        <div 
          onClick={onNavigateConfig}
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
            onClick={onNavigateConfig}
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
    <main className="flex-1 z-10 p-4 lg:p-14 flex flex-col items-center">{children}</main>
    <footer className="text-center py-10 lg:py-20 opacity-30 border-t border-white/5 bg-black/80 z-10">
      <p className="text-[8px] lg:text-[10px] font-black tracking-[1em] lg:tracking-[3em] text-slate-600 uppercase lg:ml-[3em]">SchahlLED GmbH • Map-Configurator v7.2</p>
    </footer>
  </div>
);

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(opt => opt.value.toLowerCase().includes(searchTerm.toLowerCase()));
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-all"
      >
        <span className={!selected ? 'text-slate-600' : 'font-mono'}>
          {selected ? `${selected.value} (x${selected.count})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#00040D] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-slate-800">
            <input 
              autoFocus 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search..." 
              className="w-full bg-black/60 text-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto help-scroll">
            {filtered.map(opt => (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer text-sm font-mono ${value === opt.value ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                <span>{opt.value}</span>
                <span className="text-[10px] opacity-40">x{opt.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DropZone = ({ onFileLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const process = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => onFileLoaded(file.name, e.target.result);
    reader.readAsText(file);
  };
  return (
    <div 
      onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) process(e.dataTransfer.files[0]); }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`relative w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-black/40 hover:border-slate-500'}`}
    >
      <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-400 animate-bounce' : 'text-slate-600'}`} />
      <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Drag & Drop .MAP File</p>
      <input type="file" accept=".map" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { if (e.target.files[0]) process(e.target.files[0]); }} />
    </div>
  );
};

// --- VIEWS ---

const MainView = ({ onNavigateHelp, onNavigateAdmin, isAdminMode, onNavigateConfig }) => {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('patch');
  const [serialOptions, setSerialOptions] = useState([]);
  const [patchJobs, setPatchJobs] = useState([{ id: Date.now(), oldSN: '', newSN: '' }]);
  const [dhJobs, setDhJobs] = useState([{ id: Date.now(), sourceSN: '', targetSN: '' }]);
  const [isDone, setIsDone] = useState(false);
  const [dlUrl, setDlUrl] = useState(null);

  const handleFileLoaded = (name, content) => {
    setFile({ name, content });
    const pmuRegex = /<pmu\s+([^>]+)>/gi;
    const matches = []; 
    let match;
    while ((match = pmuRegex.exec(content)) !== null) {
      const attrsStr = match[1];
      const snMatch = attrsStr.match(/sn="([^"]+)"/i);
      const netMatch = attrsStr.match(/network="([^"]+)"/i);
      if (snMatch) {
        const sn = snMatch[1];
        const existing = matches.find(m => m.value === sn);
        if (existing) existing.count++;
        else {
          const attrPairs = attrsStr.match(/([a-zA-Z0-9_]+)="([^"]*)"/gi) || [];
          const attrs = {};
          attrPairs.forEach(pair => { const [k, v] = pair.split('='); attrs[k] = v.replace(/"/g, ''); });
          matches.push({ value: sn, count: 1, isPmu: true, networkId: netMatch ? netMatch[1] : undefined, attributes: attrs });
        }
      }
    }
    setSerialOptions(matches);
    setIsDone(false);
    setDlUrl(null);
  };

  const apply = () => {
    let res = file.content;
    patchJobs.forEach(job => { if (job.oldSN && job.newSN) { res = res.replace(new RegExp(`sn="${job.oldSN}"`, 'gi'), `sn="${job.newSN}"`); } });
    dhJobs.forEach(job => {
      if (!job.sourceSN || !job.targetSN) return;
      const src = serialOptions.find(o => o.value === job.sourceSN);
      if (src) {
        const dhKeys = Object.keys(src.attributes).filter(k => k.startsWith('cal_') || k.startsWith('lux_') || k.startsWith('occupied_') || k.startsWith('vacant_'));
        res = res.replace(new RegExp(`<pmu([^>]*)sn="${job.targetSN}"([^>]*)>`, 'i'), (full, b, a) => {
          let attrs = b + ' ' + a;
          dhKeys.forEach(k => {
            const attrStr = `${k}="${src.attributes[k]}"`;
            const r = new RegExp(`${k}="[^"]*"`, 'i');
            attrs = attrs.match(r) ? attrs.replace(r, attrStr) : attrs + ` ${attrStr}`;
          });
          return `<pmu sn="${job.targetSN}" ${attrs.replace(/\s+/g, ' ').trim()}>`;
        });
      }
    });
    setDlUrl(URL.createObjectURL(new Blob([res], { type: 'text/plain' })));
    setIsDone(true);
  };

  return (
    <Layout onNavigateHelp={onNavigateHelp} onNavigateAdmin={onNavigateAdmin} onNavigateConfig={onNavigateConfig} isAdminMode={isAdminMode} currentView="main">
      <div className="w-full max-w-7xl space-y-12 lg:space-y-20">
        <div className="text-center space-y-6 lg:space-y-10">
          <h1 className="text-3xl lg:text-7xl font-light text-white uppercase tracking-[0.4em] lg:tracking-[0.6em] ml-[0.2em] filter drop-shadow-[0_0_40px_rgba(0,178,255,0.45)]">MAP-CONFIGURATOR</h1>
          <div className="w-32 lg:w-56 h-1 bg-blue-500 mx-auto rounded-full shadow-[0_0_20px_var(--schahl-blue)]"></div>
        </div>
        {!file ? (
          <div className="glass-card p-10 lg:p-20"><DropZone onFileLoaded={handleFileLoaded} /></div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-8 glass-card overflow-visible">
              <div className="flex bg-black/40 border-b border-white/10 rounded-t-3xl overflow-hidden">
                <button onClick={() => setActiveTab('patch')} className={`flex-1 py-6 lg:py-8 text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'patch' ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500'}`}>SN Patching</button>
                <button onClick={() => setActiveTab('dh')} className={`flex-1 py-6 lg:py-8 text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dh' ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500'}`}>DH Transfer</button>
              </div>
              <div className="p-6 lg:p-12 space-y-8 min-h-[400px]">
                {activeTab === 'patch' ? (
                  <>
                    <button onClick={() => setPatchJobs([...patchJobs, { id: Date.now(), oldSN: '', newSN: '' }])} className="w-full py-4 bg-slate-900 border border-slate-700 text-blue-400 font-black rounded-xl uppercase text-xs tracking-widest">+ SN-Tausch</button>
                    {patchJobs.map(j => (
                      <div key={j.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row items-center gap-6">
                        <div className="flex-1 w-full"><SearchableSelect options={serialOptions} value={j.oldSN} onChange={v => setPatchJobs(patchJobs.map(p => p.id === j.id ? {...p, oldSN: v} : p))} label="Quelle (Datei)" /></div>
                        <ArrowRight className="hidden lg:block text-slate-700" />
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ersatz (Neu)</label>
                          <input type="text" value={j.newSN} onChange={e => setPatchJobs(patchJobs.map(p => p.id === j.id ? {...p, newSN: e.target.value.toUpperCase()} : p))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500" />
                        </div>
                        <button onClick={() => setPatchJobs(patchJobs.filter(p => p.id !== j.id))} className="text-slate-700 hover:text-red-500"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <button onClick={() => setDhJobs([...dhJobs, { id: Date.now(), sourceSN: '', targetSN: '' }])} className="w-full py-4 bg-slate-900 border border-slate-700 text-blue-400 font-black rounded-xl uppercase text-xs tracking-widest">+ DH-Transfer</button>
                    {dhJobs.map(j => (
                      <div key={j.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row items-center gap-6">
                        <div className="flex-1 w-full"><SearchableSelect options={serialOptions} value={j.sourceSN} onChange={v => setDhJobs(dhJobs.map(d => d.id === j.id ? {...d, sourceSN: v} : d))} label="Quelle (Kalibrierung)" /></div>
                        <Zap className="hidden lg:block text-blue-500 opacity-40" />
                        <div className="flex-1 w-full"><SearchableSelect options={serialOptions} value={j.targetSN} onChange={v => setDhJobs(dhJobs.map(d => d.id === j.id ? {...d, targetSN: v} : d))} label="Ziel (Übernahme)" /></div>
                        <button onClick={() => setDhJobs(dhJobs.filter(d => d.id !== j.id))} className="text-slate-700 hover:text-red-500"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="glass-card p-10 lg:p-14 text-center space-y-10 flex flex-col justify-between min-h-[400px]">
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-black/60 flex items-center justify-center border-2 border-blue-500/20 shadow-inner">
                    <Settings size={36} className={`text-blue-400 ${!isDone && 'animate-spin'}`} style={{ animationDuration: '8s' }} />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-widest">{isDone ? 'READY' : 'STANDBY'}</h4>
                  <p className="text-[10px] text-slate-500 truncate border-y border-white/10 py-4 tracking-widest">{file.name}</p>
                </div>
                {!isDone ? (
                  <button onClick={apply} className="w-full py-6 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs tracking-widest shadow-xl transition-all">CONFIG ANWENDEN</button>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-xl text-[10px] text-emerald-400 font-bold uppercase tracking-widest">PATCH ERFOLGREICH</div>
                    <a href={dlUrl} download={file.name.replace('.map', '_config.map')} className="flex items-center justify-center w-full py-6 bg-white text-black font-black rounded-2xl uppercase text-xs shadow-2xl tracking-widest hover:scale-105 transition-all"><Download className="mr-4" size={24}/> DOWNLOAD</a>
                  </div>
                )}
                <button onClick={() => setFile(null)} className="text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-red-500">Datei wechseln</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const SupportPanel = () => (
  <div className="space-y-8">
    <div className="bg-black/40 border border-blue-500/20 p-8 rounded-3xl space-y-8">
      <h4 className="text-white font-black text-sm uppercase flex items-center gap-4"><Headphones size={24} className="text-blue-400"/> Technischer Support</h4>
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/5">
          <User size={28} className="text-blue-400"/>
          <div><p className="text-[8px] text-slate-500 uppercase font-black">Patrick Hartmann (Service)</p><p className="text-white font-bold text-base">Handy: -36</p><p className="text-white/60 text-[10px]">0176 80536466</p></div>
        </div>
        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/5">
          <ShieldCheck size={28} className="text-blue-400"/>
          <div><p className="text-[8px] text-slate-500 uppercase font-black">Daniel Seehaus (Techn. Leiter)</p><p className="text-white font-bold text-base">Zentrale: -20</p><p className="text-white/60 text-[10px]">089 9011982-20</p></div>
        </div>
        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/5">
          <Activity size={28} className="text-blue-400"/>
          <div><p className="text-[8px] text-slate-500 uppercase font-black">Zentrale SchahlLED</p><p className="text-white font-bold text-base">089 9011982-0</p></div>
        </div>
      </div>
    </div>
  </div>
);

// Added isAdminMode to HelpView props and passed it to Layout.
const HelpView = ({ onBack, isAdminMode }) => {
  const [topic, setTopic] = useState('fixtures');
  return (
    <Layout currentView="help" onNavigateConfig={onBack} onNavigateHelp={() => {}} onNavigateAdmin={() => {}} isAdminMode={isAdminMode}>
      <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 lg:mb-12 gap-6">
          <button onClick={onBack} className="group flex items-center gap-4 text-slate-500 hover:text-white transition-colors self-start sm:self-center">
            <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:border-blue-500/50"><ArrowLeft size={24} /></div>
            <span className="font-black uppercase tracking-widest text-sm">Zurück</span>
          </button>
          <div className="flex items-center gap-4 lg:gap-6"><HelpCircle className="text-blue-400 w-8 h-8 lg:w-12 lg:h-12" /><h2 className="text-xl lg:text-3xl font-black text-white uppercase tracking-widest">Technischer Leitfaden</h2></div>
        </div>
        <div className="glass-card overflow-hidden flex flex-col min-h-[60vh] lg:min-h-0">
          <div className="flex bg-black/60 border-b border-white/10 flex-col sm:flex-row">
            <button onClick={() => setTopic('fixtures')} className={`flex-1 py-6 lg:py-10 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border-b sm:border-b-0 sm:border-r border-white/5 ${topic === 'fixtures' ? 'text-blue-400 bg-blue-500/10 border-b-4 border-blue-500' : 'text-slate-500'}`}><Zap size={18}/> Leuchten finden & zuweisen</button>
            <button onClick={() => setTopic('reset')} className={`flex-1 py-6 lg:py-10 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${topic === 'reset' ? 'text-blue-400 bg-blue-500/10 border-b-4 border-blue-500' : 'text-slate-500'}`}><Usb size={18}/> Leuchten Reset (USB)</button>
          </div>
          <div className="p-6 lg:p-16 overflow-y-auto help-scroll flex-1">
            {topic === 'fixtures' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="space-y-10 lg:space-y-12">
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(0,178,255,1)]"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">1. Add Fixtures Wizard</h4><p className="text-sm text-slate-400">Öffnen Sie <b>"Add Fixtures"</b>. Wählen Sie im Wizard: <span className="text-blue-300 font-bold italic block mt-1">"discovering them using a USB Wireless Adapter"</span>. Klicken Sie auf <b>Next</b>.</p></div>
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(0,178,255,1)]"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">2. Netzwerk & Discover</h4><p className="text-sm text-slate-400">Netzwerk wählen (Default / A1 / A2 etc.) und Discover klicken. <br/><br/><span className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-xl block text-blue-200 font-bold uppercase text-[10px]">⭐ 3-MAL-REGEL: Insgesamt 3-mal hintereinander auf Discover klicken! Warten Sie nach jedem Klick 15-20 Sek.</span></p></div>
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(0,178,255,1)]"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">3. Edit Fixture (Zuweisung)</h4><p className="text-sm text-slate-400">Rechtsklick/Doppelklick auf Leuchte im Plan → <b>"Edit Fixture"</b>. <br/><br/><span className="text-amber-400 font-black uppercase text-[10px]">⚠️ Wichtig: Das (+)-Symbol befindet sich UNTEN LINKS.</span></p></div>
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(0,178,255,1)]"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">4. Synchronisation (Sync Map)</h4><p className="text-sm text-slate-400">Sync Map klicken → Reiter <b>"Use Wireless Adapter only"</b> → Next. <br/><br/><span className="text-blue-400 font-bold flex items-center gap-2 text-xs"><CheckCircle2 size={16}/> Falls Fehler: bis zu 3x auf "Retry" drücken.</span></p></div>
                </div>
                <SupportPanel />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                <div className="space-y-10 lg:space-y-12">
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">1. Hardware Verbindung</h4><p className="text-sm text-slate-400">Leuchte per USB (TTL/Micro-USB) mit dem PC verbinden.</p></div>
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">2. Advanced Menü</h4><p className="text-sm text-slate-400">Rechtsklick auf Leuchte → <b>Advanced</b> → <b>Reset Items</b>.</p></div>
                  <div className="relative pl-12 border-l-2 border-blue-500/20"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div><h4 className="text-white font-black text-base lg:text-lg uppercase mb-4">3. Reset ausführen</h4><p className="text-sm text-slate-400"><b>"Reset to Factory Default Network"</b> wählen → <b>"Reset via USB"</b>.</p></div>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-3xl flex gap-6"><AlertTriangle className="text-amber-500 shrink-0" size={32} /><p className="text-sm text-slate-300 font-bold uppercase italic tracking-tight">Nach Reset: Leuchte wieder über "Sync Map" mit dem Server synchronisieren!</p></div>
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

const AdminView = ({ onBack, isAuthenticated, onAuthenticated }) => {
  const [pattern, setPattern] = useState([]);
  const handleDot = i => {
    if (pattern.includes(i)) return;
    const next = [...pattern, i]; setPattern(next);
    if (next.length === 5) { if (next.join(',') === '0,1,2,5,8') onAuthenticated(); else setTimeout(() => setPattern([]), 500); }
  };
  if (!isAuthenticated) return (
    // Added isAdminMode={isAuthenticated} to Layout call for the login screen.
    <Layout onNavigateConfig={onBack} currentView="admin" onNavigateHelp={() => {}} onNavigateAdmin={() => {}} isAdminMode={isAuthenticated}>
      <div className="glass-card p-14 lg:p-20 text-center space-y-12 max-w-xl mx-auto"><Lock className="mx-auto text-blue-400 animate-pulse" size={60} /><h2 className="text-2xl font-black uppercase tracking-widest text-white">ADMIN AUTH</h2>
        <div className="grid grid-cols-3 gap-6 lg:gap-8 mx-auto w-fit p-10 bg-black/40 rounded-[2.5rem] border border-white/10 shadow-inner">
          {[0,1,2,3,4,5,6,7,8].map(i => <button key={i} onMouseDown={() => handleDot(i)} onMouseEnter={e => e.buttons === 1 && handleDot(i)} className={`w-10 h-10 rounded-full border-2 transition-all ${pattern.includes(i) ? 'bg-blue-500 border-white shadow-[0_0_20px_rgba(0,178,255,1)]' : 'bg-white/5 border-white/20'}`} />)}
        </div>
        <button onClick={onBack} className="text-slate-600 uppercase font-black text-[10px] tracking-widest hover:text-white">ABBRECHEN</button>
      </div>
    </Layout>
  );
  return (
    <Layout isAdminMode={true} currentView="admin" onNavigateConfig={onBack} onNavigateHelp={() => {}} onNavigateAdmin={() => {}}>
      <div className="glass-card p-10 lg:p-20 text-center space-y-10 min-h-[50vh] flex flex-col justify-center max-w-6xl mx-auto"><h2 className="text-3xl lg:text-5xl font-light tracking-widest text-white uppercase">Serviceprotokolle</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 lg:py-20">
          {[1,2,3].map(i => <div key={i} className="bg-black/40 p-12 rounded-[2.5rem] border border-white/5 text-slate-500 flex flex-col items-center gap-6"><FileText size={48} className="opacity-20"/><p className="font-black text-[10px] uppercase tracking-widest opacity-20">In Vorbereitung</p></div>)}
        </div>
        <button onClick={onBack} className="w-fit mx-auto px-10 py-6 rounded-2xl bg-blue-500 text-white font-black text-xs tracking-widest uppercase">ZURÜCK</button>
      </div>
    </Layout>
  );
};

// --- APP ---

const App = () => {
  const [view, setView] = useState('main');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = v => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const render = () => {
    // Passed isAdminMode to HelpView.
    if (view === 'help') return <HelpView onBack={() => navigate('main')} isAdminMode={isAdmin} />;
    if (view === 'admin') return <AdminView onBack={() => navigate('main')} isAuthenticated={isAdmin} onAuthenticated={() => setIsAdmin(true)} />;
    return <MainView onNavigateHelp={() => navigate('help')} onNavigateAdmin={() => navigate('admin')} onNavigateConfig={() => navigate('main')} isAdminMode={isAdmin} />;
  };
  return render();
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
