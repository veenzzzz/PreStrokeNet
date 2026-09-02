import { Camera, CheckCircle2, Mail, Phone, Save, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export function Profile() {
  const { user, isInitializing, profileError, updateProfile } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "+1 (415) 555-0198", role: "Neurology specialist" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((current) => ({ ...current, fullName: user.fullName, email: user.email }));
    }
  }, [user]);

  const update = (field: keyof typeof form, value: string) => { setSaved(false); setError(""); setForm((current) => ({ ...current, [field]: value })); };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);
    try {
      await updateProfile({ full_name: form.fullName, email: form.email });
      setSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We couldn't save your profile changes."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing || !user) {
    return <div className="page-canvas flex items-center justify-center"><Loader label="Loading your profile" /></div>;
  }

  return <div className="page-canvas"><PageHeader eyebrow="Your workspace" title="Profile" description="Keep your identity and contact details current for your clinical team." />{profileError ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger" role="alert">{profileError}</div> : null}<div className="mt-7 grid max-w-5xl gap-5 xl:grid-cols-[0.6fr_1.4fr]"><section className="glass-panel h-fit p-6 sm:p-7"><div className="flex flex-col items-center text-center"><div className="relative"><div className="flex size-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-blue font-display text-4xl font-bold text-app shadow-[0_16px_50px_color-mix(in_srgb,var(--primary)_20%,transparent)]">{form.fullName.slice(0, 1) || "M"}</div><button type="button" className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-xl border border-line-strong bg-surface-strong text-text shadow-lg hover:text-primary" aria-label="Change profile photo"><Camera className="size-4" aria-hidden="true" /></button></div><h2 className="mt-6 font-display text-xl font-bold text-text">{form.fullName || "Your name"}</h2><p className="mt-1 text-sm text-muted">{form.role}</p><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/8 px-3 py-1.5 text-xs font-medium text-success"><span className="size-1.5 rounded-full bg-success" />Active workspace</div></div></section><form className="glass-panel p-6 sm:p-7" onSubmit={handleSubmit}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Personal details</p><h2 className="mt-2 font-display text-xl font-bold text-text">Profile information</h2></div>{saved ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success"><CheckCircle2 className="size-4" aria-hidden="true" />Saved</span> : null}</div>{error ? <div className="mt-5 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert">{error}</div> : null}<div className="mt-7 grid gap-5 sm:grid-cols-2"><InputField id="profile-name" label="Full name" icon={UserRound} required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} /><InputField id="profile-email" label="Email address" type="email" icon={Mail} required value={form.email} onChange={(event) => update("email", event.target.value)} /><InputField id="profile-phone" label="Phone number" type="tel" icon={Phone} disabled value={form.phone} /><InputField id="profile-role" label="Role" icon={UserRound} disabled value={form.role} /></div><p className="mt-5 text-xs leading-5 text-muted">Phone number and role are displayed for context but are not persisted by the current backend profile schema.</p><div className="mt-8 flex justify-end"><Button icon={Save} type="submit" isLoading={isSaving}>Save changes</Button></div></form></div></div>;
}
