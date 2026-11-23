export function CasheaOrderNumber({ value }: { value: string }) {
  return <span className="product-code text-[length:inherit]">#{value.replace(/^#+/, "")}</span>;
}
