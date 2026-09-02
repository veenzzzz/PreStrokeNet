import os
import hashlib
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_provider import GroundedRuleProvider, OpenAICompatibleProvider, get_ai_provider

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")
if not os.path.exists(STROKE_MODEL_PATH):
    STROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "stroke_model.pkl"))

KEYSTROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "keystroke_model.pkl")
if not os.path.exists(KEYSTROKE_MODEL_PATH):
    KEYSTROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "keystroke_model.pkl"))


class Phase2051AiProviderTests(unittest.TestCase):
    def test_01_production_models_hash_integrity(self):
        """Verify stroke_model.pkl and keystroke_model.pkl SHA256 hashes remain 100% untouched."""
        self.assertTrue(os.path.exists(STROKE_MODEL_PATH), "stroke_model.pkl must exist")
        with open(STROKE_MODEL_PATH, "rb") as f:
            sha256_stroke = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(sha256_stroke, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

        self.assertTrue(os.path.exists(KEYSTROKE_MODEL_PATH), "keystroke_model.pkl must exist")
        with open(KEYSTROKE_MODEL_PATH, "rb") as f:
            sha256_keystroke = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(sha256_keystroke, "8bec474b0bfba04e5537171c18dc8ed9566edf5672ab1f93d4b04d4ffdc9fc71")

    @patch.dict(os.environ, {"AI_PROVIDER": "grounded"}, clear=False)
    def test_02_grounded_provider_selection(self):
        """Verify AI_PROVIDER=grounded selects GroundedRuleProvider."""
        provider = get_ai_provider()
        self.assertIsInstance(provider, GroundedRuleProvider)
        health = provider.health_check()
        self.assertEqual(health["status"], "healthy")
        self.assertEqual(health["mode"], "built_in")

    @patch.dict(os.environ, {"AI_PROVIDER": "openai", "AI_API_KEY": ""}, clear=False)
    def test_03_openai_provider_missing_key_returns_explicit_status(self):
        """Verify AI_PROVIDER=openai with missing API key returns explicit missing_api_key status and raises on request."""
        provider = get_ai_provider()
        self.assertIsInstance(provider, OpenAICompatibleProvider)
        health = provider.health_check()
        self.assertEqual(health["status"], "missing_api_key")
        self.assertEqual(health["mode"], "external_llm")

        with self.assertRaises(ValueError):
            provider.generate_response("system", "user msg", {})

    @patch.dict(os.environ, {"AI_PROVIDER": "openai", "AI_API_KEY": "sk-fake-test-key"}, clear=False)
    def test_04_openai_provider_configured_status(self):
        """Verify AI_PROVIDER=openai with API key returns configured status."""
        provider = get_ai_provider()
        self.assertIsInstance(provider, OpenAICompatibleProvider)
        health = provider.health_check()
        self.assertEqual(health["status"], "configured")
        self.assertEqual(health["mode"], "external_llm")

    def test_05_grounded_provider_safety_redirection(self):
        """Verify GroundedRuleProvider returns safety redirection for diagnosis / prescription requests."""
        provider = GroundedRuleProvider()
        resp = provider.generate_response("system", "diagnose me please, prescribe medication", {})
        self.assertIn("does NOT establish a medical diagnosis", resp)
        self.assertIn("911 / Emergency Services", resp)


if __name__ == "__main__":
    unittest.main()
