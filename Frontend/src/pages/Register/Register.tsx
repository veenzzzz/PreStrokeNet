import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
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
    <div className="glass-panel p-6 sm:p-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Get started</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">Create your workspace</h2><p className="mt-3 text-sm leading-6 text-muted">Set up a secure account for your clinical team.</p></div>
      {error ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert" aria-live="polite">{error}</div> : null}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <InputField id="register-name" label="Full name" placeholder="Dr. Maya Patel" autoComplete="name" required maxLength={100} icon={UserRound} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        <InputField id="register-email" label="Email address" type="email" name="email" placeholder="you@clinic.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required icon={Mail} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <InputField id="register-password" label="Password" type={showPassword ? "text" : "password"} name="new-password" placeholder="Create a strong password" autoComplete="new-password" required icon={LockKeyhole} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} trailing={<button type="button" className="rounded-md p-1 text-muted hover:text-text" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button>} />
        <InputField id="register-confirm-password" label="Confirm password" type={showPassword ? "text" : "password"} name="password-confirmation" placeholder="Repeat your password" autoComplete="new-password" required icon={Check} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
        <Button className="w-full" type="submit" isLoading={isLoading}>Create account</Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted">Already have an account? <Link className="font-semibold text-primary hover:text-primary-strong" to="/login">Sign in</Link></p>
    </div>
  );
}
