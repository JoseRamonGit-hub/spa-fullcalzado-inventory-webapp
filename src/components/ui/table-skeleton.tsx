import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

type TableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
};

// Width patterns to organically simulate real data columns
// (code, description, numeric, numeric, numeric, badge, actions)
const widthPatterns = [
  "w-14", // 0: Short code
  "w-3/4", // 1: Long description
  "w-10", // 2: Numeric
  "w-12", // 3: Currency
  "w-16", // 4: Currency wider
  "w-12", // 5: Badge/status
  "w-14", // 6: Actions
  "w-10", // 7: Fallback
];

function getWidth(colIndex: number, columnCount: number): string {
  // Last column is always small (actions or similar)
  if (colIndex === columnCount - 1) return "w-12";
  // First column is short (code/type)
  if (colIndex === 0) return "w-14";
  // Second column is wide (descriptions)
  if (colIndex === 1) return "w-3/4";
  // Middle columns alternate
  return widthPatterns[colIndex] || widthPatterns[colIndex % widthPatterns.length];
}

export function TableSkeleton({ columnCount, rowCount = 8 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className={`border-border/40 border-b ${rowIndex % 2 === 1 ? "bg-table-stripe" : ""}`}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell key={colIndex} className="px-2.5 py-1 whitespace-nowrap">
              <Skeleton className={`h-4 rounded ${getWidth(colIndex, columnCount)}`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
