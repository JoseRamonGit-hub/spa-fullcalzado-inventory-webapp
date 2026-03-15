import { redirect } from "@tanstack/react-router";

type RouteContext = {
  auth?: {
    isAuthenticated: boolean;
  };
};

export function requireAuthenticated(context: RouteContext) {
  if (!context.auth?.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

export function requireGuest(context: RouteContext) {
  if (context.auth?.isAuthenticated) {
    throw redirect({ to: "/inventory" });
  }
}
