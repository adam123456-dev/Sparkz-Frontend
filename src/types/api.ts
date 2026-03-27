export type Framework = "IFRS" | "FRS 102" | "FRS 105";

export type AnalysisStatus = "queued" | "processing" | "completed" | "failed";

export type StepState = "waiting" | "in_progress" | "completed";

export type AnalysisStep = {
  id: string;
  label: string;
  state: StepState;
};

export type UploadAnalysisResponse = {
  analysisId: string;
};

export type AnalysisStatusResponse = {
  analysisId: string;
  progress: number;
  status: AnalysisStatus;
  message: string;
  steps: AnalysisStep[];
};

export type ChecklistStatus = "fully_met" | "partially_met" | "missing";

export type ChecklistItem = {
  id: string;
  requirement: string;
  status: ChecklistStatus;
  evidence: string | null;
  explanation?: string | null;
};

export type AnalysisResultResponse = {
  analysisId: string;
  companyName: string;
  framework: string;
  total: number;
  missing: number;
  partial: number;
  fullyMet: number;
  items: ChecklistItem[];
};
