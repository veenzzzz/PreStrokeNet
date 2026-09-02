import { ArrowLeft, RefreshCw, BarChart3, TrendingUp, AlertCircle, ShieldAlert, Cpu, Database, Info } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { Loader } from "../../components/Loader";
import { getApiErrorMessage } from "../../services/authService";
import { getModelAnalytics } from "../../services/analytics";
import type { ModelAnalyticsResponse, ThresholdPerformanceItem } from "../../types";
import { MultimodalFusionPanel } from "./components/MultimodalFusionPanel";
import { ResearchValidationPanel } from "./components/ResearchValidationPanel";

export function ModelAnalytics() {
  const navigate = useNavigate();

  const [data, setData] = useState<ModelAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getModelAnalytics();
      setData(response);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load model analytics."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Identify best metrics for model comparison table
  const bestComparison = useMemo(() => {
    if (!data) return { f1: "", recall: "", roc_auc: "", pr_auc: "" };
    let bestF1 = -1, bestRecall = -1, bestRoc = -1, bestPr = -1;
    let f1Model = "", recallModel = "", rocModel = "", prModel = "";

    data.model_comparison.forEach((item) => {
      if (item.f1 > bestF1) { bestF1 = item.f1; f1Model = item.model; }
      if (item.recall > bestRecall) { bestRecall = item.recall; recallModel = item.model; }
      if (item.roc_auc > bestRoc) { bestRoc = item.roc_auc; rocModel = item.model; }
      if (item.pr_auc > bestPr) { bestPr = item.pr_auc; prModel = item.model; }
    });

    return { f1: f1Model, recall: recallModel, roc_auc: rocModel, pr_auc: prModel };
  }, [data]);

  if (isLoading) {
    return (
      <div className="page-canvas" aria-label="Loading model analytics">
        <PageHeader eyebrow="Clinical AI performance" title="Model Analytics" description="Loading the machine learning evaluation workspace." />
        <div className="glass-panel mt-7 flex h-96 items-center justify-center">
          <Loader label="Reading evaluation artifacts" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-canvas">
        <PageHeader eyebrow="Clinical AI performance" title="Model Analytics" description="Machine learning performance dashboards." />
        <div className="glass-panel mt-7 p-7 text-center">
          <AlertCircle className="mx-auto size-12 text-danger" />
          <h2 className="mt-4 font-display text-xl font-bold text-text">Evaluation Data Unavailable</h2>
          <p className="mt-2 text-sm text-muted">{error || "Could not read evaluation reports."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            <Button onClick={loadData} icon={RefreshCw}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const { production_model, confusion_matrix, model_comparison, threshold_analysis, feature_importance, dataset_analysis, model_info } = data;

  return (
    <div className="page-canvas">
      <PageHeader
        eyebrow="Clinical decision-support"
        title="Model Performance & Analytics"
        description="Offline machine learning evaluations on the untouched real stroke test set."
        action={{ label: "Back to dashboard", to: "/dashboard", icon: ArrowLeft }}
      />

      {/* 1. Overview Metrics Cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Production Model" value="Random Forest" highlight />
        <MetricCard label="Accuracy" value={`${(production_model.accuracy * 100).toFixed(2)}%`} sub="Untouched real test" />
        <MetricCard label="Precision" value={`${(production_model.precision * 100).toFixed(2)}%`} sub="Vascular positive predictive value" />
        <MetricCard label="Recall (Sensitivity)" value={`${(production_model.recall * 100).toFixed(2)}%`} sub="Vascular target capture rate" />
        <MetricCard label="F1-Score" value={`${(production_model.f1 * 100).toFixed(2)}%`} sub="Balanced precision/recall harmonic" />
        <MetricCard label="ROC-AUC" value={production_model.roc_auc.toFixed(4)} sub="Area under ROC curve" />
        <MetricCard label="PR-AUC" value={production_model.pr_auc.toFixed(4)} sub="Area under PR curve" />
      </div>

      <div className="mt-2 text-right">
        <span className="inline-block text-[11px] text-muted italic bg-white/[0.02] border border-line px-3 py-1 rounded-md">
          * Evaluated on untouched real test set (n=1,022). Not a clinical diagnosis. Accuracy alone is not clinically reliable.
        </span>
      </div>

      {/* Main Grid Content */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Left Column: Curves & Core Analytics */}
        <div className="space-y-5">
          {/* ROC Curve Chart */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              ROC Curve (Receiver Operating Characteristic)
            </h2>
            <p className="text-xs text-muted mt-1">
              FPR vs TPR across probability thresholds. ROC-AUC: <span className="font-semibold text-text">{production_model.roc_auc.toFixed(4)}</span>
            </p>
            
            <div className="mt-6">
              <RocCurveChart data={threshold_analysis} />
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-white/[0.01] border border-line text-xs text-muted flex items-start gap-2">
              <Info className="size-4 shrink-0 text-primary mt-0.5" />
              <p>
                ROC-AUC measures discrimination across classification thresholds. A score of {production_model.roc_auc.toFixed(4)} indicates strong diagnostic discrimination between stroke and non-stroke risk classes.
              </p>
            </div>
          </section>

          {/* Precision-Recall Curve */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Precision-Recall Curve (PR Curve)
            </h2>
            <p className="text-xs text-muted mt-1">
              Recall vs Precision across thresholds. PR-AUC: <span className="font-semibold text-text">{production_model.pr_auc.toFixed(4)}</span>
            </p>

            <div className="mt-6">
              <PrCurveChart data={threshold_analysis} />
            </div>

            <div className="mt-4 p-3 rounded-lg bg-white/[0.01] border border-line text-xs text-muted flex items-start gap-2">
              <ShieldAlert className="size-4 shrink-0 text-warning mt-0.5" />
              <p>
                <strong>Vascular dataset imbalance:</strong> With only 4.87% prevalence, PR-AUC of {production_model.pr_auc.toFixed(4)} is significantly higher than a random baseline of 0.0487, but underscores that high sensitivity requirements result in a high rate of false positives.
              </p>
            </div>
          </section>

          {/* Confusion Matrix */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <BarChart3 className="size-5 text-success" />
              Untouched Test Confusion Matrix
            </h2>
            <p className="text-xs text-muted mt-1">Classification counts at threshold = 0.15</p>

            <div className="mt-6 flex flex-col md:flex-row gap-6 items-center">
              {/* Matrix Layout */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[340px]">
                <div />
                <div className="text-center text-xs font-semibold text-muted">Predicted Negative</div>
                <div className="text-center text-xs font-semibold text-muted">Predicted Positive</div>

                <div className="flex items-center text-xs font-semibold text-muted pr-2">Actual Negative</div>
                <div className="rounded-xl border border-line bg-white/[0.02] p-4 text-center">
                  <span className="block font-mono text-xl font-bold text-text">{confusion_matrix.tn}</span>
                  <span className="text-[10px] text-muted uppercase">TN</span>
                </div>
                <div className="rounded-xl border border-line bg-danger/5 p-4 text-center">
                  <span className="block font-mono text-xl font-bold text-danger">{confusion_matrix.fp}</span>
                  <span className="text-[10px] text-danger uppercase font-medium">FP</span>
                </div>

                <div className="flex items-center text-xs font-semibold text-muted pr-2">Actual Positive</div>
                <div className="rounded-xl border border-line bg-danger/5 p-4 text-center">
                  <span className="block font-mono text-xl font-bold text-danger">{confusion_matrix.fn}</span>
                  <span className="text-[10px] text-danger uppercase font-medium">FN</span>
                </div>
                <div className="rounded-xl border border-line bg-success/5 p-4 text-center">
                  <span className="block font-mono text-xl font-bold text-success">{confusion_matrix.tp}</span>
                  <span className="text-[10px] text-success uppercase font-medium">TP</span>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-text shrink-0" />
                  <span><strong>True Negative (TN = {confusion_matrix.tn}):</strong> Correctly classified as low risk.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-danger shrink-0" />
                  <span><strong>False Positive (FP = {confusion_matrix.fp}):</strong> At-risk flag but patient is stroke-free.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-danger shrink-0" />
                  <span><strong>False Negative (FN = {confusion_matrix.fn}):</strong> Missed case of stroke.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-success shrink-0" />
                  <span><strong>True Positive (TP = {confusion_matrix.tp}):</strong> Correctly flagged stroke case.</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Model Comparison, Threshold Analysis, Spec Details */}
        <div className="space-y-5">
          {/* Global Feature Importance */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <Cpu className="size-5 text-primary" />
              Global Feature Importance
            </h2>
            <p className="text-xs text-muted mt-1">Random Forest classifier Gini importance rankings</p>

            <div className="mt-5 space-y-3.5">
              {feature_importance.map((item, idx) => (
                <div key={item.field} className="text-xs">
                  <div className="flex justify-between text-muted mb-1.5">
                    <span>{idx + 1}. {item.feature}</span>
                    <span className="font-mono font-medium text-text">{(item.importance * 100).toFixed(2)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(item.importance / feature_importance[0].importance) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-lg bg-white/[0.02] border border-line text-xs space-y-2">
              <p className="text-text">
                💡 <strong>Feature importance describes global model behavior</strong> (attributions across the entire training dataset).
              </p>
              <p className="text-muted leading-relaxed">
                Individual patient explanations utilize SHAP values to calculate the precise contribution of each feature to a single specific prediction.
              </p>
              <div className="pt-2 text-right">
                <Button variant="secondary" onClick={() => navigate("/reports")}>
                  Analyze Individual Predictions (SHAP)
                </Button>
              </div>
            </div>
          </section>

          {/* Model Comparison Table */}
          <section className="glass-panel overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-line">
              <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
                <Cpu className="size-5 text-primary" />
                Cross-Validation Model Comparison
              </h2>
              <p className="text-xs text-muted mt-1">5-fold cross-validation metrics (Mean) for C1: Real Only</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-line bg-surface-strong text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3">Classifier</th>
                    <th className="px-5 py-3">Accuracy</th>
                    <th className="px-5 py-3">Precision</th>
                    <th className="px-5 py-3">Recall</th>
                    <th className="px-5 py-3">F1</th>
                    <th className="px-5 py-3">ROC-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {model_comparison.map((item) => {
                    const isRec = item.model === "Random Forest";
                    return (
                      <tr key={item.model} className={`transition-colors hover:bg-white/[0.01] ${isRec ? "bg-primary/5" : ""}`}>
                        <td className="px-5 py-3.5 font-medium text-text flex items-center gap-1.5 whitespace-nowrap">
                          {item.model}
                          {isRec && (
                            <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase">
                              Rec
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-muted">{(item.accuracy * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3.5 font-mono text-muted">{(item.precision * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3.5 font-mono text-text">
                          {bestComparison.recall === item.model ? (
                            <strong className="text-success">{(item.recall * 100).toFixed(1)}%</strong>
                          ) : (
                            `${(item.recall * 100).toFixed(1)}%`
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-text">
                          {bestComparison.f1 === item.model ? (
                            <strong className="text-primary">{(item.f1 * 100).toFixed(1)}%</strong>
                          ) : (
                            `${(item.f1 * 100).toFixed(1)}%`
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-text">
                          {bestComparison.roc_auc === item.model ? (
                            <strong className="text-success">{item.roc_auc.toFixed(3)}</strong>
                          ) : (
                            item.roc_auc.toFixed(3)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Threshold Analysis Table */}
          <section className="glass-panel overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-line">
              <h2 className="font-display text-lg font-bold text-text">Threshold Sensitivity Mapping</h2>
              <p className="text-xs text-muted mt-1">Out-of-fold performance of Random Forest at key decision boundaries</p>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 z-10 border-b border-line bg-surface-strong text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3">Threshold</th>
                    <th className="px-5 py-3">Precision</th>
                    <th className="px-5 py-3">Recall</th>
                    <th className="px-5 py-3">F1-Score</th>
                    <th className="px-5 py-3">FP Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {threshold_analysis.map((item) => {
                    const isProd = Math.abs(item.threshold - 0.15) < 1e-4;
                    return (
                      <tr key={item.threshold} className={`transition-colors hover:bg-white/[0.01] ${isProd ? "bg-success/5 border-l-2 border-success" : ""}`}>
                        <td className="px-5 py-2.5 font-mono font-bold text-text flex items-center gap-1.5">
                          {item.threshold.toFixed(2)}
                          {isProd && (
                            <span className="text-[9px] font-bold bg-success/20 text-success px-1.5 py-0.5 rounded-full uppercase">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 font-mono text-muted">{(item.precision * 100).toFixed(1)}%</td>
                        <td className="px-5 py-2.5 font-mono text-text">{(item.recall * 100).toFixed(1)}%</td>
                        <td className="px-5 py-2.5 font-mono text-muted">{(item.f1 * 100).toFixed(1)}%</td>
                        <td className="px-5 py-2.5 font-mono text-muted">{(item.fpr * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-line bg-white/[0.01]">
              <p className="text-[11px] text-muted italic">
                * Lower thresholds generally increase sensitivity/recall but may increase false positives. The threshold of 0.15 is optimized to protect patient safety by prioritizing high sensitivity (78.00% Recall).
              </p>
            </div>
          </section>

          {/* Dataset Characteristics */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <Database className="size-5 text-primary" />
              Dataset Characteristics & Phase 2 Findings
            </h2>
            
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-line bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted block uppercase">Real Size</span>
                <span className="font-mono text-lg font-bold text-text">{dataset_analysis.total_records}</span>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted block uppercase">Stroke Cases</span>
                <span className="font-mono text-lg font-bold text-text">{dataset_analysis.stroke_cases}</span>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted block uppercase">Non-Stroke</span>
                <span className="font-mono text-lg font-bold text-text">{dataset_analysis.non_stroke_cases}</span>
              </div>
              <div className="rounded-xl border border-line bg-white/[0.01] p-3">
                <span className="text-[10px] text-muted block uppercase">Prevalence</span>
                <span className="font-mono text-lg font-bold text-text">{(dataset_analysis.prevalence * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-muted">
              <div>
                <h4 className="font-bold text-text mb-1">Dataset Incompatibility Findings</h4>
                <p>{dataset_analysis.incompatibility_notes}</p>
              </div>
              <div>
                <h4 className="font-bold text-text mb-1">Synthetic Augmentation Findings</h4>
                <p>{dataset_analysis.synthetic_notes}</p>
              </div>
            </div>
          </section>

          {/* Technical Specifications */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <Cpu className="size-5 text-success" />
              Production Model Pipeline Specifications
            </h2>
            
            <dl className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Estimator Type</dt>
                <dd className="font-mono text-text font-medium">{String(model_info.model_type)}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Pipeline Architecture</dt>
                <dd className="font-mono text-text font-medium">{String(model_info.architecture)}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Preprocessing Packaged</dt>
                <dd className="font-mono text-text font-medium">{String(model_info.preprocessing)}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Numerical Preprocessing</dt>
                <dd className="font-mono text-text text-right max-w-[240px]">
                  Imputation: Median<br />
                  Scaling: StandardScaler
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Categorical Preprocessing</dt>
                <dd className="font-mono text-text text-right max-w-[240px]">
                  Imputation: Most Frequent
                </dd>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Classifier Settings</dt>
                <dd className="font-mono text-text text-right max-w-[240px]">
                  class_weight: balanced<br />
                  random_state: 42
                </dd>
              </div>
              <div className="flex justify-between pb-2">
                <dt className="text-muted">Clinical Threshold</dt>
                <dd className="font-mono text-success font-bold">{String(model_info.clinical_threshold)}</dd>
              </div>
            </dl>
          </section>

          {/* Model Limitations Panel */}
          <section className="glass-panel p-6 sm:p-7 border border-warning/10 bg-warning/5">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <ShieldAlert className="size-5 text-warning" />
              Clinical Model Limitations & Disclaimers
            </h2>
            
            <ul className="mt-4 space-y-2.5 text-xs text-muted list-disc pl-5">
              <li><strong>Severe Class Imbalance:</strong> Stroke cases are highly rare (4.87% prevalence). Predictions represent risk probabilities, not a definitive diagnosis.</li>
              <li><strong>Low Positive Predictive Value (PPV):</strong> Precision is relatively low (15.73%) at the selected recall-oriented threshold, resulting in substantial false positives.</li>
              <li><strong>Screening-Oriented Threshold:</strong> The clinical threshold of 0.15 is specifically configured to maximize sensitivity (78.00% Recall), prioritizing false warnings over missed actual stroke cases.</li>
              <li><strong>Untouched Test Validation:</strong> Model performance is strictly validated on the available real stroke test partition.</li>
              <li><strong>Synthetic Augmented Training:</strong> Evaluations confirmed synthetic data did not improve generalization on real stroke patients.</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-7 space-y-7">
        <ResearchValidationPanel />
        <MultimodalFusionPanel />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-primary/5 border-primary/25" : "bg-white/[0.01] border-line"}`}>
      <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">{label}</span>
      <p className={`mt-2 font-display text-2xl font-bold ${highlight ? "text-primary" : "text-text"}`}>{value}</p>
      {sub && <span className="text-[10px] text-muted block mt-1">{sub}</span>}
    </div>
  );
}

// Roc Curve custom SVG
function RocCurveChart({ data }: { data: ThresholdPerformanceItem[] }) {
  const width = 600;
  const height = 300;
  const padding = 40;

  const points = useMemo(() => {
    // Sort points by FPR ascending
    const sorted = [...data].sort((a, b) => a.fpr - b.fpr);
    
    // Add endpoint (0,0) and (1,1) if not present
    if (sorted[0]?.fpr !== 0) {
      sorted.unshift({ threshold: 1.0, precision: 0.0, recall: 0.0, fpr: 0.0, tp: 0, fp: 0, fn: 0, tn: 0, f1: 0 });
    }
    if (sorted.at(-1)?.fpr !== 1.0) {
      sorted.push({ threshold: 0.0, precision: 0.0, recall: 1.0, fpr: 1.0, tp: 0, fp: 0, fn: 0, tn: 0, f1: 0 });
    }

    return sorted.map((p) => {
      const x = padding + p.fpr * (width - 2 * padding);
      const y = height - padding - p.recall * (height - 2 * padding);
      return { x, y, fpr: p.fpr, recall: p.recall, threshold: p.threshold };
    });
  }, [data]);

  const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <svg className="w-full overflow-visible" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Background grid */}
          {[0.25, 0.50, 0.75, 1.0].map((val) => {
            const y = height - padding - val * (height - 2 * padding);
            const x = padding + val * (width - 2 * padding);
            return (
              <g key={val}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 8" />
                <line x1={x} x2={x} y1={padding} y2={height - padding} stroke="var(--line)" strokeDasharray="3 8" />
                <text x={padding - 10} y={y + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] font-mono">{val.toFixed(2)}</text>
                <text x={x} y={height - padding + 15} textAnchor="middle" fill="var(--muted)" className="text-[10px] font-mono">{val.toFixed(2)}</text>
              </g>
            );
          })}

          <text x={padding - 10} y={height - padding + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] font-mono">0.00</text>
          <text x={padding} y={height - padding + 15} textAnchor="middle" fill="var(--muted)" className="text-[10px] font-mono">0.00</text>

          {/* Labels */}
          <text x={width / 2} y={height - 5} textAnchor="middle" fill="var(--muted)" className="text-xs">False Positive Rate (1 - Specificity)</text>
          <text x={12} y={height / 2} textAnchor="middle" fill="var(--muted)" className="text-xs transform -rotate-90 origin-center">True Positive Rate (Recall / Sensitivity)</text>

          {/* Random reference diagonal line */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={padding} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* ROC Line */}
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />

          {/* Plot dots for thresholds */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="var(--primary)" className="hover:scale-150 transition-transform duration-100" />
              <title>{`Threshold: ${p.threshold.toFixed(2)} | Recall/TPR: ${p.recall.toFixed(3)} | FPR: ${p.fpr.toFixed(3)}`}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// Precision-Recall Curve custom SVG
function PrCurveChart({ data }: { data: ThresholdPerformanceItem[] }) {
  const width = 600;
  const height = 300;
  const padding = 40;

  const points = useMemo(() => {
    // Sort points by Recall ascending
    const sorted = [...data].sort((a, b) => a.recall - b.recall);

    // Filter points to make curve coordinates clean
    return sorted.map((p) => {
      const x = padding + p.recall * (width - 2 * padding);
      const y = height - padding - p.precision * (height - 2 * padding);
      return { x, y, recall: p.recall, precision: p.precision, threshold: p.threshold };
    });
  }, [data]);

  const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <svg className="w-full overflow-visible" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Background grid */}
          {[0.25, 0.50, 0.75, 1.0].map((val) => {
            const y = height - padding - val * (height - 2 * padding);
            const x = padding + val * (width - 2 * padding);
            return (
              <g key={val}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 8" />
                <line x1={x} x2={x} y1={padding} y2={height - padding} stroke="var(--line)" strokeDasharray="3 8" />
                <text x={padding - 10} y={y + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] font-mono">{val.toFixed(2)}</text>
                <text x={x} y={height - padding + 15} textAnchor="middle" fill="var(--muted)" className="text-[10px] font-mono">{val.toFixed(2)}</text>
              </g>
            );
          })}

          <text x={padding - 10} y={height - padding + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] font-mono">0.00</text>
          <text x={padding} y={height - padding + 15} textAnchor="middle" fill="var(--muted)" className="text-[10px] font-mono">0.00</text>

          {/* Labels */}
          <text x={width / 2} y={height - 5} textAnchor="middle" fill="var(--muted)" className="text-xs">Recall (Sensitivity)</text>
          <text x={12} y={height / 2} textAnchor="middle" fill="var(--muted)" className="text-xs transform -rotate-90 origin-center">Precision (Positive Predictive Value)</text>

          {/* Random reference prevalence baseline line */}
          <line x1={padding} y1={height - padding - 0.0487 * (height - 2 * padding)} x2={width - padding} y2={height - padding - 0.0487 * (height - 2 * padding)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={width - padding - 5} y={height - padding - 0.0487 * (height - 2 * padding) - 5} textAnchor="end" fill="var(--muted)" className="text-[9px]">Stroke Prevalence Baseline (4.87%)</text>

          {/* PR Line */}
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />

          {/* Plot dots for thresholds */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="var(--primary)" className="hover:scale-150 transition-transform duration-100" />
              <title>{`Threshold: ${p.threshold.toFixed(2)} | Recall: ${p.recall.toFixed(3)} | Precision: ${p.precision.toFixed(3)}`}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
