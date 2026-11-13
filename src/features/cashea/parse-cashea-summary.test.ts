import { describe, expect, it } from "vitest";
import { parseCasheaSummary } from "./parse-cashea-summary";

/** Resumen «Debe pagar» copiado del panel de Cashea: cada etiqueta y su valor en líneas separadas. */
const DEBE_PAGAR = [
  "# Orden",
  "6400685",
  "Total",
  "$ 185.6",
  "Cobrar hoy",
  "$ 92.80",
  "Financiado",
  "$ 92.80",
  "ID",
  "551-000738",
];

const DEBE_PAGAR_RESULT = {
  orderNumber: "6400685",
  totalUsd: 185.6,
  paidTodayUsd: 92.8,
  financedUsd: 92.8,
  invoiceNumber: "551-000738",
};

/** Detalle de una orden en el panel de Cashea: sin Monto financiado, con el historial de cuotas. */
const DETALLE_DE_ORDEN = [
  "Detalle de orden",
  "Monto Total: $92.80",
  "Pago inicial",
  "$ 46.40",
  "Segundo pago",
  "$ 15.47",
  "Tercer pago",
  "$ 15.47",
  "Cuarto pago",
  "$ 15.46",
];

const NOTHING_RECOGNIZED = {
  orderNumber: null,
  totalUsd: null,
  paidTodayUsd: null,
  financedUsd: null,
  invoiceNumber: null,
};

describe("parseCasheaSummary", () => {
  it("A. lee el resumen «Debe pagar» con cada etiqueta y su valor en líneas separadas", () => {
    expect(parseCasheaSummary(DEBE_PAGAR.join("\n"))).toEqual(DEBE_PAGAR_RESULT);
  });

  it("B. lee el resumen con cada etiqueta y su valor separados por tabulación", () => {
    const pairs = [];
    for (let i = 0; i < DEBE_PAGAR.length; i += 2) pairs.push(`${DEBE_PAGAR[i]}\t${DEBE_PAGAR[i + 1]}`);

    expect(parseCasheaSummary(pairs.join("\r\n"))).toEqual(DEBE_PAGAR_RESULT);
  });

  it("C. lee el resumen copiado en una sola línea", () => {
    expect(parseCasheaSummary(`Debe pagar ${DEBE_PAGAR.join(" ")}`)).toEqual(DEBE_PAGAR_RESULT);
  });

  it("D. lee montos con coma decimal", () => {
    expect(parseCasheaSummary("Total 185,60 Cobrar hoy 92,80 Financiado 92,80")).toEqual({
      ...NOTHING_RECOGNIZED,
      totalUsd: 185.6,
      paidTodayUsd: 92.8,
      financedUsd: 92.8,
    });
  });

  it("E. lee el detalle de orden y deriva el Monto financiado del total menos el pago inicial", () => {
    expect(parseCasheaSummary(DETALLE_DE_ORDEN.join("\n"))).toEqual({
      ...NOTHING_RECOGNIZED,
      totalUsd: 92.8,
      paidTodayUsd: 46.4,
      financedUsd: 46.4,
    });
  });

  it("F. devuelve los montos leídos tal cual aunque no cuadren", () => {
    expect(parseCasheaSummary("Total $ 100 Cobrar hoy $ 40 Financiado $ 50")).toEqual({
      ...NOTHING_RECOGNIZED,
      totalUsd: 100,
      paidTodayUsd: 40,
      financedUsd: 50,
    });
  });

  it.each(["hola", "", "   \n\t  "])("G. no reconoce nada en un texto irreconocible («%s»)", (text) => {
    expect(parseCasheaSummary(text)).toEqual(NOTHING_RECOGNIZED);
  });

  it("H. ignora los datos personales del cliente", () => {
    const text = ["Cliente", "María Pérez", "Cédula", "V-12345678", ...DEBE_PAGAR, "Teléfono", "0414-1234567"].join(
      "\n",
    );

    expect(parseCasheaSummary(text)).toEqual(DEBE_PAGAR_RESULT);
  });

  it("I. deja en null el dato que falta, sin afectar a los demás", () => {
    const withoutInvoice = DEBE_PAGAR.filter((line) => line !== "ID" && line !== "551-000738");

    expect(parseCasheaSummary(withoutInvoice.join("\n"))).toEqual({ ...DEBE_PAGAR_RESULT, invoiceNumber: null });
  });

  it("J. salta una etiqueta cuyo valor no tiene la forma del campo y prueba la siguiente aparición", () => {
    const text = ["Estado de la orden: En Progreso", "# Orden 6400685", ...DETALLE_DE_ORDEN].join("\n");

    expect(parseCasheaSummary(text).orderNumber).toBe("6400685");
  });

  it("L. no deduce montos sin etiqueta", () => {
    expect(parseCasheaSummary("185.60 92.80 92.80")).toEqual(NOTHING_RECOGNIZED);
  });

  it("reconoce las variantes de cada etiqueta sin distinguir mayúsculas ni acentos", () => {
    const text = [
      "N° de orden: 6400685",
      "MONTO TOTAL: $185.60",
      "Cobrado hoy: $92.80",
      "Financiádo: $92.80",
      "# de factura: A-551",
    ].join("\n");

    expect(parseCasheaSummary(text)).toEqual({ ...DEBE_PAGAR_RESULT, invoiceNumber: "A-551" });
  });

  it("busca «ID» como palabra completa", () => {
    expect(parseCasheaSummary("Cédula de identidad V-12345678 ID 551-000738").invoiceNumber).toBe("551-000738");
  });

  it("acepta «:» y «#» juntos tras la etiqueta y la puntuación que cierra el valor", () => {
    expect(parseCasheaSummary("Orden: #6400685, Total: $ 185.60. Factura: 551-000738.")).toEqual({
      ...NOTHING_RECOGNIZED,
      orderNumber: "6400685",
      totalUsd: 185.6,
      invoiceNumber: "551-000738",
    });
  });

  it.each(["Total $ 1,234.50", "Total 1.234,50"])("K. lee el separador de miles en «%s»", (text) => {
    expect(parseCasheaSummary(text).totalUsd).toBe(1234.5);
  });

  it("distingue el separador de miles del decimal cuando hay uno solo", () => {
    expect(parseCasheaSummary("Total 1.234").totalUsd).toBe(1234);
    expect(parseCasheaSummary("Total 1,5").totalUsd).toBe(1.5);
  });

  it("ignora un monto con grupos de miles que no tienen sentido", () => {
    expect(parseCasheaSummary("Total 0.004").totalUsd).toBeNull();
    expect(parseCasheaSummary("Total 1.234.56").totalUsd).toBeNull();
  });
});
