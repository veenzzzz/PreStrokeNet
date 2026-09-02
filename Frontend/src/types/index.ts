export type RiskLevel = "low" | "medium" | "high";
export type BackendRiskLevel = "Low" | "Medium" | "High";
export type UserRole = "Admin" | "Doctor";
export type ReportStatus = "draft" | "reviewed" | "final" | "archived";
export type PredictionSort = "latest" | "oldest" | "highest_probability" | "lowest_probability" | "highest_risk" | "lowest_risk" | "patient_name";
export type ActivityType = "prediction_created" | "prediction_updated" | "doctor_note_added" | "report_downloaded" | "excel_exported" | "email_sent" | "prediction_deleted";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    full_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
  };
}

export interface PredictFinalRequest {
  patient_name: string;
  patient_id?: string;
  gender: number;
  age: number;
  hypertension: number;
  heart_disease: number;
  ever_married: number;
  work_type: number;
  Residence_type: number;
  avg_glucose_level: number;
  bmi: number;
  smoking_status: number;
  key: number;
  H: number;
  UD: number;
  DD: number;
}

export interface PredictFinalResponse {
  id?: number;
  patient_name?: string | null;
  patient_id?: string | null;
  clinical_probability: number;
  keystroke_probability: number;
  final_probability: number;
  risk: string;
  created_at?: string | null;
  updated_at?: string | null;
  explainability?: Explainability | null;
  recommendations?: string[];
}

export type PredictionErrorKind = "offline" | "timeout" | "validation" | "server" | "unknown";

export interface PredictionErrorState {
  kind: PredictionErrorKind;
  message: string;
}

