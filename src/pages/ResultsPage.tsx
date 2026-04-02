import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { getAnalysisResult } from "../services/api";
import type { AnalysisResultResponse, ChecklistItem, ChecklistStatus, EvidenceBlock } from "../types/api";
import { useAsync } from "../hooks/useAsync";

type FilterValue = "all" | "review" | ChecklistStatus;

const EVIDENCE_PREVIEW_CHARS = 140;

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
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{data.companyName}</h2>
            <p className="text-sm text-slate-500 sm:text-base">{data.framework} disclosure checklist results</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total" value={data.total} icon="list_alt" />
            <MetricCard label="Missing" value={data.missing} icon="error" color="red" />
            <MetricCard label="Partially Met" value={data.partial} icon="warning" color="amber" />
            <MetricCard label="Fully Met" value={data.fullyMet} icon="check_circle" color="emerald" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
              <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:p-1">
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
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary focus:ring-2 sm:max-w-sm"
                placeholder="Search ID, requirement, reason..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <p className="hidden border-b border-slate-100 bg-slate-50/50 px-4 py-2 text-xs leading-relaxed text-slate-500 lg:block">
              <span className="font-semibold text-slate-600">Best retrieval</span> is cosine similarity between the rule
              embedding and the strongest retrieved chunk. Each evidence card shows that chunk&apos;s own score (same
              scale, 0–100%).
            </p>
            <details className="group border-b border-slate-100 bg-slate-50/50 lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-xs text-slate-600 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2 font-semibold">
                  What do scores mean?
                  <span className="material-symbols-outlined text-base text-slate-400 transition group-open:rotate-180">
                    expand_more
                  </span>
                </span>
              </summary>
              <p className="border-t border-slate-100 px-4 pb-3 pt-2 text-xs leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-600">Best retrieval</span> is cosine similarity between the rule
                embedding and the strongest retrieved chunk. Each evidence card shows that chunk&apos;s own score (same
                scale, 0–100%).
              </p>
            </details>

            {/* Mobile / tablet: stacked cards */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredItems.map((item) => (
                <ResultItemMobileCard key={item.itemKey} item={item} />
              ))}
            </div>

            {/* Desktop: wide table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "23%" }} />
                </colgroup>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 align-bottom">ID</th>
                    <th className="px-4 py-3 align-bottom">Requirement</th>
                    <th className="px-4 py-3 text-center align-bottom">Status</th>
                    <th className="px-4 py-3 align-bottom">
                      <span className="block leading-tight">Best</span>
                      <span className="block font-normal normal-case tracking-normal text-slate-400">retrieval</span>
                    </th>
                    <th className="px-4 py-3 align-bottom">Evidence</th>
                    <th className="px-4 py-3 align-bottom">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.itemKey} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <span className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700" title={item.id}>
                          {item.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-h-[7.5rem] overflow-y-auto text-[13px] font-medium leading-snug text-slate-800">
                          {item.requirement}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
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
                      <td className="px-4 py-3">
                        <BestMatchColumn item={item} />
                      </td>
                      <td className="px-4 py-3">
                        <EvidenceColumn item={item} />
                      </td>
                      <td className="px-4 py-3">
                        <ReasonColumn item={item} layout="table" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredItems.length} of {data.items.length} checklist items
            </p>
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 sm:w-auto"
            >
              New Analysis
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ResultItemMobileCard({ item }: { item: ChecklistItem }) {
  return (
    <article className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <span className="inline-block max-w-full break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
            {item.id}
          </span>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Best retrieval</p>
          <BestMatchColumn item={item} align="start" />
        </div>
      </div>

      <section className="space-y-1">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Requirement</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-800">{item.requirement}</p>
      </section>

      <section className="space-y-1">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Evidence</h3>
        <EvidenceColumn item={item} />
      </section>

      <section className="space-y-1">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Summary</h3>
        <ReasonColumn item={item} layout="stack" />
      </section>
    </article>
  );
}

function BestMatchColumn({ item, align = "center" }: { item: ChecklistItem; align?: "center" | "start" }) {
  const sim = item.bestSimilarity;
  const cov = item.coverage;
  const alignCls = align === "start" ? "text-left" : "text-center";

  if (sim == null || sim <= 0) {
    return (
      <div className={alignCls}>
        <span className="text-lg font-semibold tabular-nums text-slate-300">—</span>
        <p className="mt-0.5 text-[10px] leading-tight text-slate-400">No match</p>
      </div>
    );
  }

  const pct = Math.round(sim * 1000) / 10;
  const tone =
    pct >= 75 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-slate-700";

  return (
    <div
      className={alignCls}
      title="Highest cosine similarity between this checklist rule and any retrieved document chunk (0–100%)."
    >
      <span className={`text-xl font-bold tabular-nums ${tone}`}>{pct}%</span>
      {cov != null && Number.isFinite(cov) ? (
        <p className="mt-1 text-[10px] font-medium leading-tight text-slate-500">
          Coverage {Math.round(cov * 100)}%
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-slate-400">Row score</p>
      )}
    </div>
  );
}

function EvidenceColumn({ item }: { item: ChecklistItem }) {
  if (item.status === "missing") {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-500">
        No document text matched this rule strongly enough to show here.
      </div>
    );
  }

  if (item.evidenceBlocks && item.evidenceBlocks.length > 0) {
    const blocks = [...item.evidenceBlocks].sort((a, b) => b.similarity - a.similarity);
    return (
      <ul className="space-y-2">
        {blocks.map((block, index) => (
          <EvidenceBlockCard key={`${block.chunkId}-${index}`} block={block} rank={index + 1} />
        ))}
      </ul>
    );
  }

  if (item.evidence?.trim()) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Snippet</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">{shortPreview(item.evidence, EVIDENCE_PREVIEW_CHARS)}</p>
      </div>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}

function EvidenceBlockCard({ block, rank }: { block: EvidenceBlock; rank: number }) {
  const pct = Math.round(block.similarity * 1000) / 10;
  const tone =
    pct >= 75 ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : pct >= 50 ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-slate-100 text-slate-800 ring-slate-200";
  const body = (block.text ?? "").trim();
  const showExpand = body.length > EVIDENCE_PREVIEW_CHARS;

  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-2.5 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">#{rank}</span>
          <span className="text-xs font-semibold text-slate-700">Page {block.pageNumber}</span>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ${tone}`}
          title="Cosine similarity for this chunk vs the rule embedding (same scale as Best retrieval)."
        >
          {pct}% match
        </span>
      </div>
      <div className="px-2.5 py-2">
        <p className="line-clamp-4 text-xs leading-relaxed text-slate-700" title={body}>
          {shortPreview(body, EVIDENCE_PREVIEW_CHARS)}
        </p>
        {showExpand ? (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-[11px] font-semibold text-primary">Show full excerpt</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-100 bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-700">
              {body}
            </pre>
          </details>
        ) : null}
      </div>
    </li>
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
  return `${value.slice(0, maxChars)}…`;
}

function ReasonColumn({ item, layout = "stack" }: { item: ChecklistItem; layout?: "table" | "stack" }) {
  const checks = item.checkResults ?? [];
  const explain = item.explanation?.trim();
  const hasChecks = checks.length > 0;

  if (!explain && !hasChecks && item.status === "missing") {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const showFallback = !explain && !hasChecks && item.status !== "missing";
  const scrollCls = layout === "table" ? "max-h-[14rem] overflow-y-auto pr-1" : "";

  return (
    <div className={`flex flex-col gap-2 ${scrollCls}`}>
      {explain ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50/90 p-2.5 text-xs font-medium leading-relaxed text-slate-700">
          {explain}
        </p>
      ) : null}
      {hasChecks ? (
        <details className={explain ? "border-t border-slate-100 pt-2" : ""}>
          <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900">
            {checks.length} atomic check{checks.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-2">
            {checks.map((c) => (
              <li
                key={c.checkId}
                className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{shortPreview(c.label, 48)}</span>
                  <AtomicStatusChip status={c.status} />
                  {c.confidence != null && Number.isFinite(c.confidence) ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                      {Math.round(c.confidence * 100)}% conf.
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
      className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
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
