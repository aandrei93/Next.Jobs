"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getRevealTargets() {
  const directChildren = Array.from(document.querySelectorAll("main > *"));
  return directChildren.filter((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.reveal !== "off");
}

export function GlobalScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = getRevealTargets();
    if (prefersReducedMotion || targets.length === 0) {
      return;
    }
    const delays = new Map<HTMLElement, number>(
      targets.map((target, index) => [target, Math.min(index * 30, 180)])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (!target.classList.contains("reveal-up")) {
              const delay = delays.get(target) || 0;
              target.animate(
                [
                  { opacity: 0, transform: "translateY(22px) scale(0.99)", filter: "blur(3px)" },
                  { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
                ],
                {
                  duration: 560,
                  delay,
                  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                  fill: "both",
                }
              );
            }
            observer.unobserve(target);
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    for (const target of targets) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