export interface ProfilePayload {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface ProfileUpdatePayload {
  full_name: string;
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface PredictionRecord {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  score: number;
  level: RiskLevel;
  confidence: number;
}

export interface PredictionResult {
  id?: number;
  score: number;
  level: RiskLevel;
  clinicalProbability: number;
  keystrokeProbability: number;
  finalProbability: number;
  summary: string;
  explainability?: Explainability | null;
  recommendations: string[];
}

export interface PredictionSummary {
  id: number;
  patient_name: string | null;
  patient_id: string | null;
  age: number | null;
  gender: number | null;
  created_at: string | null;
  updated_at?: string | null;
  final_probability: number;
  clinical_probability: number;
  keystroke_probability: number;
  risk: string;
  status?: ReportStatus | null;
}

export interface PredictionListResponse {
  items: PredictionSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PredictionSearchParams {
  q?: string;
  page: number;
  page_size: number;
  sort: PredictionSort;
  risk?: string;
  min_age?: number;
  max_age?: number;
  gender?: number;
  date_from?: string;
  date_to?: string;
  smoking_status?: number;
  hypertension?: number;
  heart_disease?: number;
  residence_type?: number;
  work_type?: number;
}

export interface PredictionUpdatePayload {
  patient_name: string;
  patient_id?: string | null;
  diagnosis?: string | null;
  doctor_notes?: string | null;
  recommendation?: string | null;
  follow_up_date?: string | null;
  status: ReportStatus;
}

export interface DoctorNotePayload {
  diagnosis?: string | null;
  doctor_notes: string;
  recommendation?: string | null;
  follow_up_date?: string | null;
  status: ReportStatus;
}

export interface ActivityEvent {
  id: number;
  prediction_id: number | null;
  activity_type: ActivityType;
  message: string;
  actor_name: string | null;
  created_at: string;
}

export interface ExplainabilityFactor {
  feature: string;
  value: number | string | null;
  contribution_percentage: number;
  direction: "increased" | "decreased" | "neutral";
  explanation: string;
  contribution?: number;
}

export interface Explainability {
  final_probability: number;
  feature_importance: ExplainabilityFactor[];
  top_factors: string[];
  clinical_explanation: string;
  recommendations: string[];
  method: "shap" | "approximate_sensitivity" | "rule_based";
  is_rule_based: boolean;
}

export interface PredictionDetail extends PredictionSummary {
  clinical_features: Record<string, number | null>;
  keystroke_features: Record<string, number | null>;
  diagnosis: string | null;
  doctor_notes: string | null;
  recommendation: string | null;
  follow_up_date: string | null;
  pdf_generated: boolean;
  excel_generated: boolean;
  email_sent: boolean;
  last_modified_by: number | null;
  explainability: Explainability;
  recommendations: string[];
  timeline: ActivityEvent[];
}

export interface DashboardTrendItem {
  label: string;
  count: number;
  average_probability: number | null;
}

export interface DashboardDistributionItem {
  label: string;
  count: number;
}

export interface DashboardStatistics {
  total_predictions: number;
  predictions_today: number;
  predictions_this_week: number;
  predictions_this_month: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  average_probability: number | null;
  average_age: number | null;
  average_bmi: number | null;
  average_glucose: number | null;
  most_common_risk: string | null;
  most_common_smoking_status: string | null;
  monthly_trend: DashboardTrendItem[];
  daily_trend: DashboardTrendItem[];
  high_risk_trend: DashboardTrendItem[];
  risk_distribution: DashboardDistributionItem[];
  age_distribution: DashboardDistributionItem[];
  gender_distribution: DashboardDistributionItem[];
  smoking_distribution: DashboardDistributionItem[];
  top_risk_factors: DashboardDistributionItem[];
  latest_predictions: PredictionSummary[];
}

export interface EmailReportPayload {
  recipient: string;
  subject: string;
  message: string;
}

export interface PatientAssessmentHistoryItem {
  id: number;
  patient_name: string;
  patient_id: string;
  age: number;
  gender: number;
  clinical_probability: number;
  keystroke_probability: number;
  final_probability: number;
  risk: string;
  created_at: string;
  doctor_notes: string | null;
  recommendation: string | null;
  follow_up_date: string | null;
  status: string;
  explainability_method: string;
}

export interface RiskProgressionPoint {
  prediction_id: number;
  assessment_date: string;
  clinical_probability: number;
  keystroke_probability: number;
  final_probability: number;
  risk: string;
}

export interface ShapFeatureComparison {
  feature: string;
  field: string;
  current_contribution: number;
  previous_contribution: number | null;
  change: number;
}

export interface RiskProgressionChange {
  previous_probability: number | null;
  current_probability: number;
  absolute_change: number;
  percentage_change: number;
  direction: "Increased" | "Decreased" | "Stable";
  status_message: string;
  shap_comparison: ShapFeatureComparison[];
}

export interface RiskProgressionResponse {
  progression: RiskProgressionPoint[];
  latest_assessment: RiskProgressionChange | null;
}

export interface ModelMetricItem {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  pr_auc: number;
  threshold?: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelComparisonItem {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  pr_auc: number;
}

export interface ThresholdPerformanceItem {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  fpr: number;
}

export interface FeatureImportanceItem {
  feature: string;
  field: string;
  importance: number;
}

export interface DatasetAnalysis {
  total_records: number;
  stroke_cases: number;
  non_stroke_cases: number;
  prevalence: number;
  incompatibility_notes: string;
  synthetic_notes: string;
}

export interface ModelAnalyticsResponse {
  production_model: ModelMetricItem;
  confusion_matrix: ConfusionMatrix;
  model_comparison: ModelComparisonItem[];
  threshold_analysis: ThresholdPerformanceItem[];
  feature_importance: FeatureImportanceItem[];
  dataset_analysis: DatasetAnalysis;
  model_info: Record<string, string | number | boolean>;
}

export interface AssistantChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  patient_id?: string;
  prediction_id?: number;
  history?: AssistantChatMessage[];
}

export interface CitationItem {
  source: string;
  label: string;
  detail?: string;
}

export interface AssistantContextSummary {
  patient_id?: string | null;
  patient_name?: string | null;
  latest_risk_level?: string | null;
  latest_final_probability?: number | null;
  latest_clinical_probability?: number | null;
  latest_assessment_date?: string | null;
  top_shap_factors: Record<string, unknown>[];
  has_history: boolean;
  has_doctor_notes: boolean;
}

export interface AssistantChatResponse {
  answer: string;
  citations: CitationItem[];
  context_summary: AssistantContextSummary;
  suggested_questions: string[];
  disclaimer: string;
  provider: string;
}

export interface KeystrokeAnalytics {
  prediction_id: number;
  keystroke_probability: number;
  behavioral_change_score: number;
  current_session: {
    dwell_time_mean: number;
    flight_time_mean: number;
    digraph_latency_mean: number;
    typing_speed: number;
    timing_variability: number;
    pause_frequency: number;
  };
  historical_baseline: {
    dwell_time_mean: number;
    flight_time_mean: number;
    digraph_latency_mean: number;
    typing_speed: number;
    timing_variability: number;
  };
  baseline_deviations: {
    typing_speed_pct: number;
    dwell_time_pct: number;
    flight_time_pct: number;
  };
  top_timing_factors: Array<{
    feature: string;
    importance: number;
    direction: string;
    observed_value: string;
  }>;
  disclaimer: string;
}


