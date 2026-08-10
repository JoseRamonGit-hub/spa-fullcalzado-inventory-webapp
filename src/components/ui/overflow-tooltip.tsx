import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type OverflowTooltipProps = Omit<ComponentProps<"span">, "children"> & {
  children: ReactNode;
  content?: ReactNode;
  contentClassName?: string;
  focusable?: boolean;
  side?: ComponentProps<typeof TooltipContent>["side"];
};

export function OverflowTooltip({
  children,
  content = children,
  className,
  contentClassName,
  focusable = true,
  side = "top",
  tabIndex,
  ...props
}: OverflowTooltipProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const updateOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
    };

    const frame = window.requestAnimationFrame(updateOverflow);
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children]);

  return (
    <Tooltip open={isOverflowing && isOpen} onOpenChange={(open) => setIsOpen(isOverflowing && open)}>
      <TooltipTrigger asChild>
        <span
          ref={textRef}
          tabIndex={tabIndex ?? (focusable && isOverflowing ? 0 : undefined)}
          className={cn(
            "focus-visible:ring-ring/50 block min-w-0 truncate rounded-xs outline-none focus-visible:ring-2",
            className,
          )}
          {...props}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={4} className={cn("max-w-xs break-words", contentClassName)}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
