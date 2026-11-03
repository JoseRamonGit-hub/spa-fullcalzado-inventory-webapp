import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useLogin } from "./useLogin";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { User } from "@/types";
import type { ReactNode } from "react";
import { businessesService } from "@/services/businessesService";

vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock("@/services/businessesService", () => ({
  businessesService: {
    getAccessible: vi.fn().mockResolvedValue([]),
  },
}));

const mockLogin = vi.mocked(authService.login);

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

const fakeUser: User = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test User",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
} as User;

function createWrapper() {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
  };
}

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
    });
    useBusinessStore.setState({
      userId: null,
      activeBusinessId: null,
      selectedBusinessByUser: {},
    });
  });

  it("en login exitoso: setea el store y navega a /dashboard", async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      user: fakeUser,
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: "test@test.com", password: "pass123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(businessesService.getAccessible).toHaveBeenCalled();

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("con redirect seguro: vuelve a la ruta original y recuerda el correo", async () => {
    mockLogin.mockResolvedValueOnce({ success: true, user: fakeUser });

    const { result } = renderHook(() => useLogin("/inventory?status=low_stock"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: " Test@Test.com ", password: "pass123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith({ href: "/inventory?status=low_stock" });
    expect(localStorage.getItem("last-login-email")).toBe("test@test.com");
  });

  it("ignora redirects externos y navega a /dashboard", async () => {
    mockLogin.mockResolvedValueOnce({ success: true, user: fakeUser });

    const { result } = renderHook(() => useLogin("//evil.com"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: "test@test.com", password: "pass123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("en credenciales incorrectas: expone el error y NO navega", async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: "Credenciales incorrectas",
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: "bad@test.com", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().user).toBeNull();

    expect(result.current.error?.message).toBe("Credenciales incorrectas");

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("en error de red: expone el error y NO navega", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: "bad@test.com", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().user).toBeNull();

    expect(result.current.error?.message).toBe("Failed to fetch");

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
