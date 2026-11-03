import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatDateTime } from "@/utils/formatters";
import type { StockPoint } from "../product-detail-presentation";

const chartConfig = {
  stock: { label: "Stock", color: "var(--primary)" },
} satisfies ChartConfig;

type ProductStockChartProps = {
  points: StockPoint[];
  isLoading: boolean;
};

/** Compact step chart of how the stock moved during the selected history period. */
export function ProductStockChart({ points, isLoading }: ProductStockChartProps) {
  if (isLoading) {
    return <div className="bg-muted/60 h-16 w-full animate-pulse rounded-md" aria-hidden="true" />;
  }

  if (points.length < 2) {
    return (
      <div className="text-muted-foreground flex h-16 items-center text-xs">
        Sin movimientos de stock en el período.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-16 w-full" aria-hidden="true">
      <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id="product-stock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-stock)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-stock)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis hide dataKey="time" type="number" scale="time" domain={["dataMin", "dataMax"]} />
        {/* Headroom keeps the line off the top edge when the stock barely moves */}
        <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25) || 1]} />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as StockPoint | undefined;
            if (!active || !point) return null;
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
                <p className="text-muted-foreground">{formatDateTime(point.time)}</p>
                <p className="tabular-value font-semibold">Stock: {point.stock}</p>
              </div>
            );
          }}
        />
        <Area
          dataKey="stock"
          type="stepAfter"
          stroke="var(--color-stock)"
          strokeWidth={1.75}
          fill="url(#product-stock-fill)"
          isAnimationActive={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
