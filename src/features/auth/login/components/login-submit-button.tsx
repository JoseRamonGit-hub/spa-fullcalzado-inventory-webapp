import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useFormContext } from "@/hooks/form";

export function LoginSubmitButton({ isPending }: { isPending: boolean }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          className="group h-11 w-full gap-2 text-sm font-semibold transition-[filter,box-shadow,transform] hover:shadow-md hover:brightness-110 active:scale-[0.98]"
          disabled={!canSubmit || isPending || isSubmitting}
        >
          {isPending || isSubmitting ? (
            <span className="inline-flex items-center gap-2" role="status">
              <span
                className="border-primary-foreground/30 border-t-primary-foreground size-4 animate-spin rounded-full border-2"
                aria-hidden="true"
              />
              Entrando…
            </span>
          ) : (
            <>
              Entrar al panel
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </Button>
      )}
    </form.Subscribe>
  );
}
