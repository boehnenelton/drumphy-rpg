import React, { useState, useEffect, useRef } from 'react';
import { CharacterData } from '../utils/bejson';
import { generateText, generateSpeech, playAudio } from '../utils/ai';
import { Volume2, Loader2, Menu, X, Terminal, User } from 'lucide-react';

type LogEntry = {
  type: 'system' | 'user' | 'ai' | 'combat';
  text: string;
};

export function GameScreen({ 
  character, 
  setCharacter, 
  selectedModel, 
  contextFiles, 
  setAiStatus 
}: any) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Normal' | 'Hard' | 'Fallout'>('Normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'terminal' | 'profile'>('terminal');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handlePlayAudio = async (index: number, text: string) => {
    if (playingAudioIndex !== null) return;
    setPlayingAudioIndex(index);
    try {
      const base64 = await generateSpeech(text, setAiStatus);
      if (base64) {
        await playAudio(base64);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlayingAudioIndex(null);
    }
  };

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs(prev => [...prev, { type, text }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    // Initial Scenario Generation
    const initGame = async () => {
      setIsGenerating(true);
      addLog('system', 'Initializing scenario...');
      try {
        const prompt = `
          You are the game master for a text-based RPG.
          CRITICAL RULE: DO NOT USE MARKDOWN FORMATTING (no asterisks, no bold, no italics, no headers). Use plain text only, spaced out nicely with empty lines between paragraphs and dialogue.
          
          The main character is named Drumphy. He has blonde hair parted and a cocky smirk.
          He is the "People's Billionaire". His biggest power is that the people are on his side.
          He doesn't wear armor; he wears tailored suits with red ties.
          He works for a secret organization called "THE PEOPLE".
          His enemies are Communist goons who hate him because he's a billionaire, Deep State militia, and color revolutionaries.
          The currency is Trump Casino Coins. Healing potions are Trump Vodka.
          Difficulty setting: ${difficulty}.
          Character Level: ${character.level}.
          Current Local Time: 2026-03-02T22:43:39-08:00
          
          Generate the opening scene for his current mission. 
          Start by explicitly stating the LOCATION and TIME at the very top.
          Then, provide the BACKSTORY for this specific mission.
          Then, set up an opening DIALOGUE with a character he encounters. Space out the dialogue nicely.
          Allow the player to freely roleplay, including speaking for or controlling the characters they encounter if they choose to do so.
          End with a prompt for the player's first action.
        `;
        const response = await generateText(prompt, selectedModel, contextFiles, setAiStatus);
        addLog('ai', response);
      } catch (err: any) {
        addLog('system', `Failed to generate scenario: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    };
    initGame();
  }, []); // Run once on mount

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userAction = input.trim();
    setInput('');
    addLog('user', `> ${userAction}`);
    setIsGenerating(true);

    try {
      // Get the last 10 logs for context
      const recentHistory = logs.slice(-10).map(l => {
        if (l.type === 'user') return `Player Action: ${l.text.replace('> ', '')}`;
        if (l.type === 'ai') return `Game Master: ${l.text}`;
        return '';
      }).filter(Boolean).join('\n\n');

      const prompt = `
        CRITICAL RULE: DO NOT USE MARKDOWN FORMATTING (no asterisks, no bold, no italics, no headers). Use plain text only, spaced out nicely with empty lines between paragraphs and dialogue.
        
        RECENT HISTORY:
        ${recentHistory}
        
        The player (Drumphy, Level ${character.level}, HP: ${character.currentHp}/${character.maxHp}) takes the following action: "${userAction}".
        Difficulty: ${difficulty}.
        
        Describe the outcome of this action. 
        Start your response by explicitly stating the current LOCATION and TIME at the top (update the time logically based on the action taken).
        If it involves combat, describe the fight. Enemies scale with the player's level. Enemies should be Communist goons, Deep State militia, or color revolutionaries. Drumphy fights in a suit with a red tie.
        If the player takes damage, specify the amount clearly like "[DAMAGE: 5]".
        If the player finds loot, specify it like "[LOOT: 10 Coins]" or "[LOOT: 1 Vodka 80 Proof]".
        Keep the tone consistent with the setting (secret organization "THE PEOPLE", fighting the deep state).
        Space out any dialogue nicely. Allow the player to roleplay and interact with NPCs freely.
      `;
      
      const response = await generateText(prompt, selectedModel, contextFiles, setAiStatus);
      addLog('ai', response);
      
      // Simple parsing for damage and loot
      let newHp = character.currentHp;
      let newCoins = character.coins;
      let newVodkas = [...character.vodkas];

      const damageMatch = response.match(/\[DAMAGE:\s*(\d+)\]/i);
      if (damageMatch) {
        newHp -= parseInt(damageMatch[1]);
        addLog('combat', `Drumphy took ${damageMatch[1]} damage!`);
      }

      const coinMatch = response.match(/\[LOOT:\s*(\d+)\s*Coins\]/i);
      if (coinMatch) {
        newCoins += parseInt(coinMatch[1]);
        addLog('system', `Found ${coinMatch[1]} Trump Casino Coins!`);
      }

      const vodkaMatch = response.match(/\[LOOT:\s*(\d+)\s*Vodka\s*(\d+)\s*Proof\]/i);
      if (vodkaMatch) {
        newVodkas.push({ quantity: parseInt(vodkaMatch[1]), proof: parseInt(vodkaMatch[2]) });
        addLog('system', `Found ${vodkaMatch[1]} Trump Vodka (${vodkaMatch[2]} Proof)!`);
      }

      if (newHp <= 0) {
        addLog('system', 'DRUMPHY HAS FALLEN. GAME OVER.');
        newHp = 0;
      }

      setCharacter({ ...character, currentHp: newHp, coins: newCoins, vodkas: newVodkas });

    } catch (err: any) {
      addLog('system', `Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const drinkVodka = (index: number) => {
    const vodka = character.vodkas[index];
    if (!vodka || vodka.quantity <= 0) return;

    const healAmount = Math.floor(vodka.proof / 10); // e.g. 80 proof = 8 HP
    const newHp = Math.min(character.maxHp, character.currentHp + healAmount);
    
    const newVodkas = [...character.vodkas];
    newVodkas[index].quantity -= 1;
    if (newVodkas[index].quantity <= 0) {
      newVodkas.splice(index, 1);
    }

    setCharacter({ ...character, currentHp: newHp, vodkas: newVodkas });
    addLog('system', `Drumphy drank Trump Vodka (${vodka.proof} Proof) and healed ${healAmount} HP!`);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto gap-4 md:p-4 p-2">
      {/* Top Bar: Stats & Settings */}
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-4">
        <div className="flex-1 bg-[#0a0a0a] p-4 flex items-center gap-4 rounded-xl">
          <img 
            src="https://api.dicebear.com/9.x/avataaars/svg?seed=Drumphy&top=shortHairShortWaved&hairColor=blonde&mouth=smirk&backgroundColor=DE2626" 
            alt="Drumphy" 
            className="w-16 h-16 rounded-full border-2 border-[#111]"
          />
          <div className="flex-1 flex justify-between items-center">
            <div>
              <h3 className="text-white font-black text-xl uppercase tracking-tight">{character.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Level {character.level} Operative</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">
                <span className={character.currentHp < character.maxHp / 3 ? 'text-[#DE2626]' : 'text-white'}>
                  {character.currentHp}
                </span>
                <span className="text-gray-600 text-lg">/{character.maxHp}</span>
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">HP</div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-64 bg-[#0a0a0a] p-4 flex flex-col justify-center rounded-xl">
          <label className="block text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest">Difficulty</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-[#111] text-white p-3 outline-none focus:ring-1 focus:ring-white appearance-none cursor-pointer rounded-lg"
          >
            <option value="Normal">Normal</option>
            <option value="Hard">Hard</option>
            <option value="Fallout">Fallout (Brutal)</option>
          </select>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden bg-[#0a0a0a] rounded-xl overflow-hidden">
        <button 
          onClick={() => setMobileTab('terminal')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${mobileTab === 'terminal' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
        >
          <Terminal size={16} /> Terminal
        </button>
        <button 
          onClick={() => setMobileTab('profile')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${mobileTab === 'profile' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
        >
          <User size={16} /> Profile
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Log Window (Hidden on mobile if profile tab is active) */}
        <div className={`flex-[3] bg-[#0a0a0a] flex flex-col min-h-0 relative rounded-xl overflow-hidden ${mobileTab === 'profile' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 font-sans text-base md:text-lg">
            {logs.map((log, i) => (
              <div key={i} className={`
                ${log.type === 'user' ? 'text-gray-500 font-mono text-sm' : ''}
                ${log.type === 'system' ? 'text-gray-400 italic text-sm' : ''}
                ${log.type === 'combat' ? 'text-[#DE2626] font-bold' : ''}
                ${log.type === 'ai' ? 'text-gray-200 leading-relaxed relative group whitespace-pre-wrap' : ''}
              `}>
                {log.text}
                {log.type === 'ai' && (
                  <button 
                    onClick={() => handlePlayAudio(i, log.text)}
                    disabled={playingAudioIndex !== null}
                    className="ml-3 inline-flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-50 transition-colors align-middle p-2 bg-[#111] rounded-full"
                    title="Read aloud"
                  >
                    {playingAudioIndex === i ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                  </button>
                )}
              </div>
            ))}
            {isGenerating && <div className="text-gray-500 animate-pulse font-mono text-sm">Processing...</div>}
            <div ref={logsEndRef} />
          </div>
          
          <form onSubmit={handleAction} className="bg-[#111] p-2 md:p-4 flex gap-2 items-center">
            <span className="text-gray-500 font-black pl-2 hidden md:inline">&gt;</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating || character.currentHp <= 0}
              className="flex-1 bg-transparent text-white outline-none p-3 font-sans text-lg placeholder-gray-600"
              placeholder="What do you do?"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isGenerating || character.currentHp <= 0 || !input.trim()}
              className="px-6 py-4 bg-white text-black font-black hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white transition-colors uppercase tracking-widest text-sm rounded-lg"
            >
              Send
            </button>
          </form>
        </div>

        {/* Side Panel: Inventory & Quick Actions (Hidden on mobile if terminal tab is active) */}
        <div className={`w-full md:w-80 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto flex flex-col gap-8 rounded-xl ${mobileTab === 'terminal' ? 'hidden md:flex' : 'flex'}`}>
          <div>
            <h3 className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest">Inventory</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#111] p-4 rounded-lg">
                <span className="text-sm text-gray-300 font-medium">Casino Coins</span>
                <span className="text-white font-bold">{character.coins}</span>
              </div>
              
              {character.vodkas.length === 0 ? (
                <p className="text-gray-600 text-sm italic p-4 bg-[#111] rounded-lg">No healing items.</p>
              ) : (
                character.vodkas.map((vodka: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#111] p-4 rounded-lg">
                    <div className="text-sm">
                      <div className="text-gray-200 font-medium">Trump Vodka</div>
                      <div className="text-gray-500 text-xs mt-1">{vodka.proof} Proof (x{vodka.quantity})</div>
                    </div>
                    <button 
                      onClick={() => drinkVodka(i)}
                      disabled={character.currentHp >= character.maxHp || character.currentHp <= 0}
                      className="px-4 py-2 bg-white text-black text-xs font-bold hover:bg-gray-200 disabled:opacity-50 uppercase tracking-wider rounded-md"
                    >
                      Drink
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest">Attributes</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(character.stats).map(([stat, val]) => (
                <div key={stat} className="bg-[#111] p-4 flex flex-col items-center justify-center rounded-lg">
                  <span className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{stat.substring(0,3)}</span>
                  <span className="text-white font-bold text-lg">{val as number}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest">Equipment</h3>
            <div className="bg-[#111] p-4 rounded-lg flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Outfit</span>
                <span className="text-white font-medium">Tailored Suit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Accessory</span>
                <span className="text-[#DE2626] font-medium">Red Tie</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

