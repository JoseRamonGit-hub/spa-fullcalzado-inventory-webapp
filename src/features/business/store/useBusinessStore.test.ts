import { beforeEach, describe, expect, it } from "vitest";
import { useBusinessStore } from "./useBusinessStore";
import type { Business, User } from "@/types";

const FULL_ID = "10000000-0000-0000-0000-000000000001";
const ESTILOS_ID = "10000000-0000-0000-0000-000000000002";

const businesses: Business[] = [
  {
    id: FULL_ID,
    name: "Full Calzado C.A.",
    slug: "full-calzado",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: ESTILOS_ID,
    name: "Zapatería Estilos C.A.",
    slug: "zapateria-estilos",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const admin = {
  id: "admin-1",
  email: "admin@test.com",
  fullname: "Admin",
  role: "admin",
  default_business_id: FULL_ID,
} as User;

const employee = {
  id: "employee-1",
  email: "employee@test.com",
  fullname: "Employee",
  role: "employee",
  default_business_id: ESTILOS_ID,
} as User;

describe("useBusinessStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useBusinessStore.setState({
      userId: null,
      activeBusinessId: null,
      selectedBusinessByUser: {},
    });
  });

  it("inicia una sesión administrativa en Full Calzado por defecto", () => {
    useBusinessStore.getState().syncBusinessContext(admin, businesses);

    expect(useBusinessStore.getState().activeBusinessId).toBe(FULL_ID);
  });

  it("persiste únicamente la selección por usuario mediante Zustand", () => {
    useBusinessStore.getState().syncBusinessContext(admin, businesses);
    useBusinessStore.getState().setActiveBusiness(ESTILOS_ID, businesses);

    const persisted = JSON.parse(window.localStorage.getItem("business-selection") ?? "{}");

    expect(persisted.state).toEqual({
      selectedBusinessByUser: { [admin.id]: ESTILOS_ID },
    });
    expect(persisted.state.businesses).toBeUndefined();
  });

  it("restaura una selección persistida que todavía es accesible", () => {
    useBusinessStore.setState({
      selectedBusinessByUser: { [admin.id]: ESTILOS_ID },
    });

    useBusinessStore.getState().syncBusinessContext(admin, businesses);

    expect(useBusinessStore.getState().activeBusinessId).toBe(ESTILOS_ID);
  });

  it("descarta una selección persistida cuando el usuario perdió acceso", () => {
    useBusinessStore.setState({
      selectedBusinessByUser: { [employee.id]: FULL_ID },
    });

    useBusinessStore.getState().syncBusinessContext(employee, [businesses[1]]);

    expect(useBusinessStore.getState().activeBusinessId).toBe(ESTILOS_ID);
    expect(useBusinessStore.getState().selectedBusinessByUser[employee.id]).toBe(ESTILOS_ID);
  });

  it("rechaza seleccionar un negocio que no está en los accesos cargados", () => {
    useBusinessStore.getState().syncBusinessContext(admin, [businesses[0]]);

    const changed = useBusinessStore.getState().setActiveBusiness(ESTILOS_ID, [businesses[0]]);

    expect(changed).toBe(false);
    expect(useBusinessStore.getState().activeBusinessId).toBe(FULL_ID);
  });

  it("limpia el contexto en memoria sin borrar la preferencia persistida", () => {
    useBusinessStore.getState().syncBusinessContext(admin, businesses);
    useBusinessStore.getState().setActiveBusiness(ESTILOS_ID, businesses);

    useBusinessStore.getState().clear();

    expect(useBusinessStore.getState().userId).toBeNull();
    expect(useBusinessStore.getState().activeBusinessId).toBeNull();
    expect(useBusinessStore.getState().selectedBusinessByUser[admin.id]).toBe(ESTILOS_ID);
  });
});
