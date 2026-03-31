import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { getAnalysisResult } from "../services/api";
import type { AnalysisResultResponse, ChecklistItem, ChecklistStatus } from "../types/api";
import { useAsync } from "../hooks/useAsync";

type FilterValue = "all" | "review" | ChecklistStatus;

export function ResultsPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  const { data, error, isLoading } = useAsync<AnalysisResultResponse>(
    () => (analysisId ? getAnalysisResult(analysisId) : Promise.reject(new Error("Missing analysis ID"))),
    [analysisId]
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const keyword = search.trim().toLowerCase();

    return data.items.filter((item) => {
      const filterMatch =
        filter === "all" || (filter === "review" ? !!item.needsReview : item.status === filter);
      if (!filterMatch) return false;
      if (!keyword) return true;
      const evidenceHaystack = (item.evidenceBlocks ?? [])
        .map((b) => `${b.text} page${b.pageNumber}`)
        .join(" ");
      const checksHaystack = (item.checkResults ?? [])
        .map((c) => `${c.label} ${c.reason ?? ""}`)
        .join(" ");
      return (
        item.id.toLowerCase().includes(keyword) ||
        item.requirement.toLowerCase().includes(keyword) ||
        (item.explanation ?? "").toLowerCase().includes(keyword) ||
        evidenceHaystack.toLowerCase().includes(keyword) ||
        checksHaystack.toLowerCase().includes(keyword)
      );
    });
  }, [data, filter, search]);

  return (
    <AppShell>
      {isLoading && <div className="rounded-lg bg-white p-6 text-sm font-medium text-slate-600">Loading results...</div>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error.message}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold">{data.companyName}</h2>
            <p className="text-slate-500">{data.framework} disclosure checklist results</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total" value={data.total} icon="list_alt" />
            <MetricCard label="Missing" value={data.missing} icon="error" color="red" />
            <MetricCard label="Partially Met" value={data.partial} icon="warning" color="amber" />
            <MetricCard label="Fully Met" value={data.fullyMet} icon="check_circle" color="emerald" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
                <FilterButton active={filter === "review"} onClick={() => setFilter("review")} label="Review" />
                <FilterButton active={filter === "missing"} onClick={() => setFilter("missing")} label="Missing" />
                <FilterButton
                  active={filter === "partially_met"}
                  onClick={() => setFilter("partially_met")}
                  label="Partial"
                />
                <FilterButton active={filter === "fully_met"} onClick={() => setFilter("fully_met")} label="Met" />
              </div>

              <input
                className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                placeholder="Search ID, requirement, reason..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Requirement</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Best match</th>
                    <th className="px-6 py-4">Evidence</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.itemKey} className="hover:bg-slate-50">
                      <td className="px-6 py-4 align-top">
                        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold">{item.id}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-sm font-medium leading-relaxed text-slate-800">
                        {item.requirement}
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <div className="flex flex-col items-center gap-1.5">
                          <StatusBadge status={item.status} />
                          {item.needsReview ? (
                            <span
                              className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800"
                              title="Low confidence, missing evidence, or partial satisfaction — confirm manually."
                            >
                              Review
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-right text-xs font-mono text-slate-600">
                        {item.bestSimilarity != null && item.bestSimilarity > 0 ? (
                          <span title="Cosine similarity vs checklist rule embedding">
                            {(item.bestSimilarity * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {item.status === "missing" ? (
                          <p className="text-xs font-medium text-slate-500">No evidence found.</p>
                        ) : item.evidenceBlocks && item.evidenceBlocks.length > 0 ? (
                          <ul className="space-y-1.5">
                            {item.evidenceBlocks.map((block) => (
                              <li
                                key={block.chunkId}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
                                title={block.text}
                              >
                                <span className="font-semibold text-slate-600">
                                  Page {block.pageNumber}
                                  <span className="ml-2 font-mono text-slate-500">
                                    {(block.similarity * 100).toFixed(1)}% match
                                  </span>
                                </span>
                                <p className="mt-1">{shortPreview(block.text, 20)}</p>
                              </li>
                            ))}
                          </ul>
                        ) : item.evidence ? (
                          <p className="text-xs leading-relaxed text-slate-700" title={item.evidence}>
                            {shortPreview(item.evidence, 20)}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <ReasonColumn item={item} />
                      </td>
                      <td className="px-6 py-4 align-top text-right text-slate-400">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredItems.length} of {data.items.length} checklist items
            </p>
            <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              New Analysis
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function AtomicStatusChip({ status }: { status: ChecklistStatus }) {
  const label =
    status === "fully_met" ? "Met" : status === "partially_met" ? "Partial" : "Missing";
  const cls =
    status === "fully_met"
      ? "bg-emerald-50 text-emerald-800"
      : status === "partially_met"
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-red-800";
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>;
}

function shortPreview(text: string | null | undefined, maxChars: number): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "—";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
}

function ReasonColumn({ item }: { item: ChecklistItem }) {
  const checks = item.checkResults ?? [];
  const explain = item.explanation?.trim();
  const hasChecks = checks.length > 0;

  if (!explain && !hasChecks && item.status === "missing") {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const showFallback = !explain && !hasChecks && item.status !== "missing";

  return (
    <div className="flex flex-col gap-2">
      {explain ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs font-medium leading-relaxed text-slate-700">
          {explain}
        </p>
      ) : null}
      {hasChecks ? (
        <details className={explain ? "border-t border-slate-100 pt-2" : ""}>
          <summary className="cursor-pointer text-xs font-medium text-slate-500">
            {checks.length} atomic check{checks.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-2 text-left">
            {checks.map((c) => (
              <li
                key={c.checkId}
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{shortPreview(c.label, 42)}</span>
                  <AtomicStatusChip status={c.status} />
                  {c.confidence != null && Number.isFinite(c.confidence) ? (
                    <span className="font-mono text-[10px] text-slate-500">
                      {Math.round(c.confidence * 100)}%
                    </span>
                  ) : null}
                </div>
                {c.reason?.trim() ? (
                  <p className="mt-1.5 leading-relaxed text-slate-600">{c.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {showFallback ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
          <span className="material-symbols-outlined text-sm">info</span>
          Reason unavailable for this item.
        </div>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
        active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color = "slate"
}: {
  label: string;
  value: number;
  icon: string;
  color?: "slate" | "red" | "amber" | "emerald";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600"
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex size-8 items-center justify-center rounded-lg ${map[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
