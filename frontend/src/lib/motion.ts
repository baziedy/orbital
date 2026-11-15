import gsap from "gsap";

type AnimationScope = Element | string | object | undefined;

/** Run scoped GSAP work only when the visitor has not requested reduced motion. */
export function animateWithMotionPreference(
  scope: AnimationScope,
  animation: () => void,
  reducedMotion?: () => void
): () => void {
  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: reduce)", () => {
    reducedMotion?.();
  });

  media.add("(prefers-reduced-motion: no-preference)", () => {
    const context = gsap.context(animation, scope);
    return () => context.revert();
  });

  return () => media.revert();
}
