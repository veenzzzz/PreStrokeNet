# Phase 9 Data Compatibility & Scientific Audit Report

This report evaluates dataset compatibility, identifier availability, record pairing, and scientific validity for multimodal stroke risk fusion.

---

## 1. Dataset Breakdown & Schema Audit

| Dataset Category | Dataset File | Rows | Identifier Column | Target Variable | Ground Truth Available |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Clinical Model Dataset** | `Datasets/raw/Stroke/healthcare-dataset-stroke-data.csv` | 5,110 | `id` (numeric patient ID) | `stroke` (binary 0/1) | **Yes** (Clinical Stroke Status) |
| **Keystroke Dataset 1** | `Datasets/raw/keystoke/DSL-StrongPasswordData.csv` | 20,400 | `subject` (`s002`–`s057`) | `subject` (51 subjects) | **No** (User Biometric ID Only) |
| **Keystroke Dataset 2** | `Datasets/raw/keystoke/KeyStrokeDistance.csv` | 596 | `subject` (`rakshith`, etc.) | `subject` (4 subjects) | **No** (User Biometric ID Only) |

---

## 2. Compatibility & Record Pairing Evaluation

1. **Shared Patient Identifiers**: **No**. The clinical dataset uses numeric patient identifiers (`id: 9046`, `51676`), whereas the keystroke datasets use biometric subject identifiers (`s002`, `s003`) or user names (`rakshith`).
2. **Paired Observations**: **No**. Clinical records and keystroke timing records were collected in separate independent studies on distinct populations.
3. **Stroke Target for Keystroke Data**: **No**. Keystroke datasets do not contain medical history or stroke ground-truth diagnoses.
4. **Supervised Multimodal Learned Fusion**: **Scientifically Invalid on Available Data**. Training a supervised joint classifier (e.g., Logistic Regression or XGBoost on combined clinical + keystroke features) would require artificially pairing unrelated clinical patients with keystroke users.

---

## 3. Scientific Framing & Experimental Rules

> [!IMPORTANT]
> **Scientific Integrity Directives**:
> 1. **No Fake Labels**: We strictly refuse to fabricate stroke labels for keystroke benchmark users.
> 2. **No Fake Patient Merges**: Clinical and keystroke datasets remain un-paired to avoid misleading clinical evaluation.
> 3. **Role Distinction**:
>    - **Clinical ML Model**: Supervised stroke-risk classifier ($P_{\text{clinical}} \in [0, 1]$).
>    - **Keystroke Model**: Biometric user identification & personal baseline behavioral change score ($P_{\text{keystroke}} \in [0, 1]$).
>    - **70/30 Hybrid Risk Score**: Multimodal decision-support prototype ($P_{\text{final}} = 0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
> 4. **Ablation & Fusion Evaluation**: We evaluate clinical baseline performance, weighted fusion sensitivity across weighting schemes ($90/10, 80/20, 70/30, 60/40$), threshold sensitivity, and present system-level ablation results without fake paired data.
