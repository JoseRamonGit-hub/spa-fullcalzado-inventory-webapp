import { describe, expect, it } from "vitest";
import { getTypeInfo } from "./columns";
import type { InventoryMovementWithRelations } from "@/types";

function statusMovement(type: "activation" | "deactivation") {
  return { type } as InventoryMovementWithRelations;
}

describe("movement status presentation", () => {
  it("presents activations as successful product-state events", () => {
    expect(getTypeInfo(statusMovement("activation"))).toMatchObject({
      variant: "success",
      label: "Activación",
      title: "Producto activado",
    });
  });

  it("presents deactivations as neutral product-state events", () => {
    expect(getTypeInfo(statusMovement("deactivation"))).toMatchObject({
      variant: "secondary",
      label: "Desactivación",
      title: "Producto desactivado",
    });
  });
});
