import type {
  AnalysisResultResponse,
  AnalysisStatusResponse,
  Framework,
  UploadAnalysisResponse
} from "../types/api";

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? "http://localhost:8000";

type StartPayload = {
  companyName: string;
  framework: Framework;
  file: File;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return (await response.json()) as T;
}

export async function startAnalysis(payload: StartPayload): Promise<UploadAnalysisResponse> {
  const formData = new FormData();
  formData.append("companyName", payload.companyName);
  formData.append("framework", payload.framework);
  formData.append("file", payload.file);

  return apiRequest<UploadAnalysisResponse>("/api/analyses", {
    method: "POST",
    body: formData
  });
}

export async function getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
  return apiRequest<AnalysisStatusResponse>(`/api/analyses/${analysisId}/status`);
}

export async function getAnalysisResult(analysisId: string): Promise<AnalysisResultResponse> {
  return apiRequest<AnalysisResultResponse>(`/api/analyses/${analysisId}/result`);
}
