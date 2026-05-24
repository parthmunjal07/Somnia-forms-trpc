const fs = require('fs');

function refactorFile(path, replacers) {
  let content = fs.readFileSync(path, 'utf-8');
  for (const replacer of replacers) {
    content = content.replace(replacer.regex, replacer.replaceWith);
  }
  fs.writeFileSync(path, content);
  console.log('Refactored', path);
}

// 1. PasswordGate.tsx
refactorFile('apps/web/components/PasswordGate.tsx', [
  {
    regex: /  styles: \{\s+bg: string;\s+cardBg: string;\s+input: string;\s+btn: string;\s+accent: string;\s+glow: string;\s+\};\n/g,
    replaceWith: ''
  },
  {
    regex: /styles, /g,
    replaceWith: ''
  },
  {
    regex: /\$\{styles\.bg\}/g,
    replaceWith: 'bg-[var(--theme-bg)] text-[var(--theme-text)]'
  },
  {
    regex: /\$\{styles\.cardBg\}/g,
    replaceWith: 'bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]'
  },
  {
    regex: /\$\{styles\.glow\}/g,
    replaceWith: ''
  },
  {
    regex: /\$\{styles\.accent\}/g,
    replaceWith: 'text-[var(--theme-accent)]'
  },
  {
    regex: /\$\{styles\.input\}/g,
    replaceWith: 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]'
  },
  {
    regex: /\$\{styles\.btn\}/g,
    replaceWith: 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90'
  }
]);

// 2. FieldRenderer.tsx
refactorFile('apps/web/components/FieldRenderer.tsx', [
  {
    regex: /  styles: \{\s+bg: string;\s+cardBg: string;\s+input: string;\s+btn: string;\s+accent: string;\s+glow: string;\s+\};\n/g,
    replaceWith: ''
  },
  {
    regex: /  styles,\n/g,
    replaceWith: ''
  },
  {
    regex: /\$\{styles\.input\}/g,
    replaceWith: 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]'
  }
]);

// 3. FormRunner.tsx
refactorFile('apps/web/components/FormRunner.tsx', [
  {
    regex: /  styles: \{\s+bg: string;\s+cardBg: string;\s+input: string;\s+btn: string;\s+accent: string;\s+glow: string;\s+\};\n/g,
    replaceWith: ''
  },
  {
    regex: /, styles }: FormRunnerProps/g,
    replaceWith: '} : FormRunnerProps'
  },
  {
    regex: /\$\{styles\.bg\}/g,
    replaceWith: 'bg-[var(--theme-bg)] text-[var(--theme-text)]'
  },
  {
    regex: /\$\{styles\.cardBg\}/g,
    replaceWith: 'bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]'
  },
  {
    regex: /\$\{styles\.glow\}/g,
    replaceWith: ''
  },
  {
    regex: /\$\{styles\.accent\}/g,
    replaceWith: 'text-[var(--theme-accent)]'
  },
  {
    regex: /\$\{styles\.btn\}/g,
    replaceWith: 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90'
  },
  {
    regex: /styles=\{styles\}/g,
    replaceWith: ''
  }
]);

// Tenet inversion logic for FormRunner.tsx
// find "const direction" usage
let formRunnerContent = fs.readFileSync('apps/web/components/FormRunner.tsx', 'utf-8');

// Replace handleNext direction setting
formRunnerContent = formRunnerContent.replace(
  /if \(currentIndex < fields.length - 1\) \{\n\s*setDirection\(1\);\n\s*setCurrentIndex\(\(prev\) => prev \+ 1\);\n\s*\}/,
  `const isInverted = form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET;
    if (currentIndex < fields.length - 1) {
      setDirection(isInverted ? -1 : 1);
      setCurrentIndex((prev) => prev + 1);
    }`
);

// Replace handleBack direction setting
formRunnerContent = formRunnerContent.replace(
  /if \(currentIndex > 0\) \{\n\s*setDirection\(-1\);\n\s*setCurrentIndex\(\(prev\) => prev - 1\);\n\s*\}/,
  `const isInverted = form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET;
    if (currentIndex > 0) {
      setDirection(isInverted ? 1 : -1);
      setCurrentIndex((prev) => prev - 1);
    }`
);

// Replace Back button text
formRunnerContent = formRunnerContent.replace(
  /<span className="uppercase tracking-widest text-\[10px\] opacity-60 ml-2 group-hover:opacity-100 transition-opacity font-bold font-mono">\s*Back\s*<\/span>/,
  `<span className="uppercase tracking-widest text-[10px] opacity-60 ml-2 group-hover:opacity-100 transition-opacity font-bold font-mono">
                {form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET ? "↺ Invert" : "Back"}
              </span>`
);

// Replace ProgressBar
formRunnerContent = formRunnerContent.replace(
  /<ProgressBar currentIndex=\{currentIndex\} total=\{fields.length\} \/>/,
  `<div className={form.theme === 'tenet' ? 'origin-right scale-x-[-1]' : ''}>
              <ProgressBar currentIndex={currentIndex} total={fields.length} />
            </div>`
);

// Add Tenet staggered text to Thank You message
// We find: {form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP."}
formRunnerContent = formRunnerContent.replace(
  /\{form\.thankYouMessage \|\| "THE PROJECTED DATA STABILIZED SUCCESSFULLY\. YOU HAVE COMPLETED THIS SUB-LEVEL\. YOU MAY SAFELY WAKE UP\."\}/,
  `{form.theme === 'tenet' && process.env.NEXT_PUBLIC_REFRESH_SECRET ? (
              <div className="flex flex-wrap justify-center gap-1 rtl flex-row-reverse">
                {(form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP.")
                  .split(' ')
                  .map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  ))}
              </div>
            ) : (
              form.thankYouMessage || "THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU HAVE COMPLETED THIS SUB-LEVEL. YOU MAY SAFELY WAKE UP."
            )}`
);

// Ensure the outermost div has the skin wrapper!
formRunnerContent = formRunnerContent.replace(
  /return \(\n\s*<div className=\{`min-h-screen/g,
  `return (\n    <div className={\`skin-\${form.theme} min-h-screen`
);

fs.writeFileSync('apps/web/components/FormRunner.tsx', formRunnerContent);
console.log('FormRunner.tsx inversion logic added.');

