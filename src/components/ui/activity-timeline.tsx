import type { ReactNode } from "react";

type ActivityEvent = {
  id: string;
  label: ReactNode;
  metadata?: ReactNode;
  note?: string | null;
};

export function ActivityTimeline({ title, events }: { title: string; events: ActivityEvent[] }) {
  return (
    <section className="mt-6">
      <h3 className="font-heading mb-3 text-sm font-semibold">{title}</h3>
      <ol role="list">
        {events.map(({ id, label, metadata, note }) => (
          <li
            key={id}
            className="before:bg-border relative flex flex-col items-start gap-0.5 ps-6 pb-3 text-xs leading-4 [overflow-wrap:anywhere] before:absolute before:start-1.5 before:top-2 before:-bottom-2 before:w-px after:absolute after:start-0.75 after:top-1 after:size-1.75 after:rounded-full after:bg-[color-mix(in_oklab,var(--muted-foreground)_60%,var(--background))] last:pb-0 last:before:hidden"
          >
            {metadata && <div className="tabular-value text-muted-foreground">{metadata}</div>}
            <div className="font-medium">{label}</div>
            {note && <p className="text-muted-foreground whitespace-pre-wrap">{note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
