import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useFormContext } from "@/hooks/form";

export function LoginSubscribeButton({ isPending }: { isPending: boolean }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          className="group mt-2 h-12 w-full gap-2 text-sm font-semibold transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
          disabled={!canSubmit || isPending || isSubmitting}
        >
          {isPending || isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Iniciando...
            </span>
          ) : (
            <>
              Entrar al panel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      )}
    </form.Subscribe>
  );
}
