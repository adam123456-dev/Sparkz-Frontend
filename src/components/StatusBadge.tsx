import type { ChecklistStatus } from "../types/api";

const STYLES: Record<ChecklistStatus, string> = {
  fully_met: "bg-emerald-100 text-emerald-700",
  partially_met: "bg-amber-100 text-amber-700",
  missing: "bg-red-100 text-red-700"
};

const LABELS: Record<ChecklistStatus, string> = {
  fully_met: "Fully Met",
  partially_met: "Partially Met",
  missing: "Missing"
};

export function StatusBadge({ status }: { status: ChecklistStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
