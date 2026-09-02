# PreStrokeNet System Limitations & Ethical Disclosures

This document details the scientific limitations, dataset constraints, and ethical disclaimers of PreStrokeNet.

---

## Key Limitations

1. **Non-Diagnostic Medical Disclaimer**: PreStrokeNet is a **screening decision-support prototype** and is **not a diagnostic medical device**.
2. **Dataset Imbalance & PPV**: Due to low stroke prevalence (4.87%), precision is relatively low (15.73%) at screening threshold $t = 0.15$, resulting in false positive screening flags that require clinical review.
3. **Lack of Paired Clinical-Keystroke Data**: Available clinical stroke dataset and keystroke benchmark dataset **do not share patient identifiers**. Multimodal decision fusion represents a decision-support prototype rather than a clinically validated joint predictor.
4. **Keystroke Target Scope**: Benchmark keystroke datasets evaluate user biometric identity rather than direct neurological impairment.
5. **Prospective Clinical Validation**: Retrospective evaluation on public datasets requires future prospective clinical trial validation before deployment in hospital environments.
