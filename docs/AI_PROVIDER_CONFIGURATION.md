# AI Provider Configuration & Health Verification

This document details the AI Provider architecture, explicit provider selection, health status verification, error handling, and clinical safety guardrails for **Phase 20.5.1** of PreStrokeNet.

---

## 1. Environment Configuration

Supported modes in `AI_PROVIDER`:
- `grounded`: Built-in Grounded Rule Engine (Default).
- `openai`: OpenAI API endpoint (`https://api.openai.com/v1`).
- `gemini`: Google Gemini OpenAI-compatible API endpoint.
- `ollama`: Local Ollama API endpoint (`http://localhost:11434/v1`).

Example configuration (`Backend/.env`):
```env
AI_PROVIDER=grounded
AI_API_KEY=
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

---

## 2. Explicit Provider Selection & Health Check

### Health Check Endpoint (`GET /clinical-assistant/health`)

#### Grounded Mode (`AI_PROVIDER=grounded`):
```json
{
  "status": "healthy",
  "provider": "grounded_rule_engine",
  "mode": "built_in"
}
```

#### External LLM Mode (Configured):
```json
{
  "status": "configured",
  "provider": "external_openai",
  "model": "gpt-4o-mini",
  "mode": "external_llm"
}
```

#### External LLM Mode (Missing Key):
```json
{
  "status": "missing_api_key",
  "provider": "external_openai",
  "model": "gpt-4o-mini",
  "mode": "external_llm",
  "detail": "AI_PROVIDER is set to 'openai' but AI_API_KEY is missing."
}
```

---

## 3. No Silent Fallback Policy

If `AI_PROVIDER` is set to an external provider (`openai`, `gemini`, `ollama`):
- If `AI_API_KEY` is missing or external request fails:
- The system returns an explicit **HTTP 400 / HTTP 502 Bad Gateway** error detailing provider unavailability.
- The system **NEVER** silently pretends an external LLM is working while using the grounded engine.
