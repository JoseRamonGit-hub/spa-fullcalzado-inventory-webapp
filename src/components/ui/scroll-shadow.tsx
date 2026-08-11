import * as React from "react";

import { cn } from "@/lib/utils";

type ScrollShadowProps = React.ComponentProps<"div"> & {
  containerClassName?: string;
};

function ScrollShadow({ className, containerClassName, children, ...props }: ScrollShadowProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [visibleEdges, setVisibleEdges] = React.useState({ left: false, right: false });

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateVisibleEdges = () => {
      const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const nextEdges = {
        left: viewport.scrollLeft > 1,
        right: viewport.scrollLeft < maxScrollLeft - 1,
      };

      setVisibleEdges((currentEdges) =>
        currentEdges.left === nextEdges.left && currentEdges.right === nextEdges.right ? currentEdges : nextEdges,
      );
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateVisibleEdges);
    const observeContent = () => {
      resizeObserver?.observe(viewport);
      viewport
        .querySelectorAll<HTMLElement>(":scope > *, table")
        .forEach((element) => resizeObserver?.observe(element));
      updateVisibleEdges();
    };
    const mutationObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(observeContent);

    observeContent();
    mutationObserver?.observe(viewport, { childList: true, subtree: true });
    viewport.addEventListener("scroll", updateVisibleEdges, { passive: true });
    window.addEventListener("resize", updateVisibleEdges);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      viewport.removeEventListener("scroll", updateVisibleEdges);
      window.removeEventListener("resize", updateVisibleEdges);
    };
  }, []);

  return (
    <div data-slot="scroll-shadow" className={cn("relative min-h-0 min-w-0", containerClassName)}>
      <div
        ref={viewportRef}
        data-slot="scroll-shadow-viewport"
        className={cn(
          "focus-visible:ring-ring/50 h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-inset",
          className,
        )}
        {...props}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        data-visible={visibleEdges.left}
        className="from-foreground/10 pointer-events-none absolute inset-y-0 left-0 z-[2] w-4 bg-linear-to-r to-transparent opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100 motion-reduce:transition-none"
      />
      <div
        aria-hidden="true"
        data-visible={visibleEdges.right}
        className="from-foreground/10 pointer-events-none absolute inset-y-0 right-0 z-[2] w-4 bg-linear-to-l to-transparent opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100 motion-reduce:transition-none"
      />
    </div>
  );
}

export { ScrollShadow };
