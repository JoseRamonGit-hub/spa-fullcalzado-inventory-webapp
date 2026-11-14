import type { ReactNode } from "react";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { Label } from "@/components/ui/label";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields } from "./cashea-order-fields";
import { PasteCasheaSummaryButton } from "./paste-cashea-summary-button";

type CasheaOrderSectionProps = {
  title: string;
  description: string;
  orderForm: CasheaOrderFormApi;
  titleFor?: string;
  action?: ReactNode;
  showFields?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export function CasheaOrderSection({
  title,
  description,
  orderForm,
  titleFor,
  action,
  showFields = true,
  disabled = false,
  children,
}: CasheaOrderSectionProps) {
  return (
    <section className="bg-card rounded-md border">
      <div className="flex items-center gap-3 p-3">
        <img src={casheaLogo} alt="" aria-hidden="true" className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          {titleFor ? (
            <Label htmlFor={titleFor} className="text-sm font-semibold">
              {title}
            </Label>
          ) : (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        {showFields && <PasteCasheaSummaryButton orderForm={orderForm} disabled={disabled} />}
        {action}
      </div>

      {showFields && (
        <div className="border-t p-3">
          <CasheaOrderFields orderForm={orderForm} disabled={disabled} />
        </div>
      )}

      {children}
    </section>
  );
}
