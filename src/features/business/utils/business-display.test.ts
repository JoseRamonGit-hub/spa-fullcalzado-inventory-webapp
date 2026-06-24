import { describe, expect, it } from "vitest";
import { getBusinessInitials } from "./business-display";

describe("getBusinessInitials", () => {
  it("ignora sufijos legales", () => {
    expect(getBusinessInitials("Full Calzado C.A.")).toBe("FC");
    expect(getBusinessInitials("Zapatería Estilos C.A.")).toBe("ZE");
  });

  it("maneja nombres cortos y vacíos", () => {
    expect(getBusinessInitials("Estilos")).toBe("ES");
    expect(getBusinessInitials("   ")).toBe("—");
  });
});
