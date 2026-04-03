"use client";

import { computeStatus, getStatusStyle, type ExpenseForStatus } from "@/lib/status";

interface StatusBadgeProps {
  expense: ExpenseForStatus;
}

export function StatusBadge({ expense }: StatusBadgeProps) {
  const status = computeStatus(expense);
  const { bg, text, border } = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      {status === "Cancelled" ? <span className="line-through">{status}</span> : status}
    </span>
  );
}
