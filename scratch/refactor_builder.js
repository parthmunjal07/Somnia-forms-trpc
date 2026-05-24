const fs = require('fs');

let content = fs.readFileSync('apps/web/app/dashboard/forms/[id]/build/page.tsx', 'utf-8');

// Remove THEME_SKINS and getSkinStyles block
// Let's use regex to remove everything from const THEME_SKINS to the end of getSkinStyles function
content = content.replace(/const THEME_SKINS = \[[\s\S]*?function getSkinStyles\(skinId: string\) \{[\s\S]*?\}\n/, '');

// Add ThemePicker import
content = content.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\nimport { ThemePicker } from "~/components/ThemePicker";');

// Replace the map block
const mapRegex = /\{THEME_SKINS\.map\(\(skin\) => \([\s\S]*?\}\)\}/;
content = content.replace(mapRegex, `<ThemePicker currentTheme={form.theme || "inception"} onChange={(t) => updateForm.mutate({ theme: t as any })} />`);

fs.writeFileSync('apps/web/app/dashboard/forms/[id]/build/page.tsx', content);
console.log('Builder page refactored.');
