import { describe, it, expect, vi } from "vitest";
import { requireAuthenticated, requireGuest } from "./routeGuards";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((options: { to: string }) => options),
}));

vi.mock("@tanstack/react-router", () => ({
  redirect: mockRedirect,
}));

describe("routeGuards", () => {
  it("requireAuthenticated redirects to /login when auth context is missing", () => {
    expect(() => requireAuthenticated({})).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: "/login" });
  });

  it("requireAuthenticated allows access when user is authenticated", () => {
    expect(() =>
      requireAuthenticated({
        auth: { isAuthenticated: true },
      }),
    ).not.toThrow();
  });

  it("requireGuest redirects authenticated users to /inventory", () => {
    expect(() =>
      requireGuest({
        auth: { isAuthenticated: true },
      }),
    ).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: "/inventory" });
  });
});
