import { Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/authService";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (fullName.length < 2) {
      setError("Enter your full name using at least two characters.");
      return;
    }
    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Re-enter the same password in both fields.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ full_name: fullName, email, password: form.password });
      navigate("/login", { state: { registered: true } });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We couldn't create your account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-label">New account</span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-text">Create your workspace</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Set up a secure account for your clinical team.
        </p>
      </div>

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

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <InputField
          id="register-name"
          label="Full name"
          placeholder="Dr. Maya Patel"
          autoComplete="name"
          required
          maxLength={100}
          icon={UserRound}
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />

        <InputField
          id="register-email"
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
          id="register-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          name="new-password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          icon={LockKeyhole}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          hint="Use at least 8 characters"
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

        <InputField
          id="register-confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          name="password-confirmation"
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
          icon={Check}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />

        <Button className="w-full" size="lg" type="submit" isLoading={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          className="font-semibold transition-colors"
          style={{ color: "var(--primary)" }}
          to="/login"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs text-muted">
        <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
        <span>Accounts require admin approval before workspace access is granted.</span>
      </div>
    </div>
  );
}
