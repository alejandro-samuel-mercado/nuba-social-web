'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[18%] -left-[12%] h-[62vw] w-[62vw] max-h-[700px] max-w-[700px] rounded-full bg-primary/40 blur-[110px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, -35, 0], y: [0, -45, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[25%] -right-[15%] h-[58vw] w-[58vw] max-h-[650px] max-w-[650px] rounded-full bg-secondary/30 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], x: [0, 25, 0], y: [0, -25, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute -bottom-[15%] left-[12%] h-[52vw] w-[52vw] max-h-[600px] max-w-[600px] rounded-full bg-tertiary/30 blur-[110px]"
      />
      <div className="absolute inset-0 bg-cubes-pattern opacity-40" />
    </div>
  );
}
