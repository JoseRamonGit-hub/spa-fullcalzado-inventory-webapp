import { readInvoiceNumber, readPanelAmount, type CasheaParseResult } from "./values";

const ORDER_HEADING = /^detalle de orden\s*#\s*(\d+)$/i;
const PAYMENT_PLAN_HEADING = /^plan de pago de(?:\s+(.+))?$/i;
const SALE_CHANNEL_HEADING = /^canal de venta$/i;

/** Vista «Detalle de orden» con línea de entrega, plan de pago y bloque de datos de la venta. */
export function readOrderDetail(lines: readonly string[]): CasheaParseResult | null {
  const orderNumber = lines.find((line) => ORDER_HEADING.test(line))?.match(ORDER_HEADING)?.[1] ?? null;
  const planStart = lines.findIndex((line) => PAYMENT_PLAN_HEADING.test(line));
  const saleInfoStart = lines.findIndex((line) => SALE_CHANNEL_HEADING.test(line));
  const hasDeliverySection = lines.some((line) => /^entrega del producto$/i.test(line));
  if (planStart === -1 && !(orderNumber && (saleInfoStart !== -1 || hasDeliverySection))) return null;

  const planHeading = lines[planStart]?.match(PAYMENT_PLAN_HEADING);
  const invoiceStart = saleInfoStart === -1 ? planStart : saleInfoStart;
  return {
    orderNumber,
    totalUsd: readPanelAmount(planHeading?.[1] ?? ""),
    paidTodayUsd: planHeading ? readInitialPayment(lines.slice(planStart + 1)) : null,
    financedUsd: null,
    invoiceNumber: invoiceStart === -1 ? null : readSaleInvoice(lines.slice(invoiceStart + 1)),
  };
}

function readInitialPayment(plan: readonly string[]): number | null {
  const paymentIndex = /^qr$/i.test(plan[0] ?? "") ? 1 : 0;
  if (!/^pagada$/i.test(plan[paymentIndex] ?? "")) return null;

  // Si el primer pago está incompleto, su fecha o la siguiente cuota ocupan el lugar del importe.
  const nextLine = plan[paymentIndex + 1] ?? "";
  const amount = /^por /i.test(nextLine) ? (plan[paymentIndex + 2] ?? "") : nextLine;
  return amount.startsWith("$") ? readPanelAmount(amount) : null;
}

function readSaleInvoice(lines: readonly string[]): string | null {
  for (const [index, line] of lines.entries()) {
    if (/^datos de comprador$/i.test(line)) break;

    const label = /^factura(?:\s*:\s*|\s+|$)(.*)$/i.exec(line);
    if (!label) continue;

    // Lee el valor completo: un día seguido por mes y año en la línea de entrega no es una factura.
    const invoice = readInvoiceNumber(label[1] || lines[index + 1] || "");
    if (invoice !== null) return invoice;
  }
  return null;
}
