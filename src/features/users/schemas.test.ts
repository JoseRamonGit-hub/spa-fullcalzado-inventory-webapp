import { describe, expect, it } from "vitest";
import { $createUserFormSchema } from "./schemas";

const fullBusinessId = "10000000-0000-0000-0000-000000000001";
const estilosBusinessId = "10000000-0000-0000-0000-000000000002";

describe("user form schemas", () => {
  it("acepta identificadores UUID válidos para Postgres aunque no tengan versión RFC", () => {
    const result = $createUserFormSchema.safeParse({
      fullname: "Luis Rojas",
      email: "LUIS@TIENDA.COM",
      password: "password123",
      role: "employee",
      is_active: true,
      business_ids: [fullBusinessId, estilosBusinessId],
      default_business_id: estilosBusinessId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("luis@tienda.com");
      expect(result.data.default_business_id).toBe(estilosBusinessId);
    }
  });
});
