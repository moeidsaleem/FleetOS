"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";


export interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple = ({
  mainCircleSize = 210,
  mainCircleOpacity = 0.9,
  numCircles = 50,
  className,
}: RippleProps) => {
  return (
    <div className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", className)}>
      {/* Main Circle */}
      <motion.div
        className="absolute rounded-full bg-black/40"
        style={{
          width: mainCircleSize,
          height: mainCircleSize,
          opacity: mainCircleOpacity,
          left: `calc(50% - ${mainCircleSize / 2}px)`,
          top: `calc(50% - ${mainCircleSize / 2}px)`,
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ripple Circles */}
      {Array.from({ length: numCircles }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/50"
          style={{
            width: mainCircleSize + i * 40,
            height: mainCircleSize + i * 40,
            left: `calc(50% - ${(mainCircleSize + i * 40) / 2}px)`,
            top: `calc(50% - ${(mainCircleSize + i * 40) / 2}px)`,
            opacity: 0.12,
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};

export default Ripple;
