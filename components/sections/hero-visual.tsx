"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { HeadgearReveal } from "@/components/sections/headgear-reveal";
import { HeroWatermark } from "@/components/sections/hero-watermark";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function HeroVisual({ watermark }: { watermark: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // 0 while the stage top is at the viewport top, 1 once the stage has
  // scrolled fully out above it.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end start"],
  });

  // The portrait sinks slowly and the watermark rises against it. The
  // watermark is nested inside the portrait layer, so its offset stacks on top
  // of the portrait's and the two visibly separate in depth while scrolling.
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);

  return (
    <div ref={stageRef} className="relative flex flex-1 items-end justify-center">
      {/* Layer 0: accent bloom behind everything. */}
      <div
        aria-hidden
        className="glow absolute bottom-[15%] left-1/2 size-[28rem] -translate-x-1/2"
      />

      {/*
       * Width is the smallest of: 140% of the container, 64rem, and whatever
       * width keeps the 3:2 portrait's height inside the viewport minus the
       * hero's top padding, telemetry bar, and bottom padding (~12rem).
       *
       * 140% is safe because the subject only occupies the middle ~55% of the
       * PNG; the transparent margins bleed off-screen and the section's
       * `overflow-hidden` clips them. On phones this is what makes the portrait
       * large enough to read.
       */}
      <motion.div
        style={{ y: reduceMotion ? 0 : portraitY }}
        className="relative w-[min(140%,64rem,calc((100svh_-_12rem)*1.5))] shrink-0"
      >
        {/*
         * Layer 1: the watermark, outline plus its ink-revealed neon fill. It
         * comes first in the DOM, so the portrait after it paints on top.
         */}
        <motion.div
          aria-hidden
          style={{ y: reduceMotion ? 0 : watermarkY }}
          className="pointer-events-none absolute inset-x-0 top-[16%]"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          >
            <HeroWatermark text={watermark} />
          </motion.div>
        </motion.div>

        {/* Layer 2: the transparent cutout portrait, in front of the watermark. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT_EXPO }}
          className="relative aspect-[3/2] w-full"
        >
          <Image
            src="/images/hero/hero-portrait.png"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-contain object-bottom -translate-y-8"
          />
          {/* Layer 3: headgear photo over the face, revealed by the ink trail. */}
          <HeadgearReveal />
        </motion.div>
      </motion.div>

      {/* The portrait is cut off at the waist; fade that edge into the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-bg via-bg/70 to-transparent"
      />
    </div>
  );
}
