import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Tracks when a landing page section scrolls into view (once per session).
 * Usage: const ref = useSectionTracking("how_it_works");
 *        <section ref={ref}>…</section>
 */
export function useSectionTracking(sectionName: string) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          trackEvent("landing.section_viewed", { section: sectionName });
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionName]);

  return ref;
}
