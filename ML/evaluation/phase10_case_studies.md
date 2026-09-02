# Phase 10 Representative Clinical Case Studies (TreeSHAP Explanations)

This document provides detailed TreeSHAP attribution case studies for representative True Positive, False Positive, True Negative, and False Negative test predictions.

---
## True Positive (Correct Stroke Flag)
- **Actual Label**: 1 | **Predicted Label**: 1 | **Predicted Risk Probability**: `27.0%` (Threshold = `15.0%`)
- **Top TreeSHAP Feature Attributions**:
  - **BMI**: `-0.2146` (Observed: `34.9`)
  - **Age**: `+0.0820` (Observed: `76.0`)
  - **Residence type**: `-0.0299` (Observed: `1.0`)
  - **Average glucose**: `-0.0241` (Observed: `207.28`)
  - **Smoking status**: `-0.0180` (Observed: `0.0`)

## False Positive (Screening Alert in Stroke-Free Patient)
- **Actual Label**: 0 | **Predicted Label**: 1 | **Predicted Risk Probability**: `17.0%` (Threshold = `15.0%`)
- **Top TreeSHAP Feature Attributions**:
  - **BMI**: `-0.1703` (Observed: `26.3`)
  - **Average glucose**: `-0.0821` (Observed: `113.34`)
  - **Age**: `-0.0330` (Observed: `67.0`)
  - **Hypertension**: `-0.0125` (Observed: `0.0`)
  - **Heart disease**: `-0.0124` (Observed: `0.0`)

## True Negative (Correct Stroke-Free Identification)
- **Actual Label**: 0 | **Predicted Label**: 0 | **Predicted Risk Probability**: `3.0%` (Threshold = `15.0%`)
- **Top TreeSHAP Feature Attributions**:
  - **BMI**: `-0.1683` (Observed: `34.8`)
  - **Average glucose**: `-0.1473` (Observed: `78.23`)
  - **Age**: `-0.0659` (Observed: `63.0`)
  - **Smoking status**: `-0.0485` (Observed: `2.0`)
  - **Heart disease**: `-0.0193` (Observed: `0.0`)

## False Negative (Missed Stroke Risk Case)
- **Actual Label**: 1 | **Predicted Label**: 0 | **Predicted Risk Probability**: `0.0%` (Threshold = `15.0%`)
- **Top TreeSHAP Feature Attributions**:
  - **Age**: `-0.4156` (Observed: `38.0`)
  - **Average glucose**: `-0.0813` (Observed: `101.45`)
  - **BMI**: `+0.0256` (Observed: `nan`)
  - **Residence type**: `-0.0118` (Observed: `0.0`)
  - **Work type**: `-0.0088` (Observed: `2.0`)

