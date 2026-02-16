import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { SearchableSelect } from './components/SearchableSelect';
import { NetworkSelector } from './components/NetworkSelector';
import { 
  ArrowRightLeft, 
  Download, 
  RefreshCw, 
  CheckCircle2,
  Cpu,
  Zap,
  LayoutTemplate,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';
import { SerialMatch } from './types';

// Critical Daylight / GH Calibration Keys
const CALIBRATION_KEYS = [
  'flags',
  'map_daylight',
  'map_amb_env_gain', 'amb_env_gain',
  'amb_act_lev', 'map_amb_act_lev',
  'amb_inact_lev', 'map_amb_inact_lev',
  'dh_active_target_level', 'map_dh_active_target_level',
  'dh_inactive_target_level', 'map_dh_inactive_target_level',
  'dh_amb_0', 'dh_amb_1', 'dh_amb_100',
  'amb_on_hyst', 'map_amb_on_hyst',
  'amb_off_hyst', 'map_amb_off_hyst',
  'dh_meter_1', 'dh_meter_100', 'dh_meter_units',
  'min_dim', 'mindim', 'rampUpSpeed', 'rampDownSpeed'
];

const parseAttributes = (tagStr: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9_]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(tagStr)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};

const reconstructTag = (originalTag: string, newAttributes: Record<string, string>) => {
  let newTag = originalTag;
  Object.entries(newAttributes).forEach(([key, value]) => {
    const regex = new RegExp(`(${key})="([^"]*)"`);
    if (regex.test(newTag)) {
      newTag = newTag.replace(regex, `$1="${value}"`);
    } else {
      if (newTag.endsWith('/>')) {
        newTag = newTag.slice(0, -2) + ` ${key}="${value}"` + '/>';
      } else if (newTag.endsWith('>')) {
        newTag = newTag.slice(0, -1) + ` ${key}="${value}"` + '>';
      }
    }
  });
  return newTag;
};

