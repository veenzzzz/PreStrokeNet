import api from "./api";
import type { EmailReportPayload, PredictionSearchParams } from "../types";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export async function downloadPdf(id: number) {
  const response = await api.get<Blob>(`/reports/${id}/pdf`, { responseType: "blob" });
  downloadBlob(response.data, `PreStrokeNet_Prediction_${id}.pdf`);
}

export async function downloadExcel(id: number) {
  const response = await api.get<Blob>(`/reports/${id}/excel`, { responseType: "blob" });
  downloadBlob(response.data, `PreStrokeNet_Prediction_${id}.xlsx`);
}

export async function downloadExcelExport(params: PredictionSearchParams) {
  const response = await api.get<Blob>("/reports/export.xlsx", { responseType: "blob", params });
  downloadBlob(response.data, "PreStrokeNet_Predictions.xlsx");
}

export async function downloadCsv(params: PredictionSearchParams) {
  const response = await api.get<Blob>("/reports/export.csv", { responseType: "blob", params });
  downloadBlob(response.data, "PreStrokeNet_Predictions.csv");
}

export async function emailReport(id: number, payload: EmailReportPayload) {
  await api.post(`/reports/${id}/email`, payload);
}
