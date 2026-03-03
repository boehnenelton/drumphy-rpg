import React, { useState } from 'react';
import { CharacterData, exportCharacterToBEJSON, importCharacterFromBEJSON } from '../utils/bejson';

export function StartScreen({ onStartGame }: { onStartGame: (char: CharacterData) => void }) {
  const [char, setChar] = useState<CharacterData | null>(null);
  const [importError, setImportError] = useState('');

  const rollStats = () => {
    const roll = () => Math.floor(Math.random() * 11) + 8; // 8 to 18
    setChar({
      id: "C" + Math.floor(Math.random() * 10000),
      name: "Drumphy",
      level: 1,
      maxHp: 20,
      currentHp: 20,
      ac: 12,
      stats: {
        Strength: roll(),
        Dexterity: roll(),
        Constitution: roll(),
        Intelligence: roll(),
        Wisdom: roll(),
        Charisma: roll()
      },
      coins: 100,
      staff: 500,
      vodkas: [{ proof: 80, quantity: 3 }]
    });
    setImportError('');
  };

  const handleExport = () => {
    if (!char) return;
    const json = exportCharacterToBEJSON(char);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drumphy_character.bejson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = importCharacterFromBEJSON(event.target?.result as string);
        setChar(imported);
        setImportError('');
      } catch (err: any) {
        setImportError(err.message || 'Failed to import');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 bg-[#050505] md:bg-[#0a0a0a] min-h-full md:min-h-0">
      <div className="text-center mb-8">
        <img 
          src="https://api.dicebear.com/9.x/avataaars/svg?seed=Drumphy&top=shortHairShortWaved&hairColor=blonde&mouth=smirk&backgroundColor=DE2626" 
          alt="Drumphy" 
          className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-[#0a0a0a] shadow-lg"
        />
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-tight">Operative <span className="text-[#DE2626]">Drumphy</span></h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest">The People's Billionaire</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
        <button onClick={rollStats} className="px-6 py-4 bg-white text-black font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm">
          Roll New Stats
        </button>
        <label className="px-6 py-4 bg-[#111] text-white font-bold hover:bg-[#222] transition-colors cursor-pointer text-center uppercase tracking-wider text-sm">
          Import BEJSON
          <input type="file" accept=".bejson,.json" className="hidden" onChange={handleImport} />
        </label>
      </div>

      {importError && <div className="text-[#DE2626] mb-4 text-center font-bold uppercase">{importError}</div>}

      {char && (
        <div className="space-y-4">
          <div className="bg-[#111] p-6">
            <h3 className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-widest">Identity</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500 block text-xs mb-1">NAME</span> <span className="text-white font-bold">{char.name}</span></div>
              <div><span className="text-gray-500 block text-xs mb-1">LEVEL</span> <span className="text-white font-bold">{char.level}</span></div>
              <div className="col-span-2"><span className="text-gray-500 block text-xs mb-1">APPEARANCE</span> <span className="text-white">Blonde hair parted, cocky smirk, tailored suit, red tie</span></div>
            </div>
          </div>

          <div className="bg-[#111] p-6">
            <h3 className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-widest">Attributes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(char.stats).map(([stat, val]) => (
                <div key={stat} className="bg-[#0a0a0a] p-3 flex flex-col items-center justify-center">
                  <span className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{stat.substring(0,3)}</span>
                  <span className="text-white font-bold text-lg">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111] p-6">
            <h3 className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-widest">Assets & Inventory</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#0a0a0a] p-3">
                <span className="text-sm text-gray-300">Loyal Staff</span>
                <span className="text-white font-bold">{char.staff} Employees</span>
              </div>
              <div className="flex justify-between items-center bg-[#0a0a0a] p-3">
                <span className="text-sm text-gray-300">Trump Casino Coins</span>
                <span className="text-white font-bold">{char.coins}</span>
              </div>
              {char.vodkas.map((v, i) => (
                <div key={i} className="flex justify-between items-center bg-[#0a0a0a] p-3">
                  <span className="text-sm text-gray-300">Trump Vodka ({v.proof} Proof)</span>
                  <span className="text-white font-bold">x{v.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button onClick={handleExport} className="px-6 py-4 bg-[#111] text-white font-bold hover:bg-[#222] transition-colors uppercase tracking-wider text-sm">
              Export BEJSON
            </button>
            <button onClick={() => onStartGame(char)} className="px-8 py-4 bg-white text-black font-black hover:bg-gray-200 transition-colors text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Deploy Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
