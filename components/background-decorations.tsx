"use client";

import React from "react"

import { useEffect, useState } from "react";
import {
  PixelCross,
  PixelCursor,
  PixelHand,
  PixelSmiley,
  PixelExclamation,
  PixelQuestion,
  PixelMonitor,
} from "./pixel-elements";

interface FloatingItem {
  id: string;
  element: React.ReactNode;
  startX: number;
  startY: number;
  size: string;
  opacity: number;
  duration: number;
  delay: number;
  animClass: string;
}

const ANIM_CLASSES = [
  "animate-drift-1",
  "animate-drift-2",
  "animate-drift-3",
  "animate-drift-4",
  "animate-drift-5",
  "animate-drift-6",
];

export function BackgroundDecorations() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items: FloatingItem[] = [
    {
      id: "cross-accent",
      element: <PixelCross className="h-full w-full text-accent" />,
      startX: 88,
      startY: 6,
      size: "w-14 h-14 md:w-20 md:h-20",
      opacity: 0.7,
      duration: 28,
      delay: 0,
      animClass: ANIM_CLASSES[0],
    },
    {
      id: "cross-faint",
      element: <PixelCross className="h-full w-full text-primary/20" />,
      startX: 5,
      startY: 10,
      size: "w-8 h-8 md:w-10 md:h-10",
      opacity: 1,
      duration: 35,
      delay: 2,
      animClass: ANIM_CLASSES[3],
    },
    {
      id: "blocks",
      element: (
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-primary md:h-12 md:w-12" />
          <div className="h-8 w-8 bg-accent md:h-12 md:w-12" />
          <div className="h-8 w-8 bg-primary/30 md:h-12 md:w-12" />
        </div>
      ),
      startX: 72,
      startY: 4,
      size: "",
      opacity: 1,
      duration: 32,
      delay: 4,
      animClass: ANIM_CLASSES[1],
    },
    {
      id: "checker-tr",
      element: (
        <div className="grid grid-cols-3 gap-[2px]">
          {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
            <div
              key={i}
              className={`h-3 w-3 md:h-4 md:w-4 ${on ? "bg-primary" : "bg-transparent"}`}
            />
          ))}
        </div>
      ),
      startX: 90,
      startY: 16,
      size: "",
      opacity: 1,
      duration: 38,
      delay: 1,
      animClass: ANIM_CLASSES[2],
    },
    {
      id: "hand",
      element: <PixelHand className="h-full w-full text-primary" />,
      startX: 85,
      startY: 28,
      size: "w-12 h-12 md:w-16 md:h-16",
      opacity: 0.8,
      duration: 26,
      delay: 3,
      animClass: ANIM_CLASSES[4],
    },
    {
      id: "cursor",
      element: <PixelCursor className="h-full w-full text-primary" />,
      startX: 78,
      startY: 42,
      size: "w-10 h-10 md:w-14 md:h-14",
      opacity: 0.7,
      duration: 30,
      delay: 5,
      animClass: ANIM_CLASSES[5],
    },
    {
      id: "monitor",
      element: <PixelMonitor className="h-full w-full text-primary" />,
      startX: 92,
      startY: 36,
      size: "w-12 h-12 md:w-16 md:h-16", 
      opacity: 0.7,
      duration: 34,
      delay: 7,
      animClass: ANIM_CLASSES[0],
    },
    {
      id: "smiley",
      element: <PixelSmiley className="h-full w-full text-primary" />,
      startX: 88,
      startY: 53,
      size: "w-12 h-12 md:w-16 md:h-16",
      opacity: 0.6,
      duration: 29,
      delay: 2,
      animClass: ANIM_CLASSES[3],
    },
    {
      id: "exclamation",
      element: <PixelExclamation className="h-full w-full text-primary" />,
      startX: 82,
      startY: 66,
      size: "w-4 h-12 md:w-5 md:h-16",
      opacity: 0.7,
      duration: 25,
      delay: 4,
      animClass: ANIM_CLASSES[1],
    },
    {
      id: "question",
      element: <PixelQuestion className="h-full w-full text-primary" />,
      startX: 88,
      startY: 78,
      size: "w-10 h-14 md:w-14 md:h-20",
      opacity: 0.7,
      duration: 33,
      delay: 6,
      animClass: ANIM_CLASSES[5],
    },
    {
      id: "cursor-left",
      element: <PixelCursor className="h-full w-full text-primary/20" />,
      startX: 4,
      startY: 63,
      size: "w-8 h-8 md:w-10 md:h-10",
      opacity: 1,
      duration: 36,
      delay: 8,
      animClass: ANIM_CLASSES[2],
    },
    {
      id: "cross-left",
      element: <PixelCross className="h-full w-full text-primary/15" />,
      startX: 10,
      startY: 76,
      size: "w-6 h-6 md:w-8 md:h-8",
      opacity: 1,
      duration: 40,
      delay: 3,
      animClass: ANIM_CLASSES[4],
    },
    {
      id: "dot-1",
      element: <div className="h-2 w-2 bg-primary/30" />,
      startX: 68,
      startY: 23,
      size: "",
      opacity: 1,
      duration: 22,
      delay: 1,
      animClass: ANIM_CLASSES[0],
    },
    {
      id: "dot-2",
      element: <div className="h-2 w-2 bg-accent/40" />,
      startX: 73,
      startY: 48,
      size: "",
      opacity: 1,
      duration: 27,
      delay: 5,
      animClass: ANIM_CLASSES[3],
    },
    {
      id: "dot-3",
      element: <div className="h-3 w-3 bg-primary/20" />,
      startX: 76,
      startY: 70,
      size: "",
      opacity: 1,
      duration: 31,
      delay: 9,
      animClass: ANIM_CLASSES[1],
    },
    {
      id: "dot-4",
      element: <div className="h-2 w-2 bg-primary/15" />,
      startX: 15,
      startY: 38,
      size: "",
      opacity: 1,
      duration: 24,
      delay: 6,
      animClass: ANIM_CLASSES[5],
    },
    {
      id: "dot-5",
      element: <div className="h-2 w-2 bg-accent/20" />,
      startX: 68,
      startY: 86,
      size: "",
      opacity: 1,
      duration: 20,
      delay: 0,
      animClass: ANIM_CLASSES[2],
    },
    {
      id: "checker-bl",
      element: (
        <div className="grid grid-cols-2 gap-[2px]">
          <div className="h-2 w-2 bg-primary/20 md:h-3 md:w-3" />
          <div className="h-2 w-2 bg-transparent md:h-3 md:w-3" />
          <div className="h-2 w-2 bg-transparent md:h-3 md:w-3" />
          <div className="h-2 w-2 bg-primary/20 md:h-3 md:w-3" />
        </div>
      ),
      startX: 6,
      startY: 84,
      size: "",
      opacity: 1,
      duration: 37,
      delay: 10,
      animClass: ANIM_CLASSES[4],
    },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`absolute h-24 w-24 md:h-48 md:w-48 ${
          mounted ? "animate-blob-1" : ""
        }`}
        style={{ left: "15%", top: "25%", opacity: 0.8 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full blur-2xl"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad-moon" x1="0%" y1="0%" x2="100%" y2="100%">
              {/* White -> Cyan -> Transparent Black */}
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M70 10 C 30 10 10 40 10 80 C 30 60 40 20 70 10 Z"
            fill="url(#grad-moon)"
          />
        </svg>
      </div>

      <div
        className={`absolute h-20 w-48 md:h-32 md:w-96 ${
          mounted ? "animate-blob-2" : ""
        }`}
        style={{ left: "45%", top: "50%", opacity: 0.9, transform: "rotate(-10deg)" }}
      >
        <svg
          viewBox="0 0 200 60"
          className="h-full w-full blur-2xl"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad-squiggle" x1="0%" y1="0%" x2="100%" y2="0%">
              {/* Cyan -> Black/Dark */}
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--background))" />
            </linearGradient>
          </defs>
          <path
            d="M10 30 Q 50 -10 90 30 T 170 30"
            fill="none"
            stroke="url(#grad-squiggle)"
            strokeWidth="25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className={`absolute h-12 w-48 md:h-16 md:w-72 ${
          mounted ? "animate-blob-1" : ""
        }`}
        style={{ 
          left: "20%", 
          top: "65%", 
          opacity: 0.8,
          transform: "rotate(5deg)",
          animationDelay: "2s"
        }}
      >
        <div className="h-full w-full rounded-[100%_0%_100%_0%/50%_50%_50%_50%] bg-gradient-to-r from-primary via-accent to-background blur-2xl" />
      </div>

      <div
        className={`absolute h-32 w-32 md:h-64 md:w-48 ${
          mounted ? "animate-blob-3" : ""
        }`}
        style={{ left: "75%", top: "20%", opacity: 0.8, animationDelay: "4s" }}
      >
        <svg
          viewBox="0 0 100 200"
          className="h-full w-full blur-2xl"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad-curve" x1="0%" y1="0%" x2="0%" y2="100%">
              {/* Cyan -> Transparent */}
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M50 10 C 100 50 100 80 50 100 C 0 120 0 150 50 190"
            fill="none"
            stroke="url(#grad-curve)"
            strokeWidth="30"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className={`absolute h-20 w-40 md:h-24 md:w-80 ${
          mounted ? "animate-blob-2" : ""
        }`}
        style={{ 
          left: "35%", 
          top: "85%", 
          opacity: 0.85, 
          animationDelay: "5s",
          transform: "rotate(170deg)",
        }}
      >
        <div className="h-full w-full rounded-[40%_60%_30%_70%/60%_40%_60%_40%] bg-gradient-to-r from-primary to-accent blur-3xl" />
      </div>

      {/* Hidden below md: at phone widths these overlap the hero copy and hurt
          readability far more than they add atmosphere. */}
      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute hidden md:block ${item.size} ${
            mounted ? item.animClass : ""
          }`}
          style={{
            left: `${item.startX}%`,
            top: `${item.startY}%`,
            opacity: item.opacity,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.element}
        </div>
      ))}
    </div>
  );
}