import { describe, expect, it } from "vitest";
import { getMovementTypeInfo } from "./movement-presentation";
import type { InventoryMovementWithRelations } from "@/types";

function statusMovement(type: "activation" | "deactivation") {
  return { type } as InventoryMovementWithRelations;
}

describe("movement status presentation", () => {
  it("presents activations as successful product-state events", () => {
    expect(getMovementTypeInfo(statusMovement("activation"))).toMatchObject({
      variant: "success",
      label: "Activación",
      title: "Producto activado",
    });
  });

  it("presents deactivations as destructive product-state events", () => {
    expect(getMovementTypeInfo(statusMovement("deactivation"))).toMatchObject({
      variant: "destructive",
      label: "Desactivación",
      title: "Producto desactivado",
    });
  });
});
