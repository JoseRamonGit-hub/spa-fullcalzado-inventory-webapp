import * as React from "react";

import { cn } from "@/lib/utils";
import { ScrollShadow } from "@/components/ui/scroll-shadow";

export type TableDensity = "default" | "operational" | "compact";

type TableProps = React.ComponentProps<"table"> & {
  scrollShadow?: boolean;
  scrollAreaLabel?: string;
  density?: TableDensity;
};

const TableDensityContext = React.createContext<TableDensity>("default");

const tableTextClassNames: Record<TableDensity, string> = {
  default: "text-sm",
  operational: "text-[13px]",
  compact: "text-xs",
};

const tableHeadDensityClassNames: Record<TableDensity, string> = {
  default: "h-7 px-3",
  operational: "h-7 px-4",
  compact: "h-7 px-3",
};

const tableCellDensityClassNames: Record<TableDensity, string> = {
  default: "p-2",
  operational: "h-[30px] px-4 py-0 text-[13px]",
  compact: "h-7 px-3 py-1.5 text-xs",
};

function Table({ className, scrollShadow = true, scrollAreaLabel, density = "default", ...props }: TableProps) {
  const table = (
    <table
      data-slot="table"
      data-density={density}
      className={cn("w-full caption-bottom", tableTextClassNames[density], className)}
      {...props}
    />
  );

  const content = !scrollShadow ? (
    <div data-slot="table-container" className="relative h-full w-full">
      {table}
    </div>
  ) : (
    <ScrollShadow
      containerClassName="h-full w-full"
      className="custom-scrollbar overflow-x-auto"
      data-slot="table-container"
      role={scrollAreaLabel ? "region" : undefined}
      aria-label={scrollAreaLabel}
      tabIndex={scrollAreaLabel ? 0 : undefined}
    >
      {table}
    </ScrollShadow>
  );

  return <TableDensityContext.Provider value={density}>{content}</TableDensityContext.Provider>;
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const density = React.useContext(TableDensityContext);

  return (
    <th
      data-slot="table-head"
      className={cn(
        "operational-label text-muted-foreground text-left align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] [&>button]:uppercase [&>div]:uppercase [&>span]:uppercase",
        tableHeadDensityClassNames[density],
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const density = React.useContext(TableDensityContext);

  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        tableCellDensityClassNames[density],
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
