export function getStripedRowClass(index: number) {
  return index % 2 === 1 ? "bg-table-stripe" : "";
}
