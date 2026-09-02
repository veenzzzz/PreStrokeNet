# Phase 20.5 — Premium AI Clinical Assistant UX

This document details the layout architecture, active patient context panel, context checklist, suggested query chips, chat conversation workspace, source citations engine, and persistent safety notice for **Phase 20.5** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

The AI Clinical Decision-Support Assistant operates as an evidence-grounded clinical decision support workspace.

All AI interactions adhere strictly to non-diagnostic decision-support framing:
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Decision fusion threshold* ($0.15$).
- *TreeSHAP attributions* (Additive feature attributions explaining Random Forest predictions transparently).
- *Persistent Safety Notice* ("Decision-support information only. Not a diagnosis.").

---

## 2. Workspace Layout Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ PAGE HEADER (Provider Health: Operational)                   │
├───────────────────────────────┬──────────────────────────────┤
│ ACTIVE PATIENT CONTEXT        │ CONVERSATION WORKSPACE       │
│ - Name, ID, Risk Badge        │ - User Messages (Right)      │
│ - Probabilities (Clin, Key)   │ - AI Responses (Left)        │
│ - Top SHAP Attributions       │ - Evidence Source Pills      │
├───────────────────────────────┤                              │
│ CONTEXT CHECKLIST             │                              │
│ - ✓ Latest Prediction         │                              │
│ - ✓ SHAP Attributions         │                              │
│ - ✓ Risk Progression          │                              │
├───────────────────────────────┤                              │
│ SUGGESTED QUERY CHIPS         │ COMPOSER (Send / Shift+Enter)│
└───────────────────────────────┴──────────────────────────────┘
```

---

## 3. Implemented Features

### 1. Active Patient Context & Context Checklist
- Renders active patient name, ID, risk badge, clinical probability %, keystroke probability %, final probability %, top TreeSHAP attributions, and context availability checklist.

### 2. Suggested Clinical Query Chips
- Standardized question chips ("Why did risk change?", "Top SHAP factors", "Summarize assessments", "Model metrics") executing chat queries directly.

### 3. Chat Conversation Workspace & Citation Engine
- Displays conversation messages, evidence cards, and source citation badges (`Latest Prediction`, `Patient History`, `SHAP Explanation`, `Doctor Notes`, `Model Analytics`).

### 4. Safety Notices & Emergency Redirection
- Persistent non-diagnostic disclaimer banner and structured safety notice cards for diagnostic or emergency queries.
