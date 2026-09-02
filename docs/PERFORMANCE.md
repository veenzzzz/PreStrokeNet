# Phase 11 System Performance & Latency Benchmarks

This document records measured local latency statistics (N = 20 iterations per operation).

---

## 1. Measured System Latency Summary

| Operation / Task | Min (ms) | Max (ms) | Mean (ms) | Median (ms) | P95 (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Clinical Model Prediction** | 2.79 | 7.67 | 4.90 | 5.00 | 7.16 |
| **TreeSHAP Explanation** | 14.43 | 29.70 | 18.01 | 16.77 | 24.25 |
| **PDF Report Generation** | 45.39 | 72.79 | 56.77 | 56.07 | 72.65 |
| **Excel Export Generation** | 13.37 | 30.85 | 17.73 | 15.85 | 27.52 |


---

## 2. Hardware Environment Note
Benchmarks were collected locally on Windows Python 3.12 environment. Measurements reflect sub-second execution across all key endpoints.
