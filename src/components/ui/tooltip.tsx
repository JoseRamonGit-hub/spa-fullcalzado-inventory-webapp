"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type TouchTooltipContextValue = {
  beginTouch: () => void;
  clearTouchState: () => void;
  contentRef: React.RefCallback<HTMLDivElement>;
  isTouchOpen: boolean;
  toggleTouch: () => void;
  triggerRef: React.RefCallback<HTMLElement>;
};

const TouchTooltipContext = React.createContext<TouchTooltipContextValue | null>(null);

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [touchOpen, setTouchOpen] = React.useState<boolean | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerElementRef = React.useRef<HTMLElement | null>(null);
  const contentElementRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (touchOpen !== true) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || triggerElementRef.current?.contains(target) || contentElementRef.current?.contains(target)) return;
      setTouchOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTouchOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [touchOpen]);

  const contextValue: TouchTooltipContextValue = {
    beginTouch: () => setTouchOpen((current) => (current === true ? true : false)),
    clearTouchState: () => setTouchOpen(null),
    contentRef: (element) => {
      contentElementRef.current = element;
    },
    isTouchOpen: touchOpen === true,
    toggleTouch: () => setTouchOpen((current) => current !== true),
    triggerRef: (element) => {
      triggerElementRef.current = element;
    },
  };

  const open = touchOpen === null ? (openProp ?? uncontrolledOpen) : touchOpen;

  return (
    <TouchTooltipContext.Provider value={contextValue}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        onOpenChange={(nextOpen) => {
          // Radix closes tooltips as soon as a finger leaves the trigger. While a touch tooltip is pinned,
          // its explicit toggle/outside-dismiss lifecycle takes precedence; pointer and keyboard behavior remains native.
          if (touchOpen !== true) {
            if (touchOpen === false && nextOpen) setTouchOpen(null);
            if (openProp === undefined) setUncontrolledOpen(nextOpen);
            onOpenChange?.(nextOpen);
          }
        }}
        {...props}
      />
    </TouchTooltipContext.Provider>
  );
}

function TooltipTrigger({
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const touchTooltip = React.useContext(TouchTooltipContext);
  const touchGestureRef = React.useRef<{ clientX: number; clientY: number; moved: boolean } | null>(null);

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      ref={touchTooltip?.triggerRef}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && event.pointerType === "touch") {
          touchGestureRef.current = { clientX: event.clientX, clientY: event.clientY, moved: false };
          touchTooltip?.beginTouch();
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const touchGesture = touchGestureRef.current;
        if (event.pointerType === "touch" && touchGesture) {
          const movedX = event.clientX - touchGesture.clientX;
          const movedY = event.clientY - touchGesture.clientY;
          if (Math.hypot(movedX, movedY) > 8) touchGesture.moved = true;
        }
        if (!event.defaultPrevented && event.pointerType === "mouse" && touchTooltip?.isTouchOpen) {
          touchTooltip.clearTouchState();
        }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        const touchGesture = touchGestureRef.current;
        touchGestureRef.current = null;
        if (!event.defaultPrevented && event.pointerType === "touch" && touchGesture && !touchGesture.moved) {
          touchTooltip?.toggleTouch();
        }
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (event.pointerType === "touch") touchGestureRef.current = null;
      }}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const touchTooltip = React.useContext(TouchTooltipContext);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        ref={touchTooltip?.contentRef}
        sideOffset={sideOffset}
        className={cn(
          "animate-in bg-foreground text-background fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
