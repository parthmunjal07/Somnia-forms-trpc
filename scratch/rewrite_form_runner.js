const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/components/FormRunner.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add Framer Motion imports
content = content.replace('import { ArrowLeft, ArrowRight, CornerDownLeft, RefreshCw, LogOut } from "lucide-react";', 
`import { ArrowLeft, ArrowRight, CornerDownLeft, RefreshCw, LogOut } from "lucide-react";\nimport { motion, AnimatePresence, useReducedMotion } from "framer-motion";`);

// Add direction state
content = content.replace('const [currentIndex, setCurrentIndex] = useState(0);', 
`const [currentIndex, setCurrentIndex] = useState(0);\n  const [direction, setDirection] = useState(1);\n  const shouldReduceMotion = useReducedMotion();`);

// Update handleNext & handleBack
content = content.replace('setCurrentIndex((prev) => prev + 1);', 'setDirection(1);\n      setCurrentIndex((prev) => prev + 1);');
content = content.replace('setCurrentIndex((prev) => prev - 1);', 'setDirection(-1);\n      setCurrentIndex((prev) => prev - 1);');

// Flash & Surfacing
content = content.replace(
  /<div className={`w-full max-w-lg border p-8 rounded-lg text-center \${styles\.cardBg} \${styles\.glow} space-y-8 animate-in fade-in duration-500`}>/g,
  `<motion.div\n          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}\n          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}\n          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}\n          className={\`w-full max-w-lg border p-8 rounded-lg text-center \${styles.cardBg} \${styles.glow} space-y-8\`}\n        >`
);
// Replace closing tags for surfacing div
content = content.replace(
  /<\/div>\n      <\/div>\n    \);\n  }\n\n  \/\/ Render Form Runner/g,
  `</motion.div>\n      </div>\n    );\n  }\n\n  // Render Form Runner`
);

content = content.replace(
  /\{\/\* "The Kick" White Flash Overlay \*\/\}\n      <div\n        className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 \${\n          showFlash \? "opacity-100" : "opacity-0"\n        }`}\n      \/>/g,
  `{/* "The Kick" White Flash Overlay */}\n      <AnimatePresence>\n        {showFlash && (\n          <motion.div\n            initial={{ opacity: 0 }}\n            animate={{ opacity: 1 }}\n            exit={{ opacity: 0 }}\n            transition={{ duration: 0.8, ease: "easeInOut" }}\n            className="fixed inset-0 bg-white z-50 pointer-events-none"\n          />\n        )}\n      </AnimatePresence>`
);


// Question Block
const questionBlockOld = `{/* Middle Area: Question Renderer with slide-down/fade animate key */}
        <div key={currentIndex} className="flex-1 py-8 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-300">
          {currentField ? (
            <FieldRenderer
              field={currentField}
              value={answers[currentField.id]}
              onChange={handleValueChange}
              styles={styles}
              error={errors[currentField.id]}
              onAutoAdvance={handleNext}
            />
          ) : (
            <div className="text-center text-xs opacity-50 uppercase tracking-widest">
              Limbo detected: No fields projected.
            </div>
          )}
        </div>`;

const questionBlockNew = `{/* Middle Area: Question Renderer with Framer Motion AnimatePresence */}
        <div className="flex-1 py-8 flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 0 } : (d) => ({ y: d > 0 ? -20 : 20, opacity: 0, scale: 0.97 })}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : (d) => ({ y: d > 0 ? 20 : -20, opacity: 0, scale: 0.97 })}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              {currentField ? (
                <FieldRenderer
                  field={currentField}
                  value={answers[currentField.id]}
                  onChange={handleValueChange}
                  styles={styles}
                  error={errors[currentField.id]}
                  onAutoAdvance={handleNext}
                />
              ) : (
                <div className="text-center text-xs opacity-50 uppercase tracking-widest">
                  Limbo detected: No fields projected.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>`;

content = content.replace(questionBlockOld, questionBlockNew);

fs.writeFileSync(filePath, content);
console.log("Updated FormRunner!");