export default function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [extractedSNs, setExtractedSNs] = useState<SerialMatch[]>([]);
  const [mode, setMode] = useState<'patch' | 'clone'>('patch');

  // Patch Mode States
  const [oldSN, setOldSN] = useState('');
  const [newSN, setNewSN] = useState('');
  
  // Clone Mode States
  const [sourceSN, setSourceSN] = useState('');
  const [targetSN, setTargetSN] = useState('');
  
  // Network Settings
  const [updateNet, setUpdateNet] = useState(false);
  const [netId, setNetId] = useState('A01');

  // Results
  const [isDone, setIsDone] = useState(false);
  const [dlUrl, setDlUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileContent) return;
    const pmuRegex = /<PMU\s+([^>]+)>/g;
    const snMap = new Map<string, SerialMatch>();
    let match;
    while ((match = pmuRegex.exec(fileContent)) !== null) {
      const attrs = parseAttributes(match[1]);
      if (attrs.sn) {
        const existing = snMap.get(attrs.sn) || { value: attrs.sn, count: 0, isPmu: true, networkId: attrs.networkid, attributes: attrs };
        existing.count++;
        existing.attributes = attrs; 
        snMap.set(attrs.sn, existing);
      }
    }
    const finalMap = new Map<string, SerialMatch>();
    for (const [key, val] of snMap.entries()) finalMap.set(key, { ...val, count: 0 });
    const countScan = /sn="([^"]+)"/g;
    while ((match = countScan.exec(fileContent)) !== null) {
      const val = match[1];
      if (!finalMap.has(val)) finalMap.set(val, { value: val, count: 0, isPmu: false, attributes: {} });
      finalMap.get(val)!.count++;
    }
    const sorted = Array.from(finalMap.values()).sort((a, b) => b.count - a.count);
    setExtractedSNs(sorted);
    if (sorted.length > 0) setOldSN(sorted[0].value);
  }, [fileContent]);

  const runProcess = () => {
    if (!fileContent) return;
    let result = fileContent;

    if (mode === 'patch') {
      result = result.replace(/<PMU\s+([^>]+)>/g, (tag, content) => {
        const attrs = parseAttributes(content);
        if (attrs['sn'] === oldSN) {
          const updated = { ...attrs, sn: newSN };
          if (updateNet) updated['networkid'] = netId;
          if (updated['name']?.includes(oldSN)) updated['name'] = updated['name'].replace(oldSN, newSN);
          return reconstructTag(tag, updated);
        }
        return tag;
      });
      result = result.replace(new RegExp(`sn="${oldSN}"`, 'g'), `sn="${newSN}"`);
    } else {
      const source = extractedSNs.find(s => s.value === sourceSN);
      if (!source) return;
      const data: Record<string, string> = {};
      CALIBRATION_KEYS.forEach(k => { if (source.attributes[k]) data[k] = source.attributes[k]; });
      
      result = result.replace(/<PMU\s+([^>]+)>/g, (tag, content) => {
        const attrs = parseAttributes(content);
        if (attrs['sn'] === targetSN) {
          const updated = { ...attrs, ...data };
          if (updateNet) updated['networkid'] = netId;
          return reconstructTag(tag, updated);
        }
        return tag;
      });
    }

    const blob = new Blob([result], { type: 'text/plain' });
    setDlUrl(URL.createObjectURL(blob));
    setIsDone(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-8 gap-4">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/10"><Cpu className="w-8 h-8 text-white" /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">MAP PATCHER</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Calibration & ID Switcher</p>
            </div>
          </div>
          {fileContent && (
            <button onClick={() => { setFileContent(null); setIsDone(false); }} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-black tracking-widest transition-all">NEUE DATEI</button>
          )}
        </header>

        {!fileContent ? (
          <DropZone onFileLoaded={(name, content) => { setFileName(name); setFileContent(content); setIsDone(false); }} />
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-center">
              <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex shadow-2xl backdrop-blur">
                <button onClick={() => { setMode('patch'); setIsDone(false); }} className={`px-10 py-3.5 rounded-xl text-xs font-black transition-all tracking-widest ${mode === 'patch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>ID ÄNDERN</button>
                <button onClick={() => { setMode('clone'); setIsDone(false); }} className={`px-10 py-3.5 rounded-xl text-xs font-black transition-all tracking-widest ${mode === 'clone' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>GH TRANSFER</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {mode === 'patch' ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-inner">
                    <h3 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] flex items-center"><Info className="w-4 h-4 mr-3" />Ziel-Gerät</h3>
                    <SearchableSelect label="Alte Seriennummer" options={extractedSNs} value={oldSN} onChange={v => { setOldSN(v); setIsDone(false); }} />
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Neue Seriennummer</label>
                      <input type="text" value={newSN} onChange={e => { setNewSN(e.target.value); setIsDone(false); }} className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl px-6 py-5 font-mono text-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-lg" placeholder="Z.B. 0201ABCD" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-inner">
                    <h3 className="font-black text-emerald-400 uppercase tracking-widest text-[10px] flex items-center"><Zap className="w-4 h-4 mr-3" />GH Transfer Fenster</h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">1. QUELLE (Von diesem Licht lesen)</label>
                          <SearchableSelect options={extractedSNs.filter(s => s.isPmu)} value={sourceSN} onChange={v => { setSourceSN(v); setIsDone(false); }} placeholder="Quelle wählen..." />
                       </div>
                       <div className="flex justify-center items-center py-4"><ArrowRight className="w-8 h-8 text-slate-800 rotate-90" /></div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">2. ZIEL (Auf dieses Licht schreiben)</label>
                          <SearchableSelect options={extractedSNs.filter(s => s.isPmu && s.value !== sourceSN)} value={targetSN} onChange={v => { setTargetSN(v); setIsDone(false); }} placeholder="Ziel wählen..." />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-6 shadow-inner">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] flex items-center"><LayoutTemplate className="w-4 h-4 mr-3" />Netzwerk Optionen</h3>
                    <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                       <span className="text-[10px] font-black text-slate-500 uppercase">Aktiv</span>
                       <input type="checkbox" checked={updateNet} onChange={e => { setUpdateNet(e.target.checked); setIsDone(false); }} className="w-6 h-6 rounded-lg border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className={`transition-all duration-500 ${updateNet ? 'opacity-100 scale-100' : 'opacity-20 scale-95 grayscale pointer-events-none'}`}>
                    <NetworkSelector value={netId} onChange={v => { setNetId(v); setIsDone(false); }} />
                  </div>
                </div>

                <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-8 space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2"><span>DATEI:</span><span className="text-slate-300 truncate max-w-[150px]">{fileName}</span></div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2"><span>MODUS:</span><span className={mode === 'patch' ? 'text-indigo-400' : 'text-emerald-400'}>{mode === 'patch' ? 'Serial Replace' : 'GH Clone'}</span></div>
                  {updateNet && <div className="flex justify-between"><span>NET ID:</span><span className="text-amber-400 font-mono text-xs">{netId}</span></div>}
                </div>

                <button 
                  onClick={runProcess} 
                  disabled={isDone || (mode === 'patch' ? !newSN : !targetSN)} 
                  className={`w-full py-6 rounded-[2rem] font-black text-xs tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center ${isDone ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:scale-[1.03] active:scale-[0.97] disabled:opacity-10'}`}
                >
                  {isDone ? <><CheckCircle2 className="w-6 h-6 mr-3" /> FERTIG</> : mode === 'patch' ? 'PATCH MAP FILE' : 'GH TRANSFER AUSFÜHREN'}
                </button>

                {isDone && dlUrl && (
                  <a href={dlUrl} download={fileName?.replace('.map', `_${mode === 'patch' ? 'patch' : 'gh_copy'}.map`)} className="flex items-center justify-center w-full px-6 py-6 bg-emerald-500 text-black font-black text-xs tracking-widest rounded-[2rem] transition-all hover:bg-emerald-400 animate-bounce shadow-xl shadow-emerald-500/20">
                    <Download className="w-5 h-5 mr-3" /> DATEI HERUNTERLADEN
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}