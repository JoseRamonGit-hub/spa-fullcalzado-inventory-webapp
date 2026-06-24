import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useLogout } from "./useLogout";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { User } from "@/types";
import type { ReactNode } from "react";

vi.mock("@/services/authService", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

const mockLogout = vi.mocked(authService.logout);

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

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
    });
  });

  it("limpia el store y navega a /login", async () => {
    useAuthStore.getState().setAuth(fakeUser);
    expect(useAuthStore.getState().user).toEqual(fakeUser);

    mockLogout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(useAuthStore.getState().user).toBeNull();

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/login",
      replace: true,
    });
  });

  it("aún limpia y navega INCLUSO si signOut falla", async () => {
    useAuthStore.getState().setAuth(fakeUser);
    mockLogout.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/login",
        replace: true,
      });
    });

    expect(useAuthStore.getState().user).toBeNull();
  });
});
