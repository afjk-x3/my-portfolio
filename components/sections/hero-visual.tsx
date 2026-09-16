"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative aspect-[3/2] w-full max-w-xl"
    >
      <div
        aria-hidden
        className="glow absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
      />
      <Image
        src="/images/hero/hero-portrait.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 40vw, 90vw"
        className="relative object-contain"
      />
    </motion.div>
  );
}
