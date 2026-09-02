import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { getApiErrorMessage, resetPassword } from "../../services/authService";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its security token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setIsComplete(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "This reset link is invalid or has expired."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return <div className="glass-panel p-6 text-center sm:p-8"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"><CheckCircle2 className="size-7" aria-hidden="true" /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-success">Password updated</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">You’re ready to sign in</h2><p className="mt-4 text-sm leading-6 text-muted">Your password has been changed securely. Sign in with your new credentials.</p><Link className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-strong" to="/login"><ArrowLeft className="size-4" aria-hidden="true" />Back to sign in</Link></div>;
  }

  return <div className="glass-panel p-6 sm:p-8"><Link className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-text" to="/login"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to sign in</Link><div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Secure reset</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">Create a new password</h2><p className="mt-3 text-sm leading-6 text-muted">Use at least eight characters and keep it unique to your clinical workspace.</p></div>{error ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert">{error}</div> : null}<form className="mt-8 space-y-5" onSubmit={handleSubmit}><InputField id="reset-password" label="New password" type="password" placeholder="Enter a new password" autoComplete="new-password" required icon={LockKeyhole} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><InputField id="reset-confirm-password" label="Confirm password" type="password" placeholder="Repeat your new password" autoComplete="new-password" required icon={KeyRound} minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /><Button className="w-full" type="submit" isLoading={isLoading}>Update password</Button></form></div>;
}
