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

export type CheckResult = {
  checkId: string;
  label: string;
  status: ChecklistStatus;
  reason?: string | null;
  confidence?: number | null;
};

export type EvidenceBlock = {
  chunkId: string;
  pageNumber: number;
  similarity: number;
  text: string;
};

export type ChecklistItem = {
  id: string;
  itemKey: string;
  requirement: string;
  status: ChecklistStatus;
  /** Best rule–chunk cosine (0–1); used for status when LLM is off. */
  bestSimilarity?: number | null;
  coverage?: number | null;
  checkResults?: CheckResult[] | null;
  evidence: string | null;
  evidenceBlocks?: EvidenceBlock[] | null;
  explanation?: string | null;
  /** When true, low confidence or missing evidence — human review recommended. */
  needsReview?: boolean;
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
