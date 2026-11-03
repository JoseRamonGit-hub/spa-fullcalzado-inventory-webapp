import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginPage } from "@/features/auth/login/page";

const searchSchema = z.object({
  /** Path to return to after signing in (set when a protected route bounced the user). */
  redirect: z.string().optional().catch(undefined),
  /** Why the user landed here, so the form can explain it. */
  reason: z.enum(["expired"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});
