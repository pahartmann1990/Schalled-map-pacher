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
  Search,
  Zap,
  LayoutTemplate,
  ChevronRight
} from 'lucide-react';
import { SerialMatch } from './types';

// Specific attributes related to Daylight Calibration and PMU settings
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
  'min_dim', 'mindim', 'mindelay', 'rampUpSpeed', 'rampDownSpeed'
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
  
  // App Mode
  const [mode, setMode] = useState<'patch' | 'clone'>('patch');

  // PATCH MODE STATES
  const [patchOldSN, setPatchOldSN] = useState<string>('');
  const [patchNewSN, setPatchNewSN] = useState<string>('');
  const [patchLimit, setPatchLimit] = useState<number>(1);
  const [patchCloneSource, setPatchCloneSource] = useState<string>('');
  const [patchUseClone, setPatchUseClone] = useState<boolean>(false);
  
  // CLONE MODE STATES
  const [cloneSourceSN, setCloneSourceSN] = useState<string>('');
  const [cloneTargetSN, setCloneTargetSN] = useState<string>('');

  // SHARED OPTIONS
  const [updateNetwork, setUpdateNetwork] = useState<boolean>(false);
  const [targetNetworkId, setTargetNetworkId] = useState<string>('A01');

  // RESULT STATE
  const [isProcessed, setIsProcessed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // 1. Analyze File
  useEffect(() => {
    if (!fileContent) return;

    const snMap = new Map<string, SerialMatch>();
    const pmuRegex = /<PMU\s+([^>]+)>/g;
    let match;
    while ((match = pmuRegex.exec(fileContent)) !== null) {
      const tagContent = match[1];
      const attrs = parseAttributes(tagContent);
      const sn = attrs['sn'];
      if (sn) {
        const existing = snMap.get(sn) || { 
          value: sn, 
          count: 0, 
          isPmu: true, 
          networkId: attrs['networkid'], 
          attributes: attrs 
        };
        existing.count++;
        existing.attributes = attrs; 
        snMap.set(sn, existing);
      }
    }

    const finalMap = new Map<string, SerialMatch>();
    for (const [key, val] of snMap.entries()) {
      if (val.isPmu) {
        val.count = 0; 
        finalMap.set(key, val);
      }
    }
    const countScan = /sn="([^"]+)"/g;
    while ((match = countScan.exec(fileContent)) !== null) {
      const val = match[1];
      if (!finalMap.has(val)) {
         finalMap.set(val, { value: val, count: 0, isPmu: false, attributes: {} });
      }
      finalMap.get(val)!.count++;
    }

    const sorted = Array.from(finalMap.values()).sort((a, b) => b.count - a.count);
    setExtractedSNs(sorted);

    if (sorted.length > 0) {
      setPatchOldSN(sorted[0].value);
      setPatchLimit(sorted[0].count);
      if (sorted[0].networkId) setTargetNetworkId(sorted[0].networkId);
    }
  }, [fileContent]);

  useEffect(() => {
    const match = extractedSNs.find(s => s.value === patchOldSN);
    if (match) {
      setPatchLimit(match.count);
      if (match.networkId) setTargetNetworkId(match.networkId);
    }
  }, [patchOldSN, extractedSNs]);

  // Handle clone target selection change to update default network
  useEffect(() => {
    const match = extractedSNs.find(s => s.value === cloneTargetSN);
    if (match && !updateNetwork) {
       if (match.networkId) setTargetNetworkId(match.networkId);
    }
  }, [cloneTargetSN, extractedSNs]);

  const handleFileLoaded = (name: string, content: string) => {
    setFileName(name);
    setFileContent(content);
    setIsProcessed(false);
    setDownloadUrl(null);
  };

  const resetApp = () => {
    setFileName(null);
    setFileContent(null);
    setExtractedSNs([]);
    setIsProcessed(false);
  };

  const executeProcess = () => {
    if (!fileContent) return;
    let modifiedContent = fileContent;
    let processedCount = 0;

    if (mode === 'patch') {
      if (!patchOldSN || !patchNewSN) return;
      const targetLimit = patchLimit;
      let cloneAttrs: Record<string, string> = {};
      if (patchUseClone && patchCloneSource) {
        const source = extractedSNs.find(s => s.value === patchCloneSource);
        if (source) {
          CALIBRATION_KEYS.forEach(key => { if (source.attributes[key]) cloneAttrs[key] = source.attributes[key]; });
        }
      }

      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === patchOldSN && processedCount < targetLimit) {
          processedCount++;
          const newAttrs = { ...attrs };
          if (patchUseClone) Object.assign(newAttrs, cloneAttrs);
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          newAttrs['sn'] = patchNewSN;
          if (newAttrs['name'] && newAttrs['name'].includes(patchOldSN)) {
             newAttrs['name'] = newAttrs['name'].replace(patchOldSN, patchNewSN);
          }
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });

      if (processedCount < targetLimit) {
         modifiedContent = modifiedContent.replace(new RegExp(`sn="${patchOldSN}"`, 'g'), (match) => {
           if (processedCount < targetLimit) { processedCount++; return `sn="${patchNewSN}"`; }
           return match;
         });
      }
    }

    if (mode === 'clone') {
       if (!cloneSourceSN || !cloneTargetSN) return;
       const source = extractedSNs.find(s => s.value === cloneSourceSN);
       if (!source) return;
       const calibrationData: Record<string, string> = {};
       CALIBRATION_KEYS.forEach(key => { if (source.attributes[key]) calibrationData[key] = source.attributes[key]; });

       modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === cloneTargetSN) {
          processedCount++;
          const newAttrs = { ...attrs };
          Object.assign(newAttrs, calibrationData);
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

  const patchMatch = extractedSNs.find(s => s.value === patchOldSN);
  const maxLimit = patchMatch?.count || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Commissioner Patcher</h1>
              <p className="text-slate-400 text-sm">Advanced Map Tool</p>
            </div>
          </div>
          {fileName && (
            <button onClick={resetApp} className="mt-4 md:mt-0 flex items-center px-4 py-2 text-sm font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              New File
            </button>
          )}
        </header>

        {!fileContent && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <DropZone onFileLoaded={handleFileLoaded} />
          </section>
        )}

        {fileContent && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            <div className="flex justify-center pb-2">
               <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex shadow-2xl">
                  <button onClick={() => { setMode('patch'); setIsProcessed(false); }} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'patch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Serial Replacer
                  </button>
                  <button onClick={() => { setMode('clone'); setIsProcessed(false); }} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'clone' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Copy className="w-4 h-4 mr-2" />
                    Calibration Transfer
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-6">
                 {mode === 'patch' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
                       <h3 className="text-lg font-bold flex items-center"><Search className="w-5 h-5 mr-2 text-indigo-400" /> 1. Replace Configuration</h3>
                       <SearchableSelect label="Target (Old Serial)" options={extractedSNs} value={patchOldSN} onChange={(val) => { setPatchOldSN(val); setIsProcessed(false); }} />
                       <div className="px-1">
                          <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Limit Replacements</span><span>{patchLimit} / {maxLimit}</span></div>
                          <input type="range" min="1" max={maxLimit} value={patchLimit} onChange={(e) => { setPatchLimit(Number(e.target.value)); setIsProcessed(false); }} className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500" />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">New Serial</label>
                          <input type="text" value={patchNewSN} onChange={(e) => { setPatchNewSN(e.target.value); setIsProcessed(false); }} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 050012AB" />
                       </div>
                    </div>
                 )}

                 {mode === 'clone' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
                       <h3 className="text-lg font-bold flex items-center"><Zap className="w-5 h-5 mr-2 text-emerald-400" /> 1. Transfer Windows</h3>
                       <div className="space-y-4">
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                            <SearchableSelect label="SOURCE LIGHT (From)" options={extractedSNs.filter(s => s.isPmu)} value={cloneSourceSN} onChange={(val) => { setCloneSourceSN(val); setIsProcessed(false); }} placeholder="Copy calibration from..." />
                          </div>
                          <div className="flex justify-center"><ChevronRight className="w-8 h-8 text-slate-700 rotate-90" /></div>
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                            <SearchableSelect label="TARGET LIGHT (To)" options={extractedSNs.filter(s => s.isPmu && s.value !== cloneSourceSN)} value={cloneTargetSN} onChange={(val) => { setCloneTargetSN(val); setIsProcessed(false); }} placeholder="Apply calibration to..." />
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center"><LayoutTemplate className="w-5 h-5 mr-2 text-indigo-400" /> Network Settings</h3>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="netUpdate" checked={updateNetwork} onChange={(e) => { setUpdateNetwork(e.target.checked); setIsProcessed(false); }} className="rounded bg-slate-800 border-slate-600 text-indigo-500" />
                        <label htmlFor="netUpdate" className="text-sm text-slate-300">Update ID</label>
                      </div>
                   </div>
                   <div className={`transition-all duration-300 ${updateNetwork ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <NetworkSelector value={targetNetworkId} onChange={(val) => { setTargetNetworkId(val); setIsProcessed(false); }} />
                   </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-grow shadow-xl">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Summary</h3>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Mode:</span><span className="text-white uppercase font-bold text-xs">{mode}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">File:</span><span className="text-slate-300 truncate max-w-[150px]">{fileName}</span></div>
                      {mode === 'patch' && patchNewSN && <div className="flex justify-between text-indigo-400"><span>New ID:</span><span className="font-mono">{patchNewSN}</span></div>}
                      {updateNetwork && <div className="flex justify-between text-indigo-400"><span>New Network:</span><span className="font-mono">{targetNetworkId}</span></div>}
                   </div>
                </div>

                <button onClick={executeProcess} disabled={mode === 'patch' ? (!patchOldSN || !patchNewSN) : (!cloneSourceSN || !cloneTargetSN)} className={`w-full py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center shadow-lg ${isProcessed ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 disabled:bg-slate-800 disabled:text-slate-600'}`}>
                  {isProcessed ? <><CheckCircle2 className="w-6 h-6 mr-2" /> Done</> : mode === 'patch' ? 'Patch Serial' : 'Transfer Calibration'}
                </button>

                {isProcessed && downloadUrl && (
                  <a href={downloadUrl} download={fileName?.replace('.map', `_${mode === 'patch' ? 'patched' : 'calibrated'}.map`) || 'output.map'} className="flex items-center justify-center w-full px-6 py-3 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-xl transition-all">
                    <Download className="w-5 h-5 mr-2" /> Download Result
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