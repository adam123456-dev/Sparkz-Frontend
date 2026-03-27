import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { startAnalysis } from "../services/api";
import type { Framework } from "../types/api";

export function UploadPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [framework, setFramework] = useState<Framework | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(companyName.trim() && framework && file && !isSubmitting);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!framework || !file) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await startAnalysis({
        companyName: companyName.trim(),
        framework,
        file
      });
      navigate(`/analyzing/${data.analysisId}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to start analysis.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Step 1 of 3</p>
          <h2 className="text-3xl font-extrabold">Upload Financial Statement</h2>
          <p className="mt-2 text-slate-500">
            Upload your PDF and select the framework to start disclosure analysis.
          </p>
        </div>

        <form className="space-y-6 p-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Company Name
              <input
                className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 font-normal outline-none ring-primary focus:ring-2"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="e.g. Sparkz Global Ltd"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Accounting Framework
              <select
                className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 font-normal outline-none ring-primary focus:ring-2"
                value={framework}
                onChange={(event) => setFramework(event.target.value as Framework)}
                required
              >
                <option value="" disabled>
                  Select framework
                </option>
                <option value="IFRS">IFRS</option>
                <option value="FRS 102">FRS 102</option>
                <option value="FRS 105">FRS 105</option>
              </select>
            </label>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-primary">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <span className="material-symbols-outlined text-4xl">cloud_upload</span>
            </div>
            <div>
              <p className="text-lg font-bold">{file ? file.name : "Select a PDF file"}</p>
              <p className="text-sm text-slate-500">PDF only, text-based document</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Starting..." : "Start Analysis"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
