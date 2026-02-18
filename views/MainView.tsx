import React, { useState } from 'react';
import { Upload, Settings, Zap, Sun, ArrowRight, Trash2, Download } from 'lucide-react';
import { Layout } from '../components/Layout';
import { DropZone } from '../components/DropZone';
import { SearchableSelect } from '../components/SearchableSelect';
import { SerialMatch } from '../types';

interface MainViewProps {
  onNavigateHelp: () => void;
  onNavigateAdmin: () => void;
  isAdminMode: boolean;
}

export const MainView: React.FC<MainViewProps> = ({ onNavigateHelp, onNavigateAdmin, isAdminMode }) => {
  const [file, setFile] = useState<{ name: string, content: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'patch' | 'dh'>('patch');
  const [serialOptions, setSerialOptions] = useState<SerialMatch[]>([]);
  const [patchJobs, setPatchJobs] = useState<{ id: number, oldSN: string, newSN: string }[]>([{ id: Date.now(), oldSN: '', newSN: '' }]);
  const [dhJobs, setDhJobs] = useState<{ id: number, sourceSN: string, targetSN: string }[]>([{ id: Date.now(), sourceSN: '', targetSN: '' }]);
  const [isDone, setIsDone] = useState(false);
  const [dlUrl, setDlUrl] = useState<string | null>(null);

  const handleFileLoaded = (name: string, content: string) => {
    setFile({ name, content });
    
    // Improved attribute parsing for cloned attributes support
    const pmuRegex = /<pmu\s+([^>]+)>/gi;
    const matches: SerialMatch[] = []; 
    let match;
    while ((match = pmuRegex.exec(content)) !== null) {
      const attrsStr = match[1];
      const snMatch = attrsStr.match(/sn="([^"]+)"/i);
      const netMatch = attrsStr.match(/network="([^"]+)"/i);
      
      if (snMatch) {
        const sn = snMatch[1];
        const existing = matches.find(m => m.value === sn);
        if (existing) {
          existing.count++;
        } else {
          // Extract all attributes for potential DH cloning
          const attrPairs = attrsStr.match(/([a-zA-Z0-9_]+)="([^"]*)"/gi) || [];
          const attrs: Record<string, string> = {};
          attrPairs.forEach(pair => {
            const [key, val] = pair.split('=');
            attrs[key] = val.replace(/"/g, '');
          });

          matches.push({ 
            value: sn, 
            count: 1, 
            isPmu: true, 
            networkId: netMatch ? netMatch[1] : undefined,
            attributes: attrs
          });
        }
      }
    }
    setSerialOptions(matches);
    setIsDone(false);
    setDlUrl(null);
  };

  const applyConfig = () => {
    if (!file) return;
    let res = file.content;
    
    // SN Patching
    patchJobs.forEach(job => {
      if (job.oldSN && job.newSN) {
        const r = new RegExp(`sn="${job.oldSN}"`, 'gi');
        res = res.replace(r, `sn="${job.newSN}"`);
      }
    });

    // DH Transfer
    dhJobs.forEach(job => {
      if (!job.sourceSN || !job.targetSN) return;
      const source = serialOptions.find(o => o.value === job.sourceSN);
      if (source) {
        // Extract only relevant DH attributes
        const dhKeys = Object.keys(source.attributes).filter(k => 
          k.startsWith('cal_') || k.startsWith('lux_') || k.startsWith('occupied_') || k.startsWith('vacant_')
        );
        
        const targetRegex = new RegExp(`<pmu([^>]*)sn="${job.targetSN}"([^>]*)>`, 'i');
        res = res.replace(targetRegex, (full, before, after) => {
          let attrs = before + ' ' + after;
          dhKeys.forEach(key => {
            const val = source.attributes[key];
            const attrStr = `${key}="${val}"`;
            const r = new RegExp(`${key}="[^"]*"`, 'i');
            if (attrs.match(r)) {
              attrs = attrs.replace(r, attrStr);
            } else {
              attrs += ` ${attrStr}`;
            }
          });
          return `<pmu sn="${job.targetSN}" ${attrs.replace(/\s+/g, ' ').trim()}>`;
        });
      }
    });

    const blob = new Blob([res], { type: 'text/plain' });
    setDlUrl(URL.createObjectURL(blob));
    setIsDone(true);
  };

  return (
    <Layout 
      onNavigateHelp={onNavigateHelp} 
      onNavigateAdmin={onNavigateAdmin} 
      onNavigateConfig={() => {}}
      isAdminMode={isAdminMode}
      currentView="main"
    >
      <div className="w-full max-w-7xl space-y-20">
        <div className="text-center space-y-10">
          <h1 className="text-7xl font-light text-white uppercase tracking-[0.6em] ml-[0.6em] filter drop-shadow-[0_0_40px_rgba(0,178,255,0.45)]">
            MAP-CONFIGURATOR
          </h1>
          <div className="w-56 h-1 bg-blue-500 mx-auto rounded-full shadow-[0_0_20px_var(--schahl-blue)]"></div>
        </div>

        {!file ? (
          <div className="glass-card p-20 flex flex-col items-center">
            <DropZone onFileLoaded={handleFileLoaded} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-16 animate-in fade-in duration-500 overflow-visible">
            <div className="lg:col-span-8 glass-card overflow-visible flex flex-col border-white/5">
              <div className="flex bg-black/40 border-b border-white/10 rounded-t-3xl overflow-hidden">
                <button 
                  onClick={() => setActiveTab('patch')} 
                  className={`flex-1 py-8 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${activeTab === 'patch' ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}>
                  <Zap size={18}/> SN Patching
                </button>
                <button 
                  onClick={() => setActiveTab('dh')} 
                  className={`flex-1 py-8 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${activeTab === 'dh' ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}>
                  <Sun size={18}/> DH Transfer
                </button>
              </div>
              
              <div className="p-12 space-y-10 min-h-[500px] overflow-visible">
                {activeTab === 'patch' ? (
                  <>
                    <button 
                      onClick={() => setPatchJobs([...patchJobs, { id: Date.now(), oldSN: '', newSN: '' }])} 
                      className="w-full py-6 bg-slate-900/50 border border-slate-700 text-blue-400 font-black rounded-2xl uppercase tracking-[0.3em] hover:brightness-125 transition-all shadow-xl">
                      + SN-Tausch hinzufügen
                    </button>
                    {patchJobs.map((job) => (
                      <div key={job.id} className="bg-black/40 p-8 rounded-3xl border border-white/5 flex items-center gap-10 relative overflow-visible">
                        <div className="flex-1 space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quelle (Datei)</label>
                          <SearchableSelect options={serialOptions} value={job.oldSN} onChange={val => setPatchJobs(patchJobs.map(j => j.id === job.id ? {...j, oldSN: val} : j))} />
                        </div>
                        <ArrowRight size={24} className="text-slate-700 mt-6" />
                        <div className="flex-1 space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ersatz (Neu)</label>
                          <input 
                            type="text" 
                            value={job.newSN} 
                            onChange={e => setPatchJobs(patchJobs.map(j => j.id === job.id ? {...j, newSN: e.target.value.toUpperCase()} : j))} 
                            className="w-full bg-black/60 border border-slate-800 rounded-xl px-6 py-4 text-white font-mono outline-none focus:border-blue-500 transition-all" 
                            placeholder="SN..." 
                          />
                        </div>
                        <button onClick={() => setPatchJobs(patchJobs.filter(j => j.id !== job.id))} className="mt-6 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setDhJobs([...dhJobs, { id: Date.now(), sourceSN: '', targetSN: '' }])} 
                      className="w-full py-6 bg-slate-900/50 border border-slate-700 text-blue-400 font-black rounded-2xl uppercase tracking-[0.3em] hover:brightness-125 transition-all shadow-xl">
                      + DH-Transfer hinzufügen
                    </button>
                    {dhJobs.map((job) => (
                      <div key={job.id} className="bg-black/40 p-8 rounded-3xl border border-white/5 flex items-center gap-10 relative overflow-visible">
                        <div className="flex-1 space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quelle (Kalibrierung)</label>
                          <SearchableSelect options={serialOptions} value={job.sourceSN} onChange={val => setDhJobs(dhJobs.map(j => j.id === job.id ? {...j, sourceSN: val} : j))} />
                        </div>
                        <Zap size={24} className="text-blue-500 mt-6 opacity-40" />
                        <div className="flex-1 space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ziel (Übernahme)</label>
                          <SearchableSelect options={serialOptions} value={job.targetSN} onChange={val => setDhJobs(dhJobs.map(j => j.id === job.id ? {...j, targetSN: val} : j))} />
                        </div>
                        <button onClick={() => setDhJobs(dhJobs.filter(j => j.id !== job.id))} className="mt-6 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-12">
              <div className="glass-card p-14 text-center space-y-12 flex flex-col justify-between min-h-[500px]">
                <div className="space-y-10">
                  <div className="w-24 h-24 mx-auto rounded-full bg-black/60 flex items-center justify-center border-2 border-blue-500/20 shadow-inner">
                    <Settings size={48} className={`text-blue-400 ${!isDone && 'animate-spin'}`} style={{ animationDuration: '8s' }} />
                  </div>
                  <h4 className="text-3xl font-black text-white uppercase tracking-widest">{isDone ? 'READY' : 'STANDBY'}</h4>
                  <p className="text-[12px] text-slate-500 truncate border-y border-white/10 py-6 tracking-[0.2em]">{file.name}</p>
                </div>
                {!isDone ? (
                  <button onClick={applyConfig} className="w-full py-10 rounded-2xl led-button text-base tracking-[0.4em]">CONFIG ANWENDEN</button>
                ) : (
                  <div className="space-y-10">
                    <div className="bg-emerald-500/10 border border-emerald-500/40 p-8 rounded-2xl text-[11px] text-emerald-400 font-bold uppercase tracking-widest">PATCH ERFOLGREICH</div>
                    <a href={dlUrl!} download={file.name.replace('.map', '_config.map')} className="flex items-center justify-center w-full py-10 bg-white text-black font-black rounded-2xl uppercase shadow-2xl tracking-[0.5em] hover:scale-105 transition-all"><Download className="mr-4" size={28}/> DOWNLOAD</a>
                  </div>
                )}
                <button onClick={() => {setFile(null); setIsDone(false); setDlUrl(null);}} className="text-slate-600 text-[11px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">Datei wechseln</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};