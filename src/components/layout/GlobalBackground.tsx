'use client';

import React from 'react';

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden transition-colors duration-300">
      {/* Subtle top ambient glow for depth, invisible to distractions */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-blue-500/5 via-indigo-500/3 to-transparent blur-3xl" />
    </div>
  );
}
