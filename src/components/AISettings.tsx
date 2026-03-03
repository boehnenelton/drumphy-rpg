import React, { useState } from 'react';
import { AI_MODELS } from '../constants';
import { rotateKey, getCurrentKey } from '../utils/ai';

export function AISettings({ 
  selectedModel, 
  setSelectedModel, 
  contextFiles, 
  setContextFiles 
}: any) {
  const [keyPreview, setKeyPreview] = useState(getCurrentKey().substring(0, 10) + '...');

  const handleRotateKey = () => {
    const newKey = rotateKey();
    setKeyPreview(newKey.substring(0, 10) + '...');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files as Iterable<File>).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContextFiles((prev: any) => [
          ...prev, 
          { name: file.name, content: event.target?.result as string, enabled: true }
        ]);
      };
      reader.readAsText(file);
    });
  };

  const toggleFile = (index: number) => {
    setContextFiles((prev: any) => {
      const newFiles = [...prev];
      newFiles[index].enabled = !newFiles[index].enabled;
      return newFiles;
    });
  };

  const removeFile = (index: number) => {
    setContextFiles((prev: any) => prev.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <h2 className="text-xl font-black text-white uppercase tracking-tight border-b border-white/10 pb-4 mb-2">AI Configuration</h2>
      
      <div className="space-y-3">
        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest">Model Selection</label>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-[#111] text-white p-3 outline-none focus:ring-1 focus:ring-[#DE2626] appearance-none cursor-pointer"
        >
          {AI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest">API Key Pool</label>
        <div className="flex gap-2 items-stretch">
          <span className="text-sm bg-[#111] text-gray-400 p-3 flex-1 truncate flex items-center">{keyPreview}</span>
          <button onClick={handleRotateKey} className="px-4 py-3 bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider">
            Rotate
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-6 mt-2 border-t border-white/5">
        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest">Context Files</label>
        <label className="block w-full text-center px-4 py-3 bg-[#111] text-white text-sm font-bold hover:bg-[#222] cursor-pointer transition-colors uppercase tracking-wider">
          Upload Context
          <input type="file" multiple className="hidden" onChange={handleFileUpload} />
        </label>
        
        <div className="space-y-2 mt-4">
          {contextFiles.map((file: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-[#111] p-3 text-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={file.enabled} 
                  onChange={() => toggleFile(i)}
                  className="w-4 h-4 accent-[#DE2626] bg-black border-gray-600 rounded-none"
                />
                <span className="truncate text-gray-300" title={file.name}>{file.name}</span>
              </div>
              <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-[#DE2626] ml-2 px-2 transition-colors">&times;</button>
            </div>
          ))}
          {contextFiles.length === 0 && (
            <div className="text-xs text-gray-600 italic text-center py-4 bg-[#111]">No context files loaded.</div>
          )}
        </div>
      </div>
    </>
  );
}
