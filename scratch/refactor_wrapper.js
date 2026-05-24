const fs = require('fs');

let content = fs.readFileSync('apps/web/components/FormClientWrapper.tsx', 'utf-8');

// Remove import
content = content.replace('import { getSkinStyles } from "~/lib/themes";\n', '');

// Remove getSkinStyles usage
content = content.replace(/const skin = currentData\.form\?\.theme \?\? "classic-dark";\n\s*const styles = getSkinStyles\(skin\);/g, 'const skin = currentData.form?.theme ?? "inception";');

// Replace styles references in FormRunner props
content = content.replace(/styles=\{styles\}\s*\/>/g, '/>');

// Replace PasswordGate styles prop
content = content.replace(/styles=\{styles\}\n\s*onUnlock=/g, 'onUnlock=');

// Replace dynamic classes
content = content.replace(/\$\{styles\.bg\}/g, 'bg-[var(--theme-bg)] text-[var(--theme-text)]');
content = content.replace(/\$\{styles\.cardBg\}/g, 'bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]');
content = content.replace(/\$\{styles\.glow\}/g, '');
content = content.replace(/\$\{styles\.accent\}/g, 'text-[var(--theme-accent)]');
content = content.replace(/\$\{styles\.btn\}/g, 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90');

// Wrap returns with the skin class
const wrapRegex = /(return \(\n\s*)<div className={`?(min-h-screen.*?)`?}/g;
content = content.replace(wrapRegex, (match, p1, p2) => {
  // We need to inject the skin class. We can wrap it in a parent, but the user said "apply the skin class to the outermost wrapper".
  // p2 is the classname string
  if (p2.includes('${styles.bg}')) return match; // already handled
  return `${p1}<div className={\`skin-\${skin} \${"${p2.replace('min-h-screen ', 'min-h-screen ')}"}\`} style={{ background: "var(--theme-bg)" }}`;
});

// Since we replaced styles.bg with bg-[var(--theme-bg)] etc, let's just make sure skin is applied to the outermost div of each return
content = content.replace(/<div className={`min-h-screen bg-\[var\(--theme-bg\)/g, '<div className={`skin-${skin} min-h-screen bg-[var(--theme-bg)]');

fs.writeFileSync('apps/web/components/FormClientWrapper.tsx', content);
console.log('FormClientWrapper refactored.');
