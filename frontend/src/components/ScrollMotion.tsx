"use client";

import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    // App Router can hydrate client page boundaries after this root effect runs.
    // Start DOM reveal mutations after that initial hydration pass.
    const startupTimer = window.setTimeout(() => {
    const root = document.documentElement;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const selector = "[data-reveal], [data-reveal-group]";
    const pendingFrames = new Set<number>();
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              (entry.target as HTMLElement).dataset.revealState = "shown";
              observer?.unobserve(entry.target);
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
        );

    const scheduleObservation = (element: HTMLElement) => {
      let firstFrame = 0;
      firstFrame = requestAnimationFrame(() => {
        pendingFrames.delete(firstFrame);
        let secondFrame = 0;
        secondFrame = requestAnimationFrame(() => {
          pendingFrames.delete(secondFrame);
          if (element.dataset.revealState !== "waiting") return;
          if (motionPreference.matches) {
            element.dataset.revealState = "shown";
            return;
          }
          observer?.observe(element);
        });
        pendingFrames.add(secondFrame);
      });
      pendingFrames.add(firstFrame);
    };

    const cancelPendingFrames = () => {
      pendingFrames.forEach(cancelAnimationFrame);
      pendingFrames.clear();
    };

    const setStaggerDelay = (element: HTMLElement, index: number) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 90, 900)}ms`);
    };

    const reveal = (element: HTMLElement) => {
      if (element.dataset.revealState) return;
      if (element.dataset.revealOrder !== undefined) {
        setStaggerDelay(element, Number(element.dataset.revealOrder) || 0);
      }
      if (element.hasAttribute("data-reveal-group")) {
        Array.from(element.children).forEach((child, index) => {
          setStaggerDelay(child as HTMLElement, index);
        });
      }
      if (!observer || motionPreference.matches) {
        element.dataset.revealState = "shown";
        return;
      }
      element.dataset.revealState = "waiting";
      scheduleObservation(element);
    };

    const scan = (node: Node) => {
      if (node instanceof HTMLElement && node.matches(selector)) reveal(node);
      if (node instanceof Element || node instanceof Document || node instanceof DocumentFragment) {
        node.querySelectorAll<HTMLElement>(selector).forEach(reveal);
      }
    };

    const showAll = () => {
      if (!motionPreference.matches) return;
      cancelPendingFrames();
      observer?.disconnect();
      document.querySelectorAll<HTMLElement>('[data-reveal-state="waiting"]').forEach((element) => {
        element.dataset.revealState = "shown";
      });
    };

    root.classList.add("motion-ready");
    scan(document.body);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(scan));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    motionPreference.addEventListener("change", showAll);
    const stop = () => {
      cancelPendingFrames();
      observer?.disconnect();
      mutationObserver.disconnect();
      motionPreference.removeEventListener("change", showAll);
      root.classList.remove("motion-ready");
      document.querySelectorAll<HTMLElement>("[data-reveal-state]").forEach((element) => {
        delete element.dataset.revealState;
      });
    };

    return stop;
    }, 1000);
    return () => window.clearTimeout(startupTimer);
  }, []);

  return null;
}
