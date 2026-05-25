export type AchievementId = 
  | 'four_layers' 
  | 'inception_typed' 
  | 'architecture_shifting' 
  | 'midnight_submission' 
  | 'limbo_found' 
  | 'totem_test' 
  | 'konami_code';

export const ACHIEVEMENTS = [
  { id: 'four_layers', name: "The Architect's Signature", hint: "Project exactly four layers deep on your dashboard." },
  { id: 'inception_typed', name: "Deep Dive", hint: "Type a certain Christopher Nolan movie title on the landing page." },
  { id: 'architecture_shifting', name: "Architecture Shifting", hint: "Rearrange the dream rapidly in the form builder (5 drags in 10s)." },
  { id: 'midnight_submission', name: "Hour of Limbo", hint: "Stabilize a projection when the clock strikes twelve (00:00)." },
  { id: 'limbo_found', name: "Lost in Limbo", hint: "Find a hidden route that doesn't exist on the map." },
  { id: 'totem_test', name: "Reality Check", hint: "Interact with the spinning totem on the landing page repeatedly." },
  { id: 'konami_code', name: "Temporal Anomaly", hint: "Use a classic retro gaming cheat code anywhere on the site." }
];

export function unlockAchievement(id: AchievementId) {
  if (typeof window === 'undefined') return;
  try {
    const unlocked = JSON.parse(localStorage.getItem('somnia_achievements') || '[]');
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem('somnia_achievements', JSON.stringify(unlocked));
      window.dispatchEvent(new Event('achievements_updated'));
    }
  } catch (e) {
    console.error("Failed to save achievement", e);
  }
}
