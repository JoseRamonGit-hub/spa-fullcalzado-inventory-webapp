export function formatProductStagnantDays(stagnantDays: number | null): string {
  if (stagnantDays === null) return "—";
  // The backend counts full days between the anchor and today, so a sale made today comes back as -1.
  const days = Math.max(0, stagnantDays);
  return `${days} ${days === 1 ? "día" : "días"}`;
}
