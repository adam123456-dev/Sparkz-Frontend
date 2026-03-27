import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ProgressBar } from "../components/ProgressBar";
import { getAnalysisStatus } from "../services/api";
import type { AnalysisStatusResponse } from "../types/api";

export function AnalyzingPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState<AnalysisStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    let mounted = true;
    let timer: number | null = null;

    const poll = async () => {
      try {
        const response = await getAnalysisStatus(analysisId);
        if (!mounted) return;

        setStatusData(response);
        setError(null);

        if (response.status === "completed") {
          navigate(`/results/${analysisId}`);
          return;
        }
        if (response.status === "failed") {
          setError(response.message || "Analysis failed.");
          return;
        }
      } catch (pollError) {
        if (!mounted) return;
        setError(pollError instanceof Error ? pollError.message : "Unable to fetch analysis status.");
      }

      timer = window.setTimeout(poll, 2000);
    };

    void poll();

    return () => {
      mounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [analysisId, navigate]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
            <span className="material-symbols-outlined text-4xl">analytics</span>
          </div>
          <h2 className="text-3xl font-extrabold">Analyzing Your Document</h2>
          <p className="mt-2 max-w-xl text-slate-500">
            Sparkz is anonymizing sensitive fields, chunking the document, and evaluating disclosures.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-3 flex items-end justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">Overall Progress</p>
            <p className="text-2xl font-bold text-primary">{statusData?.progress ?? 0}%</p>
          </div>
          <ProgressBar value={statusData?.progress ?? 0} />
          <p className="mt-3 text-sm text-slate-600">{statusData?.message ?? "Waiting for processing..."}</p>
        </div>

        <div className="space-y-3">
          {(statusData?.steps ?? []).map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                step.state === "completed"
                  ? "border-emerald-100 bg-emerald-50"
                  : step.state === "in_progress"
                    ? "border-primary/20 bg-primary/5"
                    : "border-slate-100 bg-slate-50"
              }`}
            >
              <div
                className={`flex size-6 items-center justify-center rounded-full text-white ${
                  step.state === "completed"
                    ? "bg-emerald-500"
                    : step.state === "in_progress"
                      ? "bg-primary"
                      : "bg-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {step.state === "completed"
                    ? "check"
                    : step.state === "in_progress"
                      ? "sync"
                      : "hourglass_empty"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{step.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </div>
    </AppShell>
  );
}
