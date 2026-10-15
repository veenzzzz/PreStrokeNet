import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/authService";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ ...form, email: form.email.trim().toLowerCase() });
      if (remember) localStorage.setItem("prestrokenet-remember", "true");
      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We couldn't sign you in. Check your details and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="section-label">Secure workspace</span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-text">Sign in to PreStrokeNet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Enter your credentials to access your clinical workspace.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: "var(--danger-dim)",
            borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)",
            color: "var(--danger)",
          }}
          role="alert"
          aria-live="polite"
        >
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <InputField
          id="login-email"
          label="Email address"
          type="email"
          name="email"
          placeholder="you@clinic.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          icon={Mail}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <InputField
          id="login-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          icon={LockKeyhole}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          trailing={
            <button
              type="button"
              className="rounded p-1 text-muted hover:text-text transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted select-none">
            <input
              className="size-4 rounded border-line accent-primary cursor-pointer"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <Link
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--primary)" }}
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          className="w-full"
          size="lg"
          type="submit"
          isLoading={isLoading}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Footer links */}
      <p className="mt-6 text-center text-sm text-muted">
        New to PreStrokeNet?{" "}
        <Link
          className="font-semibold transition-colors"
          style={{ color: "var(--primary)" }}
          to="/register"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs text-muted">
        <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
        <span>Your workspace is protected with encrypted access controls.</span>
      </div>
    </div>
  );
}
