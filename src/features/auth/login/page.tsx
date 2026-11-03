import { useSearch } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useLogin } from "./hooks/useLogin";
import { LoginForm } from "./components/login-form";
import { LoginPanel } from "./components/login-panel";
import { LoginFooter } from "./components/login-footer";

export function LoginPage() {
  const { redirect, reason } = useSearch({ from: "/_auth/login" });
  const { mutate, isPending, error } = useLogin(redirect);

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-6 md:p-10">
      <section className="flex w-full max-w-md flex-col gap-6 md:max-w-5xl">
        <Card className="border-border/60 gap-0 overflow-hidden p-0 shadow-xl">
          {/* Wider photo column keeps the landscape photo close to its own proportions */}
          <CardContent className="grid p-0 md:min-h-136 md:grid-cols-[1.15fr_1fr]">
            <LoginPanel />
            <LoginForm onSubmit={mutate} isPending={isPending} error={error} sessionExpired={reason === "expired"} />
          </CardContent>
        </Card>
        <LoginFooter />
      </section>
    </main>
  );
}
