import { Navigate, Route, Routes } from "react-router-dom";
import { AnalyzingPage } from "./pages/AnalyzingPage";
import { ResultsPage } from "./pages/ResultsPage";
import { UploadPage } from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/analyzing/:analysisId" element={<AnalyzingPage />} />
      <Route path="/results/:analysisId" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
