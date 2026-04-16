import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import intelPreview1 from "@/assets/intel-preview-1.png";
import intelPreview2 from "@/assets/intel-preview-2.png";

const IMAGES = [intelPreview1, intelPreview2];
const DISPLAY_MS = 5000;

export const MarketIntelPreview = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, DISPLAY_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={IMAGES[index]}
          alt="Market Intelligence preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-contain object-center"
        />
      </AnimatePresence>
    </div>
  );
};
