const fs = require('fs');

let content = fs.readFileSync('apps/web/app/dashboard/forms/[id]/build/page.tsx', 'utf-8');

// 1. Remove previewSkinStyles usage
content = content.replace(/const previewSkinStyles = getSkinStyles\(themeSkin\);\n/g, '');

content = content.replace(/\$\{previewSkinStyles\.bg\} \$\{previewSkinStyles\.cardBg\}/g, 'bg-[var(--theme-bg)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)] text-[var(--theme-text)]');
content = content.replace(/\$\{previewSkinStyles\.input\}/g, 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]');
content = content.replace(/\$\{previewSkinStyles\.btn\}/g, 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90');

// 2. Wrap the Preview Container with the skin class
// We need to find the `div` representing the preview panel wrapper.
// It's probably around line 570 where we had `${previewSkinStyles.bg} ${previewSkinStyles.cardBg}`
// Wait, we just replaced `${previewSkinStyles.bg} ${previewSkinStyles.cardBg}`. I should also add `skin-${themeSkin}` to it.
content = content.replace(/className={`w-full max-w-lg border rounded-lg p-6 font-mono/g, 'className={`skin-${themeSkin} w-full max-w-lg border rounded-lg p-6 font-mono');

// 3. Replace the select dropdown with ThemePicker
const selectBlock = `<select
                    disabled={isReadOnly}
                    value={themeSkin}
                    onChange={(e) => {
                      setThemeSkin(e.target.value);
                      if (!isReadOnly) {
                        updateFormMutation.mutate({ id, theme: e.target.value });
                      }
                    }}
                    className="w-full bg-stone-950 border border-stone-850 rounded px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {THEME_SKINS.map((skin) => (
                      <option key={skin.id} value={skin.id}>
                        {skin.name}
                      </option>
                    ))}
                  </select>`;

const themePickerCode = `<div className={isReadOnly ? "pointer-events-none opacity-50" : ""}>
                    <ThemePicker 
                      currentTheme={themeSkin} 
                      onChange={(t) => {
                        setThemeSkin(t);
                        if (!isReadOnly) {
                          updateFormMutation.mutate({ id, theme: t });
                        }
                      }} 
                    />
                  </div>`;

// Use simple string replace for the select block. We can just replace the <select> element.
// To be safe, we can use a regex since indentation might differ.
const regexSelect = /<select[\s\S]*?<\/select>/;
content = content.replace(regexSelect, themePickerCode);

// Since my previous regex might have missed `THEME_SKINS`, let's remove it if it still exists at the top.
content = content.replace(/const THEME_SKINS = \[[\s\S]*?\];\n/, '');

// If getSkinStyles still exists
content = content.replace(/function getSkinStyles[\s\S]*?}\n\n/g, '');


fs.writeFileSync('apps/web/app/dashboard/forms/[id]/build/page.tsx', content);
console.log('Builder page fixed.');
