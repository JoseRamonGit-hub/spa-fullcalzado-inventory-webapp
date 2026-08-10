export function formatProductStagnantDays(stagnantDays: number | null): string {
  if (stagnantDays === null) return "—";
  return `${stagnantDays} ${stagnantDays === 1 ? "día" : "días"}`;
}
