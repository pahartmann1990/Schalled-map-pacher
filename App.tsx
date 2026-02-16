import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { SearchableSelect } from './components/SearchableSelect';
import { NetworkSelector } from './components/NetworkSelector';
import { 
  FileCode, 
  ArrowRightLeft, 
  Download, 
  RefreshCw, 
  CheckCircle2,
  Cpu,
  Settings2,
  Copy,
  Zap,
  LayoutTemplate,
  ChevronRight,
  Info
} from 'lucide-react';
import { SerialMatch } from './types';

// Strict mapping of Daylight/GH Calibration parameters
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

const reconstructPMUTag = (originalTag: string, newAttributes: Record<string, string>) => {
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

  // Mode States
  const [targetOldSN, setTargetOldSN] = useState<string>('');
  const [targetNewSN, setTargetNewSN] = useState<string>('');
  const [patchLimit, setPatchLimit] = useState<number>(1);
  const [sourceCloneSN, setSourceCloneSN] = useState<string>('');
  const [targetCloneSN, setTargetCloneSN] = useState<string>('');
  
  // Options
  const [updateNetwork, setUpdateNetwork] = useState<boolean>(false);
  const [targetNetworkId, setTargetNetworkId] = useState<string>('A01');

  // Process State
  const [isProcessed, setIsProcessed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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
    if (sorted.length > 0) {
      setTargetOldSN(sorted[0].value);
      setPatchLimit(sorted[0].count);
    }
  }, [fileContent]);

  const executeProcess = () => {
    if (!fileContent) return;
    let modifiedContent = fileContent;
    let processedCount = 0;

    if (mode === 'patch') {
      const targetLimit = patchLimit;
      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === targetOldSN && processedCount < targetLimit) {
          processedCount++;
          const newAttrs = { ...attrs, sn: targetNewSN };
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          if (newAttrs['name']?.includes(targetOldSN)) newAttrs['name'] = newAttrs['name'].replace(targetOldSN, targetNewSN);
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });
      if (processedCount < targetLimit) {
        modifiedContent = modifiedContent.replace(new RegExp(`sn="${targetOldSN}"`, 'g'), (match) => {
          if (processedCount < targetLimit) { processedCount++; return `sn="${targetNewSN}"`; }
          return match;
        });
      }
    } else {
      const source = extractedSNs.find(s => s.value === sourceCloneSN);
      if (!source) return;
      const data = {};
      CALIBRATION_KEYS.forEach(k => { if (source.attributes[k]) data[k] = source.attributes[k]; });
      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === targetCloneSN) {
          processedCount++;
          const newAttrs = { ...attrs, ...data };
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });
    }

    const blob = new Blob([modifiedContent], { type: 'text/xml' });
    setDownloadUrl(URL.createObjectURL(blob));
    setIsProcessed(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"><Cpu className="w-8 h-8" /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Commissioner Patcher v2</h1>
              <p className="text-slate-400 text-sm">Calibration & Serial ID Management</p>
            </div>
          </div>
          {fileContent && (
            <button onClick={() => { setFileContent(null); setIsProcessed(false); }} className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" /> NEW FILE
            </button>
          )}
        </header>

        {!fileContent ? (
          <DropZone onFileLoaded={(name, content) => { setFileName(name); setFileContent(content); setIsProcessed(false); }} />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex justify-center">
              <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex shadow-2xl">
                <button onClick={() => { setMode('patch'); setIsProcessed(false); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'patch' ? 'bg-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>RENAME ID</button>
                <button onClick={() => { setMode('clone'); setIsProcessed(false); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'clone' ? 'bg-emerald-600 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>TRANSFER GH</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {mode === 'patch' ? (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                    <h3 className="font-bold text-indigo-400 flex items-center uppercase tracking-widest text-xs"><Info className="w-4 h-4 mr-2" /> Target Settings</h3>
                    <SearchableSelect label="Old Serial Number" options={extractedSNs} value={targetOldSN} onChange={(v) => { setTargetOldSN(v); setIsProcessed(false); }} />
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">New Serial Number</label>
                      <input type="text" value={targetNewSN} onChange={e => { setTargetNewSN(e.target.value); setIsProcessed(false); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0203ABCD..." />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <h3 className="font-bold text-emerald-400 flex items-center uppercase tracking-widest text-xs"><Zap className="w-4 h-4 mr-2" /> Calibration Windows</h3>
                    <div className="space-y-2">
                       <SearchableSelect label="SOURCE (From)" options={extractedSNs.filter(s => s.isPmu)} value={sourceCloneSN} onChange={v => { setSourceCloneSN(v); setIsProcessed(false); }} placeholder="Select data origin..." />
                       <div className="flex justify-center"><ChevronRight className="w-6 h-6 rotate-90 text-slate-700" /></div>
                       <SearchableSelect label="TARGET (To)" options={extractedSNs.filter(s => s.isPmu && s.value !== sourceCloneSN)} value={targetCloneSN} onChange={v => { setTargetCloneSN(v); setIsProcessed(false); }} placeholder="Select destination..." />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-indigo-400 flex items-center uppercase tracking-widest text-xs"><LayoutTemplate className="w-4 h-4 mr-2" /> Network Configuration</h3>
                    <input type="checkbox" checked={updateNetwork} onChange={e => { setUpdateNetwork(e.target.checked); setIsProcessed(false); }} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600" />
                  </div>
                  <div className={`transition-all duration-300 ${updateNetwork ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                    <NetworkSelector value={targetNetworkId} onChange={v => { setTargetNetworkId(v); setIsProcessed(false); }} />
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Execution Summary</h4>
                  <div className="space-y-2 font-mono">
                    {mode === 'patch' ? (
                      <div className="flex justify-between"><span>Replace:</span><span className="text-indigo-400">{targetOldSN || '?'}</span></div>
                    ) : (
                      <div className="flex justify-between"><span>Copy GH:</span><span className="text-emerald-400">{sourceCloneSN.slice(-4) || '??'} → {targetCloneSN.slice(-4) || '??'}</span></div>
                    )}
                    {updateNetwork && <div className="flex justify-between"><span>Network:</span><span className="text-amber-400">{targetNetworkId}</span></div>}
                  </div>
                </div>

                <button 
                  onClick={executeProcess} 
                  disabled={isProcessed || (mode === 'patch' ? !targetNewSN : !targetCloneSN)} 
                  className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center ${isProcessed ? 'bg-emerald-600' : 'bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50'}`}
                >
                  {isProcessed ? <><CheckCircle2 className="w-6 h-6 mr-2" /> DONE</> : mode === 'patch' ? 'PATCH SERIAL' : 'TRANSFER CALIBRATION'}
                </button>

                {isProcessed && downloadUrl && (
                  <a href={downloadUrl} download={fileName?.replace('.map', `_${mode === 'patch' ? 'renamed' : 'gh_copy'}.map`)} className="flex items-center justify-center w-full px-6 py-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-2xl transition-all animate-bounce">
                    <Download className="w-6 h-6 mr-3" /> DOWNLOAD .MAP
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