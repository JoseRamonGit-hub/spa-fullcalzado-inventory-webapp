import { Card, CardContent } from "@/components/ui/card";
import { useLogin } from "./hooks/useLogin";
import { LoginForm } from "./components/login-form";
import { LoginPanel } from "./components/login-panel";
import { LoginFooter } from "./components/login-footer";

export function LoginPage() {
  const { mutate, isPending } = useLogin();

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="border-border/50 overflow-hidden p-0 shadow-xl">
          <CardContent className="grid p-0 md:min-h-120 md:grid-cols-2">
            <LoginPanel />
            <LoginForm onSubmit={mutate} isPending={isPending} />
          </CardContent>
        </Card>
        <LoginFooter />
      </section>
    </main>
  );
}
