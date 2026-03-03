/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { AISettings } from './components/AISettings';
import { AboutModal } from './components/AboutModal';
import { CharacterData } from './utils/bejson';
import { Menu, Info } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<'start' | 'game'>('start');
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiStatus, setAiStatus] = useState('IDLE: System ready.');
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [contextFiles, setContextFiles] = useState<{name: string, content: string, enabled: boolean}[]>([]);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 p-4 flex justify-between items-center bg-[#050505]">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAISettings(!showAISettings)} className="text-white hover:text-[#DE2626] transition-colors p-2 -ml-2">
            <Menu size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
            The People's <span className="text-[#DE2626]">RPG</span>
          </h1>
        </div>
        <button onClick={() => setShowAbout(true)} className="text-white hover:text-[#DE2626] transition-colors p-2 -mr-2">
          <Info size={24} />
        </button>
      </header>

      {/* AI Status Bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 text-gray-400 px-4 py-2 text-xs md:text-sm flex flex-col md:flex-row justify-between gap-2">
        <span className="truncate">STATUS: <span className="text-white">{aiStatus}</span></span>
        <span className="truncate">MODEL: <span className="text-white">{selectedModel}</span></span>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {showAISettings && (
          <div className="absolute inset-0 bg-black/80 z-40 md:hidden" onClick={() => setShowAISettings(false)} />
        )}
        
        {/* Sidebar */}
        <div className={`
          absolute md:relative z-50 h-full w-80 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${showAISettings ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'}
        `}>
          <AISettings 
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            contextFiles={contextFiles}
            setContextFiles={setContextFiles}
          />
        </div>
        
        <div className="flex-1 p-0 md:p-6 overflow-y-auto bg-black">
          {screen === 'start' ? (
            <StartScreen 
              onStartGame={(char) => {
                setCharacter(char);
                setScreen('game');
              }}
            />
          ) : (
            <GameScreen 
              character={character!}
              setCharacter={setCharacter}
              selectedModel={selectedModel}
              contextFiles={contextFiles.filter(f => f.enabled)}
              setAiStatus={setAiStatus}
            />
          )}
        </div>
      </main>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
