import { useEffect, useRef, useState, type ReactNode } from "react";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import type { CasheaOrderFormApi } from "../hooks/use-cashea-order-form";
import { CasheaOrderFields, CasheaOrderNotices } from "./cashea-order-fields";
import { PasteCasheaSummaryButton } from "./paste-cashea-summary-button";

type CasheaOrderSectionProps = {
  title: string;
  orderForm: CasheaOrderFormApi;
  titleId?: string;
  action?: ReactNode;
  showFields?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export function CasheaOrderSection({
  title,
  orderForm,
  titleId,
  action,
  showFields = true,
  disabled = false,
  children,
}: CasheaOrderSectionProps) {
  const noticeRef = useRef<HTMLDivElement>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<CasheaOrderFormApi["evaluation"] | null>(null);
  const noticeEvaluation = editingSnapshot ?? orderForm.evaluation;
  const { sumError, saleTotalMismatch, orderTotalUsd } = noticeEvaluation;
  const showDifference = saleTotalMismatch && orderTotalUsd !== null;
  useEffect(() => {
    if (showFields && (sumError || showDifference)) {
      noticeRef.current?.scrollIntoView?.({ block: "nearest" });
    }
  }, [showFields, sumError, showDifference]);

  return (
    <section aria-labelledby={titleId} className="bg-card rounded-md border">
      <div className="relative flex items-center gap-2 px-3 py-2">
        <img src={casheaLogo} alt="" className="size-7 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-sm leading-none font-semibold">
            {title}
          </h3>
        </div>
        {showFields && <PasteCasheaSummaryButton orderForm={orderForm} disabled={disabled} />}
        {action}
      </div>

      {showFields && (
        <div
          className="border-t p-3"
          onFocusCapture={() => setEditingSnapshot(orderForm.evaluation)}
          onBlurCapture={() => setEditingSnapshot(null)}
        >
          {(sumError || showDifference) && (
            <div ref={noticeRef} className="mb-2 space-y-1">
              <CasheaOrderNotices orderForm={orderForm} evaluation={noticeEvaluation} />
            </div>
          )}
          <CasheaOrderFields orderForm={orderForm} disabled={disabled} showNotices={false} />
        </div>
      )}

      {children}
    </section>
  );
}
