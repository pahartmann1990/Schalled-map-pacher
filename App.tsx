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
  Copy,
  Zap,
  LayoutTemplate,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';
import { SerialMatch } from './types';

// Parameters specifically for Daylight Calibration Transfer
const GH_CALIBRATION_KEYS = [
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
  const [sourceCloneSN, setSourceCloneSN] = useState<string>('');
  const [targetCloneSN, setTargetCloneSN] = useState<string>('');
  
  // Network Options
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
    if (sorted.length > 0) setTargetOldSN(sorted[0].value);
  }, [fileContent]);

  const executeProcess = () => {
    if (!fileContent) return;
    let modifiedContent = fileContent;

    if (mode === 'patch') {
      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === targetOldSN) {
          const newAttrs = { ...attrs, sn: targetNewSN };
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          if (newAttrs['name']?.includes(targetOldSN)) newAttrs['name'] = newAttrs['name'].replace(targetOldSN, targetNewSN);
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });
      modifiedContent = modifiedContent.replace(new RegExp(`sn="${targetOldSN}"`, 'g'), `sn="${targetNewSN}"`);
    } else {
      const source = extractedSNs.find(s => s.value === sourceCloneSN);
      if (!source) return;
      const data = {};
      GH_CALIBRATION_KEYS.forEach(k => { if (source.attributes[k]) data[k] = source.attributes[k]; });
      
      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === targetCloneSN) {
          const newAttrs = { ...attrs, ...data };
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });
    }

    const blob = new Blob([modifiedContent], { type: 'text/plain' });
    setDownloadUrl(URL.createObjectURL(blob));
    setIsProcessed(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20"><Cpu className="w-8 h-8 text-white" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">MAP PATCHER</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Daylight Calibration Transfer</p>
            </div>
          </div>
          {fileContent && (
            <button onClick={() => { setFileContent(null); setIsProcessed(false); }} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold transition-all">NEW FILE</button>
          )}
        </header>

        {!fileContent ? (
          <DropZone onFileLoaded={(name, content) => { setFileName(name); setFileContent(content); setIsProcessed(false); }} />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center">
              <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 flex shadow-2xl">
                <button onClick={() => { setMode('patch'); setIsProcessed(false); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all tracking-widest ${mode === 'patch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>REPLACE SN</button>
                <button onClick={() => { setMode('clone'); setIsProcessed(false); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all tracking-widest ${mode === 'clone' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>TRANSFER GH</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {mode === 'patch' ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
                    <h3 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] flex items-center"><Info className="w-4 h-4 mr-2" /> Target Device</h3>
                    <SearchableSelect label="OLD SERIAL (Reference)" options={extractedSNs} value={targetOldSN} onChange={v => { setTargetOldSN(v); setIsProcessed(false); }} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">New Serial Number</label>
                      <input type="text" value={targetNewSN} onChange={e => { setTargetNewSN(e.target.value); setIsProcessed(false); }} className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl px-5 py-4 font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="ABCD1234..." />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8 backdrop-blur-sm">
                    <h3 className="font-black text-emerald-400 uppercase tracking-widest text-[10px] flex items-center"><Zap className="w-4 h-4 mr-2" /> GH Transfer Windows</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. SOURCE (From: Read GH values)</label>
                          <SearchableSelect options={extractedSNs.filter(s => s.isPmu)} value={sourceCloneSN} onChange={v => { setSourceCloneSN(v); setIsProcessed(false); }} placeholder="Select source device..." />
                       </div>
                       <div className="flex justify-center items-center py-2"><ArrowRight className="w-6 h-6 text-slate-700 rotate-90" /></div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. TARGET (To: Overwrite GH values)</label>
                          <SearchableSelect options={extractedSNs.filter(s => s.isPmu && s.value !== sourceCloneSN)} value={targetCloneSN} onChange={v => { setTargetCloneSN(v); setIsProcessed(false); }} placeholder="Select target device..." />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] flex items-center"><LayoutTemplate className="w-4 h-4 mr-2" /> Network Options</h3>
                    <input type="checkbox" checked={updateNetwork} onChange={e => { setUpdateNetwork(e.target.checked); setIsProcessed(false); }} className="w-6 h-6 rounded-lg border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0" />
                  </div>
                  <div className={`transition-all duration-300 ${updateNetwork ? 'opacity-100 scale-100' : 'opacity-30 scale-95 grayscale pointer-events-none'}`}>
                    <NetworkSelector value={targetNetworkId} onChange={v => { setTargetNetworkId(v); setIsProcessed(false); }} />
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <div className="flex justify-between"><span>File:</span><span className="text-slate-300 truncate max-w-[120px]">{fileName}</span></div>
                  <div className="flex justify-between"><span>Mode:</span><span className={mode === 'patch' ? 'text-indigo-400' : 'text-emerald-400'}>{mode}</span></div>
                  {updateNetwork && <div className="flex justify-between"><span>NEW ID:</span><span className="text-amber-400 font-mono">{targetNetworkId}</span></div>}
                </div>

                <button 
                  onClick={executeProcess} 
                  disabled={isProcessed || (mode === 'patch' ? !targetNewSN : !targetCloneSN)} 
                  className={`w-full py-5 rounded-3xl font-black text-sm tracking-widest shadow-2xl transition-all flex items-center justify-center ${isProcessed ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20'}`}
                >
                  {isProcessed ? <><CheckCircle2 className="w-6 h-6 mr-3" /> SUCCESS</> : mode === 'patch' ? 'PATCH MAP FILE' : 'EXECUTE GH TRANSFER'}
                </button>

                {isProcessed && downloadUrl && (
                  <a href={downloadUrl} download={fileName?.replace('.map', `_${mode === 'patch' ? 'patched' : 'gh_copy'}.map`)} className="flex items-center justify-center w-full px-6 py-5 bg-emerald-500 text-black font-black text-xs tracking-widest rounded-3xl transition-all hover:bg-emerald-400 animate-in zoom-in-95">
                    <Download className="w-5 h-5 mr-3" /> DOWNLOAD UPDATED .MAP
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