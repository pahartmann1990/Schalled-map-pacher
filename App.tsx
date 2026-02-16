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
  LayoutTemplate
} from 'lucide-react';
import { SerialMatch } from './types';

// Specific attributes related to Daylight Calibration and PMU settings
const CALIBRATION_KEYS = [
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

    // Scan PMUs
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

    // Scan Generics
    const genericSnRegex = /sn="([^"]+)"/g;
    while ((match = genericSnRegex.exec(fileContent)) !== null) {
      const sn = match[1];
      if (!snMap.has(sn)) {
        snMap.set(sn, { 
          value: sn, 
          count: 1, 
          isPmu: false, 
          attributes: {} 
        });
      } else {
        // If not isPmu, increment count here?
        // Simpler: Just rely on PMU scan for PMUs, and this for others.
        // We need accurate total counts.
        // Let's just trust our map construction logic.
        // If it was found in PMU loop, it's counted there.
        // If not, we add it here.
        // Wait, PMU regex iterates matches. Generic regex iterates matches.
        // If a PMU has SN, it matches BOTH regexes.
        // To be safe, we re-count everything using generic regex for the 'count' property
        // but keep the 'isPmu' property from the first pass.
      }
    }

    // Final accurate count pass
    const finalMap = new Map<string, SerialMatch>();
    // First fill meta from PMU scan
    for (const [key, val] of snMap.entries()) {
      if (val.isPmu) {
        val.count = 0; // Reset for counting
        finalMap.set(key, val);
      }
    }
    // Then count all text occurrences
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

    // Initialize Defaults
    if (sorted.length > 0) {
      setPatchOldSN(sorted[0].value);
      setPatchLimit(sorted[0].count);
      if (sorted[0].networkId) setTargetNetworkId(sorted[0].networkId);
    }
  }, [fileContent]);

  // Update Limit/Network when patch target changes
  useEffect(() => {
    const match = extractedSNs.find(s => s.value === patchOldSN);
    if (match) {
      setPatchLimit(match.count);
      if (match.networkId) setTargetNetworkId(match.networkId);
    }
  }, [patchOldSN, extractedSNs]);

  // Reset logic
  const handleFileLoaded = (name: string, content: string) => {
    setFileName(name);
    setFileContent(content);
    setIsProcessed(false);
    setDownloadUrl(null);
    setPatchNewSN('');
    setCloneTargetSN('');
    setCloneSourceSN('');
    setUpdateNetwork(false);
  };

  const resetApp = () => {
    setFileName(null);
    setFileContent(null);
    setExtractedSNs([]);
    setPatchOldSN('');
    setPatchNewSN('');
    setIsProcessed(false);
    setDownloadUrl(null);
  };

  // --- CORE PROCESSOR ---
  const executeProcess = () => {
    if (!fileContent) return;

    let modifiedContent = fileContent;
    let processedCount = 0;

    // --- MODE 1: PATCH (Serial Replacement + Optional Clone) ---
    if (mode === 'patch') {
      if (!patchOldSN || !patchNewSN) return;
      
      const targetLimit = patchLimit;
      
      // Prepare Clone Data if active
      let cloneAttrs: Record<string, string> = {};
      if (patchUseClone && patchCloneSource) {
        const source = extractedSNs.find(s => s.value === patchCloneSource);
        if (source) {
          CALIBRATION_KEYS.forEach(key => {
            if (source.attributes[key]) cloneAttrs[key] = source.attributes[key];
          });
        }
      }

      // Process PMUs
      modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === patchOldSN && processedCount < targetLimit) {
          processedCount++;
          
          const newAttrs = { ...attrs };
          
          // 1. Apply Calibration Clone
          if (patchUseClone) Object.assign(newAttrs, cloneAttrs);
          
          // 2. Update Network
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;
          
          // 3. Update SN
          newAttrs['sn'] = patchNewSN;
          if (newAttrs['name'] && newAttrs['name'].includes(patchOldSN)) {
             newAttrs['name'] = newAttrs['name'].replace(patchOldSN, patchNewSN);
          }
          
          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });

      // Cleanup remaining generic SNs if limit allows
      if (processedCount < targetLimit) {
         modifiedContent = modifiedContent.replace(new RegExp(`sn="${patchOldSN}"`, 'g'), (match) => {
           if (processedCount < targetLimit) {
             processedCount++;
             return `sn="${patchNewSN}"`;
           }
           return match;
         });
      }
    }

    // --- MODE 2: CLONE (Calibration Transfer Only) ---
    if (mode === 'clone') {
       if (!cloneSourceSN || !cloneTargetSN) return;
       
       // Get Source Data
       const source = extractedSNs.find(s => s.value === cloneSourceSN);
       if (!source) return;
       
       const calibrationData: Record<string, string> = {};
       CALIBRATION_KEYS.forEach(key => {
         if (source.attributes[key]) calibrationData[key] = source.attributes[key];
       });

       // Find Target and Replace attributes
       modifiedContent = modifiedContent.replace(/<PMU\s+([^>]+)>/g, (fullMatch, contentStr) => {
        const attrs = parseAttributes(contentStr);
        if (attrs['sn'] === cloneTargetSN) {
          processedCount++;
          
          const newAttrs = { ...attrs };
          
          // 1. Apply Calibration
          Object.assign(newAttrs, calibrationData);

          // 2. Update Network (If selected in options)
          if (updateNetwork) newAttrs['networkid'] = targetNetworkId;

          return reconstructPMUTag(fullMatch, newAttrs);
        }
        return fullMatch;
      });
    }

    // Generate File
    const blob = new Blob([modifiedContent], { type: 'text/xml' });
    setDownloadUrl(URL.createObjectURL(blob));
    setIsProcessed(true);
  };

  const patchMatch = extractedSNs.find(s => s.value === patchOldSN);
  const maxLimit = patchMatch?.count || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Commissioner Patcher</h1>
              <p className="text-slate-400 text-sm">Map Configuration & Calibration Tool</p>
            </div>
          </div>
          {fileName && (
            <button 
              onClick={resetApp}
              className="mt-4 md:mt-0 flex items-center px-4 py-2 text-sm font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:border-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New File
            </button>
          )}
        </header>

        {/* Upload */}
        {!fileContent && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <DropZone onFileLoaded={handleFileLoaded} />
          </section>
        )}

        {/* Main Interface */}
        {fileContent && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Mode Switcher */}
            <div className="flex justify-center pb-2">
               <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex">
                  <button
                    onClick={() => { setMode('patch'); setIsProcessed(false); }}
                    className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'patch' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Serial Replacer
                  </button>
                  <button
                    onClick={() => { setMode('clone'); setIsProcessed(false); }}
                    className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'clone' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Calibration Transfer
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* --- LEFT COLUMN: INPUTS --- */}
              <div className="space-y-6">
                 
                 {/* Mode 1: PATCH Inputs */}
                 {mode === 'patch' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5">
                          <ArrowRightLeft className="w-24 h-24" />
                       </div>
                       
                       <div>
                          <SearchableSelect
                            label="1. Target (Old Serial)"
                            options={extractedSNs}
                            value={patchOldSN}
                            onChange={(val) => { setPatchOldSN(val); setIsProcessed(false); }}
                            placeholder="Select SN to replace..."
                          />
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-500 uppercase">Limit</label>
                                <span className="text-xs text-indigo-400">{patchLimit} / {maxLimit}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max={maxLimit}
                              value={patchLimit}
                              onChange={(e) => { setPatchLimit(Number(e.target.value)); setIsProcessed(false); }}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                       </div>

                       <div>
                          <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                             2. New Serial
                          </label>
                          <input
                            type="text"
                            value={patchNewSN}
                            onChange={(e) => { setPatchNewSN(e.target.value); setIsProcessed(false); }}
                            placeholder="e.g. 050012AB"
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                          />
                       </div>

                       {/* Optional Clone in Patch Mode */}
                       <div className="pt-4 border-t border-slate-800">
                          <div className="flex items-center space-x-2 mb-3">
                             <input 
                               type="checkbox" 
                               id="patchClone"
                               checked={patchUseClone}
                               onChange={(e) => { setPatchUseClone(e.target.checked); setIsProcessed(false); }}
                               className="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-offset-slate-900"
                             />
                             <label htmlFor="patchClone" className="text-sm text-slate-300">Copy calibration from another light?</label>
                          </div>
                          {patchUseClone && (
                            <SearchableSelect
                              options={extractedSNs.filter(s => s.value !== patchOldSN)}
                              value={patchCloneSource}
                              onChange={(val) => { setPatchCloneSource(val); setIsProcessed(false); }}
                              placeholder="Select Source Light..."
                            />
                          )}
                       </div>
                    </div>
                 )}

                 {/* Mode 2: CLONE Inputs */}
                 {mode === 'clone' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Copy className="w-24 h-24" />
                       </div>
                       
                       <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start space-x-3">
                          <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-emerald-200/80">
                            Transferring Daylight settings (gain, targets, hysteresis) only. Identity fields (SN, UUID) will remain unchanged.
                          </p>
                       </div>

                       <div className="space-y-4">
                          <SearchableSelect
                            label="1. Source Light (From)"
                            options={extractedSNs}
                            value={cloneSourceSN}
                            onChange={(val) => { setCloneSourceSN(val); setIsProcessed(false); }}
                            placeholder="Copy data from..."
                          />
                          
                          <div className="flex justify-center text-slate-600">
                             <ArrowRightLeft className="w-5 h-5 rotate-90" />
                          </div>

                          <SearchableSelect
                            label="2. Target Light (To)"
                            options={extractedSNs.filter(s => s.value !== cloneSourceSN)}
                            value={cloneTargetSN}
                            onChange={(val) => { setCloneTargetSN(val); setIsProcessed(false); }}
                            placeholder="Paste data to..."
                          />
                       </div>
                    </div>
                 )}
              </div>

              {/* --- RIGHT COLUMN: COMMON OPTIONS & ACTIONS --- */}
              <div className="space-y-6 flex flex-col h-full">
                
                {/* Network Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <LayoutTemplate className="w-5 h-5" />
                        <h3 className="font-semibold text-white">Network Settings</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="netUpdate"
                          checked={updateNetwork}
                          onChange={(e) => { setUpdateNetwork(e.target.checked); setIsProcessed(false); }}
                          className="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-offset-slate-900"
                        />
                        <label htmlFor="netUpdate" className="text-sm text-slate-300">Update ID</label>
                      </div>
                   </div>
                   
                   <div className={`transition-opacity duration-200 ${updateNetwork ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <NetworkSelector 
                        value={targetNetworkId} 
                        onChange={(val) => { setTargetNetworkId(val); setIsProcessed(false); }} 
                      />
                   </div>
                </div>

                {/* File Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-grow">
                   <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">File Status</h3>
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                         <span className="text-slate-500">Name:</span>
                         <span className="text-slate-300 font-medium truncate max-w-[200px]">{fileName}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-slate-500">Size:</span>
                         <span className="text-slate-300 font-mono">{(fileContent.length / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-slate-500">Unique IDs:</span>
                         <span className="text-slate-300 font-mono">{extractedSNs.length}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-2"></div>
                      <div className="flex items-center text-xs text-slate-500">
                        {mode === 'patch' && "Ready to rename serials."}
                        {mode === 'clone' && "Ready to transfer calibration."}
                      </div>
                   </div>
                </div>

                {/* Execute Button */}
                <button
                  onClick={executeProcess}
                  disabled={mode === 'patch' ? (!patchOldSN || !patchNewSN) : (!cloneSourceSN || !cloneTargetSN)}
                  className={`
                    w-full py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center shadow-lg
                    ${isProcessed 
                      ? 'bg-emerald-600 text-white cursor-default shadow-emerald-900/20'
                      : (mode === 'patch' && (!patchOldSN || !patchNewSN)) || (mode === 'clone' && (!cloneSourceSN || !cloneTargetSN))
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : mode === 'patch' 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}
                  `}
                >
                  {isProcessed ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      Processed
                    </>
                  ) : (
                    <>
                      {mode === 'patch' ? 'Patch File' : 'Transfer Data'}
                    </>
                  )}
                </button>

                {/* Download Link */}
                {isProcessed && downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={fileName?.replace('.map', `_${mode === 'patch' ? 'patched' : 'calibrated'}.map`) || 'output.map'}
                    className="flex items-center justify-center w-full px-6 py-3 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-xl transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Result
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