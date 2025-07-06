"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OrbitingCirclesProps {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  iconSize?: number;
  speed?: number;
}

export const OrbitingCircles = ({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
}: OrbitingCirclesProps) => {
  const childArray = React.Children.toArray(children);
  const count = childArray.length;
  return (
    <div className={cn("absolute left-1/2 top-1/2", className)} style={{ width: radius * 2, height: radius * 2, transform: `translate(-50%, -50%)` }}>
      {path && (
        <div
          className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-gray-300 dark:border-gray-700 opacity-40"
          style={{ width: radius * 2, height: radius * 2, transform: "translate(-50%, -50%)" }}
        />
      )}
      {childArray.map((child, i) => {
        const angle = (360 / count) * i;
        const animation = {
          rotate: reverse ? -360 : 360,
          transition: {
            repeat: Infinity,
            duration: duration / speed,
            ease: "linear",
            delay: (delay / count) * i,
          },
        };
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: iconSize,
              height: iconSize,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
            }}
            animate={animation}
          >
            <div style={{ width: iconSize, height: iconSize }}>{child}</div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OrbitingCircles;
