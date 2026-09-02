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
    <div className="glass-panel p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome back</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">Sign in to your workspace</h2><p className="mt-3 text-sm leading-6 text-muted">Continue your clinical review with a secure, focused workspace.</p></div>
        <span className="hidden size-10 items-center justify-center rounded-xl bg-success/10 text-success sm:flex"><ShieldCheck className="size-5" aria-hidden="true" /></span>
      </div>
      {error ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert" aria-live="polite">{error}</div> : null}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <InputField id="login-email" label="Email address" type="email" name="email" placeholder="you@clinic.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required icon={Mail} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <InputField id="login-password" label="Password" type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" autoComplete="current-password" required icon={LockKeyhole} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} trailing={<button type="button" className="rounded-md p-1 text-muted hover:text-text" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button>} />
        <div className="flex items-center justify-between gap-4 text-xs"><label className="flex items-center gap-2 text-muted"><input className="size-4 rounded border-line bg-transparent accent-primary" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember me</label><Link className="font-medium text-primary hover:text-primary-strong" to="/forgot-password">Forgot password?</Link></div>
        <Button className="w-full" type="submit" isLoading={isLoading}>Sign in</Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted">New to PreStrokeNet? <Link className="font-semibold text-primary hover:text-primary-strong" to="/register">Create an account</Link></p>
      <p className="mt-8 border-t border-line pt-5 text-center text-[11px] leading-5 text-muted">Your clinical workspace is protected with encrypted access controls.</p>
    </div>
  );
}
