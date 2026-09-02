import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { getApiErrorMessage, forgotPassword } from "../../services/authService";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await forgotPassword({ email });
      setIsSent(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We couldn't process that request. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="glass-panel p-6 text-center sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"><MailCheck className="size-7" aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-success">Check your inbox</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">Reset link requested</h2>
        <p className="mt-4 text-sm leading-6 text-muted">If an account exists for this email, we’ll send a reset link. It expires shortly for your security.</p>
        <Link className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-strong" to="/login"><ArrowLeft className="size-4" aria-hidden="true" />Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-8">
      <Link className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-text" to="/login"><ArrowLeft className="size-3.5" aria-hidden="true" />Back to sign in</Link>
      <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Account recovery</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text">Forgot your password?</h2><p className="mt-3 text-sm leading-6 text-muted">Enter your work email and we’ll send instructions to reset your access.</p></div>
      {error ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert">{error}</div> : null}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}><InputField id="forgot-email" label="Email address" type="email" placeholder="you@clinic.com" autoComplete="email" required icon={Mail} value={email} onChange={(event) => setEmail(event.target.value)} /><Button className="w-full" type="submit" isLoading={isLoading}>Send reset link</Button></form>
      <p className="mt-7 text-center text-[11px] leading-5 text-muted">For account privacy, the confirmation message is the same whether or not the email is registered.</p>
    </div>
  );
}
