import { Award, Briefcase, Building, CheckCircle2, Mail, Phone, Save, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export function Profile() {
  const { user, isInitializing, profileError, updateProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    medicalLicense: "",
    department: "",
    institution: "",
    role: "Doctor",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        medicalLicense: user.medicalLicense || "",
        department: user.department || "",
        institution: user.institution || "",
        role: user.role || "Doctor",
      });
    }
  }, [user]);

  const update = (field: keyof typeof form, value: string) => {
    setSaved(false);
    setError("");
    setForm((c) => ({ ...c, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || null,
        medical_license: form.medicalLicense || null,
        department: form.department || null,
        institution: form.institution || null,
      });
      setSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "We couldn't save your profile changes."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing || !user) {
    return (
      <div className="page-canvas flex items-center justify-center">
        <Loader label="Loading your profile" />
      </div>
    );
  }

  const initials = form.fullName
    ? form.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="page-canvas">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Keep your clinical identity, credentials, and contact details current."
      />

      {profileError && (
        <div
          className="mt-6 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: "var(--danger-dim)",
            borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)",
            color: "var(--danger)",
          }}
          role="alert"
        >
          {profileError}
        </div>
      )}

      <div className="mt-7 grid max-w-5xl gap-5 xl:grid-cols-[280px_1fr]">
        {/* Profile card */}
        <section
          className="h-fit rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          aria-label="Profile overview"
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div
              className="flex size-20 items-center justify-center rounded-2xl text-2xl font-bold text-app"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 25%, transparent)",
              }}
            >
              {initials}
            </div>

            <h2 className="mt-4 text-lg font-bold text-text">{form.fullName || "Your name"}</h2>
            <p className="mt-1 text-sm text-muted">{form.department || form.role}</p>
            {form.institution && (
              <p className="mt-0.5 text-xs text-muted/70">{form.institution}</p>
            )}

            <div className="mt-4 w-full border-t border-line pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs">{form.email || "No email set"}</span>
              </div>
              {form.phone && (
                <div className="flex items-center gap-2 text-muted">
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs">{form.phone}</span>
                </div>
              )}
            </div>

            <div
              className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: "var(--success-dim)",
                color: "var(--success)",
                border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)",
              }}
            >
              <span
                className="size-1.5 rounded-full status-pulse"
                style={{ background: "var(--success)" }}
                aria-hidden="true"
              />
              Verified Clinician
            </div>
          </div>
        </section>

        {/* Edit form */}
        <form
          className="rounded-xl border border-line p-6"
          style={{ background: "var(--surface)" }}
          onSubmit={handleSubmit}
          aria-label="Edit profile"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="section-label">Credentials</p>
              <h2 className="mt-1 text-base font-bold text-text">Profile information</h2>
            </div>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--success)" }}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Saved
              </span>
            )}
          </div>

          {error && (
            <div
              className="mb-5 rounded-lg border px-4 py-3 text-sm"
              style={{
                background: "var(--danger-dim)",
                borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)",
                color: "var(--danger)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <InputField
              id="profile-name"
              label="Full name"
              icon={UserRound}
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
            <InputField
              id="profile-email"
              label="Email address"
              type="email"
              icon={Mail}
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <InputField
              id="profile-phone"
              label="Contact phone"
              type="tel"
              icon={Phone}
              value={form.phone}
              placeholder="+1 (555) 012-3456"
              onChange={(e) => update("phone", e.target.value)}
            />
            <InputField
              id="profile-license"
              label="Medical license / NPI"
              icon={Award}
              value={form.medicalLicense}
              placeholder="e.g. MD-9823412"
              onChange={(e) => update("medicalLicense", e.target.value)}
            />
            <InputField
              id="profile-department"
              label="Department / Specialty"
              icon={Briefcase}
              value={form.department}
              placeholder="e.g. Neurology & Stroke Unit"
              onChange={(e) => update("department", e.target.value)}
            />
            <InputField
              id="profile-institution"
              label="Clinical institution"
              icon={Building}
              value={form.institution}
              placeholder="e.g. Metro Health Medical Center"
              onChange={(e) => update("institution", e.target.value)}
            />
          </div>

          <p className="mt-5 text-xs leading-5 text-muted border-t border-line pt-4">
            All credentials are stored securely with audit tracking across EHR and clinical exports.
          </p>

          <div className="mt-5 flex justify-end">
            <Button icon={Save} type="submit" isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
