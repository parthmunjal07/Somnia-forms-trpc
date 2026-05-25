"use client";

import { useState, useEffect } from "react";
import { Trophy, HelpCircle, X, CheckCircle2 } from "lucide-react";
import { ACHIEVEMENTS } from "~/lib/achievements";

export function AchievementsTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = () => {
      try {
        setUnlocked(JSON.parse(localStorage.getItem('somnia_achievements') || '[]'));
      } catch (e) {}
    };
    load();
    window.addEventListener('achievements_updated', load);
    return () => window.removeEventListener('achievements_updated', load);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-mono">
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-80 bg-stone-950 border border-stone-800 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] p-4 mb-2 text-stone-200">
          <div className="flex justify-between items-center mb-4 border-b border-stone-800 pb-2">
            <h3 className="font-bold tracking-widest uppercase text-[#C9933A] text-sm">Anomalies Detected</h3>
            <button onClick={() => setIsOpen(false)} className="text-stone-500 hover:text-stone-300 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlocked.includes(ach.id);
              return (
                <div key={ach.id} className={`p-3 rounded border transition-colors ${isUnlocked ? 'border-[#C9933A]/50 bg-[#C9933A]/10' : 'border-stone-800/80 bg-stone-900/40'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {isUnlocked ? <CheckCircle2 size={14} className="text-[#C9933A]" /> : <Trophy size={14} className="text-stone-600" />}
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isUnlocked ? 'text-[#E8B455]' : 'text-stone-500'}`}>{ach.name}</span>
                    </div>
                  </div>
                  {!isUnlocked && (
                    <div className="mt-2.5">
                      {showHints[ach.id] ? (
                        <p className="text-[10px] text-stone-400 leading-relaxed uppercase tracking-widest border-t border-stone-800 pt-2 opacity-80">{ach.hint}</p>
                      ) : (
                        <button onClick={() => setShowHints(prev => ({...prev, [ach.id]: true}))} className="text-[9px] text-stone-500 hover:text-[#C9933A] flex items-center space-x-1 uppercase tracking-widest transition-colors font-semibold">
                          <HelpCircle size={10} />
                          <span>Decrypt Hint</span>
                        </button>
                      )}
                    </div>
                  )}
                  {isUnlocked && (
                    <p className="text-[9px] text-[#C9933A]/70 uppercase tracking-widest mt-1.5 font-semibold">Stabilized</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border ${unlocked.length === ACHIEVEMENTS.length ? 'bg-[#C9933A] text-stone-950 border-[#E8B455] shadow-[0_0_15px_#C9933A]' : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-[#C9933A] hover:border-[#C9933A]'}`}
        title="View Anomalies"
      >
        <Trophy size={18} className={unlocked.length === ACHIEVEMENTS.length ? 'animate-pulse' : ''} />
        {unlocked.length > 0 && unlocked.length < ACHIEVEMENTS.length && (
          <span className="absolute -top-1 -right-1 bg-[#C9933A] text-stone-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unlocked.length}
          </span>
        )}
      </button>
    </div>
  );
}
