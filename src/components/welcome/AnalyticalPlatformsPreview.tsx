import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import riskSignalsPreview from "@/assets/risk-signals-preview.png";
import inflationPreview1 from "@/assets/inflation-preview-1.png";
import inflationPreview2 from "@/assets/inflation-preview-2.png";

const IMAGES = [riskSignalsPreview, inflationPreview1, inflationPreview2];
const DISPLAY_MS = 5000;

export const AnalyticalPlatformsPreview = () => {
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
          alt="Analytical Platforms preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </AnimatePresence>
    </div>
  );
};
