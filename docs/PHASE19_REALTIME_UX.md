# Phase 19 — Real-Time Clinical Workspace & UX Intelligence

This document details the real-time polling architecture, UX improvements, global search, guided demo mode, and accessibility polish for **Phase 19** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

PreStrokeNet is a research-oriented clinical decision-support workspace.

All real-time updates and priority badges use non-diagnostic workflow framing:
- *Workflow Priority* (`HIGH`, `MEDIUM`, `LOW`).
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Color-independent ARIA badges* ensuring screen-reader accessibility.

---

## 2. Real-Time Transport Mechanism

Lightweight 10-second polling auto-refresh mechanism chosen for optimal stability:
- Automatically updates unread notification counts, live Work Queue items, and active patient badges without requiring manual page reloads or full page redraws.

---

## 3. Implemented Components

### 1. Global Search Interface
- Endpoint: `GET /search/global?q=...`
- Returns matched patients, predictions, notifications, and follow-ups.

### 2. Guided Demo / Viva Mode Workspace
- Route: `/demo`
- Step-by-step academic clinical walkthrough badged with **"DEMONSTRATION MODE"**.

### 3. Patient 360 & Dashboard UX Polish
- Responsive multi-column layout, color-independent badges, and interactive timeline modals.

---

## 4. API Summary

- `GET /search/global`: Global search query endpoint.
- `GET /patients/{id}/360`: Patient 360 monitoring summary.
