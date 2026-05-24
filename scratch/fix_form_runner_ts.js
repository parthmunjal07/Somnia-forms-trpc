const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/web/components/FormRunner.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Insert variants before the return statement inside the FormRunner function
const variantsCode = `
  const variants = {
    initial: (d: number) => ({
      y: d > 0 ? -20 : 20,
      opacity: 0,
      scale: 0.97
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (d: number) => ({
      y: d > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.97
    })
  };

  const reducedVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };
`;

content = content.replace('  // Render Form Runner\n  return (', variantsCode + '\n  // Render Form Runner\n  return (');

// Update the motion.div props
const oldMotionDiv = `<motion.div
              key={currentIndex}
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 0 } : (d) => ({ y: d > 0 ? -20 : 20, opacity: 0, scale: 0.97 })}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : (d) => ({ y: d > 0 ? 20 : -20, opacity: 0, scale: 0.97 })}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col justify-center"
            >`;

const newMotionDiv = `<motion.div
              key={currentIndex}
              custom={direction}
              variants={shouldReduceMotion ? reducedVariants : variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col justify-center"
            >`;

content = content.replace(oldMotionDiv, newMotionDiv);

fs.writeFileSync(filePath, content);
console.log("Fixed typescript for framer-motion variants!");
