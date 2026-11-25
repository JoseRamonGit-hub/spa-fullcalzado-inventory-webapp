import type { CasheaDepositInput, CasheaOrder } from "@/types";
import { getCasheaPendingSummary, isCalendarDate } from "./cashea-receivables";
import { DRAFT_MESSAGES, parseAmount } from "./cashea-order-draft";

export type CasheaDepositDraft = {
  receivedVes: string;
  depositDate: string;
  reference: string;
  appliedRate: string;
};

export type CasheaDepositPreview = {
  expectedNetUsd: number;
  receivedVes: number | null;
  impliedRate: number | null;
  receivedUsd: number | null;
  differenceUsd: number | null;
  hasDiscrepancy: boolean;
};

export type CasheaDepositEvaluation = {
  fieldErrors: Partial<Record<keyof CasheaDepositDraft, string>>;
  preview: CasheaDepositPreview;
  deposit: CasheaDepositInput | null;
};

const DISCREPANCY_TOLERANCE_CENTS = 5;

export function createCasheaDepositDraft(today: string): CasheaDepositDraft {
  return { receivedVes: "", depositDate: today, reference: "", appliedRate: "" };
}

function parseRate(rawValue: string): { rate: number } | { error: string } | null {
  const value = rawValue.trim();
  if (value === "") return null;
  if (!/^\d+(?:[.,]\d{1,4})?$/.test(value)) return { error: "Tasa inválida, máximo cuatro decimales" };

  const rate = Number(value.replace(",", "."));
  return rate > 0 ? { rate } : { error: DRAFT_MESSAGES.mustBePositive };
}

export function evaluateCasheaDepositDraft(
  draft: CasheaDepositDraft,
  orders: readonly Pick<CasheaOrder, "id" | "status" | "financed_usd" | "expected_net_usd">[],
  today: string,
): CasheaDepositEvaluation {
  const fieldErrors: CasheaDepositEvaluation["fieldErrors"] = {};

  const received = parseAmount(draft.receivedVes);
  if ("error" in received) fieldErrors.receivedVes = received.error;
  else if (received.cents <= 0) fieldErrors.receivedVes = DRAFT_MESSAGES.mustBePositive;

  const depositDate = draft.depositDate.trim();
  if (!isCalendarDate(depositDate)) fieldErrors.depositDate = "Fecha inválida";
  else if (depositDate > today) fieldErrors.depositDate = "No puede ser una fecha futura";

  const appliedRate = parseRate(draft.appliedRate);
  if (appliedRate && "error" in appliedRate) fieldErrors.appliedRate = appliedRate.error;

  const { expectedNetUsd } = getCasheaPendingSummary(orders);
  const expectedNetCents = Math.round(expectedNetUsd * 100);
  const receivedVes = fieldErrors.receivedVes || !("cents" in received) ? null : received.cents / 100;
  const rate = appliedRate && "rate" in appliedRate ? appliedRate.rate : null;
  const receivedUsdCents = receivedVes !== null && rate !== null ? Math.round((receivedVes / rate) * 100) : null;
  const differenceCents = receivedUsdCents === null ? null : expectedNetCents - receivedUsdCents;

  const preview: CasheaDepositPreview = {
    expectedNetUsd,
    receivedVes,
    impliedRate: receivedVes !== null && expectedNetCents > 0 ? receivedVes / expectedNetUsd : null,
    receivedUsd: receivedUsdCents === null ? null : receivedUsdCents / 100,
    differenceUsd: differenceCents === null ? null : differenceCents / 100,
    hasDiscrepancy: differenceCents !== null && Math.abs(differenceCents) >= DISCREPANCY_TOLERANCE_CENTS,
  };

  const deposit =
    orders.length > 0 && receivedVes !== null && Object.keys(fieldErrors).length === 0
      ? {
          orderIds: orders.map((order) => order.id),
          receivedVes,
          depositDate,
          appliedRate: rate,
          reference: draft.reference.trim() || null,
        }
      : null;

  return { fieldErrors, preview, deposit };
}
